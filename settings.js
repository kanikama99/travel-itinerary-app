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
  localStorage.clear();
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
const SCHEDULE_KEY_DBG = "trip-schedule.v1";
const PACKING_KEY_DBG  = "trip-packing.v1";

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
      lines.push(`  ${i + 1}. [${cat}] ${s.name} / ${pri} / ${stay} / ${coords}`);
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

        // タイムライン計算用ヘルパー
        const t2m = str => { const [h, m] = (str || "0:0").split(":").map(Number); return h * 60 + m; };
        const m2t = min => `${String(Math.floor(Math.abs(min) / 60)).padStart(2, "0")}:${String(Math.abs(min) % 60).padStart(2, "0")}`;
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

        const scheduledIds = new Set();
        days.forEach(d => (d.entries || []).forEach(en => scheduledIds.add(en.spotId)));

        days.forEach((d, di) => {
          const isFirst = di === 0;
          const isLast  = di === days.length - 1;
          const startStr = isFirst ? (sched.tripMeetTime || "09:00") : (d.startTime || "09:00");
          const endStr   = isLast  ? (sched.tripDismissTime || "18:00") : (d.endTime || "21:00");
          const endT = t2m(endStr);
          let t = t2m(startStr);

          lines.push(`\n  Day${di + 1} (${d.date || "日付未設定"}) ${startStr}〜${endStr}`);
          const entries = d.entries || [];
          if (entries.length === 0) {
            lines.push(`    (スポットなし)`);
          } else {
            entries.forEach(en => {
              const sp = spots.find(s => s.id === en.spotId);
              if (!sp) { lines.push(`    (不明スポット: ${en.spotId})`); return; }
              const stay = getStayMin(sp, d);
              const timeStr = m2t(t);
              const isOver    = t >= endT;
              const willOver  = !isOver && (t + stay > endT);
              const marker = isOver ? " ← ⚠赤字（終了時刻超過）" : (willOver ? " ← ⚠赤字（終了時刻を超えます）" : "");
              lines.push(`    ${timeStr} ${sp.name}（${stay}分）${marker}`);
              t += stay;
            });
            if (t > endT) {
              lines.push(`    ⚠ 合計終了見込み ${m2t(t)}（終了時刻 ${endStr} を ${m2t(t - endT)} 超過）`);
            }
          }
          const hotel = sched.hotels?.[d.id];
          if (hotel) lines.push(`    🏨 ホテル: ${hotel.name || "(未設定)"}`);
        });

        // 未配置スポット
        const unscheduled = spots.filter(s =>
          !scheduledIds.has(s.id) &&
          s.spotCategory !== "hotel" &&
          s.spotCategory !== "meet" &&
          s.spotCategory !== "dismiss" &&
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

    const packRaw = localStorage.getItem(PACKING_KEY_DBG);
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
