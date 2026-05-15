const SETTINGS_KEY = "spot-map-settings.v1";

const BG_THEMES = [
  {
    key: "warm",
    label: "ウォームベージュ",
    swatch: "linear-gradient(135deg, #fff8ea, #ffeccd)",
    full: "radial-gradient(circle at 8% 10%, rgba(255,210,87,.55), transparent 22%), radial-gradient(circle at 92% 14%, rgba(112,214,197,.34), transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,143,177,.28), transparent 18%), linear-gradient(180deg,#fff8ea 0%,#ffeccd 100%)",
  },
  {
    key: "sky",
    label: "スカイブルー",
    swatch: "linear-gradient(135deg, #eaf5ff, #d0e8ff)",
    full: "radial-gradient(circle at 8% 10%, rgba(135,206,250,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(100,180,255,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(173,216,230,.25), transparent 18%), linear-gradient(180deg,#eaf5ff 0%,#d0e8ff 100%)",
  },
  {
    key: "mint",
    label: "ミントグリーン",
    swatch: "linear-gradient(135deg, #eafff4, #d0f5e0)",
    full: "radial-gradient(circle at 8% 10%, rgba(144,238,144,.4), transparent 22%), radial-gradient(circle at 92% 14%, rgba(100,200,150,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(152,251,152,.22), transparent 18%), linear-gradient(180deg,#eafff4 0%,#d0f5e0 100%)",
  },
  {
    key: "lavender",
    label: "ラベンダー",
    swatch: "linear-gradient(135deg, #f4eeff, #e5d8ff)",
    full: "radial-gradient(circle at 8% 10%, rgba(216,191,255,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(180,150,240,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(200,170,255,.22), transparent 18%), linear-gradient(180deg,#f4eeff 0%,#e5d8ff 100%)",
  },
  {
    key: "gray",
    label: "ニュートラル",
    swatch: "linear-gradient(135deg, #f2f4f6, #e4e8ec)",
    full: "radial-gradient(circle at 8% 10%, rgba(200,210,220,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(180,190,200,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(190,200,210,.22), transparent 18%), linear-gradient(180deg,#f2f4f6 0%,#e4e8ec 100%)",
  },
];

const THEME_COLOR_MAP = {
  warm: { accent: "#ff7a45", accentDeep: "#ce5428", accentLight: "#ff9a52", accentSoft: "rgba(255,122,69,0.12)", line: "rgba(166,97,54,0.2)", panel: "rgba(255,252,245,0.88)", shadow: "0 24px 50px rgba(149,90,48,0.16)", accentRgb: "255,122,69", shadowBaseRgb: "149,90,48" },
  sky: { accent: "#3b8fd4", accentDeep: "#1a6aad", accentLight: "#60aee8", accentSoft: "rgba(59,143,212,0.12)", line: "rgba(59,120,200,0.22)", panel: "rgba(240,248,255,0.88)", shadow: "0 24px 50px rgba(30,90,160,0.14)", accentRgb: "59,143,212", shadowBaseRgb: "30,90,160" },
  mint: { accent: "#2da868", accentDeep: "#1a7a48", accentLight: "#52c485", accentSoft: "rgba(45,168,104,0.12)", line: "rgba(45,150,90,0.22)", panel: "rgba(240,255,248,0.88)", shadow: "0 24px 50px rgba(30,110,60,0.14)", accentRgb: "45,168,104", shadowBaseRgb: "30,110,60" },
  lavender: { accent: "#8b64cc", accentDeep: "#6a45a8", accentLight: "#a884e0", accentSoft: "rgba(139,100,204,0.12)", line: "rgba(120,80,200,0.22)", panel: "rgba(248,244,255,0.88)", shadow: "0 24px 50px rgba(90,60,150,0.14)", accentRgb: "139,100,204", shadowBaseRgb: "90,60,150" },
  gray: { accent: "#7a8a98", accentDeep: "#5a6a78", accentLight: "#96a6b4", accentSoft: "rgba(122,138,152,0.12)", line: "rgba(100,120,140,0.22)", panel: "rgba(245,247,250,0.88)", shadow: "0 24px 50px rgba(60,80,100,0.14)", accentRgb: "122,138,152", shadowBaseRgb: "60,80,100" },
};

function defaultSettings() {
  return {
    mapStyle: "osm-bright",
    bgTheme: "warm",
    areaSuggestCount: 10,
    calendarStyle: "standard",
    googlePlaceHoursEnabled: true,
    showBudget: true,
    clusterThreshold: 0.20,
  };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return { ...defaultSettings(), ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return defaultSettings();
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyBgFull(key) {
  const theme = BG_THEMES.find((t) => t.key === key) || BG_THEMES[0];
  const colors = THEME_COLOR_MAP[key] || THEME_COLOR_MAP.warm;
  document.body.style.background = theme.full;
  const root = document.documentElement;
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-deep", colors.accentDeep);
  root.style.setProperty("--accent-light", colors.accentLight);
  root.style.setProperty("--accent-soft", colors.accentSoft);
  root.style.setProperty("--line", colors.line);
  root.style.setProperty("--panel", colors.panel);
  root.style.setProperty("--shadow", colors.shadow);
  root.style.setProperty("--accent-rgb", colors.accentRgb);
  root.style.setProperty("--shadow-base-rgb", colors.shadowBaseRgb);
}

const savedSettings = loadSettings();
const draftSettings = { ...savedSettings };
applyBgFull(savedSettings.bgTheme);

const hamburgerBtn = document.getElementById("hamburgerBtn");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const sideDrawer = document.getElementById("sideDrawer");
hamburgerBtn?.addEventListener("click", () => {
  sideDrawer.classList.contains("hidden") ? openDrawer() : closeDrawer();
});
drawerBackdrop?.addEventListener("click", closeDrawer);

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

const bgThemeSwatches = document.getElementById("bgThemeSwatches");
BG_THEMES.forEach((theme) => {
  const btn = document.createElement("button");
  btn.className = `theme-swatch${draftSettings.bgTheme === theme.key ? " active" : ""}`;
  btn.type = "button";
  btn.style.background = theme.swatch;
  btn.innerHTML = `<span class="theme-swatch-label">${theme.label}</span>`;
  btn.addEventListener("click", () => {
    draftSettings.bgTheme = theme.key;
    document.querySelectorAll(".theme-swatch").forEach((swatch) => swatch.classList.remove("active"));
    btn.classList.add("active");
    applyBgFull(theme.key);
    markDirty();
  });
  bgThemeSwatches?.appendChild(btn);
});

const googlePlaceHoursEnabled = document.getElementById("googlePlaceHoursEnabled");
const showBudgetEnabled = document.getElementById("showBudgetEnabled");
const labelDragEnabled = document.getElementById("labelDragEnabled");
const clusterThresholdRange = document.getElementById("clusterThresholdRange");
const clusterThresholdValue = document.getElementById("clusterThresholdValue");
const clusterThresholdReset = document.getElementById("clusterThresholdReset");
const calStyleGroup = document.getElementById("calStyleGroup");
const settingsSaveBtn = document.getElementById("settingsSaveBtn");
const settingsStatus = document.getElementById("settingsStatus");
const clearPageCacheBtn = document.getElementById("clearPageCacheBtn");
const cacheClearStatus = document.getElementById("cacheClearStatus");
const clearSavedDataBtn = document.getElementById("clearSavedDataBtn");
const savedDataClearStatus = document.getElementById("savedDataClearStatus");

const APP_STORAGE_KEYS = [
  "spot-map-settings.v1",
  "spot-map-lists.v1",
  "spot-map-schedule.v1",
  "spot-map-custom-categories.v1",
  "spot-map-local-area-suggestions.v1",
  "trip-basic-plan.v1",
  "trip-print-cover.v1",
  "trip-packing-list.v1",
  "trip-packing-deleted.v1",
  "trip-travel-checklist.v1",
];
const APP_STORAGE_PREFIXES = [
  "trip-packing-list.v1:",
  "trip-packing-deleted.v1:",
  "trip-travel-checklist.v1:",
];

function clearKnownSavedData() {
  APP_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  Object.keys(localStorage)
    .filter(key => APP_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix)))
    .forEach(key => localStorage.removeItem(key));
}

if (googlePlaceHoursEnabled) googlePlaceHoursEnabled.checked = draftSettings.googlePlaceHoursEnabled !== false;
if (showBudgetEnabled) showBudgetEnabled.checked = draftSettings.showBudget !== false;
if (labelDragEnabled) labelDragEnabled.checked = draftSettings.labelDragEnabled === true;

const CLUSTER_THRESHOLD_DEFAULT = 0.20;
function updateClusterThresholdDisplay(val) {
  const pct = Math.round(val * 100);
  if (clusterThresholdValue) clusterThresholdValue.textContent = pct + "%" + (Math.abs(val - CLUSTER_THRESHOLD_DEFAULT) < 0.001 ? "（デフォルト）" : "");
}
if (clusterThresholdRange) {
  const initVal = typeof draftSettings.clusterThreshold === "number" ? draftSettings.clusterThreshold : CLUSTER_THRESHOLD_DEFAULT;
  clusterThresholdRange.value = Math.round(initVal * 100);
  updateClusterThresholdDisplay(initVal);
  clusterThresholdRange.addEventListener("input", () => {
    const val = Number(clusterThresholdRange.value) / 100;
    draftSettings.clusterThreshold = val;
    updateClusterThresholdDisplay(val);
    markDirty();
  });
}
clusterThresholdReset?.addEventListener("click", () => {
  draftSettings.clusterThreshold = CLUSTER_THRESHOLD_DEFAULT;
  if (clusterThresholdRange) clusterThresholdRange.value = Math.round(CLUSTER_THRESHOLD_DEFAULT * 100);
  updateClusterThresholdDisplay(CLUSTER_THRESHOLD_DEFAULT);
  markDirty();
});

googlePlaceHoursEnabled?.addEventListener("change", () => {
  draftSettings.googlePlaceHoursEnabled = googlePlaceHoursEnabled.checked;
  markDirty();
});

showBudgetEnabled?.addEventListener("change", () => {
  draftSettings.showBudget = showBudgetEnabled.checked;
  markDirty();
});

labelDragEnabled?.addEventListener("change", () => {
  draftSettings.labelDragEnabled = labelDragEnabled.checked;
  markDirty();
});

calStyleGroup?.querySelectorAll("input[name=calStyle]").forEach((radio) => {
  radio.checked = radio.value === draftSettings.calendarStyle;
  radio.addEventListener("change", () => {
    draftSettings.calendarStyle = radio.value;
    markDirty();
  });
});

settingsSaveBtn?.addEventListener("click", () => {
  saveSettings(draftSettings);
  isDirty = false;
  if (settingsStatus) {
    settingsStatus.textContent = "✓ 設定を保存しました！";
    settingsStatus.classList.remove("settings-status--dirty");
    settingsStatus.classList.add("settings-status--saved");
    setTimeout(() => {
      settingsStatus.classList.remove("settings-status--saved");
      settingsStatus.textContent = "変更後は保存ボタンを押してください。";
    }, 3000);
  }
});

clearPageCacheBtn?.addEventListener("click", async () => {
  clearPageCacheBtn.disabled = true;
  if (cacheClearStatus) cacheClearStatus.textContent = "ページキャッシュを削除しています...";
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    sessionStorage.clear();
    if (cacheClearStatus) cacheClearStatus.textContent = "ページキャッシュを削除しました。保存データは残っています。";
    setTimeout(() => window.location.reload(), 500);
  } catch {
    if (cacheClearStatus) cacheClearStatus.textContent = "削除に失敗しました。ブラウザの再読み込みを試してください。";
    clearPageCacheBtn.disabled = false;
  }
});

clearSavedDataBtn?.addEventListener("click", () => {
  const ok = window.confirm("しおり、スポット、スケジュール、持ち物リスト、印刷編集内容をすべて削除します。元に戻せません。実行しますか？");
  if (!ok) return;
  clearKnownSavedData();
  sessionStorage.clear();
  if (savedDataClearStatus) savedDataClearStatus.textContent = "保存データをすべて削除しました。";
  setTimeout(() => {
    window.location.href = "./index.html";
  }, 500);
});

let isDirty = false;

function markDirty() {
  isDirty = true;
  if (!settingsStatus) return;
  settingsStatus.textContent = "未保存の変更があります。";
  settingsStatus.classList.add("settings-status--dirty");
}

window.addEventListener("beforeunload", e => {
  if (!isDirty) return;
  e.preventDefault();
  e.returnValue = "";
});

document.addEventListener("click", e => {
  if (!isDirty) return;
  const link = e.target.closest("a[href]");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
  if (!window.confirm("未保存の変更があります。設定を保存せずにページを移動しますか？")) {
    e.preventDefault();
  }
}, true);

// 前のページへ戻るボタン（しおり編集など）
const settingsBackRow = document.getElementById("settingsBackRow");
const referrer = document.referrer;
if (settingsBackRow && referrer && new URL(referrer).origin === window.location.origin) {
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn btn-outline";
  backBtn.textContent = "← 前のページへ戻る";
  backBtn.addEventListener("click", () => {
    if (isDirty && !window.confirm("未保存の変更があります。設定を保存せずにページを移動しますか？")) return;
    history.back();
  });
  settingsBackRow.prepend(backBtn);
}

