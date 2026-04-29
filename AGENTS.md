# travel-itinerary-app プロジェクト固有メモ

## AI間の引き継ぎ

- Claude / Codex などAI同士の伝達事項は `AI_HANDOFF.md` に書く。
- 作業を始める前に `AI_HANDOFF.md` の「現在の状態」と「未解決・次に見ること」を確認する。
- 作業後は、変更したファイル・確認したこと・次のAIに残したい注意を短く追記する。
- 既存のユーザー変更を勝手に戻さない。判断に迷う差分があれば、まず共有メモに状況を書く。

---

## ⚠️ 地図プレビューの吹き出し（ラベル）重なり — 再発注意

**症状:** スポットピンの横に出るラベル（spot-label tooltip）が他のラベルやピンと重なる。

**根本原因:**
- Leaflet の permanent tooltip は CSS でサイズが決まるが、**衝突判定は app.js の `chooseLabelDirs()` がタイル座標で計算する。**
- 定数 `LABEL_W` / `LABEL_H` が実際の描画サイズと合わないと判定がズレる。
- styles.css の `.leaflet-tooltip.spot-label` に `max-width: 220px` を設定し、`LABEL_W = 220` / `LABEL_H = 32` と揃えること。

**禁止パターン:**
- `LABEL_W = 180` のように実際より小さい値にしない（長い日本語スポット名でラベルが重なる）
- 吹き出し方向を一律 `"right"` にハードコードしない（`chooseLabelDirs()` を必ず呼ぶ）

**正しい実装:**
```js
// app.js
const LABEL_W = 220;  // spot-label の max-width に合わせる
const LABEL_H = 32;   // padding + line-height の実測値
const LABEL_GAP = 16; // ピンからラベルまでの余白（Leaflet offset と揃える）
const LABEL_DIRS = ["right", "left", "top", "bottom"]; // 4方向を試す

// renderOverviewLayer で必ず chooseLabelDirs() を使う
const dirs = chooseLabelDirs(singles, estimateZoom(bounds));
addMarkerToMap(map, point, dirs.get(point.id) || "right");
```

```css
/* styles.css */
.leaflet-tooltip.spot-label {
  max-width: 220px;         /* LABEL_W と合わせる */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

## カレンダーピッカー

- `calendar.js` に共通カスタムカレンダー実装。
- `<input type="date" data-cal>` 属性を付けると自動でカスタムピッカーに変換。
- 設定キー `calendarStyle`（"standard" / "cute" / "minimal"）で外観切替。
- schedule.html と hotel.html の両方で `<script src="./calendar.js">` を読み込む。

---

## インラインテーマ適用（schedule.html / hotel.html）

各ページの `<script>` 内にある即時関数でテーマCSS変数を適用している。
`--accent-rgb` と `--shadow-base-rgb` も必ずセットすること（影色のテーマ連動に必要）。

```js
r.style.setProperty("--accent-rgb",      c[7]);
r.style.setProperty("--shadow-base-rgb", c[8]);
```
