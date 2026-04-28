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
  warm:     { accent: "#ff7a45", accentDeep: "#ce5428", accentLight: "#ff9a52", accentSoft: "rgba(255,122,69,0.12)",   line: "rgba(166,97,54,0.2)",    panel: "rgba(255,252,245,0.88)", shadow: "0 24px 50px rgba(149,90,48,0.16)"   },
  sky:      { accent: "#3b8fd4", accentDeep: "#1a6aad", accentLight: "#60aee8", accentSoft: "rgba(59,143,212,0.12)",   line: "rgba(59,120,200,0.22)",  panel: "rgba(240,248,255,0.88)", shadow: "0 24px 50px rgba(30,90,160,0.14)"   },
  mint:     { accent: "#2da868", accentDeep: "#1a7a48", accentLight: "#52c485", accentSoft: "rgba(45,168,104,0.12)",   line: "rgba(45,150,90,0.22)",   panel: "rgba(240,255,248,0.88)", shadow: "0 24px 50px rgba(30,110,60,0.14)"   },
  lavender: { accent: "#8b64cc", accentDeep: "#6a45a8", accentLight: "#a884e0", accentSoft: "rgba(139,100,204,0.12)",  line: "rgba(120,80,200,0.22)",  panel: "rgba(248,244,255,0.88)", shadow: "0 24px 50px rgba(90,60,150,0.14)"   },
  gray:     { accent: "#7a8a98", accentDeep: "#5a6a78", accentLight: "#96a6b4", accentSoft: "rgba(122,138,152,0.12)",  line: "rgba(100,120,140,0.22)", panel: "rgba(245,247,250,0.88)", shadow: "0 24px 50px rgba(60,80,100,0.14)"   },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { mapStyle: "osm-bright", bgTheme: "warm", ...JSON.parse(raw) } : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

function defaultSettings() {
  return { mapStyle: "osm-bright", bgTheme: "warm" };
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

const settings = loadSettings();

// Apply current bg theme to this page immediately
applyBgFull(settings.bgTheme);

function applyBgFull(key) {
  const theme = BG_THEMES.find((t) => t.key === key) || BG_THEMES[0];
  document.body.style.background = theme.full;
  const colors = THEME_COLOR_MAP[key] || THEME_COLOR_MAP.warm;
  const root = document.documentElement;
  root.style.setProperty("--accent",       colors.accent);
  root.style.setProperty("--accent-deep",  colors.accentDeep);
  root.style.setProperty("--accent-light", colors.accentLight);
  root.style.setProperty("--accent-soft",  colors.accentSoft);
  root.style.setProperty("--line",         colors.line);
  root.style.setProperty("--panel",        colors.panel);
  root.style.setProperty("--shadow",       colors.shadow);
}

// ── Hamburger drawer ─────────────────────────────────────────────────────────

const hamburgerBtn = document.getElementById("hamburgerBtn");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const sideDrawer = document.getElementById("sideDrawer");

hamburgerBtn.addEventListener("click", () => {
  sideDrawer.classList.contains("hidden") ? openDrawer() : closeDrawer();
});
drawerBackdrop.addEventListener("click", closeDrawer);

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

// ── BG theme swatches ─────────────────────────────────────────────────────────

const bgThemeSwatches = document.getElementById("bgThemeSwatches");

// ── Area suggest count ────────────────────────────────────────────────────────

const areaSuggestCountInput = document.getElementById("areaSuggestCountInput");
areaSuggestCountInput.value = settings.areaSuggestCount ?? 10;
areaSuggestCountInput.addEventListener("change", () => {
  const v = parseInt(areaSuggestCountInput.value, 10);
  if (v >= 1 && v <= 50) {
    settings.areaSuggestCount = v;
    saveSettings(settings);
  } else {
    areaSuggestCountInput.value = settings.areaSuggestCount ?? 10;
  }
});

const areaSuggestTimeoutInput = document.getElementById("areaSuggestTimeoutInput");
areaSuggestTimeoutInput.value = settings.areaSuggestTimeout ?? 10;
areaSuggestTimeoutInput.addEventListener("change", () => {
  const v = parseInt(areaSuggestTimeoutInput.value, 10);
  if (v >= 3 && v <= 60) {
    settings.areaSuggestTimeout = v;
    saveSettings(settings);
  } else {
    areaSuggestTimeoutInput.value = settings.areaSuggestTimeout ?? 10;
  }
});

// ── BG theme swatches ─────────────────────────────────────────────────────────

BG_THEMES.forEach((theme) => {
  const btn = document.createElement("button");
  btn.className = `theme-swatch${settings.bgTheme === theme.key ? " active" : ""}`;
  btn.type = "button";
  btn.style.background = theme.swatch;
  btn.innerHTML = `<span class="theme-swatch-label">${theme.label}</span>`;
  btn.addEventListener("click", () => {
    settings.bgTheme = theme.key;
    saveSettings(settings);
    document.querySelectorAll(".theme-swatch").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    applyBgFull(theme.key);
  });
  bgThemeSwatches.appendChild(btn);
});
