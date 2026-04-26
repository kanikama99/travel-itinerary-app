const STORAGE_KEY = "spot-map-organizer.v9";
const RELATIVE_CLUSTER_THRESHOLD = 0.08;
const MAP_W = 640;
const MAP_H = 420;
const MAP_PAD = 30;
const LABEL_W = 130;
const LABEL_H = 22;
const LABEL_GAP = 16;
const LABEL_DIRS = ["right", "left", "top", "bottom"];
const DETAIL_PADDING_RATIO = 0.35;
const OVERVIEW_PADDING_RATIO = 0.15;
const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

const SETTINGS_KEY = "spot-map-settings.v1";

const MAP_STYLE_CONFIGS = {
  "osm-bright": {
    url: "https://tile.openstreetmap.jp/styles/osm-bright/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    options: { maxZoom: 18, crossOrigin: true, detectRetina: true, keepBuffer: 4, tileSize: 256, zoomOffset: 0 },
  },
  "osm-standard": {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    options: { maxZoom: 19 },
  },
  "carto-light": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    options: { maxZoom: 20, subdomains: "abcd" },
  },
  "carto-dark": {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    options: { maxZoom: 20, subdomains: "abcd" },
  },
  "esri-satellite": {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    options: { maxZoom: 17 },
  },
};

const BG_THEME_CONFIGS = {
  warm:     "radial-gradient(circle at 8% 10%, rgba(255,210,87,.55), transparent 22%), radial-gradient(circle at 92% 14%, rgba(112,214,197,.34), transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,143,177,.28), transparent 18%), linear-gradient(180deg,#fff8ea 0%,#ffeccd 100%)",
  sky:      "radial-gradient(circle at 8% 10%, rgba(135,206,250,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(100,180,255,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(173,216,230,.25), transparent 18%), linear-gradient(180deg,#eaf5ff 0%,#d0e8ff 100%)",
  mint:     "radial-gradient(circle at 8% 10%, rgba(144,238,144,.4),  transparent 22%), radial-gradient(circle at 92% 14%, rgba(100,200,150,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(152,251,152,.22), transparent 18%), linear-gradient(180deg,#eafff4 0%,#d0f5e0 100%)",
  lavender: "radial-gradient(circle at 8% 10%, rgba(216,191,255,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(180,150,240,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(200,170,255,.22), transparent 18%), linear-gradient(180deg,#f4eeff 0%,#e5d8ff 100%)",
  gray:     "radial-gradient(circle at 8% 10%, rgba(200,210,220,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(180,190,200,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(190,200,210,.22), transparent 18%), linear-gradient(180deg,#f2f4f6 0%,#e4e8ec 100%)",
};

function loadAppSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { mapStyle: "osm-bright", bgTheme: "warm", ...JSON.parse(raw) } : { mapStyle: "osm-bright", bgTheme: "warm" };
  } catch {
    return { mapStyle: "osm-bright", bgTheme: "warm" };
  }
}

function applyBgTheme(themeKey) {
  document.body.style.background = BG_THEME_CONFIGS[themeKey] || BG_THEME_CONFIGS.warm;
}

const CATEGORY_DISPLAY = {
  airport:    { label: "✈ 空港",    cssClass: "category-airport" },
  restaurant: { label: "🍽 飲食",   cssClass: "category-restaurant" },
  tourist:    { label: "⛩ 観光",    cssClass: "category-tourist" },
  hotel:      { label: "🏨 ホテル",  cssClass: "category-hotel" },
  other:      { label: "📍 その他",  cssClass: "category-other" },
};

const SPOT_PIN_ICONS = {
  airport: "✈",
  restaurant: "🍽",
  tourist: "⛩",
  hotel: "🏨",
  other: "",
};

function detectSpotCategory(name, osmCategory, osmType) {
  if (osmCategory === "aeroway") return "airport";
  if (osmCategory === "tourism") {
    if (["hotel", "hostel", "motel", "guest_house", "chalet", "apartment"].includes(osmType)) return "hotel";
    if (["museum", "attraction", "viewpoint", "artwork", "zoo", "theme_park", "aquarium", "gallery"].includes(osmType)) return "tourist";
  }
  if (osmCategory === "amenity" && ["restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "biergarten", "ice_cream"].includes(osmType)) return "restaurant";
  if (osmCategory === "historic" || osmCategory === "leisure") return "tourist";

  if (/空港|airport|エアポート/i.test(name)) return "airport";
  if (/ホテル|旅館|宿泊|リゾート|inn\b|hotel/i.test(name)) return "hotel";
  if (/レストラン|食堂|居酒屋|カフェ|喫茶|ラーメン|寿司|焼肉|カレー|定食|飲食|ビストロ|バル/i.test(name)) return "restaurant";
  if (/城|寺院?|神社|仏閣|公園|博物館|美術館|タワー|展望台|記念館|資料館|遺跡|名所|大聖堂/i.test(name)) return "tourist";
  return "other";
}

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
const bulkDeleteButton = document.getElementById("bulkDeleteButton");
const spotItemTemplate = document.getElementById("spotItemTemplate");
const placeDropdown = document.getElementById("placeDropdown");
const hamburgerBtn = document.getElementById("hamburgerBtn");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const sideDrawer = document.getElementById("sideDrawer");
const spotMenuBackdrop = document.getElementById("spotMenuBackdrop");
const spotMenu = document.getElementById("spotMenu");
const spotMenuTitle = document.getElementById("spotMenuTitle");
const spotMenuClose = document.getElementById("spotMenuClose");
const spotNameInput = document.getElementById("spotNameInput");
const spotDescriptionInput = document.getElementById("spotDescriptionInput");
const spotDescriptionSave = document.getElementById("spotDescriptionSave");
const spotDeleteButton = document.getElementById("spotDeleteButton");

hamburgerBtn.addEventListener("click", () => {
  sideDrawer.classList.contains("hidden") ? openDrawer() : closeDrawer();
});
drawerBackdrop.addEventListener("click", closeDrawer);

form.addEventListener("submit", (event) => event.preventDefault());
clearButton.addEventListener("click", clearAllData);
addSpotButton.addEventListener("click", saveLocation);
bulkDeleteButton.addEventListener("click", deleteCheckedSpots);
spotMenuBackdrop.addEventListener("click", closeSpotMenu);
spotMenuClose.addEventListener("click", closeSpotMenu);
spotDescriptionSave.addEventListener("click", saveSpotDescription);
spotDeleteButton.addEventListener("click", deleteEditingSpot);
document.querySelectorAll(".type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

setupAutocomplete(placeInput, placeDropdown);

document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete-wrap")) {
    hideDropdown(placeDropdown);
  }
});

applyBgTheme(loadAppSettings().bgTheme);
render();
loadAccessInfo();

function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
    for (const key of [
      "spot-map-organizer.v7",
      "spot-map-organizer.v6",
      "spot-map-organizer.v5",
      "spot-map-organizer.v4",
      "spot-map-organizer.v3",
      "spot-map-organizer.v2",
      "spot-map-organizer.v1",
    ]) {
      const legacy = localStorage.getItem(key);
      if (legacy) return normalizeState(JSON.parse(legacy));
    }
  } catch {
    return defaultState();
  }
  return defaultState();
}

function defaultState() {
  return { spots: [] };
}

function normalizeState(value) {
  if (Array.isArray(value)) {
    return { spots: value.map(normalizeSpot) };
  }
  return {
    spots: Array.isArray(value?.spots) ? value.spots.map(normalizeSpot) : [],
  };
}

function normalizeSpot(spot) {
  return {
    ...spot,
    description: spot?.description || "",
    type: spot?.type || "spot",
    spotCategory: spot?.spotCategory || "other",
  };
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ spots: state.spots }));
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
    const spotCategory = detectSpotCategory(
      resolved.name || "",
      resolved.osmCategory || "",
      resolved.osmType || ""
    );
    const location = {
      ...resolved,
      id: createStableId(),
      name: resolved.name || fallbackName(state.spots.length + 1),
      description: "",
      type: "spot",
      spotCategory,
    };
    state.spots = [...state.spots, location];
    persistState();
    form.reset();
    setFeedback(`「${location.name}」を追加しました。`, false);
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
    osmCategory: "",
    osmType: "",
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
  if (!response.ok) throw new Error(data.error || "スポット名から場所を取得できませんでした。");
  return {
    name: data.name || query,
    lat: Number(data.lat),
    lng: Number(data.lng),
    url: data.url || "",
    sourceUrl: data.url || "",
    sourceQuery: query,
    sourceType: "search",
    osmCategory: data.osmCategory || "",
    osmType: data.osmType || "",
  };
}

function clearAllData() {
  if (state.spots.length === 0) {
    setFeedback("消去するデータはありません。", true);
    return;
  }
  if (!window.confirm("スポットをすべて削除しますか？")) return;
  Object.assign(state, defaultState(), { maps: [], editingSpotId: null });
  persistState();
  closeSpotMenu();
  setFeedback("一覧を消去しました。", false);
  render();
}

function setFeedback(message, isError) {
  feedback.textContent = message;
  feedback.style.color = isError ? "#b53a48" : "#5f6d73";
}

function render() {
  renderSpotList();
  renderMaps();
}

function renderSpotList() {
  spotCount.textContent = `${state.spots.length}件`;

  if (state.spots.length === 0) {
    spotList.className = "spot-list empty-state";
    spotList.textContent = "まだスポットが登録されていません。";
    updateBulkDeleteButton();
    return;
  }

  spotList.className = "spot-list";
  spotList.innerHTML = "";

  state.spots.forEach((spot, index) => {
    const fragment = spotItemTemplate.content.cloneNode(true);
    const nameButton = fragment.querySelector(".spot-name-button");
    const checkbox = fragment.querySelector(".spot-checkbox");
    const typeBadge = fragment.querySelector(".spot-type-badge");

    checkbox.dataset.spotId = spot.id;
    checkbox.addEventListener("change", updateBulkDeleteButton);

    if (spot.type === "meet") {
      typeBadge.textContent = "集合";
      typeBadge.className = "spot-type-badge meet";
    } else if (spot.type === "dismiss") {
      typeBadge.textContent = "解散";
      typeBadge.className = "spot-type-badge dismiss";
    } else {
      const cat = CATEGORY_DISPLAY[spot.spotCategory || "other"] || CATEGORY_DISPLAY.other;
      typeBadge.textContent = cat.label;
      typeBadge.className = `spot-type-badge ${cat.cssClass}`;
    }

    fragment.querySelector(".spot-name").textContent = `${index + 1}. ${spot.name}`;
    fragment.querySelector(".spot-meta").textContent = buildSpotMeta(spot);
    nameButton.addEventListener("click", () => openSpotMenu(spot.id));
    spotList.appendChild(fragment);
  });

  updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
  const checked = spotList.querySelectorAll(".spot-checkbox:checked");
  bulkDeleteButton.classList.toggle("hidden", checked.length === 0);
}

function deleteCheckedSpots() {
  const checkedIds = [...spotList.querySelectorAll(".spot-checkbox:checked")].map((cb) => cb.dataset.spotId);
  if (checkedIds.length === 0) return;
  if (!window.confirm(`選択した ${checkedIds.length} 件のスポットを削除しますか？`)) return;
  state.spots = state.spots.filter((spot) => !checkedIds.includes(spot.id));
  persistState();
  setFeedback(`${checkedIds.length} 件のスポットを削除しました。`, false);
  render();
}

function buildSpotMeta(spot) {
  const parts = [`${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}`];
  if (spot.description) parts.push(`メモ: ${spot.description}`);
  if (spot.sourceType === "search" && spot.sourceQuery) parts.push(`検索: ${spot.sourceQuery}`);
  if (spot.sourceUrl) parts.push(spot.sourceUrl);
  return parts.join(" | ");
}

function openSpotMenu(id) {
  const spot = state.spots.find((item) => item.id === id);
  if (!spot) return;
  state.editingSpotId = id;
  spotMenuTitle.textContent = spot.name;
  spotNameInput.value = spot.name || "";
  spotDescriptionInput.value = spot.description || "";
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === (spot.type || "spot"));
  });
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === (spot.spotCategory || "other"));
  });
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

function openDrawer() {
  sideDrawer.classList.remove("hidden");
  drawerBackdrop.classList.remove("hidden");
  sideDrawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  sideDrawer.classList.add("hidden");
  drawerBackdrop.classList.add("hidden");
  sideDrawer.setAttribute("aria-hidden", "true");
}

function saveSpotDescription() {
  const targetIndex = state.spots.findIndex((spot) => spot.id === state.editingSpotId);
  if (targetIndex < 0) return;
  const activeTypeBtn = document.querySelector(".type-btn.active");
  const newType = activeTypeBtn ? activeTypeBtn.dataset.type : "spot";
  const oldType = state.spots[targetIndex].type;

  if (newType !== "spot" && newType !== oldType) {
    state.spots = state.spots.map((s, i) =>
      i !== targetIndex && s.type === newType ? { ...s, type: "spot" } : s
    );
  }

  const activeCategoryBtn = document.querySelector(".category-btn.active");
  const newCategory = activeCategoryBtn ? activeCategoryBtn.dataset.category : "other";

  const idx = state.spots.findIndex((s) => s.id === state.editingSpotId);
  state.spots[idx] = {
    ...state.spots[idx],
    name: spotNameInput.value.trim() || state.spots[idx].name,
    description: spotDescriptionInput.value.trim(),
    type: newType,
    spotCategory: newCategory,
  };
  persistState();
  setFeedback("スポットを保存しました。", false);
  closeSpotMenu();
  render();
}

function deleteEditingSpot() {
  if (!state.editingSpotId) return;
  deleteSpot(state.editingSpotId);
  closeSpotMenu();
}

function deleteSpot(id) {
  state.spots = state.spots.filter((spot) => spot.id !== id);
  persistState();
  setFeedback("スポットを削除しました。", false);
  render();
}

function renderMaps() {
  state.maps.forEach((map) => map.remove());
  state.maps = [];

  if (state.spots.length === 0) {
    mapPanels.innerHTML = '<div class="empty-state">場所を追加すると地図が表示されます。</div>';
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

    const tileConfig = MAP_STYLE_CONFIGS[loadAppSettings().mapStyle] || MAP_STYLE_CONFIGS["osm-bright"];
    L.tileLayer(tileConfig.url, { ...tileConfig.options, attribution: tileConfig.attribution }).addTo(map);

    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

    map.fitBounds(group.bounds, { padding: [30, 30] });

    if (group.kind === "overview") {
      renderOverviewLayer(map, group.overviewItems, group.bounds);
    } else {
      renderDetailLayer(map, group.points, group.bounds);
    }
    state.maps.push(map);
  });
}

function estimateZoom(bounds) {
  const [[south, west], [north, east]] = bounds;
  const zLat = Math.log2((MAP_H - 2 * MAP_PAD) * 180 / (256 * (north - south)));
  const zLng = Math.log2((MAP_W - 2 * MAP_PAD) * 360 / (256 * (east - west)));
  return Math.min(zLat, zLng);
}

function spotToPx(spot, zoom) {
  const sc = 256 * Math.pow(2, zoom);
  const x = (spot.lng + 180) / 360 * sc;
  const s = Math.sin(spot.lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * sc;
  return { x, y };
}

function labelRect(px, dir) {
  const g = LABEL_GAP, w = LABEL_W, h = LABEL_H;
  if (dir === "right")  return { x1: px.x + g,       x2: px.x + g + w,     y1: px.y - h / 2, y2: px.y + h / 2 };
  if (dir === "left")   return { x1: px.x - g - w,    x2: px.x - g,         y1: px.y - h / 2, y2: px.y + h / 2 };
  if (dir === "top")    return { x1: px.x - w / 2,    x2: px.x + w / 2,     y1: px.y - g - h, y2: px.y - g     };
  return                       { x1: px.x - w / 2,    x2: px.x + w / 2,     y1: px.y + g,     y2: px.y + g + h };
}

function rectsOverlap(a, b) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function chooseLabelDirs(points, zoom) {
  const placed = [];
  const result = new Map();
  points.forEach((point) => {
    const px = spotToPx(point, zoom);
    let chosen = null;
    for (const dir of LABEL_DIRS) {
      const r = labelRect(px, dir);
      if (!placed.some((b) => rectsOverlap(r, b))) {
        chosen = dir;
        placed.push(r);
        break;
      }
    }
    if (!chosen) {
      chosen = "right";
      placed.push(labelRect(px, "right"));
    }
    result.set(point.id, chosen);
  });
  return result;
}

function addMarkerToMap(map, point, direction = "right") {
  const offsets = { right: [16, 0], left: [-16, 0], top: [0, -16], bottom: [0, 16] };
  const marker = L.marker([point.lat, point.lng], { icon: createMarkerIcon(point.type, point.spotCategory) }).addTo(map);
  marker.bindTooltip(escapeHtml(point.name), {
    permanent: true,
    direction,
    offset: offsets[direction] || [16, 0],
    className: "spot-label",
  });
  marker.on("click", () => openSpotMenu(point.id));
  setTimeout(() => {
    marker.getTooltip()?.getElement()?.addEventListener("click", () => openSpotMenu(point.id));
  }, 0);
  return marker;
}

function renderOverviewLayer(map, items, bounds) {
  const singles = items.filter((i) => i.type === "single").map((i) => i.point);
  const dirs = singles.length > 0 ? chooseLabelDirs(singles, estimateZoom(bounds)) : new Map();

  items.forEach((item) => {
    if (item.type === "single") {
      addMarkerToMap(map, item.point, dirs.get(item.point.id) || "right");
      return;
    }

    L.rectangle(item.bounds, {
      color: "#ff7a45",
      weight: 2,
      fillOpacity: 0.06,
      dashArray: "6 6",
    }).addTo(map);

    const labelHtml = item.points.map((point, i) => {
      const sep = i === 0 ? "" : '<span class="cluster-sep">, </span>';
      return `${sep}<span class="cluster-part cluster-spot-link" onclick="event.stopPropagation();openSpotMenu('${point.id}')">${escapeHtml(point.name)}</span>`;
    }).join("");

    L.marker([item.center.lat, item.center.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="cluster-label">${labelHtml}</div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      }),
    }).addTo(map);
  });
}

function renderDetailLayer(map, points, bounds) {
  const dirs = chooseLabelDirs(points, estimateZoom(bounds));
  points.forEach((point) => addMarkerToMap(map, point, dirs.get(point.id) || "right"));
}

function buildMapGroups(points) {
  const overviewDiagonal = rawDiagonalKm(points);
  const topClusters = findRelativeClusters(points, overviewDiagonal * RELATIVE_CLUSTER_THRESHOLD);
  const hasTopClusters = topClusters.some((c) => c.length >= 2);

  const groups = [];

  if (hasTopClusters) {
    const overviewItems = topClusters.map((cluster) => {
      if (cluster.length === 1) return { type: "single", point: cluster[0] };
      return {
        type: "cluster",
        points: cluster,
        bounds: boundsFromPoints(cluster, DETAIL_PADDING_RATIO),
        center: centerFromPoints(cluster),
      };
    });
    groups.push({
      kind: "overview",
      title: "全体図",
      caption: "近いスポットは全体図では範囲で表示し、拡大図で個別に確認できます。",
      overviewItems,
      bounds: boundsFromPoints(points, OVERVIEW_PADDING_RATIO),
    });
    addZoomGroupsRecursive(topClusters, groups);
  } else {
    groups.push({
      kind: "detail",
      title: "全体図",
      caption: "登録した場所の全体位置を一覧できる地図です。",
      points,
      bounds: boundsFromPoints(points, OVERVIEW_PADDING_RATIO),
    });
  }

  return groups;
}

function addZoomGroupsRecursive(clusters, groups) {
  clusters.filter((c) => c.length >= 2).forEach((cluster) => {
    const clusterDiagonal = rawDiagonalKm(cluster);
    const subClusters = findRelativeClusters(cluster, clusterDiagonal * RELATIVE_CLUSTER_THRESHOLD);
    const hasUsefulSubClusters = subClusters.length > 1 && subClusters.some((sc) => sc.length >= 2);

    const labels = cluster.map((p) => p.name);
    const title = `${labels.join(" / ")} の拡大図`;
    const clusterBounds = boundsFromPoints(cluster, DETAIL_PADDING_RATIO, 0.001);

    if (hasUsefulSubClusters) {
      const overviewItems = subClusters.map((sc) => {
        if (sc.length === 1) return { type: "single", point: sc[0] };
        return {
          type: "cluster",
          points: sc,
          bounds: boundsFromPoints(sc, DETAIL_PADDING_RATIO, 0.001),
          center: centerFromPoints(sc),
        };
      });
      groups.push({
        kind: "overview",
        title,
        caption: "近いスポットはさらに拡大図で個別に確認できます。",
        overviewItems,
        bounds: clusterBounds,
      });
      addZoomGroupsRecursive(subClusters, groups);
    } else {
      groups.push({
        kind: "detail",
        title,
        caption: `${labels.join("、")} を拡大して個別に確認できる地図です。`,
        points: cluster,
        bounds: clusterBounds,
      });
    }
  });
}

function findRelativeClusters(points, thresholdKm) {
  const visited = new Set();
  const clusters = [];

  for (const point of points) {
    if (visited.has(point.id)) continue;
    const queue = [point];
    const cluster = [];
    visited.add(point.id);

    while (queue.length > 0) {
      const current = queue.shift();
      cluster.push(current);
      points.forEach((candidate) => {
        if (visited.has(candidate.id)) return;
        if (distanceKm(current, candidate) <= thresholdKm) {
          visited.add(candidate.id);
          queue.push(candidate);
        }
      });
    }

    clusters.push(cluster);
  }

  return clusters.sort((a, b) => b.length - a.length);
}

function rawDiagonalKm(points) {
  if (points.length <= 1) return 0;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return distanceKm(
    { lat: Math.min(...lats), lng: Math.min(...lngs) },
    { lat: Math.max(...lats), lng: Math.max(...lngs) }
  );
}

async function loadAccessInfo() {
  try {
    const response = await fetch("/api/meta");
    const data = await response.json();
    accessInfo.innerHTML = data.urls.map((url, index) =>
      `<a class="access-link" href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${index === 0 ? "このPCで開く" : "スマホで開く"}: ${escapeHtml(url)}</a>`
    ).join("");
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
  if (SHORT_HOSTS.has(hostname)) return await expandShortGoogleMapsUrl(input);
  if (!isGoogleMapsHost(hostname)) throw new Error("Google Maps のURLを入力してください。");
  return input;
}

async function expandShortGoogleMapsUrl(input) {
  const response = await fetch("/api/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: input }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "短縮URLを展開できませんでした。");
  if (!data.url) throw new Error("短縮URLの展開結果を取得できませんでした。");
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
  if (!isGoogleMapsHost(hostname)) throw new Error("Google Maps のURLを入力してください。");

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

  if (latLngPatterns.length === 0) throw new Error("このURLから緯度経度を取得できませんでした。");

  const [, latText, lngText] = latLngPatterns[0];
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("URL内の位置情報を読み取れませんでした。");

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

function boundsFromPoints(points, paddingRatio, minSpanDeg = 0.02) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  let south = Math.min(...lats);
  let north = Math.max(...lats);
  let west = Math.min(...lngs);
  let east = Math.max(...lngs);

  const latSpan = Math.max(north - south, minSpanDeg);
  const lngSpan = Math.max(east - west, minSpanDeg);
  south -= latSpan * paddingRatio;
  north += latSpan * paddingRatio;
  west -= lngSpan * paddingRatio;
  east += lngSpan * paddingRatio;

  return [[south, west], [north, east]];
}

function centerFromPoints(points) {
  const sum = points.reduce((acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

function createMarkerIcon(type, spotCategory) {
  const pinClass = type === "meet" ? "map-pin-meet"
    : type === "dismiss" ? "map-pin-dismiss"
    : `map-pin-${spotCategory || "other"}`;
  const icon = type === "spot" ? (SPOT_PIN_ICONS[spotCategory] || "") : "";
  return L.divIcon({
    className: "",
    html: `<div class="map-pin ${pinClass}">${icon}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createStableId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function distanceKm(a, b) {
  const R = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
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

function setupAutocomplete(input, dropdown) {
  let timer = null;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const query = input.value.trim();
    if (!query || looksLikeUrl(query) || query.length < 2) {
      hideDropdown(dropdown);
      return;
    }
    timer = setTimeout(() => fetchSuggestions(query, dropdown), 350);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideDropdown(dropdown);
  });

  input.addEventListener("blur", () => hideDropdown(dropdown));
}

async function fetchSuggestions(query, dropdown) {
  try {
    const response = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(data.results) || data.results.length === 0) {
      hideDropdown(dropdown);
      return;
    }
    renderSuggestions(data.results, dropdown);
  } catch {
    hideDropdown(dropdown);
  }
}

function renderSuggestions(results, dropdown) {
  dropdown.innerHTML = "";
  results.forEach((item) => {
    const el = document.createElement("div");
    el.className = "suggest-item";
    el.innerHTML = `<span class="suggest-name">${escapeHtml(item.name)}</span><span class="suggest-detail">${escapeHtml(item.display)}</span>`;
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      addSpotFromSuggestion(item);
      hideDropdown(dropdown);
    });
    dropdown.appendChild(el);
  });
  dropdown.classList.remove("hidden");
}

function hideDropdown(dropdown) {
  dropdown.classList.add("hidden");
  dropdown.innerHTML = "";
}

function addSpotFromSuggestion(suggestion) {
  const spotCategory = detectSpotCategory(
    suggestion.name,
    suggestion.osmCategory || "",
    suggestion.osmType || ""
  );
  const location = {
    id: createStableId(),
    name: suggestion.name,
    lat: suggestion.lat,
    lng: suggestion.lng,
    url: suggestion.url || "",
    sourceUrl: suggestion.url || "",
    sourceType: "search",
    description: "",
    type: "spot",
    spotCategory,
    osmCategory: suggestion.osmCategory || "",
    osmType: suggestion.osmType || "",
  };
  state.spots = [...state.spots, location];
  persistState();
  placeInput.value = "";
  setFeedback(`「${location.name}」を追加しました。`, false);
  render();
}
