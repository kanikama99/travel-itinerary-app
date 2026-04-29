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

- 地図プレビューの spot-label tooltip は、CSSの `.leaflet-tooltip.spot-label { max-width: 220px; }` と `app.js` の `LABEL_W = 220` / `LABEL_H = 32` を揃える。
- tooltip方向は `chooseLabelDirs()` で決める。方向を一律 `"right"` に固定しない。
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
