const STORAGE_KEY = "spot-map-organizer.v9";
const LISTS_KEY = "spot-map-lists.v1";
const RELATIVE_CLUSTER_THRESHOLD = 0.12;
const MAP_PAD = 30;
const LABEL_MIN_W = 92;
const LABEL_MAX_W = 520;
const LABEL_CHAR_W = 15;
const LABEL_H = 38;
const LABEL_GAP = 24;
const LABEL_PIN_PAD = 20;
const LABEL_EDGE_PAD = 8;
const LABEL_DIRS = ["right", "left", "top", "bottom"];
const LABEL_DISTANCES = [24, 54, 84, 114, 154, 204, 264, 334];
const DETAIL_PADDING_RATIO = 0.35;
const OVERVIEW_PADDING_RATIO = 0.15;
const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

const SETTINGS_KEY = "spot-map-settings.v1";
const IS_EMBEDDED_SPOT_MENU = new URLSearchParams(location.search).get("embedded") === "1";
let _listsData = null;

const MAP_STYLES_META = [
  { key: "osm-bright",     label: "OSM Bright",      previewClass: "preview-osm-bright"     },
  { key: "osm-standard",   label: "OSM スタンダード", previewClass: "preview-osm-standard"   },
  { key: "carto-light",    label: "CartoDB Light",    previewClass: "preview-carto-light"    },
  { key: "carto-dark",     label: "CartoDB Dark",     previewClass: "preview-carto-dark"     },
  { key: "esri-satellite", label: "衛星写真",         previewClass: "preview-esri-satellite" },
];

const MAP_STYLE_CONFIGS = {
  "osm-bright": {
    url: "https://tile.openstreetmap.jp/styles/osm-bright/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    options: { maxZoom: 18 },
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

const THEME_COLOR_MAP = {
  warm:     { accent: "#ff7a45", accentDeep: "#ce5428", accentLight: "#ff9a52", accentSoft: "rgba(255,122,69,0.12)",   line: "rgba(166,97,54,0.2)",    panel: "rgba(255,252,245,0.88)", shadow: "0 24px 50px rgba(149,90,48,0.16)",   accentRgb: "255,122,69",  shadowBaseRgb: "149,90,48"  },
  sky:      { accent: "#3b8fd4", accentDeep: "#1a6aad", accentLight: "#60aee8", accentSoft: "rgba(59,143,212,0.12)",   line: "rgba(59,120,200,0.22)",  panel: "rgba(240,248,255,0.88)", shadow: "0 24px 50px rgba(30,90,160,0.14)",   accentRgb: "59,143,212",  shadowBaseRgb: "30,90,160"  },
  mint:     { accent: "#2da868", accentDeep: "#1a7a48", accentLight: "#52c485", accentSoft: "rgba(45,168,104,0.12)",   line: "rgba(45,150,90,0.22)",   panel: "rgba(240,255,248,0.88)", shadow: "0 24px 50px rgba(30,110,60,0.14)",   accentRgb: "45,168,104",  shadowBaseRgb: "30,110,60"  },
  lavender: { accent: "#8b64cc", accentDeep: "#6a45a8", accentLight: "#a884e0", accentSoft: "rgba(139,100,204,0.12)",  line: "rgba(120,80,200,0.22)",  panel: "rgba(248,244,255,0.88)", shadow: "0 24px 50px rgba(90,60,150,0.14)",   accentRgb: "139,100,204", shadowBaseRgb: "90,60,150"  },
  gray:     { accent: "#7a8a98", accentDeep: "#5a6a78", accentLight: "#96a6b4", accentSoft: "rgba(122,138,152,0.12)",  line: "rgba(100,120,140,0.22)", panel: "rgba(245,247,250,0.88)", shadow: "0 24px 50px rgba(60,80,100,0.14)",   accentRgb: "122,138,152", shadowBaseRgb: "60,80,100"  },
};

function loadAppSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const defaults = {
      mapStyle: "osm-bright",
      bgTheme: "warm",
      googlePlaceHoursEnabled: true,
      showBudget: true,
      areaSuggestCount: 10,
    };
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return { mapStyle: "osm-bright", bgTheme: "warm", googlePlaceHoursEnabled: true, showBudget: true, areaSuggestCount: 10 };
  }
}

function shouldShowBudget() {
  return loadAppSettings().showBudget !== false;
}

function applyBgTheme(themeKey) {
  document.body.style.background = BG_THEME_CONFIGS[themeKey] || BG_THEME_CONFIGS.warm;
  const colors = THEME_COLOR_MAP[themeKey] || THEME_COLOR_MAP.warm;
  const root = document.documentElement;
  root.style.setProperty("--accent",       colors.accent);
  root.style.setProperty("--accent-deep",  colors.accentDeep);
  root.style.setProperty("--accent-light", colors.accentLight);
  root.style.setProperty("--accent-soft",  colors.accentSoft);
  root.style.setProperty("--line",         colors.line);
  root.style.setProperty("--panel",           colors.panel);
  root.style.setProperty("--shadow",          colors.shadow);
  root.style.setProperty("--accent-rgb",      colors.accentRgb);
  root.style.setProperty("--shadow-base-rgb", colors.shadowBaseRgb);
}

const CATEGORIES_KEY = "spot-map-categories.v1";
const CUSTOM_DEFAULT_ICONS = ["🔵", "🟢", "🟡", "🟠", "🔴", "🟣", "🟤", "⚫"];

const DEFAULT_CATEGORIES = [
  { key: "meet",       emoji: "🤝", name: "集合場所", label: "🤝 集合場所", cssClass: "category-meet",       isDefault: true },
  { key: "dismiss",    emoji: "👋", name: "解散場所", label: "👋 解散場所", cssClass: "category-dismiss",    isDefault: true },
  { key: "airport",    emoji: "✈",  name: "空港",     label: "✈ 空港",     cssClass: "category-airport",    isDefault: true },
  { key: "station",    emoji: "🚉", name: "駅",       label: "🚉 駅",       cssClass: "category-station",    isDefault: true },
  { key: "restaurant", emoji: "🍽", name: "グルメ",   label: "🍽 グルメ",   cssClass: "category-restaurant", isDefault: true },
  { key: "tourist",    emoji: "⛩",  name: "観光",     label: "⛩ 観光",     cssClass: "category-tourist",    isDefault: true },
  { key: "hotel",      emoji: "🏨", name: "ホテル",   label: "🏨 ホテル",   cssClass: "category-hotel",      isDefault: true },
  { key: "other",      emoji: "📍", name: "その他",   label: "📍 その他",   cssClass: "category-other",      isDefault: true },
];

function loadCustomCategories() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CATEGORIES_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveCustomCategoriesStorage(cats) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
}

function getAllCategories() {
  return [
    ...DEFAULT_CATEGORIES,
    ...loadCustomCategories().map(c => ({ ...c, label: `${c.emoji} ${c.name}`, cssClass: "category-custom", isDefault: false })),
  ];
}

function getCategoryDisplay() {
  const display = {};
  getAllCategories().forEach(cat => { display[cat.key] = { label: cat.label, cssClass: cat.cssClass }; });
  return display;
}

const SPOT_PIN_ICONS = {
  meet: "🤝",
  dismiss: "👋",
  airport: "✈",
  station: "🚉",
  restaurant: "🍽",
  tourist: "⛩",
  hotel: "🏨",
  other: "📍",
};

function detectSpotCategory(name, osmCategory, osmType) {
  if (osmCategory === "aeroway") return "airport";
  if (osmCategory === "railway" || osmCategory === "public_transport") return "station";
  if (osmCategory === "tourism") {
    if (["hotel", "hostel", "motel", "guest_house", "chalet", "apartment"].includes(osmType)) return "hotel";
    if (["museum", "attraction", "viewpoint", "artwork", "zoo", "theme_park", "aquarium", "gallery"].includes(osmType)) return "tourist";
  }
  if (osmCategory === "amenity" && ["restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "biergarten", "ice_cream"].includes(osmType)) return "restaurant";
  if (osmCategory === "historic" || osmCategory === "leisure") return "tourist";

  if (/空港|airport|エアポート/i.test(name)) return "airport";
  if (/駅|station/i.test(name)) return "station";
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
const selectAllLabel = document.getElementById("selectAllLabel");
const selectAllCheckbox = document.getElementById("selectAllCheckbox");
const spotListControls = document.getElementById("spotListControls");
const addSpotButton = document.getElementById("addSpotButton");
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
const spotBudgetInput = document.getElementById("spotBudgetInput");
const spotDescriptionInput = document.getElementById("spotDescriptionInput");
const spotPhotoDrop = document.getElementById("spotPhotoDrop");
const spotPhotoInput = document.getElementById("spotPhotoInput");
const spotPhotoPreview = document.getElementById("spotPhotoPreview");
const spotPhotoPreviewText = document.getElementById("spotPhotoPreviewText");
const spotPhotoPosition = document.getElementById("spotPhotoPosition");
const spotPhotoX = document.getElementById("spotPhotoX");
const spotPhotoY = document.getElementById("spotPhotoY");
const spotDescriptionSave = document.getElementById("spotDescriptionSave");
const spotDeleteButton = document.getElementById("spotDeleteButton");
const spotDeleteConfirm = document.getElementById("spotDeleteConfirm");
const spotDeleteConfirmYes = document.getElementById("spotDeleteConfirmYes");
const spotDeleteConfirmNo = document.getElementById("spotDeleteConfirmNo");
const mapStyleBtn = document.getElementById("mapStyleBtn");
const saveAllMapsBtn = document.getElementById("saveAllMapsBtn");
const mapStylePopover = document.getElementById("mapStylePopover");
const mapStylePopoverCards = document.getElementById("mapStylePopoverCards");
const categoryModalBackdrop = document.getElementById("categoryModalBackdrop");
const categoryModal = document.getElementById("categoryModal");
const categoryModalClose = document.getElementById("categoryModalClose");
const categoryList = document.getElementById("categoryList");
const categoryEmojiInput = document.getElementById("categoryEmojiInput");
const categoryNameInput = document.getElementById("categoryNameInput");
const categoryAddBtn = document.getElementById("categoryAddBtn");
const categoryCustomizeBtn = document.getElementById("categoryCustomizeBtn");
const listModalBackdrop = document.getElementById("listModalBackdrop");
const listModal = document.getElementById("listModal");
const listModalClose = document.getElementById("listModalClose");
const listNameDisplay = document.getElementById("listNameDisplay");
const listItems = document.getElementById("listItems");
const listNameInput = document.getElementById("listNameInput");
const listAddBtn = document.getElementById("listAddBtn");
const listManageBtn = document.getElementById("listManageBtn");
const listManageDrawerBtn = document.getElementById("listManageDrawerBtn");
const areaSuggestToggle    = document.getElementById("areaSuggestToggle");
const areaSuggestPanel     = document.getElementById("areaSuggestPanel");
const areaSuggestInput     = document.getElementById("areaSuggestInput");
const areaSuggestSearchBtn = document.getElementById("areaSuggestSearchBtn");
const areaSuggestStatus    = document.getElementById("areaSuggestStatus");
const areaSuggestResults   = document.getElementById("areaSuggestResults");
const areaSuggestDrawToggle  = document.getElementById("areaSuggestDrawToggle");
const areaSuggestFilterClear = document.getElementById("areaSuggestFilterClear");
const areaSuggestMapWrap     = document.getElementById("areaSuggestMapWrap");
const areaSuggestMapEl       = document.getElementById("areaSuggestMapEl");
const areaSuggestCountInline = document.getElementById("areaSuggestCountInline");

// 地図絞り込みの状態
let geoFilterBounds    = null;
let areaSuggestMap     = null;
let geoFilterCorner1   = null;
let geoFilterRectLayer = null;
let geoFilterMarkers   = [];
const spotCategorySelect = document.getElementById("spotCategorySelect");
const spotAirportMasterInput = document.getElementById("spotAirportMasterInput");
const spotAirportMasterList = document.getElementById("spotAirportMasterList");
const spotCategoryAddForm = document.getElementById("spotCategoryAddForm");
const spotCategoryNewName = document.getElementById("spotCategoryNewName");
const spotCategoryNewAddBtn = document.getElementById("spotCategoryNewAddBtn");
const spotHoursToggleAllBtn = document.getElementById("spotHoursToggleAllChk");
const spotHoursWeeklyMode = document.getElementById("spotHoursWeeklyMode");
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

hamburgerBtn.addEventListener("click", () => {
  sideDrawer.classList.contains("hidden") ? openDrawer() : closeDrawer();
});
drawerBackdrop.addEventListener("click", closeDrawer);

saveAllMapsBtn.addEventListener("click", saveAllMapsAsImage);

mapStyleBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (mapStylePopover.classList.contains("hidden")) {
    const rect = mapStyleBtn.getBoundingClientRect();
    mapStylePopover.style.top = `${rect.bottom + 8}px`;
    mapStylePopover.style.right = `${window.innerWidth - rect.right}px`;
    mapStylePopover.classList.remove("hidden");
    renderMapStylePopover();
  } else {
    mapStylePopover.classList.add("hidden");
  }
});

form.addEventListener("submit", (event) => event.preventDefault());
selectAllCheckbox.addEventListener("change", toggleSelectAll);
addSpotButton.addEventListener("click", saveLocation);
bulkDeleteButton.addEventListener("click", deleteCheckedSpots);
spotMenuBackdrop.addEventListener("click", closeSpotMenu);
spotMenuClose.addEventListener("click", closeSpotMenu);
spotDescriptionSave.addEventListener("click", saveSpotDescription);
spotDeleteButton.addEventListener("click", () => {
  spotDeleteConfirm.classList.remove("hidden");
});
spotDeleteConfirmYes.addEventListener("click", () => {
  spotDeleteConfirm.classList.add("hidden");
  deleteEditingSpot();
});
spotDeleteConfirmNo.addEventListener("click", () => {
  spotDeleteConfirm.classList.add("hidden");
});
categoryCustomizeBtn.addEventListener("click", () => {
  openCategoryModal();
});
categoryModalBackdrop.addEventListener("click", closeCategoryModal);
categoryModalClose.addEventListener("click", closeCategoryModal);
categoryAddBtn.addEventListener("click", addCustomCategory);
categoryNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addCustomCategory();
});

listManageBtn.addEventListener("click", openListModal);
if (listManageDrawerBtn) listManageDrawerBtn.addEventListener("click", openListModal);
listModalBackdrop.addEventListener("click", closeListModal);
listModalClose.addEventListener("click", closeListModal);
listAddBtn.addEventListener("click", addNewList);
listNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addNewList();
});

setupAutocomplete(placeInput, placeDropdown);
setupSpotPhotoControls();
setupAirportMasterInput();

spotCategorySelect.addEventListener("change", () => {
  if (spotCategorySelect.value === "__add_new__") {
    spotCategoryAddForm.classList.remove("hidden");
    spotCategoryNewName.focus();
  } else {
    spotCategoryAddForm.classList.add("hidden");
    updateSpotCategoryFields(spotCategorySelect.value, null);
    const isAirport = spotCategorySelect.value === "airport";
    const stayParts = splitSpotDuration(isAirport ? syncAirportStayInputs() : defaultStayMinutesForCategory(spotCategorySelect.value));
    const stayHoursInput = document.getElementById("spotStayHoursInput");
    const stayMinutesInput = document.getElementById("spotStayMinutesInput");
    if (stayHoursInput && stayMinutesInput) {
      stayHoursInput.value = stayParts.hours;
      stayMinutesInput.value = stayParts.minutes;
    }
    setStayInputsForCategory(spotCategorySelect.value);
  }
});

spotCategoryNewAddBtn.addEventListener("click", addCategoryFromSpotMenu);
spotCategoryNewName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addCategoryFromSpotMenu();
});

setupBusinessHoursControls();
["spotTakeoffTime", "spotAirportCheckinTime", "spotAirportCheckinOffset"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", () => {
    if (id !== "spotAirportCheckinOffset") {
      const input = document.getElementById(id);
      if (input) input.value = roundTimeToFiveMinutes(input.value);
    }
    if (spotCategorySelect?.value === "airport") syncAirportStayInputs();
  });
});
document.getElementById("spotLandingTime")?.addEventListener("change", e => {
  e.target.value = roundTimeToFiveMinutes(e.target.value);
});

if (areaSuggestToggle) areaSuggestToggle.addEventListener("click", toggleAreaSuggestPanel);
if (areaSuggestSearchBtn) areaSuggestSearchBtn.addEventListener("click", handleAreaSuggest);
if (areaSuggestInput) areaSuggestInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleAreaSuggest(); });
if (areaSuggestDrawToggle) areaSuggestDrawToggle.addEventListener("click", toggleAreaSuggestDrawMap);
if (areaSuggestFilterClear) areaSuggestFilterClear.addEventListener("click", clearGeoFilter);
if (areaSuggestCountInline) {
  const saved = loadAppSettings();
  areaSuggestCountInline.value = saved.areaSuggestCount ?? 10;
  areaSuggestCountInline.addEventListener("change", () => {
    const val = parseInt(areaSuggestCountInline.value, 10);
    const s = loadAppSettings();
    if (val >= 1 && val <= 50) {
      s.areaSuggestCount = val;
    } else {
      areaSuggestCountInline.value = s.areaSuggestCount ?? 10;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete-wrap")) {
    hideDropdown(placeDropdown);
  }
  if (!e.target.closest("#mapStyleBtn") && !e.target.closest("#mapStylePopover")) {
    mapStylePopover.classList.add("hidden");
  }
});

applyBgTheme(loadAppSettings().bgTheme);
requestAnimationFrame(() => {
  render(); // DOMレイアウト確定後にマップを初期化
  const editSpotId = new URLSearchParams(location.search).get("editSpot");
  if (editSpotId) setTimeout(() => openSpotMenu(editSpotId), 80);
});

function loadAppState() {
  const d = ensureListsData();
  const active = getActiveList(d);
  return {
    spots: active?.spots ?? [],
    clusterLabelDeltas: active?.clusterLabelDeltas ?? {},
  };
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
  const oldType = spot?.type || "spot";
  let spotCategory = spot?.spotCategory || "other";
  let spotRole = spot?.spotRole || "";
  const spotRoles = Array.isArray(spot?.spotRoles) ? spot.spotRoles.filter(Boolean) : [];
  // 旧データの type="meet"/"dismiss" を spotCategory に移行
  if (oldType === "meet" || spotCategory === "meet") spotRole = "meet";
  else if (oldType === "dismiss" || spotCategory === "dismiss") spotRole = "dismiss";
  if (spotRole && !spotRoles.includes(spotRole)) spotRoles.push(spotRole);
  if (spotCategory === "meet" || spotCategory === "dismiss") spotCategory = "other";
  return {
    ...spot,
    description: spot?.description || "",
    budget: Number.isFinite(Number(spot?.budget)) ? Number(spot.budget) : 0,
    defaultStayMinutes: Number.isFinite(Number(spot?.defaultStayMinutes)) ? Number(spot.defaultStayMinutes) : null,
    type: "spot",
    spotCategory,
    spotRole: spotRoles[0] || "",
    spotRoles,
  };
}

function persistState() {
  const d = ensureListsData();
  const active = getActiveList(d);
  if (!active) return;
  active.spots = state.spots;
  active.clusterLabelDeltas = state.clusterLabelDeltas || {};
  saveListsData();
}

function ensureListsData() {
  if (_listsData) return _listsData;
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.lists)) {
        parsed.lists = parsed.lists.map(l => ({
          ...l,
          spots: Array.isArray(l.spots) ? l.spots.map(normalizeSpot) : [],
        }));
        if (parsed.lists.length > 0 && !parsed.lists.find(l => l.id === parsed.activeListId)) {
          parsed.activeListId = parsed.lists[0].id;
        }
        _listsData = parsed;
        return _listsData;
      }
    }
  } catch {}
  // 初回起動のみ "マイリスト" を自動生成（以降は空リストも許容）
  const legacySpots = loadLegacySpots();
  const first = { id: createStableId(), name: "マイリスト", spots: legacySpots };
  _listsData = { lists: [first], activeListId: first.id };
  return _listsData;
}

function loadLegacySpots() {
  for (const key of [STORAGE_KEY, "spot-map-organizer.v7", "spot-map-organizer.v6", "spot-map-organizer.v5", "spot-map-organizer.v4", "spot-map-organizer.v3", "spot-map-organizer.v2", "spot-map-organizer.v1"]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return normalizeState(JSON.parse(raw)).spots;
    } catch {}
  }
  return [];
}

function saveListsData() {
  localStorage.setItem(LISTS_KEY, JSON.stringify(_listsData));
}

function getActiveList(d) {
  const data = d || ensureListsData();
  if (!data.lists.length) return null;
  return data.lists.find(l => l.id === data.activeListId) || data.lists[0];
}

async function saveLocation() {
  const rawInput = placeInput.value.trim();
  const preferredSuggestionName = placeInput.dataset.preferredSuggestionName || "";
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
      name: preferredSuggestionName && preferredSuggestionName === rawInput
        ? preferredSuggestionName
        : (resolved.name || fallbackName(state.spots.length + 1)),
      description: "",
      type: "spot",
      spotCategory,
    };
    if (spotCategory === "airport") {
      const airport = findAirportMaster(location.name || rawInput);
      if (!airport) {
        throw new Error("空港スポットは空港テーブルから選択できる空港だけ登録できます。空港名またはIATAコードで選択してください。");
      }
      location.name = getAirportDisplayName(airport);
      location.airportId = getAirportId(airport);
      location.iata = airport.iata || airport.code || null;
      location.airportCountry = airport.country || null;
      location.airportCity = airport.city || null;
      location.lat = airport.lat;
      location.lng = airport.lng;
    }
    await maybeAttachGoogleBusinessHours(location);
    const duplicate = state.spots.find(s =>
      s.name === location.name
      || (location.spotCategory === "airport" && s.spotCategory === "airport" && (
        s.airportId === location.airportId || window.sameTripAirport?.(s, location)
      ))
    );
    if (duplicate) {
      if (location.spotCategory === "airport") {
        setFeedback(`「${location.name}」は既に空港スポットとして登録されています。`, true);
        return;
      }
      if (!window.confirm(`「${location.name}」はすでに登録されています。\n同じ名前で追加しますか？`)) return;
    }
    state.spots = [...state.spots, location];
    persistState();
    form.reset();
    delete placeInput.dataset.preferredSuggestionName;
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

// Nominatim（OpenStreetMap）に直接問い合わせてスポットを1件取得
async function maybeAttachGoogleBusinessHours(spot) {
  if (!spot || loadAppSettings().googlePlaceHoursEnabled === false) return spot;
  const query = spot.sourceQuery || spot.name || "";
  if (!query.trim()) return spot;
  try {
    const response = await fetch("/api/place-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: spot.name,
        query,
        lat: spot.lat,
        lng: spot.lng,
      }),
    });
    if (!response.ok) return spot;
    const data = await response.json();
    if (data.businessHours && typeof data.businessHours === "object") {
      spot.businessHours = data.businessHours;
    }
  } catch (error) {
    console.warn("Google Places営業時間の取得に失敗しました", error);
  }
  return spot;
}

async function searchByNominatim(query) {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1" });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "Accept-Language": "ja,en" },
  });
  if (!res.ok) return null;
  const payload = await res.json();
  if (!payload.length) return null;
  const best = payload[0];
  const lat = parseFloat(best.lat);
  const lng = parseFloat(best.lon);
  const name = best.name || best.display_name.split(",")[0].trim();
  return {
    name,
    lat,
    lng,
    url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    osmCategory: best.category || "",
    osmType: best.type || "",
  };
}

// Wikipedia APIで検索し座標を取得（Nominatimで見つからない場合のフォールバック）
async function searchByWikipedia(query) {
  const searchParams = new URLSearchParams({
    action: "query", list: "search", srsearch: query,
    format: "json", utf8: "1", srlimit: "1", origin: "*",
  });
  const searchRes = await fetch(`https://ja.wikipedia.org/w/api.php?${searchParams}`);
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const results = searchData?.query?.search || [];
  if (!results.length) return null;

  const page = results[0];
  const coordParams = new URLSearchParams({
    action: "query", prop: "coordinates", pageids: page.pageid,
    format: "json", utf8: "1", origin: "*",
  });
  const coordRes = await fetch(`https://ja.wikipedia.org/w/api.php?${coordParams}`);
  if (!coordRes.ok) return null;
  const coordData = await coordRes.json();
  const coords = coordData?.query?.pages?.[String(page.pageid)]?.coordinates || [];
  if (!coords.length) return null;

  const lat = parseFloat(coords[0].lat);
  const lng = parseFloat(coords[0].lon);
  return {
    name: page.title || query,
    lat,
    lng,
    url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    osmCategory: "",
    osmType: "",
  };
}

async function buildSpotFromSearch(query) {
  setFeedback("スポット名から場所を検索しています...", false);
  const result = await searchByNominatim(query).catch(() => null)
    || await searchByWikipedia(query).catch(() => null);
  if (!result) throw new Error("該当するスポットが見つかりませんでした。別の表記でも試してください。");
  return {
    name: result.name,
    lat: result.lat,
    lng: result.lng,
    url: result.url,
    sourceUrl: result.url,
    sourceQuery: query,
    sourceType: "search",
    osmCategory: result.osmCategory,
    osmType: result.osmType,
  };
}

function clearAllData() {
  if (state.spots.length === 0) {
    setFeedback("消去するデータはありません。", true);
    return;
  }
  if (!window.confirm(`「${getActiveList().name}」のスポットをすべて削除しますか？`)) return;
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
  renderListNameDisplay();
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

    const catDisplay = getCategoryDisplay();
    const cat = catDisplay[spot.spotCategory || "other"] || catDisplay["other"];
    const roles = getSpotRoles(spot);
    const rolePrefix = `${roles.includes("meet") ? "🤝 " : ""}${roles.includes("dismiss") ? "👋 " : ""}`;
    typeBadge.textContent = `${rolePrefix}${cat.label}`;
    const roleClass = roles.includes("meet") && roles.includes("dismiss") ? "category-meet-dismiss" : (roles[0] ? `category-${roles[0]}` : cat.cssClass);
    typeBadge.className = `spot-type-badge ${roleClass}`;

    fragment.querySelector(".spot-name").textContent = `${index + 1}. ${spot.name}`;
    fragment.querySelector(".spot-meta").textContent = buildSpotMeta(spot);
    nameButton.addEventListener("click", () => openSpotMenu(spot.id));
    const inlineDeleteBtn = fragment.querySelector(".spot-inline-delete");
    if (inlineDeleteBtn) {
      inlineDeleteBtn.addEventListener("click", () => {
        if (!window.confirm(`「${spot.name}」を削除しますか？`)) return;
        state.spots = state.spots.filter(s => s.id !== spot.id);
        persistState();
        setFeedback(`「${spot.name}」を削除しました。`, false);
        render();
      });
    }
    spotList.appendChild(fragment);
  });

  updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
  const checkboxes = spotList.querySelectorAll(".spot-checkbox");
  const checked = spotList.querySelectorAll(".spot-checkbox:checked");

  if (checkboxes.length === 0) {
    spotListControls.classList.add("hidden");
    bulkDeleteButton.style.display = "none";
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else {
    spotListControls.classList.remove("hidden");
    bulkDeleteButton.style.display = "";
    bulkDeleteButton.disabled = checked.length === 0;
    if (checked.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (checked.length === checkboxes.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }
}

function toggleSelectAll() {
  const checkboxes = spotList.querySelectorAll(".spot-checkbox");
  checkboxes.forEach(cb => { cb.checked = selectAllCheckbox.checked; });
  updateBulkDeleteButton();
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

function hasSpotCoords(spot) {
  return Number.isFinite(Number(spot?.lat)) && Number.isFinite(Number(spot?.lng));
}

function getSpotRole(spot) {
  if (!spot) return "";
  return getSpotRoles(spot)[0] || "";
}

function getSpotRoles(spot) {
  if (!spot) return [];
  const roles = Array.isArray(spot.spotRoles) ? [...spot.spotRoles] : [];
  if (spot.spotRole && !roles.includes(spot.spotRole)) roles.push(spot.spotRole);
  if ((spot.spotCategory === "meet" || spot.spotCategory === "dismiss") && !roles.includes(spot.spotCategory)) {
    roles.push(spot.spotCategory);
  }
  return roles.filter(role => role === "meet" || role === "dismiss");
}

function hasSpotRole(spot, role) {
  return getSpotRoles(spot).includes(role);
}

function defaultStayMinutesForCategory(category) {
  if (category === "airport") return 45;
  if (category === "station") return 20;
  if (category === "restaurant" || category === "tourist") return 60;
  return 60;
}

function splitSpotDuration(value) {
  const mins = Math.max(0, Number(value) || 0);
  return { hours: Math.floor(mins / 60), minutes: mins % 60 };
}

function spotTimeToMinutes(value) {
  const m = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Math.min(23 * 60 + 59, Math.max(0, Number(m[1]) * 60 + Number(m[2])));
}

function spotMinutesToTime(value) {
  const mins = Math.max(0, Math.min(23 * 60 + 59, Math.round(Number(value) || 0)));
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function roundTimeToFiveMinutes(value) {
  const mins = spotTimeToMinutes(value);
  if (mins === null) return "";
  const rounded = Math.min(23 * 60 + 55, Math.max(0, Math.round(mins / 5) * 5));
  return spotMinutesToTime(rounded);
}

function findAirportMaster(value) {
  return window.findTripAirport ? window.findTripAirport(value) : null;
}

function getAirportDisplayName(airport) {
  return airport?.displayName || airport?.name || "";
}

function getAirportId(airport) {
  return airport?.id || (airport?.iata ? `airport-${String(airport.iata).toLowerCase()}` : "");
}

function setupAirportMasterInput() {
  if (!spotAirportMasterInput || !spotAirportMasterList) return;
  spotAirportMasterList.innerHTML = "";
  (window.TRIP_AIRPORTS || []).forEach(ap => {
    const opt = document.createElement("option");
    opt.value = getAirportDisplayName(ap);
    opt.label = `${ap.iata || ""} ${ap.country || ""} ${ap.city || ""}`.trim();
    spotAirportMasterList.appendChild(opt);
  });
  spotAirportMasterInput.addEventListener("change", () => {
    const airport = findAirportMaster(spotAirportMasterInput.value);
    if (!airport) return;
    applyAirportMasterToMenu(airport);
  });
}

function applyAirportMasterToMenu(airport) {
  if (!airport) return;
  const displayName = getAirportDisplayName(airport);
  if (spotAirportMasterInput) spotAirportMasterInput.value = displayName;
  if (spotNameInput) spotNameInput.value = displayName;
}

function findAirportForSpot(spot) {
  return findAirportMaster(spot?.airportId || spot?.iata || spot?.name || "");
}

function getAirportStayMinutesFromTimes(takeoffTime, checkinTime, offsetMin = 90) {
  const takeoff = spotTimeToMinutes(roundTimeToFiveMinutes(takeoffTime));
  if (takeoff === null) return Math.max(0, Number(offsetMin) || 90);
  const checkin = spotTimeToMinutes(roundTimeToFiveMinutes(checkinTime));
  if (checkin !== null && checkin <= takeoff) return Math.max(0, takeoff - checkin);
  return Math.max(0, Number(offsetMin) || 90);
}

function syncAirportStayInputs() {
  const stayHoursInput = document.getElementById("spotStayHoursInput");
  const stayMinutesInput = document.getElementById("spotStayMinutesInput");
  const takeoffInput = document.getElementById("spotTakeoffTime");
  const checkinInput = document.getElementById("spotAirportCheckinTime");
  const offsetInput = document.getElementById("spotAirportCheckinOffset");
  if (takeoffInput?.value) takeoffInput.value = roundTimeToFiveMinutes(takeoffInput.value);
  if (checkinInput?.value) checkinInput.value = roundTimeToFiveMinutes(checkinInput.value);
  const takeoff = spotTimeToMinutes(takeoffInput?.value);
  const offset = Math.max(0, parseInt(offsetInput?.value, 10) || 90);
  if (offsetInput && !offsetInput.value) offsetInput.value = String(offset);
  if (takeoff !== null && checkinInput && !checkinInput.value) {
    checkinInput.value = spotMinutesToTime(Math.max(0, takeoff - offset));
  }
  const stay = getAirportStayMinutesFromTimes(takeoffInput?.value, checkinInput?.value, offset);
  const parts = splitSpotDuration(stay);
  if (stayHoursInput) stayHoursInput.value = parts.hours;
  if (stayMinutesInput) stayMinutesInput.value = parts.minutes;
  return stay;
}

function setStayInputsForCategory(category) {
  const isAirport = category === "airport";
  const stayHoursInput = document.getElementById("spotStayHoursInput");
  const stayMinutesInput = document.getElementById("spotStayMinutesInput");
  const stayRow = document.querySelector(".spot-duration-row");
  const airportStayNote = document.getElementById("spotAirportStayNote");
  [stayHoursInput, stayMinutesInput].forEach(input => {
    if (!input) return;
    input.disabled = isAirport;
    input.readOnly = isAirport;
  });
  stayRow?.classList.toggle("is-readonly", isAirport);
  airportStayNote?.classList.toggle("hidden", !isAirport);
  if (isAirport) syncAirportStayInputs();
}

function readSpotDurationMinutes() {
  const h = parseInt(document.getElementById("spotStayHoursInput")?.value, 10);
  const m = parseInt(document.getElementById("spotStayMinutesInput")?.value, 10);
  const total = (Number.isFinite(h) && h > 0 ? h * 60 : 0) + (Number.isFinite(m) && m > 0 ? m : 0);
  return total > 0 ? total : null;
}

function buildSpotMeta(spot) {
  const parts = hasSpotCoords(spot)
    ? [`${Number(spot.lat).toFixed(5)}, ${Number(spot.lng).toFixed(5)}`]
    : ["座標未設定"];
  if (shouldShowBudget() && spot.budget) parts.push(`予算: ¥${Number(spot.budget).toLocaleString()}`);
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
  const tourLink = document.getElementById("spotTourSearchLink");
  if (tourLink) {
    const params = new URLSearchParams({ spotId: spot.id, spotName: spot.name || "" });
    if (spot.lat && spot.lng) {
      params.set("lat", spot.lat);
      params.set("lng", spot.lng);
    }
    tourLink.href = `./tour.html?${params.toString()}`;
  }
  spotNameInput.value = spot.name || "";
  const budgetField = document.getElementById("spotBudgetField");
  if (budgetField) budgetField.classList.toggle("hidden", !shouldShowBudget());
  spotBudgetInput.value = shouldShowBudget() ? (spot.budget || "") : "";
  spotDescriptionInput.value = spot.description || "";
  const scheduleNote = new URLSearchParams(location.search).get("scheduleNote") || "";
  if (scheduleNote) {
    const currentMemo = spotDescriptionInput.value.trim();
    if (!currentMemo) {
      spotDescriptionInput.value = scheduleNote;
    } else if (!currentMemo.includes(scheduleNote)) {
      spotDescriptionInput.value = `${currentMemo}\n${scheduleNote}`;
    }
  }
  const stayParts = splitSpotDuration(spot.defaultStayMinutes ?? defaultStayMinutesForCategory(spot.spotCategory));
  const stayHoursInput = document.getElementById("spotStayHoursInput");
  const stayMinutesInput = document.getElementById("spotStayMinutesInput");
  if (stayHoursInput) stayHoursInput.value = stayParts.hours;
  if (stayMinutesInput) stayMinutesInput.value = stayParts.minutes;

  // 役割（集合・解散）は通常カテゴリと分離して表示
  const isMeet    = hasSpotRole(spot, "meet");
  const isDismiss = hasSpotRole(spot, "dismiss");
  const meetBtn    = document.getElementById("spotMeetToggle");
  const dismissBtn = document.getElementById("spotDismissToggle");
  setSpotRoleButtons({ meet: isMeet, dismiss: isDismiss });
  if (meetBtn)    meetBtn.onclick    = () => toggleSpotRole("meet");
  if (dismissBtn) dismissBtn.onclick = () => toggleSpotRole("dismiss");

  // メインカテゴリから meet/dismiss を除外
  spotCategorySelect.innerHTML = "";
  const allCats = getAllCategories();
  allCats.filter(cat => cat.key !== "other" && cat.key !== "meet" && cat.key !== "dismiss").forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.key;
    opt.textContent = cat.label;
    spotCategorySelect.appendChild(opt);
  });
  const otherCat = allCats.find(cat => cat.key === "other");
  if (otherCat) {
    const otherOpt = document.createElement("option");
    otherOpt.value = otherCat.key;
    otherOpt.textContent = otherCat.label;
    spotCategorySelect.appendChild(otherOpt);
  }
  const addOpt = document.createElement("option");
  addOpt.value = "__add_new__";
  addOpt.textContent = "＋ 新しいカテゴリを追加...";
  spotCategorySelect.appendChild(addOpt);
  // meet/dismiss の場合はドロップダウンでは "other" を表示
  spotCategorySelect.value = spot.spotCategory || "other";
  spotCategoryAddForm.classList.add("hidden");

  // カテゴリ固有フィールドの表示切り替え
  updateSpotCategoryFields(spot.spotCategory, spot);

  // 優先度
  const prioEl = document.getElementById("spotPriorityInput");
  if (prioEl) prioEl.value = spot.priority || 3;

  // 営業時間（曜日ごと）
  fillBusinessHoursInputs(spot.businessHours);
  updateSpotPhotoPreview(spot);

  spotMenu.classList.remove("hidden");
  spotMenuBackdrop.classList.remove("hidden");
  spotMenu.setAttribute("aria-hidden", "false");
}

function setSpotRoleButtons(roles) {
  const meetBtn    = document.getElementById("spotMeetToggle");
  const dismissBtn = document.getElementById("spotDismissToggle");
  const meetActive = !!roles?.meet;
  const dismissActive = !!roles?.dismiss;
  meetBtn?.classList.toggle("spot-role-btn--active", meetActive);
  meetBtn?.setAttribute("aria-pressed", meetActive ? "true" : "false");
  dismissBtn?.classList.toggle("spot-role-btn--active", dismissActive);
  dismissBtn?.setAttribute("aria-pressed", dismissActive ? "true" : "false");
}

function toggleSpotRole(role) {
  const meetBtn    = document.getElementById("spotMeetToggle");
  const dismissBtn = document.getElementById("spotDismissToggle");
  const target = role === "meet" ? meetBtn : dismissBtn;
  const wasActive = target?.classList.contains("spot-role-btn--active");
  target?.classList.toggle("spot-role-btn--active", !wasActive);
  target?.setAttribute("aria-pressed", wasActive ? "false" : "true");
}

function splitBusinessHoursRange(value) {
  if (!value) return { open: "", close: "" };
  if (typeof value === "object") {
    return {
      open: value.open || value.start || "",
      close: value.close || value.end || "",
    };
  }
  const match = String(value).trim().match(/^(\d{1,2}:\d{2})\s*(?:-|〜|~|－|ー)\s*(\d{1,2}:\d{2})$/);
  return match ? { open: match[1].padStart(5, "0"), close: match[2].padStart(5, "0") } : { open: "", close: "" };
}

function formatMinutesAsTime(value) {
  const mins = Math.min(1440, Math.max(0, Number(value) || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToBusinessMinutes(value, fallback) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  return Math.min(1440, Math.max(0, Number(match[1]) * 60 + Number(match[2])));
}

function updateBusinessHoursRange(row) {
  const enabled = row.classList.contains("spot-hours-range--enabled");
  const openInput = row.querySelector('[data-part="open"]');
  const closeInput = row.querySelector('[data-part="close"]');
  const valueEl = row.querySelector(".spot-hours-value");
  let open = Number(openInput?.value || 600);
  let close = Number(closeInput?.value || 1080);
  if (close <= open) {
    if (document.activeElement === openInput) open = Math.max(0, close - 30);
    else close = Math.min(1440, open + 30);
  }
  if (openInput) openInput.value = open;
  if (closeInput) closeInput.value = close;
  row.style.setProperty("--hours-open-pct", `${(open / 1440) * 100}%`);
  row.style.setProperty("--hours-close-pct", `${(close / 1440) * 100}%`);
  if (valueEl) valueEl.textContent = enabled ? `${formatMinutesAsTime(open)}〜${formatMinutesAsTime(close)}` : "定休日";
}

function createBusinessHoursExtraRange(day) {
  const div = document.createElement("div");
  div.className = "spot-hours-range spot-hours-range--extra";
  div.dataset.day = day;
  div.dataset.slot = "2";
  div.innerHTML = `
    <div class="spot-hours-slider">
      <div class="spot-hours-track"></div>
      <div class="spot-hours-fill"></div>
      <input type="range" min="0" max="1440" step="30" value="960" data-part="open" class="spot-hours-range-input" aria-label="追加営業時間の開始時刻" />
      <input type="range" min="0" max="1440" step="30" value="1260" data-part="close" class="spot-hours-range-input" aria-label="追加営業時間の終了時刻" />
    </div>
    <span class="spot-hours-value">16:00〜21:00</span>
  `;
  div.querySelectorAll(".spot-hours-range-input").forEach(input => {
    input.addEventListener("input", () => updateBusinessHoursRange(div));
  });
  return div;
}

function getOrCreateExtraHoursRange(day) {
  let extra = document.querySelector(`.spot-hours-range--extra[data-day="${day}"]`);
  if (extra) return extra;
  const primary = document.querySelector(`.spot-hours-range[data-day="${day}"]:not(.spot-hours-range--extra)`);
  if (!primary) return null;
  extra = createBusinessHoursExtraRange(day);
  primary.parentElement.appendChild(extra);
  return extra;
}

function setExtraHoursVisible(day, visible) {
  const primary = document.querySelector(`.spot-hours-range[data-day="${day}"]:not(.spot-hours-range--extra)`);
  const btn = primary?.querySelector(".spot-hours-split-btn");
  const extra = visible ? getOrCreateExtraHoursRange(day) : document.querySelector(`.spot-hours-range--extra[data-day="${day}"]`);
  if (extra) {
    extra.classList.toggle("hidden", !visible);
    extra.classList.toggle("spot-hours-range--enabled", visible);
    updateBusinessHoursRange(extra);
  }
  btn?.classList.toggle("active", visible);
  btn?.setAttribute("aria-pressed", visible ? "true" : "false");
}

function updateHoursBulkVisibility() {
  const isWeekly = !!spotHoursWeeklyMode?.checked;
  const wrap = spotHoursToggleAllBtn?.closest("label");
  if (wrap) wrap.style.display = isWeekly ? "" : "none";
}

function updateSpotPhotoPreview(spot) {
  if (!spotPhotoDrop || !spotPhotoPreview || !spotPhotoPreviewText) return;
  const photoUrl = spot?.photoUrl || "";
  const x = Number.isFinite(Number(spot?.photoX)) ? Number(spot.photoX) : 50;
  const y = Number.isFinite(Number(spot?.photoY)) ? Number(spot.photoY) : 50;
  if (spotPhotoX) spotPhotoX.value = x;
  if (spotPhotoY) spotPhotoY.value = y;
  if (spotPhotoPosition) spotPhotoPosition.classList.toggle("hidden", !photoUrl);
  spotPhotoPreview.classList.toggle("hidden", !photoUrl);
  spotPhotoPreviewText.classList.toggle("hidden", !!photoUrl);
  if (photoUrl) {
    spotPhotoPreview.src = photoUrl;
    spotPhotoPreview.alt = spot?.name || "";
    spotPhotoPreview.style.objectPosition = `${x}% ${y}%`;
  } else {
    spotPhotoPreview.removeAttribute("src");
    spotPhotoPreview.alt = "";
  }
}

function updateEditingSpotPhoto(fields, rerenderList = false) {
  const targetIndex = state.spots.findIndex((spot) => spot.id === state.editingSpotId);
  if (targetIndex < 0) return;
  state.spots[targetIndex] = { ...state.spots[targetIndex], ...fields };
  persistState();
  updateSpotPhotoPreview(state.spots[targetIndex]);
  if (rerenderList) render();
}

function readSpotPhotoFile(file) {
  if (!file || !file.type?.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    updateEditingSpotPhoto({ photoUrl: reader.result, photoX: 50, photoY: 50 }, true);
  };
  reader.readAsDataURL(file);
}

function setupSpotPhotoControls() {
  if (!spotPhotoDrop || !spotPhotoInput) return;
  spotPhotoDrop.addEventListener("click", () => spotPhotoInput.click());
  spotPhotoDrop.addEventListener("dragover", (event) => {
    event.preventDefault();
    spotPhotoDrop.classList.add("is-drag");
  });
  spotPhotoDrop.addEventListener("dragleave", () => spotPhotoDrop.classList.remove("is-drag"));
  spotPhotoDrop.addEventListener("drop", (event) => {
    event.preventDefault();
    spotPhotoDrop.classList.remove("is-drag");
    readSpotPhotoFile(event.dataTransfer?.files?.[0]);
  });
  spotPhotoInput.addEventListener("change", (event) => {
    readSpotPhotoFile(event.target.files?.[0]);
    event.target.value = "";
  });
  [spotPhotoX, spotPhotoY].forEach((input) => {
    input?.addEventListener("input", () => {
      updateEditingSpotPhoto({
        photoX: Number(spotPhotoX?.value) || 50,
        photoY: Number(spotPhotoY?.value) || 50,
      });
    });
  });
}

function setupBusinessHoursControls() {
  spotHoursWeeklyMode?.addEventListener("change", () => {
    const isWeekly = spotHoursWeeklyMode.checked;
    document.querySelector(".spot-hours-table")?.classList.toggle("is-weekly", isWeekly);
    updateHoursBulkVisibility();
    if (!isWeekly) {
      const sun = readPrimaryHoursRange("sun");
      // 非曜日別モードでは常に有効扱い
      DAYS.forEach(day => applyHoursToDay(day, true, sun.open, sun.close));
    }
  });
  document.querySelectorAll(".spot-hours-range:not(.spot-hours-range--extra)").forEach(row => {
    if (!row.querySelector(".spot-hours-split-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "spot-hours-split-btn";
      btn.textContent = "分割";
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        const day = row.dataset.day;
        const extra = document.querySelector(`.spot-hours-range--extra[data-day="${day}"]`);
        setExtraHoursVisible(day, !extra || extra.classList.contains("hidden"));
      });
      row.appendChild(btn);
    }
  });
  document.querySelectorAll(".spot-hours-enabled").forEach(input => {
    input.addEventListener("change", () => {
      document.querySelectorAll(`.spot-hours-range[data-day="${input.dataset.day}"]`).forEach(row => {
        row.classList.toggle("spot-hours-range--enabled", input.checked && !row.classList.contains("hidden"));
        updateBusinessHoursRange(row);
      });
    });
  });
  document.querySelectorAll(".spot-hours-range-input").forEach(input => {
    input.addEventListener("input", () => {
      const row = input.closest(".spot-hours-range");
      if (row) updateBusinessHoursRange(row);
    });
  });
  spotHoursToggleAllBtn?.addEventListener("change", () => {
    const shouldEnable = spotHoursToggleAllBtn.checked;
    document.querySelectorAll(".spot-hours-enabled").forEach(input => {
      input.checked = shouldEnable;
      input.dispatchEvent(new Event("change"));
      if (!shouldEnable) setExtraHoursVisible(input.dataset.day, false);
    });
    updateHoursBulkButton();
  });
  updateHoursBulkVisibility();
}

function readPrimaryHoursRange(day) {
  const enabled = document.querySelector(`.spot-hours-enabled[data-day="${day}"]`)?.checked;
  const row = document.querySelector(`.spot-hours-range[data-day="${day}"]:not(.spot-hours-range--extra)`);
  return {
    enabled,
    open: row?.querySelector('[data-part="open"]')?.value ?? 600,
    close: row?.querySelector('[data-part="close"]')?.value ?? 1080,
  };
}

function applyHoursToDay(day, enabled, open, close) {
  const input = document.querySelector(`.spot-hours-enabled[data-day="${day}"]`);
  const row = document.querySelector(`.spot-hours-range[data-day="${day}"]:not(.spot-hours-range--extra)`);
  if (input) input.checked = !!enabled;
  if (row) {
    const openInput = row.querySelector('[data-part="open"]');
    const closeInput = row.querySelector('[data-part="close"]');
    if (openInput) openInput.value = open;
    if (closeInput) closeInput.value = close;
    row.classList.toggle("spot-hours-range--enabled", !!enabled);
    updateBusinessHoursRange(row);
  }
  setExtraHoursVisible(day, false);
}

function updateHoursBulkButton() {
  if (!spotHoursToggleAllBtn) return;
  const enabledInputs = [...document.querySelectorAll(".spot-hours-enabled")];
  const allEnabled = enabledInputs.length > 0 && enabledInputs.every(input => input.checked);
  spotHoursToggleAllBtn.checked = allEnabled;
}

function fillBusinessHoursInputs(hours) {
  // hours が null/undefined = 未設定の新規スポット → 全曜日有効・0:00-24:00 をデフォルトにする
  const noHoursAtAll = !hours || !Object.values(hours).some(v => String(v || "").trim());
  document.querySelectorAll(".spot-hours-range").forEach(row => {
    if (row.classList.contains("spot-hours-range--extra")) row.remove();
  });
  document.querySelectorAll(".spot-hours-range:not(.spot-hours-range--extra)").forEach(row => {
    const day = row.dataset.day;
    const enabledInput = document.querySelector(`.spot-hours-enabled[data-day="${day}"]`);
    const openInput = row.querySelector('[data-part="open"]');
    const closeInput = row.querySelector('[data-part="close"]');
    if (noHoursAtAll) {
      if (enabledInput) enabledInput.checked = true;
      row.classList.add("spot-hours-range--enabled");
      if (openInput) openInput.value = 0;
      if (closeInput) closeInput.value = 1440;
      updateBusinessHoursRange(row);
      setExtraHoursVisible(day, false);
      return;
    }
    const isClosed = String(hours?.[day] || "").trim().toLowerCase() === "closed";
    const ranges = isClosed ? [] : String(hours?.[day] || "").split(",").map(v => splitBusinessHoursRange(v)).filter(r => r.open && r.close);
    const range = ranges[0] || { open: "", close: "" };
    const enabled = !!(range.open && range.close);
    if (enabledInput) enabledInput.checked = enabled;
    row.classList.toggle("spot-hours-range--enabled", enabled);
    if (openInput) openInput.value = timeToBusinessMinutes(range.open, 0);
    if (closeInput) closeInput.value = timeToBusinessMinutes(range.close, 1440);
    updateBusinessHoursRange(row);
    if (ranges[1]) {
      const extra = getOrCreateExtraHoursRange(day);
      extra.querySelector('[data-part="open"]').value = timeToBusinessMinutes(ranges[1].open, 960);
      extra.querySelector('[data-part="close"]').value = timeToBusinessMinutes(ranges[1].close, 1260);
      setExtraHoursVisible(day, true);
    } else {
      setExtraHoursVisible(day, false);
    }
  });
  const values = DAYS.map(day => hours?.[day] || "");
  const first = values[0] || "";
  const isWeekly = values.some(value => value !== first);
  if (spotHoursWeeklyMode) spotHoursWeeklyMode.checked = isWeekly;
  document.querySelector(".spot-hours-table")?.classList.toggle("is-weekly", isWeekly);

  // 非曜日別モードでは全日共通チェックボックスを常に有効にする
  const hasAnyHours = values.some(value => String(value || "").trim());
  if (!isWeekly && hasAnyHours) {
    const sunInput = document.querySelector('.spot-hours-enabled[data-day="sun"]');
    const sunRow   = document.querySelector('.spot-hours-range[data-day="sun"]:not(.spot-hours-range--extra)');
    if (sunInput && !sunInput.checked) {
      sunInput.checked = true;
      sunRow?.classList.add("spot-hours-range--enabled");
      if (sunRow) updateBusinessHoursRange(sunRow);
    }
  }

  updateHoursBulkButton();
  updateHoursBulkVisibility();
}

function readBusinessHoursInputs() {
  const businessHours = {};
  const currentSpot = state.spots.find((spot) => spot.id === state.editingSpotId);
  if (!spotHoursWeeklyMode?.checked) {
    const sun = readPrimaryHoursRange("sun");
    if (!sun.enabled) return businessHours;
    // 非曜日別モードでは常に有効扱い（チェックボックスなし）
    const open = formatMinutesAsTime(sun.open);
    const close = formatMinutesAsTime(sun.close);
    const ranges = [`${open}-${close}`];
    const extra = document.querySelector('.spot-hours-range--extra[data-day="sun"]:not(.hidden)');
    if (extra) {
      const extraOpen = formatMinutesAsTime(extra.querySelector('[data-part="open"]')?.value);
      const extraClose = formatMinutesAsTime(extra.querySelector('[data-part="close"]')?.value);
      if (extraOpen && extraClose) ranges.push(`${extraOpen}-${extraClose}`);
    }
    DAYS.forEach(day => {
      businessHours[day] = ranges.join(",");
    });
    return businessHours;
  }
  document.querySelectorAll(".spot-hours-range").forEach(row => {
    const day = row.dataset.day;
    const enabled = document.querySelector(`.spot-hours-enabled[data-day="${day}"]`)?.checked;
    if (!enabled) {
      if (day && !row.classList.contains("spot-hours-range--extra")) businessHours[day] = "closed";
      return;
    }
    if (row.classList.contains("hidden")) return;
    const openInput = row.querySelector('[data-part="open"]');
    const closeInput = row.querySelector('[data-part="close"]');
    const open = formatMinutesAsTime(openInput?.value);
    const close = formatMinutesAsTime(closeInput?.value);
    if (day && open && close) {
      businessHours[day] = businessHours[day] ? `${businessHours[day]},${open}-${close}` : `${open}-${close}`;
    }
  });
  return businessHours;
}

function updateSpotCategoryFields(cat, spot) {
  const airportSec = document.getElementById("spotAirportSection");
  const hotelSec   = document.getElementById("spotHotelSection");
  if (airportSec) airportSec.classList.toggle("hidden", cat !== "airport");
  if (hotelSec)   hotelSec.classList.toggle("hidden",   cat !== "hotel");

  if (cat === "airport" && spot) {
    const el = id => document.getElementById(id);
    const airport = findAirportForSpot(spot);
    if (spotAirportMasterInput) spotAirportMasterInput.value = getAirportDisplayName(airport) || spot.name || "";
    if (el("spotTakeoffTime"))          el("spotTakeoffTime").value          = roundTimeToFiveMinutes(spot.takeoffTime) || "";
    if (el("spotLandingTime"))          el("spotLandingTime").value          = roundTimeToFiveMinutes(spot.landingTime) || "";
    if (el("spotAirportCheckinOffset")) el("spotAirportCheckinOffset").value = spot.airportCheckinOffsetMin || 90;
    if (el("spotAirportCheckinTime")) {
      el("spotAirportCheckinTime").value = roundTimeToFiveMinutes(spot.airportCheckinTime) || "";
      if (!el("spotAirportCheckinTime").value && spot.takeoffTime) {
        el("spotAirportCheckinTime").value = spotMinutesToTime(Math.max(0, spotTimeToMinutes(spot.takeoffTime) - (Number(spot.airportCheckinOffsetMin) || 90)));
      }
    }
    syncAirportStayInputs();
  } else if (cat === "airport") {
    const el = id => document.getElementById(id);
    if (spotAirportMasterInput) spotAirportMasterInput.value = "";
    if (el("spotAirportCheckinOffset") && !el("spotAirportCheckinOffset").value) el("spotAirportCheckinOffset").value = "90";
    syncAirportStayInputs();
  }
  if (cat === "hotel" && spot) {
    const el = id => document.getElementById(id);
    if (el("spotHotelCheckinTime"))  el("spotHotelCheckinTime").value  = spot.hotelCheckinTime  || "";
    if (el("spotHotelCheckoutTime")) el("spotHotelCheckoutTime").value = spot.hotelCheckoutTime || "";
  }
  setStayInputsForCategory(cat);
}

function addCategoryFromSpotMenu() {
  const name = spotCategoryNewName.value.trim();
  if (!name) { spotCategoryNewName.focus(); return; }

  const existing = loadCustomCategories();
  const emoji = CUSTOM_DEFAULT_ICONS[existing.length % CUSTOM_DEFAULT_ICONS.length];
  const key = `custom_${Date.now()}`;
  existing.push({ key, emoji, name });
  saveCustomCategoriesStorage(existing);

  const newOpt = document.createElement("option");
  newOpt.value = key;
  newOpt.textContent = `${emoji} ${name}`;
  const otherOpt = spotCategorySelect.querySelector('option[value="other"]');
  spotCategorySelect.insertBefore(newOpt, otherOpt);
  spotCategorySelect.value = key;
  spotCategoryAddForm.classList.add("hidden");
  spotCategoryNewName.value = "";
}

function closeSpotMenu() {
  state.editingSpotId = null;
  spotMenu.classList.add("hidden");
  spotMenuBackdrop.classList.add("hidden");
  spotMenu.setAttribute("aria-hidden", "true");
  spotDeleteConfirm?.classList.add("hidden");
  if (IS_EMBEDDED_SPOT_MENU && window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "spot-menu-closed" }, window.location.origin);
  }
}

function renderMapStylePopover() {
  const currentStyle = loadAppSettings().mapStyle;
  mapStylePopoverCards.innerHTML = "";
  MAP_STYLES_META.forEach((style) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `popover-style-item${currentStyle === style.key ? " active" : ""}`;
    btn.innerHTML = `<span class="popover-style-swatch ${style.previewClass}"></span><span>${style.label}</span>`;
    btn.addEventListener("click", () => {
      const s = loadAppSettings();
      s.mapStyle = style.key;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      mapStylePopover.classList.add("hidden");
      renderMaps();
    });
    mapStylePopoverCards.appendChild(btn);
  });
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

  // 役割（集合・解散）トグルを優先
  const isMeetActive    = document.getElementById("spotMeetToggle")?.classList.contains("spot-role-btn--active");
  const isDismissActive = document.getElementById("spotDismissToggle")?.classList.contains("spot-role-btn--active");

  let newCategory = (spotCategorySelect.value && spotCategorySelect.value !== "__add_new__")
    ? spotCategorySelect.value : "other";
  const newRoles = [];
  if (isMeetActive) {
    state.spots = state.spots.map((s, i) =>
      i !== targetIndex && hasSpotRole(s, "meet")
        ? { ...s, spotRoles: getSpotRoles(s).filter(role => role !== "meet"), spotRole: getSpotRoles(s).filter(role => role !== "meet")[0] || "" }
        : s
    );
    newRoles.push("meet");
  }
  if (isDismissActive) {
    state.spots = state.spots.map((s, i) =>
      i !== targetIndex && hasSpotRole(s, "dismiss")
        ? { ...s, spotRoles: getSpotRoles(s).filter(role => role !== "dismiss"), spotRole: getSpotRoles(s).filter(role => role !== "dismiss")[0] || "" }
        : s
    );
    newRoles.push("dismiss");
  }

  // 営業時間（曜日ごと）
  const businessHours = readBusinessHoursInputs();

  // カテゴリ固有フィールド
  const extraFields = {};
  const categoryFieldReset = {
    airportId: null,
    iata: null,
    airportCountry: null,
    airportCity: null,
    takeoffTime: null,
    landingTime: null,
    airportCheckinTime: null,
    airportCheckinOffsetMin: null,
    hotelCheckinTime: null,
    hotelCheckoutTime: null,
  };
  let nextDefaultStayMinutes = readSpotDurationMinutes();
  let canonicalName = spotNameInput.value.trim() || state.spots[targetIndex].name;
  if (newCategory === "airport") {
    const g = id => document.getElementById(id);
    const airport = findAirportMaster(spotAirportMasterInput?.value || spotNameInput.value);
    if (!airport) {
      setFeedback("空港カテゴリでは、空港テーブルから空港を選択してください。", true);
      spotAirportMasterInput?.focus();
      return;
    }
    const duplicate = state.spots.find((s, i) => i !== targetIndex && s.spotCategory === "airport" && (
      s.airportId === getAirportId(airport) || window.sameTripAirport?.(s, airport)
    ));
    if (duplicate) {
      setFeedback(`「${getAirportDisplayName(airport)}」は既に空港スポットとして登録されています。表記ゆれの別スポットは作成できません。`, true);
      return;
    }
    canonicalName = getAirportDisplayName(airport);
    extraFields.airportId = getAirportId(airport);
    extraFields.iata = airport.iata || airport.code || null;
    extraFields.airportCountry = airport.country || null;
    extraFields.airportCity = airport.city || null;
    if (Number.isFinite(Number(airport.lat))) extraFields.lat = Number(airport.lat);
    if (Number.isFinite(Number(airport.lng))) extraFields.lng = Number(airport.lng);
    extraFields.takeoffTime          = roundTimeToFiveMinutes(g("spotTakeoffTime")?.value) || null;
    extraFields.landingTime          = roundTimeToFiveMinutes(g("spotLandingTime")?.value) || null;
    if (!g("spotAirportCheckinTime")?.value && extraFields.takeoffTime) {
      const offForDefault = parseInt(g("spotAirportCheckinOffset")?.value, 10) || 90;
      g("spotAirportCheckinTime").value = spotMinutesToTime(Math.max(0, spotTimeToMinutes(extraFields.takeoffTime) - offForDefault));
    }
    extraFields.airportCheckinTime   = roundTimeToFiveMinutes(g("spotAirportCheckinTime")?.value) || null;
    const off = parseInt(g("spotAirportCheckinOffset")?.value);
    extraFields.airportCheckinOffsetMin = Number.isFinite(off) && off > 0 ? off : 90;
    nextDefaultStayMinutes = syncAirportStayInputs();
  }
  if (newCategory === "hotel") {
    const g = id => document.getElementById(id);
    extraFields.hotelCheckinTime  = g("spotHotelCheckinTime")?.value  || null;
    extraFields.hotelCheckoutTime = g("spotHotelCheckoutTime")?.value || null;
  }

  state.spots[targetIndex] = {
    ...state.spots[targetIndex],
    ...categoryFieldReset,
    name: canonicalName,
    budget: shouldShowBudget() ? Math.max(0, parseInt(spotBudgetInput.value, 10) || 0) : (spot.budget || 0),
    description: spotDescriptionInput.value.trim(),
    type: "spot",
    spotCategory: newCategory,
    spotRole: newRoles[0] || "",
    spotRoles: newRoles,
    priority: parseInt(document.getElementById("spotPriorityInput")?.value) || 3,
    defaultStayMinutes: nextDefaultStayMinutes,
    businessHours: Object.keys(businessHours).length > 0 ? businessHours : null,
    ...extraFields,
  };
  persistState();
  if (IS_EMBEDDED_SPOT_MENU && window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "spot-menu-saved",
      spotId: state.editingSpotId,
      defaultStayMinutes: state.spots[targetIndex].defaultStayMinutes,
    }, window.location.origin);
  }
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
  state.maps.forEach((map) => {
    try { map.remove(); } catch (_) {} // NaN状態の壊れたマップでも安全にクリーンアップ
  });
  state.maps = [];

  const mappableSpots = state.spots.filter(hasSpotCoords);

  if (state.spots.length === 0) {
    mapPanels.innerHTML = '<div class="empty-state">場所を追加すると地図が表示されます。</div>';
    return;
  }

  if (mappableSpots.length === 0) {
    mapPanels.innerHTML = '<div class="empty-state">座標のあるスポットを追加すると地図が表示されます。</div>';
    return;
  }

  const groups = buildMapGroups(mappableSpots);
  mapPanels.innerHTML = "";

  groups.forEach((group, index) => {
    const card = document.createElement("article");
    card.className = "map-card";

    const head = document.createElement("div");
    head.className = "map-head";
    head.innerHTML = `<div><p class="map-number">Map ${index + 1}</p><h3>${escapeHtml(group.title)}</h3></div>`;
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "ghost-button icon-btn";
    saveBtn.title = "画像で保存";
    saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    saveBtn.addEventListener("click", () => saveMapAsImage(card, group.title));
    head.appendChild(saveBtn);
    if (loadAppSettings().labelDragEnabled) {
      const resetLabelBtn = document.createElement("button");
      resetLabelBtn.type = "button";
      resetLabelBtn.className = "ghost-button icon-btn";
      resetLabelBtn.title = "吹き出し位置をリセット";
      resetLabelBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
      resetLabelBtn.addEventListener("click", () => {
        state.spots.forEach(s => { delete s.labelDeltaX; delete s.labelDeltaY; });
        state.clusterLabelDeltas = {};
        persistState();
        renderMaps();
      });
      head.appendChild(resetLabelBtn);
    }

    const mapContainer = document.createElement("div");
    mapContainer.className = "leaflet-map";

    card.append(head, mapContainer);
    mapPanels.appendChild(card);
    void mapContainer.offsetHeight; // CSSのmin-heightをレイアウトに確定させてからLeafletに渡す

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

function estimateLabelSize(point) {
  const name = String(point?.name || "");
  const charW = window.innerWidth <= 520 ? 12 : LABEL_CHAR_W;
  const w = Math.min(LABEL_MAX_W, Math.max(LABEL_MIN_W, name.length * charW + 22));
  return { w, h: LABEL_H };
}

function estimateClusterLabelSize(item) {
  const rows = Math.max(1, item?.points?.length || 1) + (item?.mapNumber ? 1 : 0);
  return { w: 160, h: Math.min(150, 12 + rows * 20) };
}

function pointToLayerPx(map, point) {
  const p = map.latLngToLayerPoint([point.lat, point.lng]);
  return { x: p.x, y: p.y };
}

function labelRect(px, dir, point, distance = LABEL_GAP, size = estimateLabelSize(point)) {
  const g = distance;
  const { w, h } = size;
  if (dir === "right")  return { x1: px.x + g,       x2: px.x + g + w,     y1: px.y - h / 2, y2: px.y + h / 2 };
  if (dir === "left")   return { x1: px.x - g - w,    x2: px.x - g,         y1: px.y - h / 2, y2: px.y + h / 2 };
  if (dir === "top")    return { x1: px.x - w / 2,    x2: px.x + w / 2,     y1: px.y - g - h, y2: px.y - g     };
  return                       { x1: px.x - w / 2,    x2: px.x + w / 2,     y1: px.y + g,     y2: px.y + g + h };
}

function pinRect(px) {
  const p = LABEL_PIN_PAD;
  return { x1: px.x - p, x2: px.x + p, y1: px.y - p, y2: px.y + p };
}

function labelViewRect(map) {
  const size = map.getSize();
  return {
    x1: LABEL_EDGE_PAD,
    x2: Math.max(LABEL_EDGE_PAD, size.x - LABEL_EDGE_PAD),
    y1: LABEL_EDGE_PAD,
    y2: Math.max(LABEL_EDGE_PAD, size.y - LABEL_EDGE_PAD),
  };
}

function rectsOverlap(a, b) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function overlapArea(a, b) {
  if (!rectsOverlap(a, b)) return 0;
  return (Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * (Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
}

function outOfBoundsArea(r, bounds) {
  if (!bounds) return 0;
  const insideW = Math.max(0, Math.min(r.x2, bounds.x2) - Math.max(r.x1, bounds.x1));
  const insideH = Math.max(0, Math.min(r.y2, bounds.y2) - Math.max(r.y1, bounds.y1));
  return Math.max(0, (r.x2 - r.x1) * (r.y2 - r.y1) - insideW * insideH);
}

function chooseLabelPlacements(map, points, options = {}) {
  const viewRect = labelViewRect(map);
  const placed = [
    ...points.map(point => pinRect(pointToLayerPx(map, point))),
    ...(options.initialRects || [])
  ];
  const sizeFor = options.sizeFor || estimateLabelSize;
  const dirOrder = options.preferredDirs || LABEL_DIRS;
  const distances = options.distances || LABEL_DISTANCES;
  const result = new Map();
  points.forEach((point) => {
    const px = pointToLayerPx(map, point);
    const size = sizeFor(point);
    let fallback = null;
    let fallbackPenalty = Infinity;

    for (const dir of dirOrder) {
      for (const distance of distances) {
        const r = labelRect(px, dir, point, distance, size);
        const overlapPenalty = placed.reduce((sum, b) => sum + overlapArea(r, b), 0);
        const edgeOverflow = outOfBoundsArea(r, viewRect);
        const distancePenalty = distance * 0.15;
        const penalty = overlapPenalty + edgeOverflow * 12 + distancePenalty;
        if (overlapPenalty === 0 && edgeOverflow === 0) {
          placed.push(r);
          result.set(point.id, { direction: dir, distance, rect: r });
          return;
        }
        if (penalty < fallbackPenalty) {
          fallbackPenalty = penalty;
          fallback = { direction: dir, distance, rect: r };
        }
      }
    }
    if (options.allowEdgeOverflow && fallback) {
      const overlapPenalty = placed.reduce((sum, b) => sum + overlapArea(fallback.rect, b), 0);
      if (overlapPenalty === 0) {
        placed.push(fallback.rect);
        result.set(point.id, fallback);
      }
    }
  });
  return result;
}

function addMarkerToMap(map, point, placement = null) {
  const dx = Number(point.labelDeltaX) || 0;
  const dy = Number(point.labelDeltaY) || 0;
  const base = {
    right:  placement ? [placement.distance + dx,  dy] : [LABEL_GAP + dx,  dy],
    left:   placement ? [-placement.distance + dx, dy] : [-LABEL_GAP + dx, dy],
    top:    placement ? [dx, -placement.distance + dy] : [dx, -LABEL_GAP + dy],
    bottom: placement ? [dx,  placement.distance + dy] : [dx,  LABEL_GAP + dy],
  };
  const roles = getSpotRoles(point);
  const markerRole = roles.includes("meet") && roles.includes("dismiss") ? "meet-dismiss" : getSpotRole(point);
  const marker = L.marker([point.lat, point.lng], { icon: createMarkerIcon(point.type, point.spotCategory, markerRole) }).addTo(map);
  const dir = placement ? placement.direction : "right";
  marker.bindTooltip(escapeHtml(point.name), {
    permanent: true,
    direction: dir,
    offset: base[dir] || [16 + dx, dy],
    className: `spot-label spot-label-gap-${placement ? placement.distance : LABEL_GAP}`,
  });
  marker.on("click", () => openSpotMenu(point.id));
  setTimeout(() => {
    const tipEl = marker.getTooltip()?.getElement();
    if (tipEl) {
      tipEl.addEventListener("click", () => openSpotMenu(point.id));
      if (loadAppSettings().labelDragEnabled) attachLabelDrag(tipEl, point.id, map);
    }
  }, 0);
  return marker;
}

function attachLabelDrag(el, spotId, map) {
  el.style.pointerEvents = "auto";
  el.style.cursor = "grab";
  el.title = "ドラッグで位置を調整";

  let dragging = false;
  let startX, startY, startDx, startDy;
  // Leaflet が _updatePosition で設定する marginLeft/Top の基準値
  let baseMl = 0, baseMt = 0;

  // マウスが tooltip 上にある間はマップドラッグを無効化し、tooltip の mousedown を受け取れるようにする
  el.addEventListener("mouseenter", () => map.dragging.disable());
  el.addEventListener("mouseleave", () => { if (!dragging) map.dragging.enable(); });

  const onMove = e => {
    // Leaflet のベース margin に drag delta を加算（上書きではなく加算）
    el.style.marginLeft = `${baseMl + (e.clientX - startX)}px`;
    el.style.marginTop  = `${baseMt + (e.clientY - startY)}px`;
  };

  const onUp = e => {
    dragging = false;
    map.dragging.enable();
    el.style.cursor = "grab";
    // ベース margin を復元してから renderMaps で再構築
    el.style.marginLeft = `${baseMl}px`;
    el.style.marginTop  = `${baseMt}px`;
    const ndx = startDx + (e.clientX - startX);
    const ndy = startDy + (e.clientY - startY);
    const spot = state.spots.find(s => s.id === spotId);
    if (spot) {
      spot.labelDeltaX = ndx;
      spot.labelDeltaY = ndy;
      persistState();
    }
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    renderMaps();
  };

  el.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    dragging = true;
    el.style.cursor = "grabbing";
    // Leaflet が設定している現在の margin を基準値として保存（リセットしない）
    baseMl = parseFloat(el.style.marginLeft) || 0;
    baseMt = parseFloat(el.style.marginTop)  || 0;
    startX = e.clientX;
    startY = e.clientY;
    const sp = state.spots.find(s => s.id === spotId);
    startDx = Number(sp?.labelDeltaX) || 0;
    startDy = Number(sp?.labelDeltaY) || 0;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

function attachClusterLabelDrag(el, clusterKey, currentDelta, map) {
  el.style.pointerEvents = "auto";
  el.style.cursor = "grab";
  el.title = "ドラッグで位置を調整";

  let dragging = false;
  let startX, startY, startDx, startDy;

  el.addEventListener("mouseenter", () => map.dragging.disable());
  el.addEventListener("mouseleave", () => { if (!dragging) map.dragging.enable(); });

  const onMove = e => {
    el.style.transform = `translate(${e.clientX - startX}px, ${e.clientY - startY}px)`;
  };

  const onUp = e => {
    dragging = false;
    map.dragging.enable();
    el.style.cursor = "grab";
    el.style.transform = "";
    const ndx = startDx + (e.clientX - startX);
    const ndy = startDy + (e.clientY - startY);
    if (!state.clusterLabelDeltas) state.clusterLabelDeltas = {};
    state.clusterLabelDeltas[clusterKey] = { dx: ndx, dy: ndy };
    persistState();
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    renderMaps();
  };

  el.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    dragging = true;
    el.style.cursor = "grabbing";
    startX = e.clientX;
    startY = e.clientY;
    startDx = currentDelta.dx || 0;
    startDy = currentDelta.dy || 0;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

function renderOverviewLayer(map, items, bounds) {
  const singles = items.filter((i) => i.type === "single").map((i) => i.point);
  const allPointRects = items.flatMap((item) =>
    item.type === "single"
      ? [pinRect(pointToLayerPx(map, item.point))]
      : item.points.map(point => pinRect(pointToLayerPx(map, point)))
  );
  const clusters = items.filter((i) => i.type !== "single");
  const clusterPoints = clusters.map((item, index) => ({
    id: `cluster-${index}`,
    lat: item.center.lat,
    lng: item.center.lng,
    _clusterItem: item
  }));
  const clusterPlacements = clusterPoints.length > 0
    ? chooseLabelPlacements(map, clusterPoints, {
        initialRects: allPointRects,
        sizeFor: point => estimateClusterLabelSize(point._clusterItem),
        preferredDirs: ["right", "bottom", "top", "left"],
        distances: [34, 64, 94, 124, 154, 204, 264]
      })
    : new Map();
  const clusterRects = [...clusterPlacements.values()].map(p => p.rect).filter(Boolean);
  const placements = singles.length > 0
    ? chooseLabelPlacements(map, singles, {
        initialRects: [...allPointRects, ...clusterRects],
        preferredDirs: clusters.length > 0 ? ["left", "bottom", "top", "right"] : LABEL_DIRS,
        distances: [34, 64, 94, 124, 154, 204, 264]
      })
    : new Map();

  items.forEach((item) => {
    if (item.type === "single") {
      addMarkerToMap(map, item.point, placements.get(item.point.id));
      return;
    }

    L.rectangle(item.bounds, {
      color: "#ff7a45",
      weight: 2,
      fillOpacity: 0.06,
      dashArray: "6 6",
    }).addTo(map);

    const mapLabel = item.mapNumber
      ? `<span class="cluster-map-label">拡大図: MAP${item.mapNumber}</span>`
      : "";
    const labelHtml = mapLabel + item.points.map((point) =>
      `<span class="cluster-part cluster-spot-link" onclick="event.stopPropagation();openSpotMenu('${point.id}')">${escapeHtml(point.name)}</span>`
    ).join("");

    // クラスター内の各スポットに小ピンを配置
    item.points.forEach((point) => {
      const isDefaultCat = DEFAULT_CATEGORIES.some(c => c.key === point.spotCategory);
      const roles = getSpotRoles(point);
      const role = roles.includes("meet") && roles.includes("dismiss") ? "meet-dismiss" : getSpotRole(point);
      const pinClass = role === "meet-dismiss" ? "map-pin-meet-dismiss"
        : role === "meet" ? "map-pin-meet"
        : role === "dismiss" ? "map-pin-dismiss"
        : isDefaultCat ? `map-pin-${point.spotCategory || "other"}` : "map-pin-custom";
      const memberIcon = L.divIcon({
        className: "",
        html: `<div class="map-pin map-pin-cluster-member ${pinClass}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const memberMarker = L.marker([point.lat, point.lng], { icon: memberIcon }).addTo(map);
      memberMarker.on("click", () => openSpotMenu(point.id));
    });

    const clusterIndex = clusters.indexOf(item);
    const placement = clusterPlacements.get(`cluster-${clusterIndex}`);
    if (!placement) return;
    const size = estimateClusterLabelSize(item);
    const anchor = clusterIconAnchor(placement.direction, placement.distance, size);
    const clusterKey = item.points.map(p => p.id).sort().join(":");
    const delta = (state.clusterLabelDeltas || {})[clusterKey] || { dx: 0, dy: 0 };
    const adjustedAnchor = [anchor[0] - delta.dx, anchor[1] - delta.dy];

    const clusterMarker = L.marker([item.center.lat, item.center.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="cluster-label">${labelHtml}</div>`,
        iconSize: [size.w, size.h],
        iconAnchor: adjustedAnchor,
      }),
    }).addTo(map);

    if (loadAppSettings().labelDragEnabled) {
      setTimeout(() => {
        const el = clusterMarker.getElement()?.querySelector(".cluster-label");
        if (el) attachClusterLabelDrag(el, clusterKey, delta, map);
      }, 0);
    }
  });
}

function clusterIconAnchor(direction, distance, size) {
  if (direction === "right") return [-distance, size.h / 2];
  if (direction === "left") return [size.w + distance, size.h / 2];
  if (direction === "top") return [size.w / 2, size.h + distance];
  return [size.w / 2, -distance];
}

function renderDetailLayer(map, points, bounds) {
  const placements = chooseLabelPlacements(map, points);
  points.forEach((point) => addMarkerToMap(map, point, placements.get(point.id)));
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
    addZoomGroupsRecursive(topClusters, groups, overviewItems);
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

function addZoomGroupsRecursive(clusters, groups, parentOverviewItems) {
  clusters.filter((c) => c.length >= 2).forEach((cluster) => {
    const clusterDiagonal = rawDiagonalKm(cluster);
    const subClusters = findRelativeClusters(cluster, clusterDiagonal * RELATIVE_CLUSTER_THRESHOLD);
    const hasUsefulSubClusters = subClusters.length > 1 && subClusters.some((sc) => sc.length >= 2);

    const labels = cluster.map((p) => p.name);
    const title = `${labels.join(" / ")} の拡大図`;
    const clusterBounds = boundsFromPoints(cluster, DETAIL_PADDING_RATIO, 0.001);

    // このクラスターに対応するMAP番号（次にpushされるgroup）
    const mapNum = groups.length + 1;

    // 親のoverviewItemsに対応するcluster itemがあればmapNumberを付与
    if (parentOverviewItems) {
      const clusterIds = new Set(cluster.map(p => p.id));
      const parentItem = parentOverviewItems.find(item =>
        item.type === "cluster" &&
        item.points.length === cluster.length &&
        item.points.every(p => clusterIds.has(p.id))
      );
      if (parentItem) parentItem.mapNumber = mapNum;
    }

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
      addZoomGroupsRecursive(subClusters, groups, overviewItems);
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

function createMarkerIcon(type, spotCategory, spotRole = "") {
  const isDefaultCat = DEFAULT_CATEGORIES.some(c => c.key === spotCategory);
  const pinClass = spotRole === "meet-dismiss" ? "map-pin-meet-dismiss"
    : spotRole === "meet" ? "map-pin-meet"
    : spotRole === "dismiss" ? "map-pin-dismiss"
    : isDefaultCat ? `map-pin-${spotCategory || "other"}` : "map-pin-custom";
  let icon = "";
  if (spotRole === "meet-dismiss") {
    icon = "🔁";
  } else if (spotRole) {
    icon = SPOT_PIN_ICONS[spotRole] || "";
  } else if (isDefaultCat) {
    icon = SPOT_PIN_ICONS[spotCategory] || "";
  } else {
    const customCat = loadCustomCategories().find(c => c.key === spotCategory);
    icon = customCat ? customCat.emoji : "";
  }
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
    const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "6" });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "Accept-Language": "ja,en" },
    });
    if (!response.ok) { hideDropdown(dropdown); return; }
    const items = await response.json();
    if (!Array.isArray(items) || items.length === 0) { hideDropdown(dropdown); return; }
    const results = items.map((item) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      return {
        name: item.name || item.display_name.split(",")[0].trim(),
        display: item.display_name || "",
        lat,
        lng,
        url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        osmCategory: item.category || "",
        osmType: item.type || "",
      };
    });
    renderSuggestions(results, dropdown);
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

async function saveMapAsImage(card, title) {
  try {
    setFeedback("地図を画像に変換中...", false);
    card.classList.add("is-capturing");
    const canvas = await html2canvas(card, {
      useCORS: true,
      allowTaint: false,
      logging: false,
      scale: 2,
    });
    card.classList.remove("is-capturing");
    const safeTitle = (title || "map").replace(/[/\\:*?"<>|]/g, "").replace(/\s+/g, "_");
    const link = document.createElement("a");
    link.download = `map_${safeTitle}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setFeedback("地図の画像を保存しました。", false);
  } catch {
    card.classList.remove("is-capturing");
    setFeedback("地図の保存に失敗しました。ブラウザの制限で外部タイルが取得できない場合があります。", true);
  }
}

async function saveAllMapsAsImage() {
  if (state.spots.length === 0) {
    setFeedback("地図がありません。", true);
    return;
  }
  try {
    setFeedback("地図を画像に変換中...", false);
    mapPanels.classList.add("is-capturing");
    const canvas = await html2canvas(mapPanels, {
      useCORS: true,
      allowTaint: false,
      logging: false,
      scale: 2,
    });
    mapPanels.classList.remove("is-capturing");
    const listName = (getActiveList()?.name || "map").replace(/[/\\:*?"<>|]/g, "").replace(/\s+/g, "_");
    const link = document.createElement("a");
    link.download = `maps_${listName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setFeedback("地図の画像を保存しました。", false);
  } catch {
    mapPanels.classList.remove("is-capturing");
    setFeedback("地図の保存に失敗しました。ブラウザの制限で外部タイルが取得できない場合があります。", true);
  }
}

function openCategoryModal() {
  renderCategoryModal();
  categoryModal.classList.remove("hidden");
  categoryModalBackdrop.classList.remove("hidden");
  categoryModal.setAttribute("aria-hidden", "false");
}

function closeCategoryModal() {
  categoryModal.classList.add("hidden");
  categoryModalBackdrop.classList.add("hidden");
  categoryModal.setAttribute("aria-hidden", "true");
}

function renderCategoryModal() {
  categoryList.innerHTML = "";
  getAllCategories().forEach(cat => {
    const item = document.createElement("div");
    item.className = `category-list-item${cat.isDefault ? " is-default" : ""}`;
    const emojiSpan = document.createElement("span");
    emojiSpan.className = "category-list-emoji";
    emojiSpan.textContent = cat.emoji;
    const nameSpan = document.createElement("span");
    nameSpan.className = "category-list-name";
    nameSpan.textContent = cat.name;
    item.append(emojiSpan, nameSpan);
    if (cat.isDefault) {
      const tag = document.createElement("span");
      tag.className = "category-list-tag";
      tag.textContent = "デフォルト";
      item.appendChild(tag);
    } else {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "category-delete-btn";
      delBtn.textContent = "×";
      delBtn.title = `「${cat.name}」を削除`;
      delBtn.addEventListener("click", () => deleteCustomCategory(cat.key));
      item.appendChild(delBtn);
    }
    categoryList.appendChild(item);
  });
}

function addCustomCategory() {
  const emoji = categoryEmojiInput.value.trim() || "🏷";
  const name = categoryNameInput.value.trim();
  if (!name) {
    categoryNameInput.focus();
    return;
  }
  const key = `custom-${Date.now()}`;
  const custom = loadCustomCategories();
  custom.push({ key, emoji, name });
  saveCustomCategoriesStorage(custom);
  categoryEmojiInput.value = "";
  categoryNameInput.value = "";
  renderCategoryModal();
}

function deleteCustomCategory(key) {
  const updated = loadCustomCategories().filter(c => c.key !== key);
  saveCustomCategoriesStorage(updated);
  let changed = false;
  state.spots = state.spots.map(spot => {
    if (spot.spotCategory === key) {
      changed = true;
      return { ...spot, spotCategory: "other" };
    }
    return spot;
  });
  if (changed) {
    persistState();
    render();
  }
  renderCategoryModal();
}

async function addSpotFromSuggestion(suggestion) {
  const spotCategory = suggestion.spotCategory || detectSpotCategory(
    suggestion.name,
    suggestion.osmCategory || "",
    suggestion.osmType || ""
  );
  const airport = spotCategory === "airport" ? findAirportMaster(suggestion.name || suggestion.display) : null;
  if (spotCategory === "airport" && !airport) {
    setFeedback("空港スポットは空港テーブルから選択できる空港だけ登録できます。", true);
    return;
  }
  const lat = Number(suggestion.lat);
  const lng = Number(suggestion.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const location = {
    id: createStableId(),
    name: airport ? getAirportDisplayName(airport) : suggestion.name,
    lat: airport ? airport.lat : (hasCoords ? lat : null),
    lng: airport ? airport.lng : (hasCoords ? lng : null),
    url: suggestion.url || "",
    sourceUrl: suggestion.url || "",
    sourceType: suggestion.sourceType || "search",
    description: suggestion.description || "",
    type: "spot",
    spotCategory,
    osmCategory: suggestion.osmCategory || "",
    osmType: suggestion.osmType || "",
  };
  if (airport) {
    location.airportId = getAirportId(airport);
    location.iata = airport.iata || airport.code || null;
    location.airportCountry = airport.country || null;
    location.airportCity = airport.city || null;
  }
  if (hasCoords && location.sourceType !== "local-suggestion") {
    await maybeAttachGoogleBusinessHours(location);
  }
  const duplicate = state.spots.find(s =>
    s.name === location.name
    || (location.spotCategory === "airport" && s.spotCategory === "airport" && (
      s.airportId === location.airportId || window.sameTripAirport?.(s, location)
    ))
  );
  if (duplicate) {
    setFeedback(`「${location.name}」は既に登録されています。`, true);
    return;
  }
  state.spots = [...state.spots, location];
  persistState();
  placeInput.value = "";
  setFeedback(`「${location.name}」を追加しました。`, false);
  try {
    render();
  } catch (e) {
    console.error("render失敗（スポット追加後）:", e);
    setFeedback("地図の更新に失敗しました。ページを再読み込みしてください。", true);
  }
}

// ── エリアから提案 ────────────────────────────────────────────────────────────

// 地図で範囲を絞る
function initAreaSuggestMap() {
  if (areaSuggestMap) { setTimeout(() => areaSuggestMap.invalidateSize(), 50); return; }
  const spotsWithCoord = state.spots.filter(s => s.lat && s.lng);
  const center = spotsWithCoord.length > 0
    ? [spotsWithCoord[0].lat, spotsWithCoord[0].lng]
    : [35.68, 139.76];
  areaSuggestMap = L.map(areaSuggestMapEl, { center, zoom: 11, zoomControl: true, attributionControl: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(areaSuggestMap);

  spotsWithCoord.forEach(spot => {
    L.circleMarker([spot.lat, spot.lng], {
      radius: 6, color: "#ff7a45", fillColor: "#ff7a45", fillOpacity: 0.7, weight: 2,
    }).bindTooltip(spot.name, { permanent: false }).addTo(areaSuggestMap);
  });

  if (spotsWithCoord.length > 1) {
    areaSuggestMap.fitBounds(L.latLngBounds(spotsWithCoord.map(s => [s.lat, s.lng])).pad(0.3));
  }

  areaSuggestMap.on("click", handleDrawMapClick);
  setTimeout(() => areaSuggestMap.invalidateSize(), 100);
}

function handleDrawMapClick(e) {
  const hint = areaSuggestMapWrap.querySelector(".area-suggest-map-hint");
  if (!geoFilterCorner1) {
    geoFilterCorner1 = e.latlng;
    const m = L.circleMarker(e.latlng, {
      radius: 7, color: "#0088cc", fillColor: "#0088cc", fillOpacity: 0.9, weight: 2,
    }).addTo(areaSuggestMap);
    geoFilterMarkers.push(m);
    if (hint) hint.textContent = "2点目をクリックして範囲を確定してください";
  } else {
    geoFilterBounds  = L.latLngBounds(geoFilterCorner1, e.latlng);
    geoFilterCorner1 = null;
    geoFilterMarkers.forEach(m => m.remove());
    geoFilterMarkers = [];
    if (geoFilterRectLayer) geoFilterRectLayer.remove();
    geoFilterRectLayer = L.rectangle(geoFilterBounds, { color: "#ff7a45", weight: 2, fillOpacity: 0.12 }).addTo(areaSuggestMap);
    areaSuggestMap.fitBounds(geoFilterBounds.pad(0.1));
    if (hint) hint.textContent = "範囲を設定しました（もう一度クリックで再設定）";
    areaSuggestFilterClear.classList.remove("hidden");
    areaSuggestDrawToggle.classList.add("active");
  }
}

function clearGeoFilter() {
  geoFilterBounds  = null;
  geoFilterCorner1 = null;
  geoFilterMarkers.forEach(m => m.remove());
  geoFilterMarkers = [];
  if (geoFilterRectLayer) { geoFilterRectLayer.remove(); geoFilterRectLayer = null; }
  areaSuggestFilterClear.classList.add("hidden");
  areaSuggestDrawToggle.classList.remove("active");
  const hint = areaSuggestMapWrap?.querySelector(".area-suggest-map-hint");
  if (hint) hint.textContent = "地図をクリックして範囲の2点を選択してください";
}

function toggleAreaSuggestDrawMap() {
  const isHidden = areaSuggestMapWrap.classList.contains("hidden");
  areaSuggestMapWrap.classList.toggle("hidden", !isHidden);
  if (isHidden) initAreaSuggestMap();
}

function getAreaSuggestCount() {
  const el = document.getElementById("areaSuggestCountInline");
  if (el) {
    const val = parseInt(el.value, 10);
    if (val >= 1 && val <= 50) return val;
  }
  const s = loadAppSettings();
  return (typeof s.areaSuggestCount === "number" && s.areaSuggestCount >= 1) ? s.areaSuggestCount : 10;
}

function toggleAreaSuggestPanel() {
  const isHidden = areaSuggestPanel.classList.contains("hidden");
  areaSuggestPanel.classList.toggle("hidden", !isHidden);
  areaSuggestToggle.classList.toggle("open", isHidden);
}

async function handleAreaSuggest() {
  const areaName = areaSuggestInput.value.trim();
  if (!areaName) {
    setAreaSuggestStatus("エリア名を入力してください。", true);
    return;
  }
  areaSuggestResults.innerHTML = "";
  setAreaSuggestStatus("ローカル候補から提案を作成しています...", false);
  areaSuggestSearchBtn.disabled = true;

  try {
    const count = getAreaSuggestCount();
    const suggestions = fetchAreaSuggestions(areaName, count);

    if (!suggestions.length) {
      setAreaSuggestStatus("ローカル候補が見つかりませんでした。都道府県名や主要エリア名で試してください。", true);
      return;
    }
    setAreaSuggestStatus(`「${areaName}」向けのローカル候補 ${suggestions.length} 件`, false);
    renderAreaSuggestions(suggestions);
  } catch (_) {
    setAreaSuggestStatus("候補の作成に失敗しました。別のエリア名で試してください。", true);
  } finally {
    areaSuggestSearchBtn.disabled = false;
  }
}

function normalizeAreaText(value) {
  return String(value || "").trim().replace(/[都道府県市区町村\s]/g, "");
}

function findLocalAreaData(areaName) {
  const data = window.LOCAL_AREA_SUGGESTIONS || {};
  const needle = normalizeAreaText(areaName);
  if (!needle) return undefined;
  let bestEntry = null;
  let bestScore = 0;
  for (const [pref, entry] of Object.entries(data)) {
    for (const key of [pref, ...(entry.keys || [])]) {
      const normalized = normalizeAreaText(key);
      if (!normalized) continue;
      let score = 0;
      if (needle === normalized) score = 1000 + normalized.length;
      else if (needle.includes(normalized)) score = 100 + normalized.length;
      else if (normalized.includes(needle)) score = 1 + normalized.length;
      if (score > bestScore) { bestScore = score; bestEntry = [pref, entry]; }
    }
  }
  return bestScore > 0 ? bestEntry : undefined;
}

function fetchAreaSuggestions(areaName, count) {
  const found = findLocalAreaData(areaName);
  if (!found) return [];
  const [pref, entry] = found;

  // サブエリアはメインエリア名で検索したときだけ表示する
  // （「パリ」で検索したときに「リヨン」「マルセイユ」が出ないようにする）
  const needle = normalizeAreaText(areaName);
  const mainKey = normalizeAreaText(pref);
  const isSearchingMainArea = needle.includes(mainKey) || mainKey.includes(needle);

  const subAreaNames = isSearchingMainArea
    ? (entry.subareas || (entry.keys || []).filter(k => normalizeAreaText(k) !== mainKey))
    : [];
  const subareas = subAreaNames.map(name => ({
    name,
    display: "候補エリア",
    sourceType: "local-suggestion",
  }));

  const foods = (entry.foods || []).map(name => ({
    name,
    display: "ご当地フード",
    sourceType: "local-suggestion",
  }));
  // メインエリア名で検索したときだけスポットを表示する
  // （「釜山」で検索して景福宮など離れた都市のスポットが出ないようにする）
  const spots = isSearchingMainArea
    ? (entry.spots || []).map(name => ({ name, display: "おすすめスポット", sourceType: "local-suggestion" }))
    : [];
  const mixed = [];
  const max = Math.max(count, 1);
  for (let i = 0; i < Math.max(foods.length, spots.length); i++) {
    if (spots[i]) mixed.push(spots[i]);
    if (foods[i]) mixed.push(foods[i]);
  }
  return [...subareas, ...mixed].slice(0, max);
}

function setAreaSuggestStatus(msg, isError) {
  areaSuggestStatus.textContent = msg;
  areaSuggestStatus.classList.remove("hidden");
  areaSuggestStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function renderAreaSuggestions(suggestions) {
  areaSuggestResults.innerHTML = "";
  suggestions.forEach(item => {
    const card = document.createElement("div");
    card.className = "area-suggest-item";

    const fillSpotInput = () => {
      placeInput.value = item.name;
      placeInput.dataset.preferredSuggestionName = item.name;
      placeInput.focus();
      placeInput.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const nameSpan = document.createElement("span");
    nameSpan.className = "area-suggest-item-name";
    nameSpan.innerHTML = `${escapeHtml(item.name)}<small>${escapeHtml(item.display || "")}</small>`;

    const googleBtn = document.createElement("button");
    googleBtn.type = "button";
    googleBtn.className = "area-suggest-google-btn";
    googleBtn.textContent = "Google検索";
    googleBtn.addEventListener("click", () => {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(item.name)}`, "_blank", "noopener,noreferrer");
    });

    const useBtn = document.createElement("button");
    useBtn.type = "button";
    useBtn.className = "area-suggest-add-btn";
    useBtn.textContent = "追加欄に入力";
    useBtn.title = "スポットを追加欄に入力";
    useBtn.addEventListener("click", fillSpotInput);

    const isFood = item.display === "ご当地フード";
    if (item.display === "候補エリア") {
      const subareaBtn = document.createElement("button");
      subareaBtn.type = "button";
      subareaBtn.className = "area-suggest-subarea-btn";
      subareaBtn.textContent = "提案を見る";
      subareaBtn.addEventListener("click", () => {
        if (areaSuggestInput) {
          areaSuggestInput.value = item.name;
          handleAreaSuggest();
        }
      });
      card.append(nameSpan, googleBtn, subareaBtn, useBtn);
    } else if (isFood) {
      card.append(nameSpan, googleBtn);
    } else {
      card.append(nameSpan, googleBtn, useBtn);
    }
    areaSuggestResults.appendChild(card);
  });
}

function renderListNameDisplay() {
  if (listNameDisplay) listNameDisplay.textContent = getActiveList()?.name ?? "リストなし";
}

function openListModal() {
  renderListModal();
  listModal.classList.remove("hidden");
  listModalBackdrop.classList.remove("hidden");
  listModal.setAttribute("aria-hidden", "false");
}

function closeListModal() {
  listModal.classList.add("hidden");
  listModalBackdrop.classList.add("hidden");
  listModal.setAttribute("aria-hidden", "true");
}

function renderListModal() {
  const d = ensureListsData();
  const checkedIds = [...spotList.querySelectorAll(".spot-checkbox:checked")].map(cb => cb.dataset.spotId);
  const checkedSpots = state.spots.filter(s => checkedIds.includes(s.id));
  const hasChecked = checkedSpots.length > 0;

  listItems.innerHTML = "";
  d.lists.forEach(list => {
    const isActive = list.id === d.activeListId;
    const item = document.createElement("div");
    item.className = `list-manage-item${isActive ? " is-active" : ""}`;

    const nameSpan = document.createElement("span");
    nameSpan.className = "list-manage-name";
    nameSpan.textContent = list.name;

    const countSpan = document.createElement("span");
    countSpan.className = "list-manage-count";
    countSpan.textContent = `${list.spots.length}件`;

    item.append(nameSpan, countSpan);

    if (isActive) {
      const tag = document.createElement("span");
      tag.className = "list-manage-tag";
      tag.textContent = "使用中";
      item.appendChild(tag);
    } else {
      if (hasChecked) {
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "list-copy-btn";
        copyBtn.textContent = `${checkedSpots.length}件を追加`;
        copyBtn.title = `選択中の${checkedSpots.length}件をこのリストにコピー`;
        copyBtn.addEventListener("click", () => copyCheckedSpotsToList(list.id));
        item.appendChild(copyBtn);
      }

      const switchBtn = document.createElement("button");
      switchBtn.type = "button";
      switchBtn.className = "list-switch-btn";
      switchBtn.textContent = "切替";
      switchBtn.addEventListener("click", () => switchActiveList(list.id));
      item.appendChild(switchBtn);
    }

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "category-delete-btn";
    delBtn.textContent = "×";
    delBtn.title = `「${list.name}」を削除`;
    delBtn.addEventListener("click", () => deleteListEntry(list.id));
    item.appendChild(delBtn);

    listItems.appendChild(item);
  });
  renderListNameDisplay();
}

function copyCheckedSpotsToList(targetListId) {
  const checkedIds = [...spotList.querySelectorAll(".spot-checkbox:checked")].map(cb => cb.dataset.spotId);
  if (checkedIds.length === 0) return;
  const checkedSpots = state.spots.filter(s => checkedIds.includes(s.id));

  const d = ensureListsData();
  const targetList = d.lists.find(l => l.id === targetListId);
  if (!targetList) return;

  const existingIds = new Set(targetList.spots.map(s => s.id));
  const newSpots = checkedSpots.filter(s => !existingIds.has(s.id));

  if (newSpots.length === 0) {
    alert("選択したスポットはすでにそのリストに含まれています。");
    return;
  }

  targetList.spots = [...targetList.spots, ...newSpots];
  saveListsData();
  setFeedback(`${newSpots.length}件のスポットをコピーしました。`, false);
  renderListModal();
}

function addNewList() {
  const name = listNameInput.value.trim();
  if (!name) { listNameInput.focus(); return; }
  const checkedIds = [...spotList.querySelectorAll(".spot-checkbox:checked")].map(cb => cb.dataset.spotId);
  const checkedSpots = state.spots.filter(s => checkedIds.includes(s.id));
  const d = ensureListsData();
  const newList = { id: createStableId(), name, spots: [...checkedSpots] };
  d.lists.push(newList);
  // activeListId は変えない（現在のリストに留まる）
  saveListsData();
  listNameInput.value = "";
  renderListModal();
}

function switchActiveList(id) {
  persistState();
  const d = ensureListsData();
  if (!d.lists.find(l => l.id === id)) return;
  d.activeListId = id;
  saveListsData();
  state.spots = [...getActiveList(d).spots];
  state.maps = [];
  state.editingSpotId = null;
  closeListModal();
  render();
}

function deleteListEntry(id) {
  const d = ensureListsData();
  const list = d.lists.find(l => l.id === id);
  if (!list) return;
  if (!window.confirm(`「${list.name}」を削除しますか？\nこのリストのスポットも全て削除されます。`)) return;
  d.lists = d.lists.filter(l => l.id !== id);
  if (d.lists.length === 0) {
    // リストが0件になった場合は空状態へ
    d.activeListId = null;
    state.spots = [];
    state.maps = [];
    state.editingSpotId = null;
  } else if (d.activeListId === id) {
    d.activeListId = d.lists[0].id;
    state.spots = [...getActiveList(d).spots];
    state.maps = [];
    state.editingSpotId = null;
  }
  saveListsData();
  render();
  renderListModal();
}

