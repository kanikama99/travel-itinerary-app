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

// デバッグログ生成
const LISTS_KEY_DBG    = "spot-map-lists.v1";
const SCHEDULE_KEY_DBG = "spot-map-schedule.v1";
const PACKING_KEY_DBG  = "trip-packing-list.v1";

function buildDebugLog() {
  const lines = [];
  const now = new Date().toLocaleString("ja-JP");
  lines.push(`=== Trip Pop Map デバッグログ (${now}) ===`);

  try {
    const listsRaw = localStorage.getItem(LISTS_KEY_DBG);
    if (!listsRaw) { lines.push("[スポットリスト] データなし"); return lines.join("\n"); }
    const listsData = JSON.parse(listsRaw);
    const activeList = listsData.lists?.find(l => l.id === listsData.activeListId) || listsData.lists?.[0];
    if (!activeList) { lines.push("[スポットリスト] アクティブリストなし"); return lines.join("\n"); }

    lines.push(`\n[しおり] ${activeList.name || "(未設定)"} (id: ${activeList.id})`);
    const spots = activeList.spots || [];
    lines.push(`スポット数: ${spots.length}`);
    spots.forEach((s, i) => {
      const stay = s.defaultStayMinutes ? `滞在${s.defaultStayMinutes}分` : "";
      const pri  = `優先度${s.priority || 3}`;
      const cat  = s.spotCategory || "tourist";
      const coords = (s.lat && s.lng) ? `(${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)})` : "座標なし";
      const roles = Array.isArray(s.spotRoles) && s.spotRoles.length ? ` / 役割:${s.spotRoles.join(",")}` : (s.spotRole ? ` / 役割:${s.spotRole}` : "");
      const source = s.sourceType ? ` / source:${s.sourceType}` : "";
      const airport = s.spotCategory === "airport" ? ` / airportId:${s.airportId || "-"} / IATA:${s.iata || "-"}` : "";
      lines.push(`  ${i + 1}. [${cat}] ${s.name} / ${pri} / ${stay} / ${coords}${roles}${airport}${source}`);
      if (s.description) lines.push(`     メモ: ${s.description.slice(0, 80)}`);
    });

    const schedRaw = localStorage.getItem(SCHEDULE_KEY_DBG);
    if (schedRaw) {
      const schedAll = JSON.parse(schedRaw);
      const sched = schedAll[activeList.id];
      if (sched) {
        lines.push(`\n[スケジュール]`);
        lines.push(`  移動手段: ${sched.travelMode || "transit"}`);
        lines.push(`  集合: ${sched.tripMeetTime || "09:00"} ${sched.tripMeetPlace || ""}`);
        lines.push(`  解散: ${sched.tripDismissTime || "18:00"} ${sched.tripDismissPlace || ""}`);
        const days = sched.days || [];
        lines.push(`  日数: ${days.length}日`);

        // タイムライン計算用ヘルパー。schedule.html の自動配置と同じ考え方で、仮宿泊・仮空港もログに出す。
        const t2m = str => {
          const m = String(str || "").match(/^(\d{1,2}):(\d{2})$/);
          if (!m) return 0;
          return Number(m[1]) * 60 + Number(m[2]);
        };
        const parseClock = str => {
          const m = String(str || "").match(/^(\d{1,2}):(\d{2})$/);
          if (!m) return null;
          const h = Number(m[1]);
          const min = Number(m[2]);
          return (h >= 0 && h <= 23 && min >= 0 && min <= 59) ? h * 60 + min : null;
        };
        const m2t = min => `${String(Math.floor(Math.max(0, min) / 60) % 24).padStart(2, "0")}:${String(Math.max(0, min) % 60).padStart(2, "0")}`;
        const m2dur = min => `${String(Math.floor(Math.abs(min) / 60)).padStart(2, "0")}:${String(Math.abs(min) % 60).padStart(2, "0")}`;
        const getRoles = spot => {
          const roles = Array.isArray(spot?.spotRoles) ? [...spot.spotRoles] : [];
          if (spot?.spotRole && !roles.includes(spot.spotRole)) roles.push(spot.spotRole);
          if ((spot?.spotCategory === "meet" || spot?.spotCategory === "dismiss") && !roles.includes(spot.spotCategory)) roles.push(spot.spotCategory);
          return roles;
        };
        const isMeet = spot => getRoles(spot).includes("meet");
        const isDismiss = spot => getRoles(spot).includes("dismiss");
        const isVisitSpot = (spot, isFirst, isLast) => !!spot
          && spot.spotCategory !== "hotel"
          && spot.spotCategory !== "airport"
          && !(isFirst && isMeet(spot))
          && !(isLast && isDismiss(spot));
        const getStayMin = (spot, dayData) => {
          if (dayData?.stayTimes?.[spot.id]) return dayData.stayTimes[spot.id];
          if (sched.defaultStayTimes?.[spot.id]) return sched.defaultStayTimes[spot.id];
          if (spot.defaultStayMinutes) return spot.defaultStayMinutes;
          const cat = spot.spotCategory || "tourist";
          if (cat === "restaurant") return 60;
          if (cat === "airport") return 90;
          if (cat === "hotel") return 0;
          return 90;
        };
        const getAirportStayMin = (airportSpot, flight = null, fallback = 90) => {
          const takeoff = parseClock(flight?.time || airportSpot?.takeoffTime || "");
          if (takeoff === null) return Number(airportSpot?.defaultStayMinutes) || fallback;
          const checkin = parseClock(airportSpot?.airportCheckinTime || "");
          if (checkin !== null && checkin <= takeoff) return Math.max(0, takeoff - checkin);
          return Number(airportSpot?.airportCheckinOffsetMin) || Number(airportSpot?.defaultStayMinutes) || fallback;
        };
        const distKm = (a, b) => {
          if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
          const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
          const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
          return 2 * R * Math.asin(Math.sqrt(h));
        };
        const estimateTravel = (from, to, defMin) => {
          const d = distKm(from, to);
          if (d === null) return defMin;
          if (d < 1) return 10; if (d < 5) return 20; if (d < 20) return 30;
          if (d < 80) return 60; return 90;
        };
        const sameAirport = (a, b) => !!a && !!b && (
          (a.airportId && (a.airportId === b.airportId || a.airportId === b.id))
          || (a.iata && (a.iata === b.iata || a.iata === b.code))
          || String(a.name || "").trim() === String(b.name || "").trim()
        );
        const findSpotByName = name => spots.find(s => String(s.name || "").trim() === String(name || "").trim()) || null;
        const findFlight = (role, anchor, date) => {
          if (!anchor || !sched.flights) return null;
          return sched.flights[`${role}:${anchor.id || anchor.name}:${date || ""}`]
            || sched.flights[`${role}:${anchor.name}:${date || ""}`]
            || null;
        };
        const flightDepartureSpot = flight => flight ? (spots.find(s => s.id === flight.departureSpotId) || findSpotByName(flight.airport)) : null;
        const flightArrivalSpot = flight => flight ? (spots.find(s => s.id === flight.arrivalSpotId) || findSpotByName(flight.arrivalAirport)) : null;
        const airportCandidates = () => spots.filter(s => s.spotCategory === "airport" && !isMeet(s) && !isDismiss(s) && s.lat && s.lng);
        const nearbyAirport = (baseSpots, fallbackSpot) => {
          const airports = airportCandidates().filter(ap => !sameAirport(ap, fallbackSpot));
          const bases = (baseSpots || []).filter(s => s?.lat && s?.lng);
          if (!airports.length || !bases.length) return airports[0] || null;
          return airports
            .map(ap => ({ ap, score: Math.min(...bases.map(s => distKm(ap, s) ?? Infinity)) }))
            .sort((a, b) => a.score - b.score)[0]?.ap || airports[0];
        };
        const dayVisitSpots = (dayData, isFirst, isLast) => (dayData?.entries || [])
          .map(en => spots.find(s => s.id === en.spotId))
          .filter(s => s?.lat && s?.lng && isVisitSpot(s, isFirst, isLast));
        const provisionalHotel = (dayData, di, role) => {
          const current = dayVisitSpots(dayData, di === 0, di === days.length - 1);
          const neighborIdx = role === "meet" ? di - 1 : di + 1;
          const neighbor = days[neighborIdx];
          const neighborSpots = dayVisitSpots(neighbor, neighborIdx === 0, neighborIdx === days.length - 1);
          const scheduled = new Set(days.flatMap(x => (x.entries || []).map(en => en.spotId)));
          const candidates = spots.filter(s => s.lat && s.lng && !scheduled.has(s.id) && isVisitSpot(s, false, false));
          const base = [...current, ...neighborSpots, ...candidates];
          if (!base.length) return null;
          const lat = base.reduce((sum, s) => sum + Number(s.lat), 0) / base.length;
          const lng = base.reduce((sum, s) => sum + Number(s.lng), 0) / base.length;
          const anchor = base.map(s => ({ s, d: distKm({ lat, lng }, s) ?? Infinity })).sort((a, b) => a.d - b.d)[0]?.s;
          return { id: `hotel-provisional-${dayData?.id || di}`, name: `仮の宿泊エリア（${anchor?.name || "中心街"}周辺の中心街・駅目安）`, lat, lng, spotCategory: "hotel", provisional: true };
        };
        const getTripSideAirport = (dayData, role) => {
          const visits = dayVisitSpots(dayData, false, false);
          return nearbyAirport(visits.length ? visits : spots.filter(s => s.lat && s.lng && !isMeet(s) && !isDismiss(s) && s.spotCategory !== "airport"), role === "meet" ? spots.find(isMeet) : spots.find(isDismiss));
        };
        const meetContext = (dayData, di, fallbackStart) => {
          if (di !== 0) {
            const hotel = sched.hotels?.[days[di - 1]?.id];
            return { anchor: hotel?.lat && hotel?.lng ? hotel : provisionalHotel(dayData, di, "meet"), start: fallbackStart, note: hotel?.name ? "前泊ホテル" : "仮宿泊" };
          }
          const meet = spots.find(isMeet) || null;
          if (meet?.spotCategory !== "airport") return { anchor: meet, start: fallbackStart, note: "集合場所" };
          const flight = findFlight("meet", meet, dayData.date);
          const arrival = flightArrivalSpot(flight) || nearbyAirport(dayVisitSpots(dayData, true, false), meet) || getTripSideAirport(dayData, "meet");
          const provisional = !flight && arrival;
          const arrivalT = parseClock(flight?.arrivalTime || (provisional ? m2t(fallbackStart + (Number(meet.airportCheckinOffsetMin) || 90) + 120) : ""));
          return { anchor: arrival || meet, start: arrivalT !== null ? Math.max(fallbackStart, arrivalT) : fallbackStart, note: provisional ? "仮往路フライト到着後" : "往路フライト到着後", flight, provisional };
        };
        const dismissContext = (dayData, di, fallbackEnd) => {
          if (di !== days.length - 1) {
            const hotel = sched.hotels?.[dayData.id];
            return { anchor: hotel?.lat && hotel?.lng ? hotel : provisionalHotel(dayData, di, "dismiss"), end: fallbackEnd, note: hotel?.name ? "宿泊ホテル" : "仮宿泊" };
          }
          const dismiss = spots.find(isDismiss) || null;
          if (dismiss?.spotCategory !== "airport") return { anchor: dismiss, end: fallbackEnd, note: "解散場所" };
          const flight = findFlight("dismiss", dismiss, dayData.date);
          const departure = flightDepartureSpot(flight) || nearbyAirport(dayVisitSpots(dayData, false, true), dismiss) || getTripSideAirport(dayData, "dismiss") || dismiss;
          const provisional = !flight && departure;
          const takeoff = parseClock(flight?.time || (provisional ? sched.tripDismissTime : ""));
          const stay = getAirportStayMin(departure || dismiss, flight || { time: sched.tripDismissTime }, 90);
          const limit = takeoff !== null ? Math.max(0, takeoff - stay) : fallbackEnd;
          return { anchor: departure, end: Math.min(fallbackEnd, limit), note: provisional ? "仮復路フライトのチェックイン締切" : "復路フライトのチェックイン締切", flight, provisional, takeoff, stay };
        };

        const scheduledIds = new Set();
        days.forEach(d => (d.entries || []).forEach(en => scheduledIds.add(en.spotId)));

        const flights = Object.values(sched.flights || {});
        if (flights.length) {
          lines.push(`  航空券: ${flights.length}件`);
          flights.forEach(f => lines.push(`    - [${f.role || "-"}] ${f.flightNumber || "便名未設定"} ${f.airport || ""} ${f.time || "--:--"} → ${f.arrivalAirport || ""} ${f.arrivalTime || "--:--"}${f.provisional ? "（仮）" : ""}`));
        } else {
          lines.push(`  航空券: 未登録（空港集合/解散では仮フライトで推定）`);
        }

        days.forEach((d, di) => {
          const isFirst = di === 0;
          const isLast  = di === days.length - 1;
          const startStr = isFirst ? (sched.tripMeetTime || "09:00") : (d.startTime || "09:00");
          const endStr   = isLast  ? (sched.tripDismissTime || "18:00") : (d.endTime || "21:00");
          const inputStartT = t2m(startStr);
          const inputEndT = t2m(endStr);
          const defTravel = d.travelMinutes || 20;
          const meetCtx = meetContext(d, di, inputStartT);
          const dismissCtx = dismissContext(d, di, inputEndT);
          const endT = dismissCtx.end ?? inputEndT;
          let t = meetCtx.start ?? inputStartT;
          let prevSpot = meetCtx.anchor || null;

          lines.push(`\n  ── Day${di + 1} (${d.date || "日付未設定"}) ${startStr}〜${endStr} ──`);
          if (t !== inputStartT || endT !== inputEndT) {
            lines.push(`    実配置枠: ${m2t(t)}〜${m2t(endT)}（${meetCtx.note || "開始"} / ${dismissCtx.note || "終了"}を考慮）`);
          }

          // 集合
          const meetName = isFirst ? (sched.tripMeetPlace || "集合場所") : "前泊先";
          lines.push(`    ${m2t(t)} 【集合】${meetName}`);
          if (meetCtx.provisional) lines.push(`      ⚠ 往路フライト未登録: ${meetCtx.anchor?.name || "到着空港"}を仮到着空港として推定`);
          if (!isFirst && meetCtx.anchor?.provisional) lines.push(`      ⚠ ${meetCtx.anchor.name}を出発点として仮置き`);

          const entries = (d.entries || []).filter(en => {
            const sp = spots.find(s => s.id === en.spotId);
            return isVisitSpot(sp, isFirst, isLast);
          });
          if (entries.length === 0) {
            lines.push(`    スポットなし`);
          } else {
            entries.forEach(en => {
              const sp = spots.find(s => s.id === en.spotId);
              if (!sp) { lines.push(`    (不明スポット: ${en.spotId})`); return; }
              const travelMin = estimateTravel(prevSpot, sp, defTravel);
              t += travelMin;
              const stay = getStayMin(sp, d);
              const isOver   = t >= endT;
              const willOver = !isOver && (t + stay > endT);
              const warn = isOver ? " ⚠超過" : (willOver ? " ⚠終了時刻を超えます" : "");
              lines.push(`    ${m2t(t)} 【移動${travelMin}分→】${sp.name}（滞在${stay}分）${warn}`);
              t += stay;
              prevSpot = sp;
            });
          }

          // 解散 or ホテル
          const dismissName = isLast ? (dismissCtx.anchor?.name || sched.tripDismissPlace || "解散場所") : (dismissCtx.anchor?.name || "ホテル");
          const finalTravel = estimateTravel(prevSpot, dismissCtx.anchor, defTravel);
          t += finalTravel;
          const dismissOver = t > endT ? ` ⚠${m2dur(t - endT)}超過` : "";
          lines.push(`    ${m2t(t)} 【${isLast ? "解散" : "ホテル到着"}】${dismissName}【移動${finalTravel}分】${dismissOver}`);
          if (dismissCtx.provisional) lines.push(`      ⚠ 復路フライト未登録: 解散時刻 ${sched.tripDismissTime || "18:00"} を仮の出発時刻として、${m2t(endT)}までを配置上限にしています`);
          if (!isLast && dismissCtx.anchor?.provisional) lines.push(`      ⚠ ${dismissCtx.anchor.name}を宿泊先として仮置き`);

          if (t > endT) {
            lines.push(`    → 終了時刻 ${m2t(endT)} を ${m2dur(t - endT)} 超過`);
          }

          const hotel = sched.hotels?.[d.id];
          if (hotel) lines.push(`    🏨 ${hotel.name || "(未設定)"}`);
        });

        // 未配置スポット
        const unscheduled = spots.filter(s =>
          !scheduledIds.has(s.id) &&
          s.spotCategory !== "hotel" &&
          !isMeet(s) &&
          !isDismiss(s) &&
          s.spotCategory !== "airport"
        );
        if (unscheduled.length > 0) {
          lines.push(`\n  未配置スポット（${unscheduled.length}件）:`);
          unscheduled.forEach(s => {
            const stay = getStayMin(s, null);
            lines.push(`    - ${s.name}（優先度${s.priority || 3}・滞在${stay}分）`);
          });
        } else {
          lines.push(`\n  未配置スポット: なし`);
        }
      }
    }

    const packRaw = localStorage.getItem(`${PACKING_KEY_DBG}:${activeList.id}`)
      || localStorage.getItem(PACKING_KEY_DBG);
    if (packRaw) {
      const packing = JSON.parse(packRaw);
      const itemCount = packing.reduce((n, g) => n + (g.items || []).length, 0);
      lines.push(`\n[持ち物] グループ${packing.length}個・アイテム${itemCount}件`);
    }
  } catch (e) {
    lines.push(`[エラー] ${e.message}`);
  }
  return lines.join("\n");
}

if (window.__SETTINGS_TEST_MODE__) {
  window.__settingsTestApi = { buildDebugLog };
}

const generateDebugLogBtn = document.getElementById("generateDebugLogBtn");
const copyDebugLogBtn     = document.getElementById("copyDebugLogBtn");
const debugLogOutput      = document.getElementById("debugLogOutput");

generateDebugLogBtn?.addEventListener("click", () => {
  const log = buildDebugLog();
  debugLogOutput.value = log;
  debugLogOutput.style.display = "block";
  copyDebugLogBtn.style.display = "inline-flex";
});

copyDebugLogBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(debugLogOutput.value);
    const orig = copyDebugLogBtn.textContent;
    copyDebugLogBtn.textContent = "コピーしました！";
    setTimeout(() => { copyDebugLogBtn.textContent = orig; }, 2000);
  } catch {
    debugLogOutput.select();
    document.execCommand("copy");
  }
});
