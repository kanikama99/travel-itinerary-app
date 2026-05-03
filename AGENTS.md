# travel-itinerary-app プロジェクト固有メモ

## AI間の引き継ぎ

- Claude / Codex などAI同士の伝達事項は `AI_HANDOFF.md` に書く。
- 作業を始める前に `AI_HANDOFF.md` の「現在の状態」と「未解決・次に見ること」を確認する。
- 作業後は、変更したファイル・確認したこと・次のAIに残したい注意を短く追記する。
- 既存のユーザー変更を勝手に戻さない。判断に迷う差分があれば、まず共有メモに状況を書く。

## 文字化けチェック

- 日本語を含む HTML / JS / CSS / Markdown を編集したら、最後に文字化けしていないか確認する。
- 少なくとも触ったページと主要導線のページで、`繧` / `縺` / `譁` / `蛟` / `蜊` / `謖` / `驛` / `譌` / `�` が残っていないか検索する。
- 可能ならブラウザでもページタイトル、ハンバーガーメニュー、主要ボタン、フォームラベルを目視確認する。
- PowerShell の表示だけが文字化けすることがあるため、`Select-String` の一致有無やブラウザ表示も合わせて判断する。
- 文字化けを直すために一括変換や `Set-Content` で広範囲を書き換えない。必要な箇所だけ `apply_patch` で直す。

## 地図プレビューの吹き出し（ラベル）重なり — 再発注意

**症状:** スポットピンの横に出るラベル（spot-label tooltip）が他のラベルやピンと重なる。
近いスポットが多いと吹き出しが欠けたり、どのピンのラベルか分からなくなる。

**根本原因:**
- Leaflet の permanent tooltip は CSS でサイズが決まるが、衝突判定は app.js の `chooseLabelPlacements()` が実際の Leaflet レイヤー座標で計算する。
- ラベル寸法の見積もり（`LABEL_MIN_W` / `LABEL_MAX_W` / `LABEL_CHAR_W` / `LABEL_H`）が実際の描画サイズと合わないと判定がズレる。
- spot-label は横書き固定。`white-space: nowrap` / `word-break: keep-all` / `writing-mode: horizontal-tb` を崩さないこと。
- `chooseLabelPlacements()` の戻り値には `rect` を必ず含める。`renderOverviewLayer()` のクラスターラベル配置が単独ラベルを避けるために `occupiedRects` として使う。
- スポットピン・スポット吹き出し・クラスタ吹き出しは、他のピンや吹き出しと絶対に重ねて配置しない。`chooseLabelPlacements()` は重ならない候補だけを採用し、空きがない場合は吹き出しを省略する。重ねて表示するフォールバック（例: `|| "right"`）は禁止。
- 地図の配置を変更したら、行きたい場所ページと印刷ページの両方でスクリーンショットまたはブラウザ確認を行い、ピン・吹き出し同士が重なっていないことを確認する。

**禁止パターン:**
- ラベル幅見積もりを実際より小さい値にしない。
- `overflow-wrap: anywhere` を spot-label やスケジュール画面のSPOTS名に指定しない。
- `text-overflow: ellipsis` や `overflow: hidden` で長いスポット名を切らない。
- 吹き出し方向を一律 `"right"` にハードコードしない。`chooseLabelPlacements()` を必ず呼ぶ。
- `estimateZoom(bounds)` や固定幅でラベル配置を推定しない。

## カレンダーピッカー

- `calendar.js` に共通カスタムカレンダー実装。
- `<input type="date" data-cal>` 属性を付けると自動でカスタムピッカーに変換。
- 設定キー `calendarStyle`（`standard` / `cute` / `minimal`）で外観切替。
- `schedule.html` と `hotel.html` の両方で `<script src="./calendar.js">` を読み込む。

## インラインテーマ適用（schedule.html / hotel.html）

各ページの `<script>` 内にある即時関数でテーマCSS変数を適用している。
`--accent-rgb` と `--shadow-base-rgb` も必ずセットすること（影色のテーマ連動に必要）。

```js
r.style.setProperty("--accent-rgb", c[7]);
r.style.setProperty("--shadow-base-rgb", c[8]);
```
