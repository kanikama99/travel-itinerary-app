# travel-itinerary-app プロジェクト固有メモ

## Branch sync workflow for AI agents

Use this workflow for Claude Code, Codex, Codespaces, and local PC work.

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

## AI間の引き継ぎ

- Claude / Codex などAI同士の伝達事項は `AI_HANDOFF.md` に書く。
- 作業を始める前に `AI_HANDOFF.md` の「現在の状態」と「未解決・次に見ること」を確認する。
- 作業後は、変更したファイル・確認したこと・次のAIに残したい注意を短く追記する。
- 既存のユーザー変更を勝手に戻さない。判断に迷う差分があれば、まず共有メモに状況を書く。

---

## ⚠️ 地図プレビューの吹き出し（ラベル）重なり — 再発注意

**症状:** スポットピンの横に出るラベル（spot-label tooltip）が他のラベルやピンと重なる。
近いスポットが多いと吹き出しが欠けたり、どのピンのラベルか分からなくなる。

**根本原因:**
- Leaflet の permanent tooltip は CSS でサイズが決まるが、**衝突判定は app.js の `chooseLabelPlacements()` が実際の Leaflet レイヤー座標で計算する。**
- ラベル寸法の見積もり（`LABEL_MIN_W` / `LABEL_MAX_W` / `LABEL_CHAR_W` / `LABEL_H`）が実際の描画サイズと合わないと判定がズレる。
- spot-label は横書き固定。`white-space: nowrap` / `word-break: keep-all` / `writing-mode: horizontal-tb` を崩さないこと。
- 衝突判定は app.js の `estimateLabelSize()` がスポット名の長さから幅を見積もる。`LABEL_MIN_W` / `LABEL_MAX_W` / `LABEL_CHAR_W` / `LABEL_H` と実CSSのフォント・paddingを大きくズラさないこと。
- `chooseLabelPlacements(map, points)` はラベル同士・ピン・地図枠を避ける。推定ズームや固定 `MAP_W` / `MAP_H` ベースに戻さないこと。
- `chooseLabelPlacements()` の戻り値には `rect` を必ず含める。`renderOverviewLayer()` のクラスターラベル配置が単独ラベルを避けるために `occupiedRects` として使う。
- 近いスポットは `RELATIVE_CLUSTER_THRESHOLD` で全体図クラスタ化する。近接スポットの渋滞が再発したら閾値も確認する。

**禁止パターン:**
- ラベル幅見積もりを実際より小さい値にしない（長い日本語スポット名でラベルが重なる）
- `overflow-wrap: anywhere` を spot-label に指定しない（日本語が1文字ずつ縦に並ぶ）
- スケジュール画面のSPOTS名にも `overflow-wrap: anywhere` を指定しない。狭い欄でも横書き・省略表示を優先し、1文字ずつの縦表記は禁止。
- `text-overflow: ellipsis` や `overflow: hidden` で長いスポット名を切らない
- 吹き出し方向を一律 `"right"` にハードコードしない（`chooseLabelPlacements()` を必ず呼ぶ）
- `estimateZoom(bounds)` や固定幅でラベル配置を推定しない（実表示とズレて地図端で吹き出しが欠ける）

**正しい実装:**
```js
// app.js
const LABEL_MIN_W = 92;
const LABEL_MAX_W = 520;
const LABEL_CHAR_W = 15; // 横書きラベルの文字幅見積もり
const LABEL_H = 38;      // 1行横書き + padding の実測値
const LABEL_GAP = 24;    // ピンからラベルまでの余白（Leaflet offset と揃える）
const LABEL_PIN_PAD = 20;
const LABEL_EDGE_PAD = 8;
const LABEL_DISTANCES = [24, 54, 84, 114]; // 近接時に段階的に離す
const LABEL_DIRS = ["right", "left", "top", "bottom"]; // 4方向を試す

// renderOverviewLayer / renderDetailLayer で必ず chooseLabelPlacements() を使う
const placements = chooseLabelPlacements(map, singles);
addMarkerToMap(map, point, placements.get(point.id) || "right");
```

```css
/* styles.css */
.leaflet-tooltip.spot-label {
  width: max-content;
  max-width: none;
  white-space: nowrap;
  word-break: keep-all;
  writing-mode: horizontal-tb;
}
```

---

## ⚠️ スポットメニューの開き方 — ページ遷移禁止

**ルール:** スポットメニューは `spots.html?editSpot=SPOT_ID&embedded=1` を **iframeオーバーレイ** で開くこと。`<a href="./spots.html?editSpot=...">` でページ遷移させてはいけない。

**理由:** ページ遷移するとユーザーが元のページ（旅行計画・スケジュール等）に戻れなくなる。

**正しい実装パターン（schedule.html / tripplan.html 共通）:**
```html
<!-- HTML -->
<div id="sharedSpotMenuOverlay" class="shared-spot-menu-overlay hidden" role="dialog" aria-modal="true">
  <div class="shared-spot-menu-frame-wrap">
    <button id="sharedSpotMenuClose" class="shared-spot-menu-close" type="button" aria-label="閉じる">×</button>
    <iframe id="sharedSpotMenuFrame" class="shared-spot-menu-frame" title="スポットメニュー"></iframe>
  </div>
</div>
```
```js
// JS
function openSpotMenu(spotId) {
  const overlay = document.getElementById("sharedSpotMenuOverlay");
  const frame   = document.getElementById("sharedSpotMenuFrame");
  frame.src = `./spots.html?editSpot=${encodeURIComponent(spotId)}&embedded=1`;
  overlay.classList.remove("hidden");
}
function closeSpotMenu() {
  document.getElementById("sharedSpotMenuOverlay")?.classList.add("hidden");
  const frame = document.getElementById("sharedSpotMenuFrame");
  if (frame) frame.src = "about:blank";
  // ← ここで画面を再描画してスポット変更を反映
}
// postMessage で spots.html 側が "spot-menu-saved" / "spot-menu-closed" を送ってくる
window.addEventListener("message", event => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === "spot-menu-saved" || event.data?.type === "spot-menu-closed") closeSpotMenu();
});
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
