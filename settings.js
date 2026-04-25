const SETTINGS_KEY = "spot-map-settings.v1";

const MAP_STYLES = [
  {
    key: "osm-bright",
    label: "OSM Bright",
    description: "日本向け明るいスタイル（標準）",
    previewClass: "preview-osm-bright",
  },
  {
    key: "osm-standard",
    label: "OSM スタンダード",
    description: "OpenStreetMap 標準スタイル",
    previewClass: "preview-osm-standard",
  },
  {
    key: "carto-light",
    label: "CartoDB Light",
    description: "白ベースのシンプルなスタイル",
    previewClass: "preview-carto-light",
  },
  {
    key: "carto-dark",
    label: "CartoDB Dark",
    description: "ダークテーマのスタイル",
    previewClass: "preview-carto-dark",
  },
  {
    key: "esri-satellite",
    label: "衛星写真",
    description: "Esri の衛星画像タイル",
    previewClass: "preview-esri-satellite",
  },
];

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
}

// ── Map style cards ───────────────────────────────────────────────────────────

const mapStyleCards = document.getElementById("mapStyleCards");

MAP_STYLES.forEach((style) => {
  const btn = document.createElement("button");
  btn.className = `style-card${settings.mapStyle === style.key ? " active" : ""}`;
  btn.type = "button";
  btn.innerHTML = `
    <div class="style-card-preview ${style.previewClass}">
      <span class="style-card-check">✓</span>
    </div>
    <div class="style-card-info">
      <span class="style-card-name">${style.label}</span>
      <span class="style-card-desc">${style.description}</span>
    </div>
  `;
  btn.addEventListener("click", () => {
    settings.mapStyle = style.key;
    saveSettings(settings);
    document.querySelectorAll(".style-card").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  });
  mapStyleCards.appendChild(btn);
});

// ── BG theme swatches ─────────────────────────────────────────────────────────

const bgThemeSwatches = document.getElementById("bgThemeSwatches");

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
