const STORAGE_KEY = "spot-map-organizer.v7";
const CLUSTER_THRESHOLD_KM = 35;
const DETAIL_PADDING_RATIO = 0.35;
const OVERVIEW_PADDING_RATIO = 0.15;
const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

const sampleSpots = [
  { name: "浅草寺", url: "https://www.google.com/maps/place/%E6%B5%85%E8%8D%89%E5%AF%BA/@35.714765,139.796655,16z", description: "" },
  { name: "東京タワー", url: "https://www.google.com/maps/place/%E6%9D%B1%E4%BA%AC%E3%82%BF%E3%83%AF%E3%83%BC/@35.658581,139.745433,16z", description: "" },
  { name: "首里城", url: "https://www.google.com/maps/place/%E9%A6%96%E9%87%8C%E5%9F%8E/@26.217299,127.719398,16z", description: "" },
];

const state = {
  ...loadAppState(),
  maps: [],
  editingSpotId: null,
};

const form = document.getElementById("spotForm");
const placeInput = document.getElementById("placeInput");
const feedback = document.getElementById("feedback");
const spotList = document.getElementById("spotList");
const spotCount = document.getElementById("spotCount");
const mapPanels = document.getElementById("mapPanels");
const clearButton = document.getElementById("clearButton");
const addSpotButton = document.getElementById("addSpotButton");
const accessInfo = document.getElementById("accessInfo");
const meetDateInput = document.getElementById("meetDateInput");
const meetTimeInput = document.getElementById("meetTimeInput");
const dismissDateInput = document.getElementById("dismissDateInput");
const dismissTimeInput = document.getElementById("dismissTimeInput");
const spotItemTemplate = document.getElementById("spotItemTemplate");
const spotMenuBackdrop = document.getElementById("spotMenuBackdrop");
const spotMenu = document.getElementById("spotMenu");
const spotMenuTitle = document.getElementById("spotMenuTitle");
const spotMenuClose = document.getElementById("spotMenuClose");
const spotNameInput = document.getElementById("spotNameInput");
const spotDescriptionInput = document.getElementById("spotDescriptionInput");
const spotDescriptionSave = document.getElementById("spotDescriptionSave");
const spotDeleteButton = document.getElementById("spotDeleteButton");

form.addEventListener("submit", (event) => event.preventDefault());
clearButton.addEventListener("click", clearAllData);
addSpotButton.addEventListener("click", saveLocation);
meetDateInput.addEventListener("change", () => updateSchedule("meet"));
meetTimeInput.addEventListener("change", () => updateSchedule("meet"));
dismissDateInput.addEventListener("change", () => updateSchedule("dismiss"));
dismissTimeInput.addEventListener("change", () => updateSchedule("dismiss"));
spotMenuBackdrop.addEventListener("click", closeSpotMenu);
spotMenuClose.addEventListener("click", closeSpotMenu);
spotDescriptionSave.addEventListener("click", saveSpotDescription);
spotDeleteButton.addEventListener("click", deleteEditingSpot);

render();
loadAccessInfo();

function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeState(JSON.parse(raw));
    }

    for (const key of ["spot-map-organizer.v6", "spot-map-organizer.v5", "spot-map-organizer.v4", "spot-map-organizer.v3", "spot-map-organizer.v2", "spot-map-organizer.v1"]) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        return normalizeState(JSON.parse(legacy));
      }
    }
  } catch {
    return defaultState();
  }

  return defaultState();
}

function defaultState() {
  return {
    spots: [],
    meetDate: "",
    meetTime: "",
    dismissDate: "",
    dismissTime: "",
  };
}

function normalizeState(value) {
  if (Array.isArray(value)) {
    return { ...defaultState(), spots: value.map(normalizeSpot) };
  }

  return {
    spots: Array.isArray(value?.spots) ? value.spots.map(normalizeSpot) : [],
    meetDate: value?.meetDate || "",
    meetTime: value?.meetTime || "",
    dismissDate: value?.dismissDate || "",
    dismissTime: value?.dismissTime || "",
  };
}

function normalizeSpot(spot) {
  return {
    ...spot,
    description: spot?.description || "",
  };
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    spots: state.spots,
    meetDate: state.meetDate,
    meetTime: state.meetTime,
    dismissDate: state.dismissDate,
    dismissTime: state.dismissTime,
  }));
}

async function saveLocation() {
  const rawInput = placeInput.value.trim();

  if (!rawInput) {
    setFeedback("スポット名か Google Maps URL のどちらかを入力してください。", true);
    return;
  }

  try {
    const resolved = looksLikeUrl(rawInput)
      ? await buildSpotFromUrl(rawInput)
      : await buildSpotFromSearch(rawInput);
    const location = {
      ...resolved,
      id: createStableId(),
      name: resolved.name || fallbackName(state.spots.length + 1),
      description: "",
    };

    state.spots = [...state.spots, location];
    persistState();
    form.reset();
    setFeedback(`「${location.name}」を立ち寄りスポットに追加しました。`, false);
    render();
  } catch (error) {
    setFeedback(error.message, true);
  }
}

async function buildSpotFromUrl(url) {
  setFeedback("URLを確認しています...", false);
  const resolvedUrl = await normalizeGoogleMapsUrl(url);
  const parsed = parseGoogleMapsUrl(resolvedUrl);
  return {
    name: parsed.name,
    lat: parsed.lat,
    lng: parsed.lng,
    url: resolvedUrl,
    sourceUrl: url,
    sourceType: "url",
  };
}

async function buildSpotFromSearch(query) {
  setFeedback("スポット名から場所を検索しています...", false);
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "スポット名から場所を取得できませんでした。");
  }

  return {
    name: data.name || query,
    lat: Number(data.lat),
    lng: Number(data.lng),
    url: data.url || "",
    sourceUrl: data.url || "",
    sourceQuery: query,
    sourceType: "search",
  };
}

function loadSampleData() {
  state.spots = sampleSpots.map((entry, index) => {
    const parsed = parseGoogleMapsUrl(entry.url);
    return {
      id: `sample-${index + 1}`,
      name: entry.name || parsed.name || fallbackName(index + 1),
      lat: parsed.lat,
      lng: parsed.lng,
      url: entry.url,
      sourceUrl: entry.url,
      sourceType: "url",
      description: entry.description || "",
    };
  });
  persistState();
  setFeedback("サンプルを読み込みました。", false);
  render();
}

function clearAllData() {
  if (state.spots.length === 0 && !state.meetDate && !state.dismissDate) {
    setFeedback("消去するデータはありません。", true);
    return;
  }

  const confirmed = window.confirm("スポットと日時設定をすべて削除しますか？");
  if (!confirmed) {
    return;
  }

  Object.assign(state, defaultState(), { maps: [], editingSpotId: null });
  persistState();
  closeSpotMenu();
  setFeedback("一覧を消去しました。", false);
  render();
}

function updateSchedule(kind) {
  if (kind === "meet") {
    state.meetDate = meetDateInput.value;
    state.meetTime = meetTimeInput.value;
  } else {
    state.dismissDate = dismissDateInput.value;
    state.dismissTime = dismissTimeInput.value;
  }

  persistState();
  renderSchedule();
}

function setFeedback(message, isError) {
  feedback.textContent = message;
  feedback.style.color = isError ? "#b53a48" : "#5f6d73";
}

function render() {
  renderSchedule();
  renderSpotList();
  renderMaps();
}

function renderScheduleLegacy() {
  meetDateInput.value = state.meetDate || "";
  meetTimeInput.value = state.meetTime || "";
  dismissDateInput.value = state.dismissDate || "";
  dismissTimeInput.value = state.dismissTime || "";

  meetMeta.textContent = buildScheduleText("開始", state.meetDate, state.meetTime);
  dismissMeta.textContent = buildScheduleText("終了", state.dismissDate, state.dismissTime);
}

function buildScheduleText(label, date, time) {
  return "";
}

function renderSpotListLegacy() {
  spotCount.textContent = `${state.spots.length}件`;

  if (state.spots.length === 0) {
    spotList.className = "spot-list empty-state";
    spotList.textContent = "まだスポットが登録されていません。";
    return;
  }

  spotList.className = "spot-list";
  spotList.innerHTML = "";

  state.spots.forEach((spot, index) => {
    const fragment = spotItemTemplate.content.cloneNode(true);
    const nameButton = fragment.querySelector(".spot-name-button");
    fragment.querySelector(".spot-name").textContent = `${index + 1}. ${spot.name}`;
    fragment.querySelector(".spot-meta").textContent = buildSpotMeta(spot);
    nameButton.addEventListener("click", () => openSpotMenu(spot.id));
    spotList.appendChild(fragment);
  });
}

function buildSpotMeta(spot) {
  const parts = [`${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}`];
  if (spot.description) {
    parts.push(`メモ: ${spot.description}`);
  }
  if (spot.sourceType === "search" && spot.sourceQuery) {
    parts.push(`検索: ${spot.sourceQuery}`);
  }
  if (spot.sourceUrl) {
    parts.push(spot.sourceUrl);
  }
  return parts.join(" | ");
}

function openSpotMenu(id) {
  const spot = state.spots.find((item) => item.id === id);
  if (!spot) {
    return;
  }

  state.editingSpotId = id;
  spotMenuTitle.textContent = spot.name;
  spotNameInput.value = spot.name || "";
  spotDescriptionInput.value = spot.description || "";
  spotMenu.classList.remove("hidden");
  spotMenuBackdrop.classList.remove("hidden");
  spotMenu.setAttribute("aria-hidden", "false");
}

function closeSpotMenu() {
  state.editingSpotId = null;
  spotMenu.classList.add("hidden");
  spotMenuBackdrop.classList.add("hidden");
  spotMenu.setAttribute("aria-hidden", "true");
}

function saveSpotDescription() {
  const targetIndex = state.spots.findIndex((spot) => spot.id === state.editingSpotId);
  if (targetIndex < 0) {
    return;
  }

  state.spots[targetIndex] = {
    ...state.spots[targetIndex],
    name: spotNameInput.value.trim() || state.spots[targetIndex].name,
    description: spotDescriptionInput.value.trim(),
  };
  persistState();
  setFeedback("スポットの説明を保存しました。", false);
  closeSpotMenu();
  render();
}

function deleteEditingSpot() {
  if (!state.editingSpotId) {
    return;
  }
  deleteSpot(state.editingSpotId);
  closeSpotMenu();
}

function deleteSpot(id) {
  state.spots = state.spots.filter((spot) => spot.id !== id);
  persistState();
  setFeedback("スポットを削除しました。", false);
  render();
}

function renderSchedule() {
  meetDateInput.value = state.meetDate || "";
  meetTimeInput.value = state.meetTime || "";
  dismissDateInput.value = state.dismissDate || "";
  dismissTimeInput.value = state.dismissTime || "";
}

function renderSpotList() {
  spotCount.textContent = `${state.spots.length}件`;

  if (state.spots.length === 0) {
    spotList.className = "spot-list empty-state";
    spotList.textContent = "まだスポットが登録されていません。";
    return;
  }

  spotList.className = "spot-list";
  spotList.innerHTML = "";

  state.spots.forEach((spot, index) => {
    const fragment = spotItemTemplate.content.cloneNode(true);
    const nameButton = fragment.querySelector(".spot-name-button");
    fragment.querySelector(".spot-name").textContent = `${index + 1}. ${spot.name}`;
    fragment.querySelector(".spot-meta").textContent = buildSpotMeta(spot);
    nameButton.addEventListener("click", () => openSpotMenu(spot.id));
    spotList.appendChild(fragment);
  });
}

function renderMaps() {
  state.maps.forEach((map) => map.remove());
  state.maps = [];

  if (state.spots.length === 0) {
    mapPanels.innerHTML = '<div class="empty-state">場所を追加すると、全体図と拡大図がここに表示されます。</div>';
    return;
  }

  const groups = buildMapGroups(state.spots);
  mapPanels.innerHTML = "";

  groups.forEach((group, index) => {
    const card = document.createElement("article");
    card.className = "map-card";

    const head = document.createElement("div");
    head.className = "map-head";
    head.innerHTML = `<div><p class="map-number">Map ${index + 1}</p><h3>${escapeHtml(group.title)}</h3></div>`;

    const caption = document.createElement("p");
    caption.className = group.kind === "overview" ? "map-caption" : "detail-caption";
    caption.textContent = group.caption;

    const mapContainer = document.createElement("div");
    mapContainer.className = "leaflet-map";

    card.append(head, caption, mapContainer);
    mapPanels.appendChild(card);

    const map = L.map(mapContainer, {
      zoomControl: true,
      scrollWheelZoom: false,
      preferCanvas: true,
    });

    L.tileLayer("https://tile.openstreetmap.jp/styles/osm-bright/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      crossOrigin: true,
      detectRetina: true,
      keepBuffer: 4,
      tileSize: 256,
      zoomOffset: 0,
    }).addTo(map);

    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

    if (group.kind === "overview") {
      renderOverviewLayer(map, group.overviewItems);
    } else {
      renderDetailLayer(map, group.points);
    }

    map.fitBounds(group.bounds, { padding: [30, 30] });
    state.maps.push(map);
  });
}

function renderOverviewLayer(map, items) {
  items.forEach((item) => {
    if (item.type === "single") {
      const marker = L.marker([item.point.lat, item.point.lng], { icon: createMarkerIcon() }).addTo(map);
      marker.bindPopup(`<strong>${escapeHtml(item.point.name)}</strong>`);
      marker.bindTooltip(escapeHtml(item.point.name), {
        permanent: true,
        direction: "right",
        offset: [12, 0],
        className: "spot-label",
      });
      return;
    }

    L.rectangle(item.bounds, {
      color: "#ff7a45",
      weight: 2,
      fillOpacity: 0.06,
      dashArray: "6 6",
    }).addTo(map);

    const summaryHtml = formatClusterLabel(item.points.map((point) => point.name));
    const summaryText = item.points.map((point) => point.name).join(", ");
    const labelMarker = L.marker([item.center.lat, item.center.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="cluster-label">${summaryHtml}</div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      }),
    }).addTo(map);
    labelMarker.bindPopup(`<strong>${escapeHtml(summaryText)}</strong>`);
  });
}

function renderDetailLayer(map, points) {
  points.forEach((point) => {
    const marker = L.marker([point.lat, point.lng], { icon: createMarkerIcon() }).addTo(map);
    marker.bindPopup(`<strong>${escapeHtml(point.name)}</strong>`);
    marker.bindTooltip(escapeHtml(point.name), {
      permanent: true,
      direction: "right",
      offset: [12, 0],
      className: "spot-label",
    });
  });
}

function buildMapGroups(points) {
  const clusters = buildClusters(points);
  const overviewItems = clusters.map((cluster) => {
    if (cluster.length === 1) {
      return { type: "single", point: cluster[0] };
    }
    return {
      type: "cluster",
      points: cluster,
      bounds: boundsFromPoints(cluster, DETAIL_PADDING_RATIO),
      center: centerFromPoints(cluster),
    };
  });

  const groups = [{
    kind: "overview",
    title: "全体図",
    caption: clusters.some((cluster) => cluster.length >= 2)
      ? "近いスポットは全体図では範囲とまとめラベルで表示し、拡大図で個別に見分けられるようにしています。"
      : "登録した場所の全体位置を一覧できる地図です。",
    overviewItems,
    bounds: boundsFromPoints(points, OVERVIEW_PADDING_RATIO),
  }];

  clusters.filter((cluster) => cluster.length >= 2).forEach((cluster) => {
    const labels = cluster.map((point) => point.name);
    groups.push({
      kind: "detail",
      title: `${labels.join(" / ")} の拡大図`,
      caption: `${labels.join("、")} を拡大して個別に確認できる地図です。`,
      points: cluster,
      bounds: boundsFromPoints(cluster, DETAIL_PADDING_RATIO),
    });
  });

  return groups;
}

function buildClusters(points) {
  const visited = new Set();
  const clusters = [];

  for (const point of points) {
    if (visited.has(point.id)) {
      continue;
    }

    const queue = [point];
    const cluster = [];
    visited.add(point.id);

    while (queue.length > 0) {
      const current = queue.shift();
      cluster.push(current);

      points.forEach((candidate) => {
        if (visited.has(candidate.id)) {
          return;
        }
        if (distanceKm(current, candidate) <= CLUSTER_THRESHOLD_KM) {
          visited.add(candidate.id);
          queue.push(candidate);
        }
      });
    }

    clusters.push(cluster);
  }

  return clusters.sort((a, b) => b.length - a.length);
}

async function loadAccessInfo() {
  try {
    const response = await fetch("/api/meta");
    const data = await response.json();
    accessInfo.innerHTML = data.urls.map((url, index) => `<a class="access-link" href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${index === 0 ? "このPCで開く" : "スマホで開く"}: ${escapeHtml(url)}</a>`).join("");
  } catch {
    accessInfo.textContent = "起動すると、このPC用URLとスマホ用URLを表示します。";
  }
}

async function normalizeGoogleMapsUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("有効なURLを入力してください。");
  }

  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (SHORT_HOSTS.has(hostname)) {
    return await expandShortGoogleMapsUrl(input);
  }
  if (!isGoogleMapsHost(hostname)) {
    throw new Error("Google Maps のURLを入力してください。");
  }
  return input;
}

async function expandShortGoogleMapsUrl(input) {
  const response = await fetch("/api/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: input }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "短縮URLを展開できませんでした。");
  }
  if (!data.url) {
    throw new Error("短縮URLの展開結果を取得できませんでした。");
  }
  return data.url;
}

function parseGoogleMapsUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("有効なURLを入力してください。");
  }

  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (!isGoogleMapsHost(hostname)) {
    throw new Error("Google Maps のURLを入力してください。");
  }

  const decodedPath = decodeURIComponent(url.pathname);
  const placeMatch = decodedPath.match(/\/place\/([^/]+)/);
  const name = placeMatch ? cleanupPlaceName(placeMatch[1]) : "";
  const latLngPatterns = [
    decodedPath.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/),
    decodedPath.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/),
    url.searchParams.get("q")?.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/),
    url.searchParams.get("ll")?.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/),
    url.searchParams.get("query")?.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/),
    url.searchParams.get("destination")?.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/),
  ].filter(Boolean);

  if (latLngPatterns.length === 0) {
    throw new Error("このURLから緯度経度を取得できませんでした。");
  }

  const [, latText, lngText] = latLngPatterns[0];
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("URL内の位置情報を読み取れませんでした。");
  }

  return { name, lat, lng };
}

function isGoogleMapsHost(hostname) {
  return hostname === "google.com" || hostname === "maps.google.com" || hostname.endsWith(".google.com");
}

function cleanupPlaceName(name) {
  return name.replace(/\+/g, " ").trim();
}

function fallbackName(index) {
  return `スポット ${index}`;
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value);
}

function boundsFromPoints(points, paddingRatio) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  let south = Math.min(...lats);
  let north = Math.max(...lats);
  let west = Math.min(...lngs);
  let east = Math.max(...lngs);

  const latSpan = Math.max(north - south, 0.02);
  const lngSpan = Math.max(east - west, 0.02);
  south -= latSpan * paddingRatio;
  north += latSpan * paddingRatio;
  west -= lngSpan * paddingRatio;
  east += lngSpan * paddingRatio;

  return [[south, west], [north, east]];
}

function centerFromPoints(points) {
  const sum = points.reduce((accumulator, point) => ({
    lat: accumulator.lat + point.lat,
    lng: accumulator.lng + point.lng,
  }), { lat: 0, lng: 0 });

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length,
  };
}

function createMarkerIcon() {
  return L.divIcon({
    className: "",
    html: '<div class="map-pin"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function createStableId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function formatClusterLabel(labels) {
  return labels.map((label, index) => {
    const separator = index === 0 ? "" : '<span class="cluster-sep">, </span><wbr>';
    return `${separator}<span class="cluster-part">${escapeHtml(label)}</span>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
