// calendar.js — カスタム日付ピッカー
// <input type="date" data-cal> に付けると自動でカスタムピッカーに変換する。
// 設定の calendarStyle ("standard" / "cute" / "minimal") で外観が変わる。

(function () {
  const SETTINGS_KEY = "spot-map-settings.v1";

  function getCalStyle() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").calendarStyle || "standard";
    } catch { return "standard"; }
  }

  const MONTH_NAMES = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const DOW_NAMES   = ["月","火","水","木","金","土","日"];

  function formatDisplay(val) {
    if (!val) return "";
    const d = new Date(val + "T00:00:00");
    if (isNaN(d)) return val;
    const dows = ["日","月","火","水","木","金","土"];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dows[d.getDay()]}）`;
  }

  function closeAllPopups() {
    document.querySelectorAll(".cal-popup--open").forEach(p => p.classList.remove("cal-popup--open"));
  }

  function positionPopup(popup, anchor) {
    const rect = anchor.getBoundingClientRect();
    const popW = 308;
    const popH = 320;
    let left = rect.left;
    let top  = rect.bottom + 6;

    if (left + popW > window.innerWidth - 8)  left = window.innerWidth - popW - 8;
    if (left < 8) left = 8;
    if (top + popH > window.innerHeight - 8)  top  = rect.top - popH - 6;
    if (top < 8) top = 8;

    popup.style.left = `${left}px`;
    popup.style.top  = `${top}px`;
  }

  function createPopup(hiddenInput, displayBtn) {
    const today = new Date();
    let year, month;

    function syncFromInput() {
      if (hiddenInput.value) {
        const d = new Date(hiddenInput.value + "T00:00:00");
        year  = d.getFullYear();
        month = d.getMonth();
      } else {
        year  = today.getFullYear();
        month = today.getMonth();
      }
    }
    syncFromInput();

    const popup = document.createElement("div");
    popup.className = `cal-popup cal-style-${getCalStyle()}`;
    document.body.appendChild(popup);

    function render() {
      const selVal  = hiddenInput.value;
      const selDate = selVal ? new Date(selVal + "T00:00:00") : null;
      const daysInMonth    = new Date(year, month + 1, 0).getDate();
      const firstDow       = new Date(year, month, 1).getDay();
      const adjustedFirst  = (firstDow + 6) % 7; // 0=月

      let html = `
        <div class="cal-header">
          <button type="button" class="cal-nav-btn" data-dir="prev">‹</button>
          <span class="cal-month-label">${year}年 ${MONTH_NAMES[month]}</span>
          <button type="button" class="cal-nav-btn" data-dir="next">›</button>
        </div>
        <div class="cal-grid">
          ${DOW_NAMES.map(d => `<div class="cal-dow">${d}</div>`).join("")}
      `;

      for (let i = 0; i < adjustedFirst; i++) {
        html += `<div class="cal-cell cal-cell--empty"></div>`;
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr  = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const isToday  = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        const isSel    = selDate && selDate.getFullYear() === year && selDate.getMonth() === month && selDate.getDate() === day;
        const dow      = (adjustedFirst + day - 1) % 7;
        const isSat    = dow === 5;
        const isSun    = dow === 6;

        let cls = "cal-cell";
        if (isToday) cls += " cal-cell--today";
        if (isSel)   cls += " cal-cell--selected";
        if (isSat)   cls += " cal-cell--sat";
        if (isSun)   cls += " cal-cell--sun";

        html += `<div class="${cls}" data-date="${dateStr}">${day}</div>`;
      }

      html += "</div>";
      popup.innerHTML = html;

      popup.querySelectorAll(".cal-nav-btn").forEach(btn => {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          if (btn.dataset.dir === "prev") {
            month--;
            if (month < 0) { month = 11; year--; }
          } else {
            month++;
            if (month > 11) { month = 0; year++; }
          }
          render();
        });
      });

      popup.querySelectorAll(".cal-cell[data-date]").forEach(cell => {
        cell.addEventListener("click", e => {
          e.stopPropagation();
          hiddenInput.value = cell.dataset.date;
          hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
          displayBtn.querySelector(".cal-display-text").textContent = formatDisplay(cell.dataset.date);
          popup.classList.remove("cal-popup--open");
        });
      });
    }

    render();

    // ピッカー外クリックで閉じる
    document.addEventListener("click", e => {
      if (!popup.contains(e.target) && e.target !== displayBtn) {
        popup.classList.remove("cal-popup--open");
      }
    }, true);

    // 外部から hidden input が変更された場合に月を同期
    hiddenInput.addEventListener("change", () => {
      syncFromInput();
      displayBtn.querySelector(".cal-display-text").textContent = formatDisplay(hiddenInput.value);
    });

    return popup;
  }

  function wrapDateInput(hiddenInput) {
    hiddenInput.style.display = "none";

    const wrapper = document.createElement("div");
    wrapper.className = "cal-wrapper";
    hiddenInput.parentNode.insertBefore(wrapper, hiddenInput);
    wrapper.appendChild(hiddenInput);

    const displayBtn = document.createElement("button");
    displayBtn.type = "button";
    displayBtn.className = "cal-display";
    const labelTxt = formatDisplay(hiddenInput.value) || "日付を選択";
    displayBtn.innerHTML = `<span class="cal-display-text">${labelTxt}</span><span class="cal-icon">📅</span>`;

    // 元の input の class と style を引き継ぐ
    if (hiddenInput.classList.contains("trip-date-input") || hiddenInput.classList.contains("hotel-input")) {
      displayBtn.style.width = "100%";
    }
    wrapper.appendChild(displayBtn);

    const popup = createPopup(hiddenInput, displayBtn);

    displayBtn.addEventListener("click", e => {
      e.stopPropagation();
      const wasOpen = popup.classList.contains("cal-popup--open");
      closeAllPopups();
      if (!wasOpen) {
        popup.classList.add("cal-popup--open");
        positionPopup(popup, displayBtn);
      }
    });
  }

  function initDatePickers() {
    document.querySelectorAll("input[data-cal]").forEach(input => wrapDateInput(input));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDatePickers);
  } else {
    initDatePickers();
  }

  function updateDisplay(inputEl) {
    const wrap = inputEl.closest?.(".cal-wrapper");
    const txt  = wrap?.querySelector(".cal-display-text");
    if (txt) txt.textContent = formatDisplay(inputEl.value) || "日付を選択";
  }

  window.CalendarPicker = { init: initDatePickers, updateDisplay };
})();
