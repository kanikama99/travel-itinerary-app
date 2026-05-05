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

## Next Things To Watch

- If the user still sees old broken map tiles, ask them to hard reload once; the bug was likely a cached copy of `print.html` with the bad Leaflet CSS integrity hash.
- If adding more country-specific packing rules, extend `COUNTRY_RULES` in `checklist.html` and keep the strings browser-verified.
- `tripplan.html` のウィッシュリストは `trip-basic-plan.v1` に保存される。印刷ページ（print.html）に未連携なので、将来的に組み込むなら render() で `trip-basic-plan.v1` を読み込む必要がある。
- ラベルドラッグはドラッグ終了後に地図を再描画するため、ズーム/パン操作のたびに offset はリセットされる（Leaflet がツールチップを再配置するため）。将来的に Leaflet の pane 座標系で管理すると安定する。
