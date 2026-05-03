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

## Next Things To Watch

- If the user still sees old broken map tiles, ask them to hard reload once; the bug was likely a cached copy of `print.html` with the bad Leaflet CSS integrity hash.
- If adding more country-specific packing rules, extend `COUNTRY_RULES` in `checklist.html` and keep the strings browser-verified.
- `tripplan.html` のウィッシュリストは `trip-basic-plan.v1` に保存される。印刷ページ（print.html）に未連携なので、将来的に組み込むなら render() で `trip-basic-plan.v1` を読み込む必要がある。
