import json
import os
import socket
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
    return build_result(name, lat, lng, best.get("display_name", ""))


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
    return build_result(page.get("title", query), float(coord["lat"]), float(coord["lon"]), page.get("title", query))


def build_result(name, lat, lng, display_name):
    google_url = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
    return {
        "name": name,
        "lat": lat,
        "lng": lng,
        "url": google_url,
        "display_name": display_name,
    }


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