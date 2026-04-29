# AI_HANDOFF.md

Claude / Codex など、このプロジェクトを触るAI同士の共有メモです。
作業前に読み、作業後に短く追記してください。

## 運用ルール

- 既存のユーザー変更や他AIの変更を勝手に戻さない。
- 大きめの変更をしたら「変更したファイル」「確認したこと」「未解決」を残す。
- バグ再発防止や設計判断は、理由が後から分かるように1-3行で残す。
- 古いメモを消すより、必要なら「完了」「不要になった」と追記する。

## 現在の状態

- `bookmarks.html` / `hotel.html` / `schedule.html` に未コミットの変更あり。
- `AGENTS.md` は未追跡ファイルとして存在していた。Codex向けのプロジェクト指示として利用。
- `CLAUDE.md` と `AGENTS.md` には同じプロジェクト固有注意が入っている。

## 重要な注意

- 地図プレビューの spot-label tooltip は横書き固定。`overflow-wrap: anywhere` 禁止。衝突判定は `chooseLabelPlacements(map, points)` で実際の Leaflet レイヤー座標を使い、地図枠・ピン・ラベル同士を避ける。
- tooltip方向と距離は `chooseLabelPlacements()` で決める。方向を一律 `"right"` に固定しない。
- カスタムカレンダーは `calendar.js` 共通実装。`<input type="date" data-cal>` で変換される。
- `schedule.html` / `hotel.html` のインラインテーマ適用では `--accent-rgb` と `--shadow-base-rgb` も必ず設定する。

## 未解決・次に見ること

- 未コミット変更の中身はまだ精査していない。次の機能追加や修正前に関連ファイルを確認する。
- PowerShell起動時に `C:\ProgramData\Anaconda3\Scripts\conda.exe` が見つからないという profile エラーが毎回出る。作業自体は継続可能。

## 作業ログ

### 2026-04-29 Codex

- AI間の引き継ぎ用にこの `AI_HANDOFF.md` を追加。
- `AGENTS.md` / `CLAUDE.md` の先頭に、このファイルを見る運用ルールを追記。
- 既存のアプリコードには変更なし。

### 2026-04-29 Codex

- `hotel.html` のホテル検索フォームに人数・部屋数・予算上限を追加。
- Booking.com / じゃらん / 楽天トラベル / Google検索のURL生成を、追加条件と日付に対応するよう修正。
- じゃらんは旧 `search/search.do` ではなく `uw/uwp2011/uww2011init.do`、楽天は `kw.travel.rakuten.co.jp/keyword/Search.do` を使う。
- Google検索ボタンは検索ボタン群の最後に移動。デスクトップでは右端、モバイルでは2列目側に出る。

### 2026-04-29 Codex

- 地図プレビューの spot-label をしっぽ付き吹き出しに変更。
- `overflow-wrap: anywhere` で日本語が縦並びになる問題を避けるため、spot-label は1行横書き固定。`estimateLabelSize()` でスポット名の長さから衝突判定用の幅を見積もる。
- `schedule.html` に「配置済みをSPOTSへ戻す」ボタンを追加。全日程の `entries` と `stayTimes`、`transitCache` をクリアする。
- 楽天トラベル検索は日本語キーワードの文字化け対策として、URL直書きではなく `accept-charset="Shift_JIS"` のGETフォーム送信に変更。

### 2026-04-29 Codex

- 通天閣/新世界など近接スポットで吹き出しが欠ける問題に対し、`chooseLabelPlacements()` を実Leaflet座標ベースへ変更し、段階的なラベル距離候補・地図枠外ペナルティ・ピン障害物判定を追加。
- ラベル距離が伸びても対応ピンが追えるように、`spot-label-gap-*` クラスと `::after` でコネクタ線を追加。
- ユニバ/梅田付近の渋滞緩和として `RELATIVE_CLUSTER_THRESHOLD` を `0.12` に調整。
- じゃらん/楽天トラベルの梅田文字化け対策として、両方とも `accept-charset="Shift_JIS"` のGETフォーム送信に統一。

### 2026-04-29 Codex

- 複数スポットの `cluster-label` だけ小さめサイズに調整。個別 spot-label とは別サイズなので混同しない。
- ホテル登録はホテル名必須、1名あたり予約金額・チェックイン予定時刻を任意入力として保存。スケジュールのホテル行に金額/時刻を表示。
- スポットメニューにスポットごとの予算入力を追加。スポット一覧メタとスケジュール行に表示。

### 2026-04-29 Codex

- 複数スポットの `cluster-label` を固定幅150pxの縦積みリストに変更。各スポット名は1行省略で、ラベル枠外に漏れないようにした。
- `schedule.html` の集合/解散設定にSPOTS選択と新規追加ボタンを追加。
- SPOTSから選ぶと対象スポットのカテゴリを `meet` / `dismiss` に更新し、同カテゴリの既存スポットは `other` に戻す。
- 新規追加は座標なしスポットとして activeList に追加し、カテゴリ `meet` / `dismiss` を付与する。行きたい場所ページにも反映される。

### 2026-04-29 Codex

- クラスターラベルも `chooseLabelPlacements()` に載せ、単独スポットラベル・全ピンを避けて配置するよう修正。梅田クラスターが関空ラベルに被る問題の対策。
- 集合/解散の新規追加ボタンを、プルダウン横ではなくテキスト入力欄の右へ移動。テキスト未入力時は追加せず入力欄にフォーカスする。
- 集合/解散の新規追加は座標なしスポットを作るため、`app.js` 側で `hasSpotCoords()` を使い、地図プレビューは座標ありスポットだけを描画する。スポット一覧のメタ表示は座標なしなら「座標未設定」と出す。

### 2026-04-29 Codex

- `chooseLabelPlacements()` の戻り値に `rect` を含めるよう修正。これが無いと `renderOverviewLayer()` の `occupiedRects` が空になり、ユニバなど単独スポットラベルへクラスターラベルが重なる。
- `#categoryCustomizeBtn` はテーマ色によって埋もれないよう、白背景・濃色文字・境界線を明示。
- `schedule.html` のSPOTS欄は滞在時間を促す文言に変更し、スポット名が見切れにくいよう折り返しへ変更。営業時間（例 `10:00-18:00`）の手動入力を追加し、自動配置の日程選択とタイムラインの「営業時間外」警告に反映。
- Googleの営業時間を自動取得するなら、スクレイピングではなく Google Places API 連携として実装する方針。現状は手動営業時間を制約条件として使う。

### 2026-04-29 Codex

- 地図プレビューの全体図では、クラスターラベルを東側優先、単独ラベルを西側優先で配置するよう調整。ユニバのラベルが大阪市街側へ重なりにくくするため。
- スケジュール画面SPOTS名の `overflow-wrap: anywhere` を禁止し、横書き1行省略へ戻した。SPOTS欄の1文字ずつ縦表記は再発禁止。
- `schedule.travelMode` を追加。既定は `transit`。`transit` は公共交通→車fallback、`driving` は車→公共交通fallback。移動時間キャッシュキーにモードを含め、切替時は `transitCache` をクリアする。

### 2026-04-29 Codex

- 集合/解散は `spotCategory` ではなく `spotRole` として分離。旧 `spotCategory=meet/dismiss` は読み込み時に `spotRole` へ移し、カテゴリは `other` に戻す。集合/解散はそれぞれ常に1件だけになるよう、最新指定以外の同ロールを解除する。
- スケジュールSPOTS欄とタイムラインの滞在時間は「時間」「分」の2入力に変更。保存値は引き続き分単位。
- 自動配置後、`generatePlan()` の `skipped` に入ったスポットは日程から外すため、SPOTSに残る。
- ホテル登録フォームにチェックアウト予定時刻と「ホテルスポットとしてSPOTSにも追加」チェックを追加。保存時に `spotCategory: "hotel"`、`hotelCheckinTime`、`hotelCheckoutTime`、`sourceNightId` を持つスポットを追加/更新する。
- 公共交通優先時は車ルートへフォールバックして採用しない。API取得失敗時は `failed` として通常の既定移動時間表示に留める。

### 2026-04-29 Codex

- 行きたい場所ページのスポットメニューで、集合/解散ボタンに `data-role` と `aria-pressed` を付け、押下状態が見えるようにした。保存時は `spotRole` へ反映し、同じ役割の既存スポットは解除する。
- スポットメニューの営業時間は「任意」を明記し、日曜始まりに変更。入力は曜日ごとに開始時刻/終了時刻の `type="time"` 2欄へ分離した。
- 既存データ互換のため、保存形式は引き続き `businessHours[day] = "HH:MM-HH:MM"`。旧文字列はメニュー表示時に開始/終了へ分解する。

### 2026-04-29 Codex

- スポットメニューの営業時間UIを、曜日ごとの使用チェックボックス + 両端ドラッグ式の横バーへ変更。保存形式は引き続き `businessHours[day] = "HH:MM-HH:MM"`。
- 集合場所と解散場所は同じスポットにできるよう、`spotRoles: ["meet", "dismiss"]` を扱う実装へ拡張。旧 `spotRole` も互換で読む。
- スケジュールページの解散日初期値は、集合日の翌日になるよう変更。集合日の初期値が明日なので、初期表示では解散日は現在の翌々日。
- スケジュールページのSPOTS欄から上下矢印と営業時間入力を削除。営業時間は行きたい場所ページのスポットメニューから設定し、自動配置の制約に使う。

### 2026-04-29 Codex

- 集合/解散の両方を持つスポットは `category-meet-dismiss` と `map-pin-meet-dismiss` で緑/紫の両方が見えるようにした。
- スポットメニューに滞在時間（時間/分）を追加し、スポットの `defaultStayMinutes` として保存。スケジュール側は `schedule.defaultStayTimes` がなければこの値を使う。
- 空港専用の離陸/着陸予定時刻は横並びに変更。ハンバーガーメニュー内の「ホテルを見つける」はCSSで非表示。
- スケジュールの宿泊先ボタンと主要文字サイズを強調。空港が集合/解散に指定された場合は「航空券を探す・登録する」ボタンを表示し、`flight.html` で検索/登録できる。
- 経路取得は HERE API 通信失敗時のエラー理由を `transitCache` に残して画面表示するよう変更。ローカル検証では `transit.router.hereapi.com:443` に接続できず `HTTP:000`。
