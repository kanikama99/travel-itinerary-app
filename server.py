import json
import os
import socket
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HOST = "0.0.0.0"
PORT = 8000
USER_AGENT = "SpotMapOrganizer/1.0 (+local app)"
SHORT_HOSTS = {"maps.app.goo.gl", "goo.gl"}


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/meta":
            self.send_json(200, {
                "host": HOST,
                "port": PORT,
                "urls": build_access_urls(),
            })
            return
        super().do_GET()

    def do_POST(self):
        if self.path == "/api/resolve":
            self.handle_resolve()
            return
        if self.path == "/api/search":
            self.handle_search()
            return
        if self.path == "/api/suggest":
            self.handle_suggest()
            return
        if self.path == "/api/route":
            self.handle_route()
            return
        if self.path == "/api/place-hours":
            self.handle_place_hours()
            return
        self.send_error(404, "Not Found")

    def handle_resolve(self):
        payload = self.read_json_body()
        if payload is None:
            return

        url = str(payload.get("url", "")).strip()
        if not url:
            self.send_json(400, {"error": "URLを入力してください。"})
            return

        try:
            expanded = resolve_google_maps_url(url)
        except ValueError as exc:
            self.send_json(400, {"error": str(exc)})
            return
        except Exception:
            self.send_json(502, {"error": "短縮URLの展開に失敗しました。ネットワーク接続を確認してください。"})
            return

        self.send_json(200, {"url": expanded})

    def handle_suggest(self):
        payload = self.read_json_body()
        if payload is None:
            return

        query = str(payload.get("query", "")).strip()
        if not query:
            self.send_json(400, {"error": "スポット名を入力してください。"})
            return

        try:
            results = suggest_places(query)
        except Exception:
            self.send_json(502, {"error": "候補の取得に失敗しました。"})
            return

        self.send_json(200, {"results": results})

    def handle_search(self):
        payload = self.read_json_body()
        if payload is None:
            return

        query = str(payload.get("query", "")).strip()
        if not query:
            self.send_json(400, {"error": "スポット名を入力してください。"})
            return

        try:
            result = search_place(query)
        except LookupError as exc:
            self.send_json(404, {"error": str(exc)})
            return
        except Exception:
            self.send_json(502, {"error": "スポット検索に失敗しました。ネットワーク接続を確認してください。"})
            return

        self.send_json(200, result)

    def handle_route(self):
        payload = self.read_json_body()
        if payload is None:
            return

        api_key = get_env_value("GOOGLE_MAPS_API_KEY")
        if not api_key:
            self.send_json(500, {"error": ".env の GOOGLE_MAPS_API_KEY が未設定です"})
            return

        try:
            result = fetch_google_route(api_key, payload)
        except ValueError as exc:
            self.send_json(400, {"error": str(exc)})
            return
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            self.send_json(exc.code, {"error": "Google Routes API の取得に失敗しました", "detail": detail})
            return
        except Exception as exc:
            self.send_json(502, {"error": "Google Routes API の取得に失敗しました", "detail": str(exc)})
            return

        self.send_json(200, result)

    def handle_place_hours(self):
        payload = self.read_json_body()
        if payload is None:
            return

        api_key = get_env_value("GOOGLE_MAPS_API_KEY")
        if not api_key:
            self.send_json(500, {"error": ".env の GOOGLE_MAPS_API_KEY が未設定です"})
            return

        try:
            result = fetch_google_place_hours(api_key, payload)
        except ValueError as exc:
            self.send_json(400, {"error": str(exc)})
            return
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            self.send_json(exc.code, {"error": "Google Places API の取得に失敗しました", "detail": detail})
            return
        except Exception as exc:
            self.send_json(502, {"error": "Google Places API の取得に失敗しました", "detail": str(exc)})
            return

        self.send_json(200, result)

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length)
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json(400, {"error": "JSONの形式が正しくありません。"})
            return None

    def send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def resolve_google_maps_url(url):
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.netloc.lower().removeprefix("www.")

    if hostname not in SHORT_HOSTS and not is_google_maps_host(hostname):
        raise ValueError("Google Maps のURLを入力してください。")

    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=15) as response:
        final_url = response.geturl()

    final_host = urllib.parse.urlparse(final_url).netloc.lower().removeprefix("www.")
    if not is_google_maps_host(final_host):
        raise ValueError("Google Maps のURLとして展開できませんでした。")

    return final_url


def suggest_places(query):
    params = urllib.parse.urlencode({
        "q": query,
        "format": "jsonv2",
        "limit": 6,
        "accept-language": "ja,en",
    })
    request = urllib.request.Request(
        f"https://nominatim.openstreetmap.org/search?{params}",
        headers={"User-Agent": USER_AGENT, "Accept-Language": "ja,en"},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        data = json.loads(response.read().decode("utf-8"))

    results = []
    for item in data[:6]:
        lat = float(item["lat"])
        lng = float(item["lon"])
        name = item.get("name") or item.get("display_name", "").split(",")[0].strip()
        display = item.get("display_name", "")
        results.append({
            "name": name,
            "display": display,
            "lat": lat,
            "lng": lng,
            "url": f"https://www.google.com/maps/search/?api=1&query={lat},{lng}",
            "osmCategory": item.get("category", ""),
            "osmType": item.get("type", ""),
        })
    return results


def search_place(query):
    osm_result = search_place_by_osm(query)
    if osm_result is not None:
        return osm_result

    wiki_result = search_place_by_wikipedia(query)
    if wiki_result is not None:
        return wiki_result

    raise LookupError("該当するスポットが見つかりませんでした。別の表記でも試してください。")


def search_place_by_osm(query):
    params = urllib.parse.urlencode({
        "q": query,
        "format": "jsonv2",
        "limit": 1,
    })
    request = urllib.request.Request(
        f"https://nominatim.openstreetmap.org/search?{params}",
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "ja,en",
        },
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if not payload:
        return None

    best = payload[0]
    lat = float(best["lat"])
    lng = float(best["lon"])
    name = best.get("name") or best.get("display_name", query).split(",")[0].strip()
    return build_result(name, lat, lng, best.get("display_name", ""), best.get("category", ""), best.get("type", ""))


def search_place_by_wikipedia(query):
    search_params = urllib.parse.urlencode({
        "action": "query",
        "list": "search",
        "srsearch": query,
        "format": "json",
        "utf8": 1,
        "srlimit": 1,
    })
    search_request = urllib.request.Request(
        f"https://ja.wikipedia.org/w/api.php?{search_params}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(search_request, timeout=15) as response:
        search_payload = json.loads(response.read().decode("utf-8"))

    search_results = search_payload.get("query", {}).get("search", [])
    if not search_results:
        return None

    page = search_results[0]
    coord_params = urllib.parse.urlencode({
        "action": "query",
        "prop": "coordinates",
        "pageids": page["pageid"],
        "format": "json",
        "utf8": 1,
    })
    coord_request = urllib.request.Request(
        f"https://ja.wikipedia.org/w/api.php?{coord_params}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(coord_request, timeout=15) as response:
        coord_payload = json.loads(response.read().decode("utf-8"))

    page_data = coord_payload.get("query", {}).get("pages", {}).get(str(page["pageid"]), {})
    coordinates = page_data.get("coordinates") or []
    if not coordinates:
        return None

    coord = coordinates[0]
    return build_result(page.get("title", query), float(coord["lat"]), float(coord["lon"]), page.get("title", query), "", "")


def build_result(name, lat, lng, display_name, osm_category="", osm_type=""):
    google_url = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
    return {
        "name": name,
        "lat": lat,
        "lng": lng,
        "url": google_url,
        "display_name": display_name,
        "osmCategory": osm_category,
        "osmType": osm_type,
    }


def get_env_value(name):
    value = os.environ.get(name)
    if value:
        return value.strip()

    env_path = os.path.join(BASE_DIR, ".env")
    if not os.path.exists(env_path):
        return ""
    with open(env_path, "r", encoding="utf-8-sig") as fp:
        for line in fp:
            text = line.strip()
            if not text or text.startswith("#") or "=" not in text:
                continue
            key, raw_value = text.split("=", 1)
            if key.strip() == name:
                return raw_value.strip().strip('"').strip("'")
    return ""


def fetch_google_place_hours(api_key, payload):
    query = str(payload.get("query") or payload.get("name") or "").strip()
    if not query:
        raise ValueError("検索キーワードが空です")

    body = {
        "textQuery": query,
        "languageCode": "ja",
        "regionCode": "JP",
        "maxResultCount": 1,
    }

    try:
        lat = float(payload.get("lat"))
        lng = float(payload.get("lng"))
        body["locationBias"] = {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 1500.0,
            }
        }
    except (TypeError, ValueError):
        pass

    request = urllib.request.Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": ",".join([
                "places.id",
                "places.displayName",
                "places.regularOpeningHours.periods",
            ]),
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))

    place = (data.get("places") or [{}])[0]
    business_hours = google_periods_to_business_hours(
        ((place.get("regularOpeningHours") or {}).get("periods")) or []
    )
    return {
        "placeId": place.get("id"),
        "placeName": ((place.get("displayName") or {}).get("text")) or "",
        "businessHours": business_hours or None,
    }


def google_periods_to_business_hours(periods):
    day_keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    result = {}
    covered_days = set()
    for period in periods:
        open_info = period.get("open") or {}
        close_info = period.get("close") or {}
        day = open_info.get("day")
        if day is None:
            continue
        try:
            day_index = int(day)
            open_hour = int(open_info.get("hour", 0))
            open_minute = int(open_info.get("minute", 0))
            close_hour = int(close_info.get("hour", 24))
            close_minute = int(close_info.get("minute", 0))
        except (TypeError, ValueError):
            continue
        if day_index < 0 or day_index >= len(day_keys):
            continue
        close_day = close_info.get("day")
        try:
            close_day_index = int(close_day) if close_day is not None else day_index
        except (TypeError, ValueError):
            close_day_index = day_index
        close_day_index = close_day_index % 7
        cursor = day_index
        covered_days.add(cursor)
        while close_day is not None and cursor != close_day_index:
            cursor = (cursor + 1) % 7
            if cursor != close_day_index:
                covered_days.add(cursor)
        if close_info.get("day") is not None and int(close_info.get("day")) != day_index:
            close_hour, close_minute = 24, 0
        if open_hour == 0 and open_minute == 0 and close_hour == 24 and close_minute == 0:
            continue
        open_text = f"{open_hour:02d}:{open_minute:02d}"
        close_text = f"{close_hour:02d}:{close_minute:02d}"
        key = day_keys[day_index]
        result[key] = f"{result[key]},{open_text}-{close_text}" if result.get(key) else f"{open_text}-{close_text}"
    if covered_days:
        for idx, key in enumerate(day_keys):
            if idx not in covered_days:
                result[key] = "closed"
    return result


def fetch_google_place_hours(api_key, payload):
    query = str(payload.get("query") or payload.get("name") or "").strip()
    if not query:
        raise ValueError("検索キーワードが空です")
    try:
        return fetch_google_place_hours_new_api(api_key, payload, query)
    except urllib.error.HTTPError as exc:
        if exc.code not in (400, 403, 404):
            raise
        return fetch_google_place_hours_legacy_api(api_key, payload, query)


def fetch_google_place_hours_new_api(api_key, payload, query):
    body = {
        "textQuery": query,
        "languageCode": "ja",
        "regionCode": "JP",
        "maxResultCount": 1,
    }
    try:
        lat = float(payload.get("lat"))
        lng = float(payload.get("lng"))
        body["locationBias"] = {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 1500.0,
            }
        }
    except (TypeError, ValueError):
        pass

    request = urllib.request.Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": ",".join([
                "places.id",
                "places.displayName",
                "places.regularOpeningHours.periods",
            ]),
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))

    place = (data.get("places") or [{}])[0]
    business_hours = google_periods_to_business_hours(
        ((place.get("regularOpeningHours") or {}).get("periods")) or []
    )
    return {
        "placeId": place.get("id"),
        "placeName": ((place.get("displayName") or {}).get("text")) or "",
        "businessHours": business_hours or None,
        "provider": "places-new",
    }


def fetch_google_place_hours_legacy_api(api_key, payload, query):
    text_params = {
        "query": query,
        "language": "ja",
        "region": "jp",
        "key": api_key,
    }
    try:
        lat = float(payload.get("lat"))
        lng = float(payload.get("lng"))
        text_params["location"] = f"{lat},{lng}"
        text_params["radius"] = "1500"
    except (TypeError, ValueError):
        pass

    text_url = "https://maps.googleapis.com/maps/api/place/textsearch/json?" + urllib.parse.urlencode(text_params)
    text_request = urllib.request.Request(text_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(text_request, timeout=20) as response:
        text_data = json.loads(response.read().decode("utf-8"))

    status = text_data.get("status")
    if status != "OK":
        raise ValueError(text_data.get("error_message") or status or "Places Text Search error")

    first = (text_data.get("results") or [{}])[0]
    place_id = first.get("place_id")
    if not place_id:
        return {"placeId": "", "placeName": first.get("name") or "", "businessHours": None, "provider": "places-legacy"}

    details_params = {
        "place_id": place_id,
        "fields": "name,opening_hours",
        "language": "ja",
        "key": api_key,
    }
    details_url = "https://maps.googleapis.com/maps/api/place/details/json?" + urllib.parse.urlencode(details_params)
    details_request = urllib.request.Request(details_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(details_request, timeout=20) as response:
        details_data = json.loads(response.read().decode("utf-8"))

    status = details_data.get("status")
    if status != "OK":
        raise ValueError(details_data.get("error_message") or status or "Places Details error")

    result_data = details_data.get("result") or {}
    business_hours = google_periods_to_business_hours(
        ((result_data.get("opening_hours") or {}).get("periods")) or []
    )
    return {
        "placeId": place_id,
        "placeName": result_data.get("name") or first.get("name") or "",
        "businessHours": business_hours or None,
        "provider": "places-legacy",
    }


def fetch_google_route(api_key, payload):
    origin = payload.get("origin") or {}
    destination = payload.get("destination") or {}
    mode = str(payload.get("mode") or "transit").lower()
    travel_mode = "DRIVE" if mode == "driving" else "TRANSIT"

    try:
        origin_lat = float(origin["lat"])
        origin_lng = float(origin["lng"])
        dest_lat = float(destination["lat"])
        dest_lng = float(destination["lng"])
    except (KeyError, TypeError, ValueError):
        raise ValueError("origin/destination の座標が正しくありません")

    if travel_mode == "TRANSIT":
        return fetch_google_directions_route(api_key, origin_lat, origin_lng, dest_lat, dest_lng)

    body = {
        "origin": {"location": {"latLng": {"latitude": origin_lat, "longitude": origin_lng}}},
        "destination": {"location": {"latLng": {"latitude": dest_lat, "longitude": dest_lng}}},
        "travelMode": travel_mode,
        "languageCode": "ja",
        "units": "METRIC",
    }
    if travel_mode == "TRANSIT":
        body["transitPreferences"] = {"routingPreference": "LESS_WALKING"}

    request = urllib.request.Request(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": ",".join([
                "routes.duration",
                "routes.legs.steps.travelMode",
                "routes.legs.steps.staticDuration",
                "routes.legs.steps.transitDetails.transitLine.name",
                "routes.legs.steps.transitDetails.transitLine.nameShort",
                "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",
                "routes.legs.steps.transitDetails.stopDetails.departureStop.name",
            ]),
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))

    route = (data.get("routes") or [{}])[0]
    duration_min = parse_google_duration_minutes(route.get("duration"))
    segments = []
    transfers = 0
    had_transit = False
    for leg in route.get("legs") or []:
        for step in leg.get("steps") or []:
            step_mode = step.get("travelMode")
            step_min = parse_google_duration_minutes(step.get("staticDuration"))
            if step_mode == "WALK":
                if step_min > 0:
                    segments.append(f"🚶{step_min}分")
            elif step_mode == "TRANSIT":
                if had_transit:
                    transfers += 1
                had_transit = True
                details = step.get("transitDetails") or {}
                line = details.get("transitLine") or {}
                name = line.get("nameShort") or line.get("name") or "公共交通"
                stop = details.get("stopDetails") or {}
                departure = (stop.get("departureStop") or {}).get("name")
                arrival = (stop.get("arrivalStop") or {}).get("name")
                if departure and arrival:
                    segments.append(f"🚃{name}（{departure}→{arrival}）")
                else:
                    segments.append(f"🚃{name}")
            elif step_mode == "DRIVE":
                segments.append("🚗")

    if duration_min <= 0:
        raise ValueError("Google Routes API から有効な経路が返りませんでした")
    if travel_mode == "DRIVE" and not segments:
        segments = ["🚗"]

    return {
        "durationMin": duration_min,
        "transfers": transfers if travel_mode == "TRANSIT" else 0,
        "segments": segments,
        "mode": "driving" if travel_mode == "DRIVE" else "transit",
    }


def fetch_google_directions_route(api_key, origin_lat, origin_lng, dest_lat, dest_lng):
    params = urllib.parse.urlencode({
        "origin": f"{origin_lat},{origin_lng}",
        "destination": f"{dest_lat},{dest_lng}",
        "mode": "transit",
        "language": "ja",
        "key": api_key,
    })
    request = urllib.request.Request(
        f"https://maps.googleapis.com/maps/api/directions/json?{params}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))

    status = data.get("status")
    if status != "OK":
        message = data.get("error_message") or status or "Directions API error"
        if status == "REQUEST_DENIED":
            message = f"{message}（Directions API を有効化し、APIキー制限に Directions API を追加してください）"
        elif status == "ZERO_RESULTS":
            message = "Google Directions API がこの区間の公共交通ルートを返しませんでした（日本の鉄道・バスはAPIで返らない区間があります）"
        raise ValueError(message)

    leg = ((data.get("routes") or [{}])[0].get("legs") or [{}])[0]
    duration_sec = ((leg.get("duration") or {}).get("value")) or 0
    duration_min = max(1, round(duration_sec / 60))
    segments = []
    transfers = 0
    had_transit = False
    for step in leg.get("steps") or []:
        mode = step.get("travel_mode")
        step_sec = ((step.get("duration") or {}).get("value")) or 0
        step_min = max(1, round(step_sec / 60)) if step_sec else 0
        if mode == "WALKING":
            if step_min > 0:
                segments.append(f"🚶{step_min}分")
        elif mode == "TRANSIT":
            if had_transit:
                transfers += 1
            had_transit = True
            details = step.get("transit_details") or {}
            line = details.get("line") or {}
            vehicle_type = ((line.get("vehicle") or {}).get("type") or "").upper()
            icon = {
                "SUBWAY": "🚇",
                "BUS": "🚌",
                "TRAM": "🚊",
                "RAIL": "🚃",
                "HEAVY_RAIL": "🚃",
                "COMMUTER_TRAIN": "🚃",
                "HIGH_SPEED_TRAIN": "🚄",
                "FERRY": "⛴",
            }.get(vehicle_type, "🚃")
            name = line.get("short_name") or line.get("name") or "公共交通"
            departure = (details.get("departure_stop") or {}).get("name")
            arrival = (details.get("arrival_stop") or {}).get("name")
            headsign = details.get("headsign")
            label = f"{icon}{name}"
            if headsign:
                label += f"（{headsign}方面）"
            if departure and arrival:
                label += f" {departure}→{arrival}"
            segments.append(label)

    if not segments:
        raise ValueError("Directions API から乗り換え情報が返りませんでした")

    return {
        "durationMin": duration_min,
        "transfers": transfers,
        "segments": segments,
        "mode": "transit",
    }


def parse_google_duration_minutes(value):
    if not value:
        return 0
    text = str(value)
    if text.endswith("s"):
        try:
            return max(1, round(float(text[:-1]) / 60))
        except ValueError:
            return 0
    return 0


def is_google_maps_host(hostname):
    return hostname == "google.com" or hostname == "maps.google.com" or hostname.endswith(".google.com")


def build_access_urls():
    urls = [f"http://127.0.0.1:{PORT}"]
    for ip in get_local_ips():
        urls.append(f"http://{ip}:{PORT}")
    return urls


def get_local_ips():
    addresses = []
    try:
        _, _, ip_list = socket.gethostbyname_ex(socket.gethostname())
        for ip in ip_list:
            if ip.startswith("127."):
                continue
            addresses.append(ip)
    except OSError:
        pass

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            candidate = sock.getsockname()[0]
            if candidate and not candidate.startswith("127."):
                addresses.append(candidate)
    except OSError:
        pass

    return sorted(set(addresses))


def main():
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print("Serving Spot Map Organizer")
    for url in build_access_urls():
        print(f"Open: {url}")
    print("スマホからは同じWi-Fiに接続して、上のIPアドレスを開いてください。")
    server.serve_forever()


if __name__ == "__main__":
    main()
