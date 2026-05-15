(function () {
  const SETTINGS_KEY = "spot-map-settings.v1";
  const TRIP_PAGES = ["spots.html","tripplan.html","schedule.html","checklist.html","travelchecklist.html","print.html"];

  const bgThemes = {
    warm: "radial-gradient(circle at 8% 10%, rgba(255,210,87,.55), transparent 22%), radial-gradient(circle at 92% 14%, rgba(112,214,197,.34), transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,143,177,.28), transparent 18%), linear-gradient(180deg,#fff8ea 0%,#ffeccd 100%)",
    sky: "radial-gradient(circle at 8% 10%, rgba(135,206,250,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(100,180,255,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(173,216,230,.25), transparent 18%), linear-gradient(180deg,#eaf5ff 0%,#d0e8ff 100%)",
    mint: "radial-gradient(circle at 8% 10%, rgba(144,238,144,.4), transparent 22%), radial-gradient(circle at 92% 14%, rgba(100,200,150,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(152,251,152,.22), transparent 18%), linear-gradient(180deg,#eafff4 0%,#d0f5e0 100%)",
    lavender: "radial-gradient(circle at 8% 10%, rgba(216,191,255,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(180,150,240,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(200,170,255,.22), transparent 18%), linear-gradient(180deg,#f4eeff 0%,#e5d8ff 100%)",
    gray: "radial-gradient(circle at 8% 10%, rgba(200,210,220,.45), transparent 22%), radial-gradient(circle at 92% 14%, rgba(180,190,200,.28), transparent 20%), radial-gradient(circle at 80% 80%, rgba(190,200,210,.22), transparent 18%), linear-gradient(180deg,#f2f4f6 0%,#e4e8ec 100%)",
  };

  const colors = {
    warm: { bg: "#fff3dd", accent: "#ff7a45", accentDeep: "#ce5428", accentLight: "#ff9a52", accentSoft: "rgba(255,122,69,0.12)", line: "rgba(166,97,54,0.2)", panel: "rgba(255,252,245,0.88)", shadow: "0 24px 50px rgba(149,90,48,0.16)", accentRgb: "255,122,69", shadowBaseRgb: "149,90,48" },
    sky: { bg: "#e8f4fd", accent: "#3b8fd4", accentDeep: "#1a6aad", accentLight: "#60aee8", accentSoft: "rgba(59,143,212,0.12)", line: "rgba(59,120,200,0.22)", panel: "rgba(240,248,255,0.88)", shadow: "0 24px 50px rgba(30,90,160,0.14)", accentRgb: "59,143,212", shadowBaseRgb: "30,90,160" },
    mint: { bg: "#f0fdf4", accent: "#2da868", accentDeep: "#1a7a48", accentLight: "#52c485", accentSoft: "rgba(45,168,104,0.12)", line: "rgba(45,150,90,0.22)", panel: "rgba(240,255,248,0.88)", shadow: "0 24px 50px rgba(30,110,60,0.14)", accentRgb: "45,168,104", shadowBaseRgb: "30,110,60" },
    lavender: { bg: "#fdf0f8", accent: "#8b64cc", accentDeep: "#6a45a8", accentLight: "#a884e0", accentSoft: "rgba(139,100,204,0.12)", line: "rgba(120,80,200,0.22)", panel: "rgba(248,244,255,0.88)", shadow: "0 24px 50px rgba(90,60,150,0.14)", accentRgb: "139,100,204", shadowBaseRgb: "90,60,150" },
    gray: { bg: "#f2f4f6", accent: "#7a8a98", accentDeep: "#5a6a78", accentLight: "#96a6b4", accentSoft: "rgba(122,138,152,0.12)", line: "rgba(100,120,140,0.22)", panel: "rgba(245,247,250,0.88)", shadow: "0 24px 50px rgba(60,80,100,0.14)", accentRgb: "122,138,152", shadowBaseRgb: "60,80,100" },
  };

  function loadThemeKey() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").bgTheme;
      if (typeof raw === "string" && colors[raw]) return raw;
      if (typeof raw === "number") return ["warm", "sky", "mint", "lavender", "gray"][raw] || "warm";
    } catch {}
    return "warm";
  }

  function shouldShowBudget() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").showBudget !== false;
    } catch {
      return true;
    }
  }

  function applyTheme() {
    const key = loadThemeKey();
    const c = colors[key] || colors.warm;
    const root = document.documentElement;
    document.body.style.background = bgThemes[key] || bgThemes.warm;
    root.style.setProperty("--bg", c.bg);
    root.style.setProperty("--accent", c.accent);
    root.style.setProperty("--accent-deep", c.accentDeep);
    root.style.setProperty("--accent-light", c.accentLight);
    root.style.setProperty("--accent-soft", c.accentSoft);
    root.style.setProperty("--line", c.line);
    root.style.setProperty("--panel", c.panel);
    root.style.setProperty("--panel-strong", c.panel);
    root.style.setProperty("--shadow", c.shadow);
    root.style.setProperty("--accent-rgb", c.accentRgb);
    root.style.setProperty("--shadow-base-rgb", c.shadowBaseRgb);
    document.body.classList.toggle("budget-hidden", !shouldShowBudget());
  }

  function saveLastTripPage() {
    const path = window.location.pathname;
    const filename = path.split(/[/\\]/).pop() || "";
    if (TRIP_PAGES.some(p => filename === p)) {
      try { sessionStorage.setItem("lastTripPage", window.location.href); } catch {}
    }
  }

  function injectCurrentTripLink() {
    const nav = document.querySelector(".drawer-nav");
    if (!nav || nav.querySelector("[data-current-trip-link]")) return;
    let lastPage = "./spots.html";
    try { lastPage = sessionStorage.getItem("lastTripPage") || "./spots.html"; } catch {}
    const link = document.createElement("a");
    link.href = lastPage;
    link.className = "drawer-nav-item";
    link.dataset.currentTripLink = "true";
    link.innerHTML = '<span class="drawer-nav-icon">🧭</span><span>現在のしおりのページに戻る</span>';
    nav.insertBefore(link, nav.firstChild);
  }

  function injectLegalLink() {
    const nav = document.querySelector(".drawer-nav");
    if (!nav || nav.querySelector("[data-legal-link]")) return;
    const link = document.createElement("a");
    link.href = "./legal.html";
    link.className = "drawer-nav-item";
    link.dataset.legalLink = "true";
    link.innerHTML = '<span class="drawer-nav-icon">§</span><span>利用規約・プライバシー</span>';
    nav.appendChild(link);
  }

  function injectLegalFooter() {
    if (document.querySelector("[data-app-legal-footer]")) return;
    const footer = document.createElement("footer");
    footer.className = "app-legal-footer";
    footer.dataset.appLegalFooter = "true";
    footer.innerHTML = [
      '<p>Trip Pop Map は旅行計画を補助するツールです。経路、時刻、価格、営業時間、空室、予約可否は保証しません。予約・出発前に各公式サイトで確認してください。</p>',
      '<p>外部予約サイトへのリンクには、今後広告・アフィリエイトが含まれる場合があります。PDFや画像を共有する前に、予約番号、同行者名、宿泊先、顔写真などの個人情報が含まれていないか確認してください。</p>',
      '<p><a href="./legal.html">利用規約・プライバシー・免責・データ帰属</a></p>'
    ].join("");
    document.body.appendChild(footer);
  }

  applyTheme();
  saveLastTripPage();
  injectCurrentTripLink();
  injectLegalLink();
  injectLegalFooter();
  window.TripTheme = { applyTheme, injectCurrentTripLink, injectLegalLink, injectLegalFooter };
})();
