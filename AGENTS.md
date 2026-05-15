# travel-itinerary-app プロジェクト固有メモ

## Branch Sync Workflow

Use this workflow for Codex, Claude Code, Codespaces, and local PC work.

- Start work by checking `git status` and `git branch --show-current`.
- On a work branch such as `sandbox` or `feature/*`, if the working tree is clean, run `git pull --ff-only` before editing.
- If there are uncommitted changes, do not run `pull`, `stash`, `merge`, `reset`, or checkout another branch without asking the user first.
- Do not push directly to `develop` unless the user explicitly asks. Treat `develop` as the branch for reviewed/stable changes.
- Prefer working in `sandbox` or a short-lived branch from `develop`.
- On the `sandbox` branch, after requested work is complete and relevant checks pass, AI agents may commit and push to `origin/sandbox` without asking for an extra approval each time.
- Before switching devices or handing work to another AI, commit and push the current `sandbox` work after checks pass.
- On branches other than `sandbox`, commit/push still requires an explicit user request unless the user says otherwise.
- Before committing, review `git diff` and run the relevant syntax checks/tests for the touched files.
- Before pushing, run `git pull --ff-only`; if it fails or reports divergence/conflict, stop and ask the user.
- Use clear commit messages that describe the user-visible change.
- Never use destructive commands such as `git reset --hard` or `git checkout -- <file>` unless the user explicitly requested that exact operation.

## AI 間の引き継ぎ

- Claude / Codex など AI 同士の伝達事項は `AI_HANDOFF.md` に書く。
- 作業を始める前に `AI_HANDOFF.md` の「現在の状態」と「未解決・次に見ること」を確認する。
- 作業後は、変更したファイル・確認したこと・次の AI に残したい注意を短く追記する。
- 既存のユーザー変更を勝手に戻さない。判断に迷う差分があれば、まず共有メモに状況を書く。

## 文字化けチェック

- 日本語を含む HTML / JS / CSS / Markdown を編集したら、最後に文字化けしていないか確認する。
- 少なくとも触ったページと主要導線のページで、`繧` / `縺` / `譁` / `蛟` / `蜊` / `謖` / `驛` / `譌` / `�` が残っていないか検索する。
- PowerShell の表示だけが文字化けすることがあるため、`Select-String` の一致有無やブラウザ表示も合わせて判断する。
- 文字化けを直すために一括変換や `Set-Content` で広範囲を書き換えない。必要な箇所だけ `apply_patch` で直す。

## 地図プレビューの吹き出し重なり

地図プレビュー関係の `app.js` / `print.html` / `styles.css` などを編集したら、行きたい場所ページと印刷ページの両方で確認すること。

- Leaflet の permanent tooltip は CSS でサイズが決まるが、衝突判定は `app.js` の `chooseLabelPlacements()` が実際の Leaflet レイヤー座標で計算する。
- ラベル寸法の見積もり（`LABEL_MIN_W` / `LABEL_MAX_W` / `LABEL_CHAR_W` / `LABEL_H`）を実際の描画サイズより小さくしない。
- `.spot-label` は横書き固定。`white-space: nowrap` / `word-break: keep-all` / `writing-mode: horizontal-tb` を崩さない。
- `chooseLabelPlacements()` の戻り値には必ず `rect` を含める。`renderOverviewLayer()` のクラスターラベル配置が単独ラベルを避けるために `occupiedRects` として使う。
- スポットピン・スポット吹き出し・クラスタ吹き出しは、他のピンや吹き出しと重ねない。重ねて表示するフォールバック（例: `|| "right"`）は禁止。
- プレビュー上のスポット名が地図上にすべて正しく反映されていることを確認する。
- スポット名・ピン・矢印・吹き出し同士が重なっていないことを確認する。
- 矢印はクラスタ吹き出しまたはスポット名ラベルと、拡大枠またはピンの双方に繋がっていることを確認する。
- 拡大枠はラベル配置の占有矩形として扱う。単独スポットの矢印が拡大枠を横切る、または拡大枠からクラスタ吹き出しへの矢印と交差する候補は避けること。
- 拡大枠と `拡大図: MAPn` の吹き出しは必ず矢印で接続すること。横方向だけで配置が難しい場合は、斜め方向の接続線も使ってよい。
- `拡大図: MAPn` はクリックでページ内の該当 MAP へスクロール移動できる状態を保つこと。
- 拡大図の範囲を示す枠線が地図上ですべて表示されていることを確認する。
- 可能なら Chrome とスマホ（iOS / Android）でも表示を確認する。

禁止パターン:

- `.spot-label` やスケジュール画面の SPOTS 名に `overflow-wrap: anywhere` を指定しない。
- 長いスポット名を `text-overflow: ellipsis` や `overflow: hidden` で切らない。
- 吹き出し方向を一律 `"right"` にハードコードしない。`chooseLabelPlacements()` を必ず呼ぶ。
- `estimateZoom(bounds)` や固定幅だけでラベル配置を推定しない。
- 拡大枠や拡大枠接続線を、単独スポットのラベル・矢印配置の衝突判定から外さない。

## カレンダーピッカー

- `calendar.js` に共通カスタムカレンダー実装。
- `<input type="date" data-cal>` 属性を付けると自動でカスタムピッカーに変換。
- 設定キー `calendarStyle`（`standard` / `cute` / `minimal`）で外観切替。
- `schedule.html` と `hotel.html` の両方で `<script src="./calendar.js">` を読み込む。

## インラインテーマ適用

`schedule.html` / `hotel.html` の `<script>` 内にある即時関数でテーマ CSS 変数を適用している。`--accent-rgb` と `--shadow-base-rgb` も必ずセットすること。

```js
r.style.setProperty("--accent-rgb", c[7]);
r.style.setProperty("--shadow-base-rgb", c[8]);
```
