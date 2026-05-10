# AI_HANDOFF.md

Shared notes for Claude / Codex agents working on this repo.

## Working Rules

- Read this file before starting work, and update it before finishing.
- Do not revert user changes or other agent changes unless the user explicitly asks.
- After editing files with Japanese text, check for mojibake in both source search and the in-app browser.
- For mojibake checks, use the pattern documented in `AGENTS.md`.

## Map Label Caution

- Spot label placement is handled by `chooseLabelPlacements()` in `app.js` using actual Leaflet layer coordinates.
- Do not hard-code all labels to one direction.
- Do not add `overflow-wrap: anywhere` to `.spot-label` or schedule SPOTS names.
- Keep `spot-label` horizontal: `white-space: nowrap`, `word-break: keep-all`, `writing-mode: horizontal-tb`.
- `chooseLabelPlacements()` must return `rect`; overview cluster labels use those occupied rects.

## Recent Work Log

### 2026-05-10 Codex print toolbar usability pass

- Updated `print.html` print-page controls into a grouped sticky toolbar.
  - Top row now separates output, add actions, and map style.
  - Selection tools now live in a dedicated selected-item toolbar; cover/back-cover layers show rotation/color/font/z-order/delete controls, while normal print elements show only scale/reset controls.
  - Page navigation and page-order chips are grouped below the main toolbar.
  - The hidden list remains beside the preview, with the same drag/click restore behavior.
- Improved selection sync in `print.html`.
  - Toolbar state is restored after re-rendering, cleared when clicking blank preview space, and cleared when moving to a page that does not contain the selected item.
  - Text layer insertion no longer assumes the back cover is the sixth page; it uses the current page id and moves to the edited cover/back-cover page.
- Checks: `print.html` inline script parsed with `vm.Script`; touched-file mojibake scan returned no matches; local HTTP 200 confirmed for `print.html`.
- Browser Use could not connect to the in-app browser backend in this session, and local Playwright is not installed, so visual browser confirmation is still recommended when available.

### 2026-05-10 Codex remove manual debug log UI

- Removed the settings-page "AIに現状を伝える" section from `settings.html`.
- Removed the now-unused manual debug log generator from `settings.js`.
- Deleted `tests/settings_debug_log.test.mjs`; auto-placement diagnostics are now written automatically to `debug_logs/` via `schedule.html` / `server.py`.
- Checks: `node --check settings.js`, `schedule.html` inline `vm.Script`, `node tests/schedule_auto_place.test.mjs`, touched-file mojibake scan, and local HTTP 200 for `settings.html`.

### 2026-05-10 Codex auto-placement trace and route-cache guard

- Updated `schedule.html`.
  - Auto-placement cleanup is now reusable as `enforceAutoPlacementCapacity()`.
  - After route cache updates, auto-generated schedules are rechecked and the last overflowing spot is removed if the real/estimated route duration makes hotel/airport arrival exceed the effective end time.
  - Auto-placement writes a trace via `saveAutoPlacementTrace()` after initial placement and after route-cache updates. The trace also stays in localStorage key `spot-map-last-auto-placement-trace.v1`.
  - Trace includes input/effective windows, meet/dismiss anchors, entries, travel durations, provisional flights, airport stays, overflow/check-in flags, removed spots, and route updates.
- Updated `server.py`.
  - Added `POST /api/debug-trace`, writing recent trace files under `debug_logs/` and keeping the newest 20 per list/kind.
- Expanded `tests/schedule_auto_place.test.mjs` with a route-cache update scenario where a later long final leg forces a spot removal.
- Checks: `node tests/schedule_auto_place.test.mjs`, `node tests/settings_debug_log.test.mjs`, schedule inline `vm.Script`, `server.py` AST parse, `node --check tests/schedule_auto_place.test.mjs`, and added-line mojibake scan.

### 2026-05-10 Codex debug log provisional context

- Updated `settings.js` debug log generation for "AIに現状を伝える".
  - Spot rows now include roles, airportId/IATA, and sourceType.
  - Schedule log now reports registered flights, or that airport meet/dismiss will use provisional flights when no flight is saved.
  - Day logs now include effective placement windows after considering inbound arrival, return check-in limits, provisional hotels, and provisional airports.
  - Unscheduled spot filtering now uses meet/dismiss roles instead of only spot categories.
- Added `tests/settings_debug_log.test.mjs` to verify that a multi-day airport trip with no saved flights logs provisional inbound/outbound context, provisional hotel area, effective placement window, airport IDs, and no false unscheduled spots.
- Checks: `node tests/settings_debug_log.test.mjs`, `node tests/schedule_auto_place.test.mjs`, `node --check settings.js`, `node --check tests/settings_debug_log.test.mjs`, touched-file mojibake scan, and local HTTP 200 for `settings.html`.

### 2026-05-10 Codex schedule auto-placement constraints

- Updated `schedule.html` auto-placement and timeline generation.
  - Added `parseClockMinutes()` so missing flight times are not treated as `00:00` in airport auto-placement contexts.
  - First-day airport meet no longer rewrites the user's trip start time to a derived check-in time.
  - After an inbound flight, sightseeing starts at the later of the user start time and the flight arrival time.
  - Airport meet/dismiss time semantics are now explained in the trip settings card.
  - Auto-placement core was factored into `runAutoPlacement()` and exposed only under `window.__SCHEDULE_TEST_MODE__`.
- Added `tests/schedule_auto_place.test.mjs`.
  - Covers domestic day trip, short day overflow skipping, registered inbound flight, explicit late start after arrival, registered return flight check-in limit, business-hour skipping, and multi-day provisional airport flights.
- Checks: `node tests/schedule_auto_place.test.mjs`, `node --check tests/schedule_auto_place.test.mjs`, `node --check app.js`, `schedule.html` inline script `vm.Script`, touched-file mojibake scan, and local HTTP 200 for `schedule.html`.

### 2026-05-06 Codex airport stay/check-in linkage

- Updated airport spot handling in `spots.html`, `app.js`, `schedule.html`, and `styles.css`.
  - Airport spot stay time is now read-only in the spot menu with a note explaining that it is the time between takeoff and scheduled check-in.
  - Airport check-in offset defaults to 90 minutes, and when takeoff is present with no explicit check-in time, check-in is filled as takeoff minus 90 minutes.
  - Saving an airport stores `defaultStayMinutes` from takeoff/check-in, and schedule airport-stay rows use that same derived duration.
  - Schedule-side airport stay inputs for return-flight rows are disabled because they are now derived from the airport spot settings.
- Checks: `spots.html` and `schedule.html` inline scripts parse OK; `app.js` parses OK; mojibake scan OK for touched files.

### 2026-05-06 Codex mobile area suggestions

- Updated the mobile layout for the "エリアからキーワードを提案" panel on `spots.html`.
  - `styles.css` now stacks suggestion-card actions vertically below 640px and lets the page scroll naturally instead of using a nested result scroller.
  - `app.js` shortens the fill button label to "追加欄に入力" while keeping the full text in the button title.
- Checks: `spots.html` inline script and `app.js` parse OK; mojibake scan OK for `spots.html`, `app.js`, and `styles.css`; Browser Use screenshot on `spots.html` showed the mobile-style panel without console errors.

### 2026-05-06 Codex sandbox auto-push rule

- Updated `AGENTS.md` and `CLAUDE.md` so AI agents may automatically commit and push completed, checked work on the `sandbox` branch without asking for extra approval every time.
- Other branches still require explicit user approval for commit/push unless the user says otherwise.
- `.gitignore` contains `.env` and `__pycache__/`; it should be tracked because it defines repo-wide ignore rules.

### 2026-05-06 Codex schedule airport auto-placement

- Updated `schedule.html` auto-placement for return flights.
  - Final-day candidate capacity now uses the earlier of trip end, return-flight airport stay start, and airport check-in deadline.
  - Final-day auto-placement estimates the last leg to the return flight departure airport/trip-side airport instead of the home dismiss airport.
  - Post-placement cleanup removes the last spot when the generated dismiss step exceeds the end/check-in limit.
- Checks: `schedule.html` inline script syntax OK; mojibake scan OK for `schedule.html`.

### 2026-05-06 Codex branch workflow notes

- Added the same "Branch sync workflow for AI agents" section to `AGENTS.md` and `CLAUDE.md`.
- The rule covers Codex, Claude Code, Codespaces, and local PC work:
  check branch/status first, pull only on a clean worktree, avoid direct `develop` pushes, ask before stash/merge/reset, and pull --ff-only before pushing.
- Existing mojibake remains in both instruction files; only a small ASCII section was added to avoid broad risky rewrites.

### 2026-05-06 Codex airport schedule follow-up

- Updated `schedule.html` airport handling for cross-border trips.
  - Arrival airport rows no longer prepend the label "到着空港".
  - Meet-side airport stay can be edited with the same compact minutes input used for dismiss-side airport stay.
  - Airport stay inputs are constrained so the minutes unit stays on the same line.
  - Non-role airport spots are excluded from SPOTS sidebar auto-placement and normal visit routing; they are used as implicit trip-side flight/ground anchors instead.
  - First/last day route prefetch and final-day reverse start calculation now use the trip-side airport when a flight endpoint is missing.
- Checks: `schedule.html` inline script syntax OK. Browser Use verification was attempted but the in-app browser automation quota was unavailable in this session.

### 2026-05-01 Codex local area suggestions

- Retired the gourmet page as an active workflow.
  - Removed gourmet links from page navigation/drawers.
  - `gourmet.html` now redirects to `spots.html`.
  - Schedule now advances directly to the packing checklist; checklist back goes to schedule.
- Added `local_area_suggestions.js` with 47-prefecture local suggestions.
  - Each prefecture has local foods and tourist spots.
  - `spots.html` loads this before `app.js`.
- Reworked the `spots.html` area suggestion flow in `app.js`.
  - No Nominatim / Overpass / Wikidata network search is used for area suggestions.
  - Suggestions are returned immediately from the local table.
  - Default suggestion count is 10.
  - Food suggestions are added as coordinate-less restaurant/category entries; tourist suggestions are coordinate-less tourist entries.
  - Coordinate-less suggestions are deduplicated by name and can be adjusted later from the spot menu.
- Removed the unused `/api/gourmet-suggestions` handler from `server.py`.
- Removed the area suggestion timeout setting because local suggestions no longer need a network timeout.
- Checks: JS syntax OK, `server.py` AST parse OK, mojibake scan OK, HTTP 200 for `spots.html`, `local_area_suggestions.js`, `gourmet.html`, `schedule.html`, and `checklist.html`.

### 2026-05-01 Codex latest

- Answered the store-listing concern by keeping gourmet suggestions to names/search links and avoiding copied photos/reviews/descriptions.
- Updated `gourmet.html` and `server.py`.
  - Added a 47-prefecture hidden gourmet seed table.
  - Added `/api/gourmet-suggestions`; when Google Places API is available, it returns real store candidates with Google Maps attribution text.
  - Fallback remains local search candidates so minor prefectures no longer go blank.
- Updated map pin/label behavior in `app.js`, `print.html`, and `styles.css`.
  - Pins now use emoji-style icons instead of kanji labels.
  - Label placement only accepts non-overlapping candidates; if no safe label position exists, the marker remains and the label is omitted.
  - Added longer connector distances for speech-bubble labels.
- Added budget display setting in `settings.html` / `settings.js`; `app.js`, `schedule.html`, `hotel.html`, `tour.html`, `flight.html`, and `theme.js` hide budget UI/summary when disabled without deleting saved amounts.
- Added the non-overlap rule to `AGENTS.md`.
- Checks: JS inline/script syntax OK; `server.py` AST parse OK; mojibake scan OK for touched app files; server restarted but live Places call returned 502 in this environment, so fallback behavior is important.

### 2026-05-01 Codex follow-up

- Changed map tooltip styling in `styles.css` so spot labels use a connected speech-bubble neck instead of a diamond pointer.
- Updated `schedule.html`.
  - SPOTS chips no longer open the day picker popup on click; users should drag/drop to schedule.
  - The plus icon on SPOTS chips was replaced with a drag-grip icon.
  - Auto-placement skipped spots are shown as a red warning in the SPOTS sidebar.
- Updated `gourmet.html`.
  - Added Miyazaki actual-shop candidates, including chicken nanban and local chicken options.
- Updated `checklist.html`.
  - Merged old `旅行` / `旅行先` category names into `旅先`.
- Updated `print.html`.
  - Conditional packing groups are hidden from print output.

### 2026-05-01 Codex update

- Rebuilt `gourmet.html` with clean Japanese text and a curated actual-shop candidate table.
  - Osaka, Tokyo, Kyoto, Fukuoka, Nagoya, and Sapporo now show concrete shop names instead of generic search phrases.
  - Shop names still link to Google search for current confirmation.
- Fixed `checklist.html` delete behavior.
  - Default items are no longer re-added immediately after deletion.
  - Deleted item names are tracked in `trip-packing-deleted.v1`.
- Rebuilt `print.html` with clean Japanese text.
  - Business hours are summarized into compact chips such as all days / day ranges.
  - Added per-spot hide/show controls for the spot photo/introduction section.
  - Schedule day headers now include weekdays, for example `[1日目] 5/2(土)`.
- Verified scripts with `new Function(...)`.
- Browser checks passed for `checklist.html` and `print.html`: no mojibake and no page errors.

### 2026-05-01 Codex

- Updated spot menu business-hours controls in `spots.html`, `styles.css`, and `app.js`.
  - Replaced the awkward checkbox/label layout with clearer card-like switch controls.
  - Weekly day rows are hidden unless weekly mode is enabled.
- Fixed print-page map rendering in `print.html`.
  - Corrected the Leaflet CSS integrity hash; the previous typo could block Leaflet CSS and make tiles appear grey/misaligned.
  - Map initialization now waits until the generated card is in the DOM, then invalidates size and refits bounds.
- Updated packing list behavior in `checklist.html`.
  - Added default items: license, nail clipper, tissues, razor.
  - Added overseas/country-based suggestions: security pouch, overseas SIM, local currency, conversion plug.
  - Country rules are currently a static table in `COUNTRY_RULES`.
  - Delete controls are now trash icon buttons.
- Updated `print.html` packing list rendering so default packing additions are merged even if saved packing data already exists.
- Browser checks passed for:
  - `checklist.html`: no mojibake, requested packing items visible, trash delete button present.
  - `print.html`: no mojibake, requested packing items visible, no print-page Leaflet/CSS integrity errors.

### 2026-05-03 Claude ナビ統一・tripplan新規作成・削除確認・背表紙

- 新ページ `tripplan.html`（旅行計画）を作成。目的地・日程・人数・予算・メモの入力フォームとやりたいこと/食べたいもの等のウィッシュリストを含む。データは `trip-basic-plan.v1` に保存。
- 全ページのナビゲーションボタンを「← ページ名」「ページ名 →」形式に統一。`styles.css` に `.page-nav-bar` / `.page-nav-bar-btn--prev` / `.page-nav-bar-btn--next` を追加（sticky / top:0）。
- ページフローを spots → tripplan → schedule に変更。spots.html の次ボタン先を tripplan.html に更新。schedule.html の前ボタン先を tripplan.html に更新。
- 全ページのドロワーナビに「旅行計画」（tripplan.html）を追加。
- スポットメニューのゴミ箱ボタンを上部（`.spot-menu-top-bar`）に移動し、初回クリックで `#spotDeleteConfirm` 確認ダイアログを表示してから削除する二段式に変更（`app.js`）。
- `print.html` に「背表紙写真を選択」ボタン (`#backCoverPhotoBtn`) を追加。背表紙は `cover.backCoverImage` に保存し、しおりの最終ページとして `.back-cover` セクションを出力。

### 2026-05-03 Claude ナビボタン色統一・スポット設定ページ・削除ボタン移動・印刷マップスタイル・ホテル時刻修正

- **ナビボタン色統一** — `styles.css` の `.page-nav-bar-btn--prev` を `--next` と同じアクセントグラデーションに変更。戻るボタンも進むボタンも同色になった。
- **ゴミ箱ボタン移動** — `spots.html` のスポットメニューで `.spot-menu-top-bar` を廃止し、`#spotDeleteButton` を `.spot-menu-head-actions` 内の保存・閉じるボタン左に移動。確認ダイアログ `#spotDeleteConfirm` は `spot-menu-head` の直後に配置。
- **旅行計画ページ再設計** — `tripplan.html` を「スポット設定」ページとして全面書き直し。概要フォーム・ウィッシュリストを廃止し、スポット一覧を展開表示（優先度・滞在時間・営業時間・予算・メモ）。変更は即時保存（`spot-map-lists.v1` に書き込み）。ホテルスポット（sourceType あり）は一覧から除外。曜日別営業時間はスポットメニューへ案内する旨を明記。
- **印刷ページ地図スタイル** — `print.html` のツールバーに `<select id="printMapStyleSelect">` を追加。OSM Bright / OSM スタンダード / CartoDB Light / CartoDB Dark / 衛星写真を選択でき、`spot-map-settings.v1` に保存して即再描画。
- **ホテルページ時刻入力修正** — `hotel.html` のチェックイン・チェックアウト予定時刻の `step="300"` を `step="900"`（15分刻み）に変更。`.hotel-night-form--booking` のレスポンシブCSS（600px以下: 2カラム、601-760px: 3カラム）を追加してカレンダーアイコンと時刻入力の重複を解消。
- **スケジュール自動配置からホテル除外** — `schedule.html` の自動配置ボタン処理で `s.spotCategory !== "hotel"` フィルタを追加。ホテルスポットは自動配置の対象外になった。

### 2026-05-04 Claude スケジュール改善・旅行計画リンク

- **旅行計画 (`tripplan.html`)**: スポット名を `./spots.html?editSpot=SPOT_ID` へのリンクに変更（`.spotset-name-link` スタイル追加）。
- **Trip Period アイコン修正**: 集合 `🏁→🤝`、解散 `🏁→👋`。
- **⋯ ボタン削除**: `#tripMeetSpotMenuBtn` / `#tripDismissSpotMenuBtn` をHTMLから削除。`renderTripPlaceSelects` の menuBtn 参照も削除。CSS の `.trip-place-menu-btn` も削除。
- **「または」追加**: 集合・解散それぞれの `.trip-place-controls`（ドロップダウン）と `.trip-place-add-row`（手動入力）の間に `<p class="trip-place-or">または</p>` を挿入。
- **予算合計クリックで内訳ポップアップ**: `updateTripSummary` で `el.innerHTML` に切り替えて `#tripBudgetBtn`（`.trip-budget-link`）を埋め込み。`showBudgetBreakdown()` を追加。`#budgetBreakdownOverlay` ポップアップ HTML・CSS を追加。
- **SPOTS サイドバーからホテル除外**: `renderUnscheduled` の `unscheduled` フィルタと `schedulableSpots` フィルタに `s.spotCategory !== "hotel"` を追加。
- **ホテルタイムライン行の再設計**: 単一ボタン→「名前ボタン（`openScheduleSpotMenu`）＋変更ボタン（`hotel.html`）」の2ボタン構成に変更。`.tl-hotel-row` / `.tl-hotel-name-btn` / `.tl-hotel-change-btn` CSS を追加。ホテル名未登録時は名前ボタンを disabled 表示。
- チェック: JS構文OK（schedule.html / tripplan.html）。

### 2026-05-04 Claude ページ統一・優先順位入力リネーム・スケジュール移動時間

- **「旅行計画」→「優先順位入力」** に全ファイルでリネーム（tripplan.html のタイトル・h1・ドロワー、spots/schedule/checklist/print のナビボタン・ドロワー、flight/hotel/howto/settings/tour のドロワー）。
- **ヒーローブロック統一** — `schedule.html` / `checklist.html` / `print.html` のヘッダーを `spots.html` と同じ `.hero > .hero-copy-wrap` 形式に変更。`schedule.html` の古い `.schedule-header` / `.schedule-eyebrow` / `.schedule-title` CSS を削除。`.schedule-list-badge` は hero-copy-wrap 内に移動。
- **プログレスステップ** — `styles.css` に `.progress-steps` / `.progress-step` / `.progress-step--current` / `.progress-sep` を追加。5ページ（行きたい場所①〜印刷する⑤）の hero ブロック内に `<nav class="progress-steps">` を追加。現在ページは赤太字、他はリンク。
- **移動時間はスケジュールページに移動予定** — 旅行計画（tripplan.html）から移動時間コードを削除。スケジュール画面での移動時間入力は未実装。
- チェック: JS構文OK（tripplan.html / schedule.html）。全ファイルから「旅行計画」文字列なし確認。

### 2026-05-04 Claude 旅行計画ページ改善・スポットメニューiframe化

- **スポットメニューをiframeオーバーレイに変更**（`tripplan.html`）
  - スポット名のリンク（`<a href="./spots.html?editSpot=...">`）を廃止。
  - `<button class="spotset-name-btn">` に変更し、クリックで `openSpotMenu(spotId)` を呼ぶ。
  - `schedule.html` と同じ `#sharedSpotMenuOverlay` / `#sharedSpotMenuFrame` パターンを実装。
  - `spot-menu-saved` / `spot-menu-closed` postMessage 受信で閉じて `renderSpots()` を再実行。
  - `CLAUDE.md` にスポットメニューはiframe方式のルールを追記（再発防止）。
- **滞在時間の placeholder 削除**（`tripplan.html`）
  - 時間・分入力から `placeholder="1"` / `placeholder="0"` を削除。
- **空港スポット除外**（`tripplan.html`）
  - `spotCategory === "airport"` のスポットを旅行計画ページに表示しないようフィルタ追加。
- **空港「XX分前」placeholder 削除**（`spots.html`）
  - `spotAirportCheckinOffset` の `placeholder="90"` を削除。
- **スポット間の移動時間・移動メモ**（`tripplan.html`）
  - 各スポットカード間に `.spotset-travel-section` を追加。
  - 🗺 経路ボタン（Google Maps `dir/?api=1` URL）、移動時間（時間＋分）、移動メモ textarea。
  - 移動データは `spot.travelToNextMinutes` / `spot.travelToNextMemo` に保存（`spot-map-lists.v1`）。
- チェック: JS構文OK（`tripplan.html`）。

### 2026-05-04 Claude 自動配置終了時刻超過防止・持ち物グループ追加修正

- **自動配置の終了時刻超過防止** (`schedule.html`)
  - `pickAutoPlaceDay` のフォールバック（`fallbackIndex % totalDays`）を廃止し、候補ゼロ時は `null` を返すよう変更。
  - `autoPlaceBtn` の forEach で `dayIdx === null` のスポットは `autoPlaceSkippedNames` に追加してスキップ。
  - 開館時間が一致しないスポット等、どの日にも入れないスポットが誤って配置されなくなった。
- **持ち物リストのグループ追加ボタン修正** (`checklist.html`)
  - `render(d)` が `items.length > 0` のグループのみ描画していたため新規グループ（空）が即消えていた不具合を修正。
  - `d.filter(g => g.items.length > 0).forEach` → `d.forEach` に変更し全グループを表示。
  - 各グループヘッダーに「+ 追加」ボタン (`.check-add-cat-btn`) を追加し、そのグループに直接アイテムを追加できるようになった。
  - 空グループには「アイテムがありません」プレースホルダーを表示。
  - `gi` が filtered index でなく `d` の実際のインデックスを示すよう修正（drag-drop / startEditCat のインデックス不整合も解消）。

### 2026-05-04 Claude 多画面一括改修

- **自動配置：優先度順配置** (`schedule.html`)
  - `others` の forEach 前に `sort((a,b) => (a.priority||3)-(b.priority||3))` を追加。優先度1から配置される。
- **自動配置：終了時刻超過（ホテル到着）修正** (`schedule.html`)
  - ポスト処理を while ループに変更。dismiss step の overflow が true のとき最後のスポットをスキップリストに追加してから再実行。21:00設定で21:28表示になっていた問題を解消。
- **持ち物リスト：グループ削除ボタン** (`checklist.html`)
  - 各グループヘッダーにゴミ箱ボタンを追加。確認ダイアログ後に `d.splice(gi,1)` で削除。
- **ホテル Night Registration フォーム改修** (`hotel.html`)
  - `hotelCheckinDateInput`（チェックイン日）入力欄を追加。
  - グリッドを `1fr 150px 140px 130px 130px` → `1fr 1fr` (3行×2列) に変更。
  - 並び順: [ホテル名][予約金額] / [チェックイン日][チェックイン時刻] / [チェックアウト日][チェックアウト時刻]
  - `refreshNightDateLabel` でチェックイン日入力値も参照。保存時も `selectedCheckin` を使用。
- **設定ページ改修** (`settings.html`, `settings.js`, `styles.css`)
  - 営業時間・表示項目セクションのチェックボックスをコンパクト化（panel-head削除、`.settings-check-row` 方式）。
  - 設定保存時に `✓ 設定を保存しました！` 緑色フラッシュ表示（3秒後に元テキストに戻る）。
  - 前のページへ戻るボタン: `document.referrer` が同一オリジンの場合にのみ表示（history.back()）。
- **デバッグログ機能** (`settings.html`, `settings.js`)
  - 設定ページに「AIに現状を伝える」セクション追加。
  - 「デバッグログを生成」ボタンでアクティブリスト・スポット一覧・スケジュール・ホテル・持ち物件数を整形テキスト出力。
  - 「クリップボードにコピー」ボタンでそのままAIへ貼り付け可能。

### 2026-05-05 Claude デバッグログ強化・初日終了/最終日終了時刻を各日カードに追加

- **デバッグログ強化** (`settings.js`)
  - `buildDebugLog()` を全面改修。各日のスケジュールをタイムライン形式で出力。
  - 各スポットに推定開始時刻を付与（初日は`tripMeetTime`基点、最終日は`tripDismissTime`を終了として判定）。
  - 終了時刻を超過するスポットに `← ⚠赤字（終了時刻超過）` / `← ⚠赤字（終了時刻を超えます）` マーカーを表示。
  - 日ごとの超過量（例: 終了時刻 18:00 を 00:28 超過）を末尾に表示。
  - 未配置スポット一覧（優先度・滞在時間付き）を追加。
- **初日開始時刻・最終日終了時刻を各日カードで設定可能に** (`schedule.html`)
  - `renderDayCard` の時刻行を全日表示に変更（従来: 初日は「終了」のみ、最終日は「開始」のみ、1日旅行は非表示）。
  - 初日「開始」欄 → `schedule.tripMeetTime` と連動（変更で上部の集合時刻欄も同期）。
  - 最終日「終了」欄 → `schedule.tripDismissTime` と連動（変更で上部の解散時刻欄も同期）。
  - 1日旅行でも開始・終了両方の時刻を編集できるようになった。

### 2026-05-05 Claude 多項目改修

**行きたい場所 (spots.html / app.js / styles.css)**
- **同名スポット重複警告**: `saveLocation()` で同名スポットが既存にあれば confirm ダイアログを表示。
- **ゴミ箱ボタン常時表示**: `spotItemTemplate` に `.spot-inline-delete` ボタンを追加。`renderSpotList()` でクリック時に削除確認を表示。
- **リスト管理ボタン削除**: `#listManageDrawerBtn` を SPOTS ブロックのボタン列から削除。`app.js` 側は null ガード追加。
- **カテゴリカスタマイズボタン**: アイコン + "カテゴリ" から、グラデーションの "カテゴリカスタマイズ" テキストボタンに変更。
- **ghost-button ボーダー色修正**: `styles.css` の `.ghost-button` の `border-color` をハードコードのオレンジから `var(--line)` に変更。カテゴリカスタマイズ閉じるボタン等がテーマ連動するようになった。
- **ラベルドラッグ機能**: 設定画面に `labelDragEnabled` トグルを追加。ONにすると地図上の吹き出しをドラッグして微調整でき、`spot.labelDeltaX`/`labelDeltaY` に保存される。`addMarkerToMap` がデルタを offset に反映。

**スケジュール (schedule.html)**
- **宿泊先未登録メッセージ**: `missingHotel` フラグを travel step に追加。`noCoords && missingHotel` の場合 "🏨 宿泊先が未登録です" を表示（従来: "📍 座標情報がないため経路を取得できません"）。
- **車アイコン連続防止**: ドライブモードの非概算ルートでは `info.segments` を表示しない（🚗→🚗→🚗 が並ぶのを防止）。
- **別日程ホテル引き継ぎ**: "変更" ボタンクリック時、他の日に登録済みホテルがあれば選択ポップオーバーを表示。選んだホテルをその日のホテルとしてコピーできる。

**設定 (settings.html / settings.js)**
- `labelDragEnabled` 設定を追加（地図吹き出しドラッグ）。

**印刷する (print.html)**
- **1ページずつ表示**: `currentPrintPage` + `goPage(n)` でページ管理。6ページ（表紙/地図/スポット/日程/持ち物/裏表紙）を前後ボタンで切り替え。
- **プレビューから編集**: 表紙ページに直接タイトル/サブタイトル入力欄・表紙写真ボタンを埋め込み。スポットページに表示切替トグルを埋め込み。ツールバーとも同期。

### 2026-05-06 Claude 大規模改修（print.html・schedule.html・新ページ）

**前セッションから継続（前セッションで実装済み）**
- `howto.html` 全面書き直し（6ステップガイド）
- `travelchecklist.html` 新規作成（⑤チェックリスト）
- `local_area_suggestions.js` にキーワード追記（北海道・青森・秋田・山形・新潟・茨城・東京）
- `spots.html` 営業時間デフォルト変更（0:00-24:00/全日共通/全曜日営業）、「曜日ごとに設定」ボタンを先頭に移動
- `app.js` に全体図クラスタの「拡大図: MAPn」ラベル表示
- `schedule.html` 集合場所→最初のスポット間の手動移動時間 (`day.meetTravelMinutes`) UI
- 全ページのプログレスステップに⑤チェックリスト追加、印刷を⑥に変更

**今セッションで実装**

**`print.html`**
- `@media print` に `.hero` を非表示追加（印刷時にヒーローブロックを消す）
- `@page { size:A4; margin:10mm }` 追加
- `.print-section { width:210mm; min-height:297mm; margin:0 auto }` でプレビューをA4サイズ化
- `@media print` で `.print-section { display:block!important; width:auto; min-height:auto; margin:0 }` リセット
- `.page { break-before:page }` で各ページを改ページ
- `sec2` からプレビュー側の `.spot-visibility-inline` 表示切替ボタンを削除
- `.visibility-panel` の `<strong>スポット写真・紹介の表示</strong>` ラベルを削除
- `scheduleRows()` にフライト情報表示追加（集合・解散空港に飛行機情報がある場合）
- `scheduleRows()` のホテルチェックアウト時刻を `h.checkoutTime` → `day.startTime` 優先に変更

**`schedule.html`**
- 解散場所が空港＋フライト登録済みの場合: 「到着→空港滞在→離陸」の3行スプリット表示
  - `generatePlan()` の `endTime` を `フライト離陸時刻 - dismissAirportStayMin` に調整
  - `dismissFlight` / `dismissAirportStayMin` を step データに追加
  - 解散行: 「🛬 着」ラベルのみ（フライトボタンは離陸行に移動）
  - 空港滞在行: 分数入力（`schedule.dismissAirportStayMin`、デフォルト90分）
  - 離陸行: フライト情報ボタン + 警告
- `.tl-airport-arrive-label` CSS 追加

### 2026-05-06 Claude スケジュール・印刷ページ改修

**スケジュールページ (schedule.html)**
- **2日目以降のホテル出発時刻**: `generatePlan` で非初日の `startTime` 計算を変更。`day.startTime` 未設定時、前泊ホテルの `checkoutTime` を使用（なければ従来通り09:00）。ホテルチェックアウト時刻が遅い場合にタイムラインが正しい出発時刻を表示する。
- **解散空港チェックイン締め切りチェック**: `getDismissAirportCheckinDeadline(dayIdx)` と `checkDismissAirportDeadline(dayIdx, spot)` を追加。最終日に解散空港＋フライト登録済みの場合、スポットをドロップまたは日程ピッカーで追加する際に締め切り超過をアラートでエラー表示。

**印刷ページ (print.html)**
- **別の場所クリックで選択解除**: `#book` に click ハンドラを追加。`.print-element` `.cover-layer` 以外をクリックすると選択解除。
- **オブジェクト分離**: 
  - 地図ページ: タイトル (`map-title` print-element) と各マップカード (`map-card-N` print-element) を分離。
  - スポット写真・紹介: タイトル (`spots-title`) と各スポット (`spot-{id}`) を別 print-element に分離。
  - 持ち物リスト: タイトル (`packing-title`) とリスト (`packing-list`) を別 print-element に分離。
- **新規ページ追加**: ツールバーに「新規ページ追加」ボタン。クリックでタイトル入力→カスタムページを追加。
- **ページ並び替え**: ツールバーにページ順序チップ列を追加。ドラッグで並び替え可能。カスタムページは×ボタンで削除。ページ順序は `cover.pageOrder`、カスタムページは `cover.customPages` に保存。

**確認したこと**
- `schedule.html` / `print.html` インラインスクリプト構文チェック OK。
- 文字化けパターン検索 OK。
- HTTP 200 確認済み。

## Next Things To Watch

### 2026-05-06 Codex 追記（営業時間・空港・チェックリスト）

**変更したファイル**
- `app.js`: スポットメニューの定休日表示を「定休日」に変更。曜日別営業時間でチェックを外した曜日を必ず `closed` として保存するよう修正。埋め込みスポットメニュー保存時に `defaultStayMinutes` を親へ通知。
- `schedule.html`: 営業時間判定で `closed` を明示的に除外。自動配置後の厳密チェックで営業時間外になったスポットをSPOTS警告へ戻す。スポットメニュー保存後に配置済みスポットの滞在時間も同期。滞在時間入力をコンパクト化。
- `flight.html`: 航空券保存時に出発空港・到着空港をどちらも空港スポットとして登録/更新し、到着空港の `arrivalSpotId` も保存。
- `checklist.html`: チェックリスト項目を同一グループ内でもドラッグ&ドロップで並べ替えられるよう修正。
- `styles.css`: ヒーローブロックの高さを揃えるため `.hero-copy-wrap` に共通最小高さを追加。営業時間切替ボタンのブロック高さをON/OFFで固定。

**確認したこと**
- `node --check app.js` OK。
- `schedule.html` / `flight.html` / `checklist.html` のインラインスクリプトを `vm.Script` で構文チェック OK。
- 触った `app.js` / `schedule.html` / `flight.html` / `checklist.html` / `styles.css` で文字化けパターン検索 OK。
- `http://127.0.0.1:8000/schedule.html` / `flight.html` / `checklist.html` は HTTP 200。

**次のAIへの注意**
- PowerShell プロファイルの conda エラーは毎回出るが、コマンド自体の終了コードと本文で判断する。
- ブラウザ操作ツールはこのターンでは見つからなかったため目視確認は未実施。可能ならスポットメニューの曜日別切替、定休日スポットの自動配置、空港フライト保存、チェックリスト並べ替えをブラウザで確認する。

### 2026-05-06 Codex 追記（追加UI・印刷表紙編集）

**変更したファイル**
- `spots.html`: 「現在選択中のリスト: リスト管理」表示を行きたい場所ページから非表示化。カテゴリ追加欄に「アイコン欄には好きな絵文字を設定できます。」の注釈を追加。
- `theme.js`: ハンバーガーメニューに「現在のしおりのページに戻る」を自動挿入する処理を追加。
- `howto.html`: 「前のページに戻る」ボタンを追加。履歴がない場合は `spots.html` へ戻る。
- `print.html`: 表紙/背表紙をレイヤー式に変更。表紙・背表紙へ画像追加、選択要素の拡大縮小/回転/前面/背面/削除に対応。タイトル/サブタイトルはプレビュー上のテキストを直接編集する方式に変更し、プレビュー内の「写真を変更」ボタンと外部テキストボックスを削除。

**確認したこと**
- `spots.html` / `print.html` / `howto.html` / `schedule.html` / `flight.html` / `checklist.html` のインラインスクリプト構文チェック OK。
- `app.js` / `theme.js` の `node --check` OK。
- 触った主要ファイルの文字化けパターン検索 OK。
- `http://127.0.0.1:8000/spots.html` / `print.html` / `howto.html` は HTTP 200。

**次のAIへの注意**
- `print.html` は既存どおり圧縮気味の単一HTML。表紙レイヤーは `trip-print-cover.v1` の `coverLayers` / `backCoverLayers` に保存される。旧 `coverImage` / `backCoverImage` は初回表示時にレイヤーへフォールバックする。
- Playwright はこの環境で利用不可、ブラウザ操作ツールも見つからなかったため、表紙レイヤー操作の目視確認は未実施。

- If the user still sees old broken map tiles, ask them to hard reload once; the bug was likely a cached copy of `print.html` with the bad Leaflet CSS integrity hash.
- If adding more country-specific packing rules, extend `COUNTRY_RULES` in `checklist.html` and keep the strings browser-verified.
- `tripplan.html` のウィッシュリストは `trip-basic-plan.v1` に保存される。印刷ページ（print.html）に未連携なので、将来的に組み込むなら render() で `trip-basic-plan.v1` を読み込む必要がある。
- ラベルドラッグはドラッグ終了後に地図を再描画するため、ズーム/パン操作のたびに offset はリセットされる（Leaflet がツールチップを再配置するため）。将来的に Leaflet の pane 座標系で管理すると安定する。
### 2026-05-06 Codex Browser Use print.html visual check

- Checked `http://127.0.0.1:8000/print.html` with Browser Use.
- No file changes besides this note.
- Current local data showed no registered spots, so map/spot/schedule preview pages showed empty-state text.
- Stepped through preview pages 1/6 to 6/6; no browser console warnings/errors were reported.
- Visual note: on the narrow in-app viewport, the packing-list preview is wider than the visible area and the rightmost category is clipped by the viewport, consistent with the A4 preview being wider than the current browser pane.

### 2026-05-06 Codex airport flight endpoint handling

- Updated `flight.html` so saved flights keep the schedule anchor spot separate from the actual flight departure/arrival airport spots.
  - Outbound meet flight: anchor/departure can both be Haneda.
  - Return dismiss flight: anchor can stay Haneda while departure can be Taoyuan and arrival can be Haneda.
  - Known airport coordinates are added for common airports including TPE so flight-created airport spots can participate in route estimates.
- Updated `schedule.html` generated plans to use flight endpoints.
  - After a registered meet flight, the next ground route starts at the arrival airport instead of the home airport.
  - For a registered dismiss flight, the final ground route goes to the flight departure airport, then shows airport stay and flight back to the dismiss anchor.
  - Return flight registration no longer defaults takeoff time to the computed airport-arrival time such as 14:43; blank unless a flight was already saved.
- Checks: inline scripts in `schedule.html` and `flight.html` passed `vm.Script`; mojibake scan for touched files passed; Browser Use loaded `schedule.html` and a sample `flight.html?role=dismiss&airport=TPE&arrivalAirport=HND...` with no console warnings/errors.

### 2026-05-06 Codex code health fixes

- Added `airports.js` as a shared airport master and loaded it from `schedule.html` / `flight.html`; both pages still have local fallback arrays.
- Updated `app.js` so airport/hotel-only spot fields are reset when a spot category changes away from those categories.
- Updated `schedule.html` so inline stay-time precedence is day override -> schedule default -> spot default, and kept the existing final-day airport check-in capacity guard.
- Scoped `checklist.html` and `travelchecklist.html` storage by active list id, with legacy global-key fallback.
- Updated `print.html` to read scoped packing data and avoid accumulating duplicate drag/drop listeners in visibility controls.
- Updated `bookmarks.html` list deletion to clean schedule, print-cover, packing, and travel-checklist data for the deleted list id.
- Updated `settings.js` saved-data deletion to remove only known app keys/prefixes instead of calling `localStorage.clear()`.
- Updated `api/resolve.js` to validate Google Maps hosts before server-side fetch; allowed `google.com`, `maps.google.com`, `goo.gl`, and `maps.app.goo.gl`.
- Checks: `node --check` passed for touched JS files; all HTML inline scripts passed `vm.Script`; touched-file mojibake scan passed; Browser Use loaded `spots.html`, `schedule.html`, `flight.html`, `print.html`, `checklist.html`, `travelchecklist.html`, `settings.html`, and `bookmarks.html` with no console errors.

### 2026-05-07 Codex airport table and local suggestion fixes

- Expanded `airports.js` into a richer local airport table with `id`, IATA, country, city, and aliases. `findTripAirport()` now resolves common aliases such as `東京国際空港`, `Tokyo Haneda Airport`, `HND`, and `airport-hnd` to `羽田空港 (HND)`.
- Updated `flight.html`.
  - Departure/arrival airport inputs now use the local airport table via datalist and validation; arbitrary airport strings are rejected before search/save.
  - Flight-created airport spots are saved with canonical airport name, `airportId`, IATA, country/city, and table coordinates.
  - Takeoff/landing times are normalized to 5-minute increments on display/save.
- Updated `spots.html` / `app.js`.
  - Airport category spot menu now has an airport-table input; saving an airport category requires a matching table airport and saves the canonical name.
  - Airport duplicate detection uses `airportId` / normalized airport aliases, preventing `羽田空港` / `東京国際空港` / `Tokyo Haneda Airport` from becoming separate airport spots.
  - Local area suggestions hide the "追加欄に入力" button for `ご当地フード`.
  - Local area suggestion names are preserved when added through the normal spot input, so `九份` is not replaced by a geocoding result such as `Jiufen`.
- Updated `schedule.html` airport add paths to save `airportId` / IATA and reject airport-category additions that are not in the airport table.
- Checks: `node --check` passed for `airports.js` and `app.js`; inline scripts for `flight.html`, `schedule.html`, `spots.html` passed `vm.Script`; touched-file mojibake scan passed; local HTTP 200 confirmed for `flight.html`, `spots.html`, and `schedule.html`.
- Browser Use could not be completed in this run because the Codex app reported a usage-limit rejection. If available later, visually confirm `flight.html` datalist/time controls and `spots.html` local suggestions.

### 2026-05-06 Codex airport UX follow-up

- Updated `schedule.html` again for airport trip planning.
  - Trip meet/dismiss text inputs now show local suggestions immediately from registered spots and known airports, then append Nominatim results if available.
  - Typing examples like `羽田` shows `羽田空港 (HND)` without waiting on network.
  - Adding a typed known airport uses local coordinates and canonical airport name, so `羽田空港` becomes `羽田空港 (HND)`.
  - Meet flight registration now pre-fills a likely arrival airport from trip spots/known nearby airports, instead of leaving destination blank.
  - Empty final day with a registered dismiss flight now derives the start/leave time from `flight takeoff - airport stay - travel time` when the user has not manually set that day's start time.
  - Route fetching was aligned to use flight endpoints: arrival airport for outbound first ground route, departure airport for return final ground route.
- Checks: inline scripts in `schedule.html` / `flight.html` passed `vm.Script`; mojibake scan passed; Browser Use confirmed `羽田` suggestions render and console warnings/errors are empty.

### 2026-05-06 Codex print controls and airport timeline follow-up

- Updated `print.html`.
  - Added numeric inputs for selected cover-layer scale and rotation.
  - Added a text-layer button plus color, font, and font-size controls for text layers.
  - Added print element selection/scaling for major body elements (`map`, `spots`, `schedule`, `packing`).
  - Added visibility controls for those print elements, plus a hidden list on the right. Visible items can be dragged into the hidden list; hidden items can be restored by click or drag back.
  - Existing spot hide/show controls now share the same visible/hidden lists.
- Updated `schedule.html`.
  - Trip meet/dismiss text input no longer saves to the schedule on plain text change; it is committed only by SPOTS select or the new-add button.
  - Outbound flight arrival airport is shown as its own timeline row.
  - Return flight arrival airport is shown after the flight row.
- Checks: inline scripts in `schedule.html`, `print.html`, and `flight.html` passed `vm.Script`; mojibake scan passed; Browser Use loaded `print.html` and `schedule.html` with no console warnings/errors.

### 2026-05-07 Codex flight time and provisional airport flight follow-up

- Updated `flight.html` time entry for takeoff/landing.
  - Replaced native `type="time"` controls with hour/minute selects so the browser cannot show 1-minute options.
  - Minute choices are fixed to `00, 05, 10, ... 55`; incoming query params and saved values are rounded to the nearest 5 minutes.
- Updated `schedule.html` airport-anchor behavior.
  - When meet/dismiss is an airport and no confirmed flight is registered, the timeline now creates a provisional flight using the nearest airport to non-airport trip spots, with provisional takeoff/landing times prefilled.
  - Provisional flight rows show a warning badge. Opening the flight page from that row carries the provisional airport/time values; saving the real flight removes the provisional warning.
  - Return flights with a missing/wrong departure endpoint that resolves to the dismiss airport are treated as provisional and corrected to the nearest airport suggestion until re-saved.
  - Airport suggestions for these provisional endpoints ignore airport spots and use actual non-airport spots as the distance base.
- Checks: `node --check` passed for `airports.js` and `app.js`; inline scripts for `flight.html`, `schedule.html`, and `spots.html` passed `vm.Script`; local HTTP 200 confirmed for `flight.html` and `schedule.html`; touched-file mojibake scan returned no matches.

### 2026-05-07 Codex area suggestion add flow

- Updated `app.js` area suggestions on `spots.html`.
  - The displayed order is now candidate areas, recommended spots, then local foods.
  - Recommended spot buttons now add the spot directly instead of copying text into the add field.
  - Local-food rows remain reference-only and have no add button.
  - Added buttons become disabled as "追加済み"; when the spot list changes, the suggestion buttons are re-rendered from current spots, so deleting the spot makes the button available again.
  - Local-suggestion spot adds now search with the selected area context and country code hints. For Taiwan/China ambiguity, mismatched country results are rejected before adding.
- Data audit: Taiwan local suggestions and China local suggestions have no exact duplicate recommended spot names. `太魯閣渓谷` exists in the Taiwan suggestions only; the wrong-China result came from ambiguous geocoding during add, not from duplicate local data.
- Browser check: `spots.html` showed Taiwan suggestions in the expected order, with foods after spots and without add buttons. A live add of `太魯閣渓谷` placed the marker around Xibao/Taroko, Taiwan.
- Checks: `node --check app.js` passed; `spots.html` inline scripts passed `vm.Script`; local HTTP 200 confirmed for `spots.html`; touched-file mojibake scan returned no matches.

### 2026-05-07 Codex UI defaults follow-up

- Updated area suggestion add buttons in `styles.css` / `app.js`.
  - "スポット追加" is now a filled accent button with white text.
  - "追加済み" gets the muted disabled style via the `added` class.
- Updated spot business-hours defaults in `app.js`.
  - New/no-hours spots now open the hours slider at 09:00-20:00 instead of all day.
- Updated `flight.html` time inputs.
  - Replaced split hour/minute selects with one text-style time input per field plus a 5-minute datalist.
  - Incoming values such as `09:03` are rounded to `09:05`; no hour/minute split UI remains.
- Updated `schedule.html`.
  - Default first-day airport meet time now renders at the provisional/registered departure airport check-in time, avoiding an immediate check-in warning when trip meet time is still the default.
  - Missing hotels now get a timeline-only provisional "仮の宿泊エリア（中心街・駅目安）" based on nearby visit spots, with a warning badge. It is not saved as a real hotel.
- Checks: `node --check app.js` passed; inline scripts for `flight.html`, `schedule.html`, and `spots.html` passed `vm.Script`; touched-file mojibake scan returned no matches. Browser check confirmed `flight.html` no longer has the hour/minute split controls and rounds query times to 5-minute values.

### 2026-05-07 Codex tripplan/schedule provisional follow-up

- Updated `tripplan.html` spot-detail business-hour defaults in the trip planning step so empty hours render as `09:00` / `20:00`. This makes the native time picker open from the desired cursor position instead of the current time.
- Updated `schedule.html` provisional hotel placement.
  - Provisional hotels now also consider unplaced candidate spots, so the placeholder can be shown before auto-placement has put every spot onto a day.
  - The provisional hotel label names the nearest anchor/candidate area, e.g. `仮の宿泊エリア（九份周辺の中心街・駅目安）`, and the warning repeats that specific placeholder.
- Updated `schedule.html` provisional outbound flight timing.
  - For a meet airport without a registered flight, the trip start time is treated as the check-in time and the provisional departure is set 90 minutes later. Example: start/check-in `09:00` -> flight departure `10:30`.
- Checks: inline scripts for `schedule.html` and `tripplan.html` passed `vm.Script`; touched-file mojibake scan returned no matches; local HTTP 200 confirmed for `schedule.html` and `tripplan.html`.

### 2026-05-07 Codex flight/tripplan/auto-place follow-up

- Updated `flight.html`.
  - Flight takeoff/landing inputs are native `type=time` controls again, with `step=300` so the clock-style UI is preserved while 5-minute rounding remains on load/save.
- Updated `tripplan.html`.
  - Business-hour inputs stay empty when no hours are saved.
  - On focus only, empty start/end hour inputs temporarily seed `09:00` / `20:00` so the native time picker opens from those positions. If the user leaves without editing, the field returns to empty and nothing is saved.
- Updated `schedule.html` auto-placement.
  - Auto-placement now uses the same provisional airport context as the timeline: first-day airport meet uses the suggested/registered arrival airport and flight arrival time as the starting anchor; last-day airport dismiss uses the suggested/registered departure airport and check-in deadline as the day limit.
  - Provisional return flights now treat the trip dismiss time as the local departure time, so `18:00` departure yields a `16:30` check-in limit with the default 90-minute airport stay.
- Checks: inline scripts for `flight.html`, `schedule.html`, and `tripplan.html` passed `vm.Script`; touched-page mojibake scan returned no matches; local HTTP 200 confirmed for all three pages; Browser Use confirmed `flight.html` time inputs have `type=time` and `step=300`, and rounded query times from `09:03`/`11:07` to valid 5-minute values.

### 2026-05-07 Codex map labels, provisional route fetch, print editor follow-up

- Updated map label styling in `styles.css`.
  - Spot/cluster label borders are thicker and the spot label tail is now a compact pointer plus a slim connector, instead of the previous wide filled neck. Placement collision logic in `app.js` was left intact.
- Updated `schedule.html`.
  - `scheduleTransitFetches()` now queues every generated `travel` step from `generatePlan()`, so provisional hotels and provisional airport endpoints also get route cache entries.
  - When a route is not cached yet but both endpoints have coordinates, the timeline immediately uses a distance-based estimated duration instead of showing 20 minutes while waiting.
- Updated `print.html`.
  - Text color control is now an `A` button with an underline color swatch.
  - Font-size input and font select widths were reduced.
  - Removed the separate "要素倍率" control; the existing倍率 controls now apply to either the selected cover layer or selected print element.
  - Cover/back-cover layers now support click-select, drag-to-move, corner handle resize, and rotate-handle rotation.
- Checks: `node --check` / `vm.Script` passed for `app.js`, `schedule.html`, and `print.html`; local HTTP 200 confirmed for `spots.html`, `schedule.html`, and `print.html`; touched-file mojibake scan returned no matches. Browser Use could not run because the Codex app reported a usage-limit rejection.

### 2026-05-07 Codex print editor polish and auto-place scenarios

- Updated `print.html`.
  - Added text color preset swatches next to the A/underline color picker.
  - Enlarged the cover/back-cover rotate handle.
  - Removed the old visible-object button area; hidden objects now live in the right-side hidden list and can be restored by dragging back onto the preview or clicking the restore button.
  - Added an "初期配置に戻す" button for the selected cover/back-cover layer or selected print element scale.
  - Fixed preview text layers so selecting text focuses the editable text node and input changes are saved.
  - Moved the hidden list beside the preview area without changing the book/page dimensions; it stacks below only on narrow screens.
- Schedule auto-place scenario check:
  - Ran the real `schedule.html` auto-placement logic in a Node DOM/localStorage harness for domestic Osaka, Asia Taipei, and Europe Paris patterns.
  - Domestic suggested ITM, Asia suggested TPE, Europe suggested CDG; all scenarios produced day plans without skipped spots, overflow warnings, check-in warnings, or missing-coordinate warnings.
- Checks: `node --check app.js` passed; inline scripts for `schedule.html` and `print.html` passed `vm.Script`; local HTTP 200 confirmed for `schedule.html` and `print.html`; `print.html` loaded in Browser Use with no console warnings/errors. Touched-file mojibake scan returned no matches.
