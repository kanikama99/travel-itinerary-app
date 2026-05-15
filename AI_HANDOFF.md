# AI_HANDOFF.md

Shared notes for Claude / Codex agents working on this repo.

## Working Rules

- Read this file before starting work, and update it before finishing.
- Do not revert user changes or other agent changes unless the user explicitly asks.
- Follow `AGENTS.md` for branch sync, mojibake checks, and map-preview cautions.
- If the working tree has uncommitted changes, do not pull, stash, merge, reset, or switch branches without asking.

## Current State

- Branch: `sandbox`.
- The working tree already had uncommitted changes before the 2026-05-16 refactor pass. Treat them as user/agent work and do not revert them casually.
- Recent release-risk/legal changes added `legal.html`, common footer/legal notice handling in `theme.js`, and print/legal copy in `print.html`.
- `tests/travel_plan_pdf_e2e.mjs` exists as an untracked file in the current working tree and is intended to cover full-page/PDF checks.

## Unresolved / Next Things To Check

- Re-run `node tests/travel_plan_pdf_e2e.mjs` when the environment allows it. A previous run after the legal/footer pass was blocked by Codex app escalation/usage limits.
- Map-preview related edits still require browser/screenshot verification for both `spots.html` and `print.html`; see `AGENTS.md`.
- PowerShell may display Japanese as mojibake even when files are valid UTF-8. Prefer source scans and browser rendering for final judgment.

## Recent Work Log

### 2026-05-16 Codex map connector / MAP jump follow-up

- Updated map clustering default from 12% to 20% in `app.js`, `settings.js`, `settings.html`, and `print.html`.
- Updated `app.js` map overview placement so zoom frames are treated as occupied rectangles and zoom-frame connector lines are treated as occupied connector segments when placing single spot labels.
- Added connector arrows between each overview zoom frame and its `拡大図: MAPn` cluster label.
- Changed `拡大図: MAPn` in cluster labels into a button that scrolls to the corresponding map card (`map-card-n`) on the page.
- Mirrored the zoom-frame connector and frame-avoidance logic in `print.html` for PDF maps.
- Added `tests/map_preview_connectors_e2e.mjs` with a Taiwan/Taroko-style Chrome headless check:
  - seeds Taipei/Taroko/Central Taiwan spots,
  - verifies MAP jump scrolling,
  - verifies zoom connector arrowheads exist,
  - checks visible spot labels / cluster labels / primary pins for overlap,
  - saves `debug_logs/map-preview-connectors-taiwan.png`.
- Updated `AGENTS.md` with recurrence notes for zoom-frame occupied rects, zoom-frame connector arrows, diagonal connectors, and MAP jump behavior.
- Verification completed:
  - `node --check app.js`
  - `node --check settings.js`
  - `node --check tests/map_preview_connectors_e2e.mjs`
  - inline script parsing for `print.html`, `settings.html`, and `spots.html`
  - `node tests/schedule_auto_place.test.mjs`
  - `node tests/travel_plan_pdf_e2e.mjs`
  - `node tests/map_preview_connectors_e2e.mjs`
  - `git diff --check -- app.js print.html styles.css settings.js settings.html AGENTS.md tests/map_preview_connectors_e2e.mjs`
  - added-line mojibake scan returned no matches

### 2026-05-16 Codex refactor / Markdown cleanup

- Removed unused `app.js` functions that had no callers:
  - `clearAllData()`
  - `escapeAttribute()`
  - old `fetchAreaSuggestions()`
  - old `renderAreaSuggestions()`
  - `defaultState()`
- Kept the active ordered area suggestion path:
  - `fetchAreaSuggestionsOrdered()`
  - `renderAreaSuggestionsV2()`
- Rewrote `AGENTS.md` into clean Japanese notes, preserving the branch workflow, mojibake checks, map-preview warnings, calendar notes, and inline theme-variable notes.
- Replaced the mojibake-heavy `CLAUDE.md` with a short pointer to `AGENTS.md`.
- Condensed this handoff file so new agents see current state and open risks first.
- Fixed mojibake in the newly added `legal.html`.
- Rewrote `tests/travel_plan_pdf_e2e.mjs` seed data with clean ASCII labels while preserving the six-plan PDF/page verification flow.
- Verification completed:
  - `node --check app.js`
  - `node --check theme.js`
  - `node --check tests/travel_plan_pdf_e2e.mjs`
  - inline script parsing for `legal.html`, `print.html`, `flight.html`, `hotel.html`, `tour.html`, `rental.html`, and `schedule.html`
  - `node tests/schedule_auto_place.test.mjs`
  - `node tests/travel_plan_pdf_e2e.mjs`
  - `git diff --check`
  - mojibake scan for touched files only matched the documented pattern line in `AGENTS.md`

### 2026-05-16 Codex map preview verification memo update

- Updated `AGENTS.md` map preview checklist to explicitly require connector arrows to touch both their label/bubble and target frame/pin.
- Added Chrome and smartphone (iOS / Android) expected-display checks to the same map preview checklist.

### 2026-05-11 Codex release-risk legal notice pass

- Added `legal.html` with release-facing notices for planning-tool positioning, route/time/price/availability disclaimers, privacy/PDF sharing cautions, external service/data attribution, ads/affiliate disclosure, prohibited misuse, and data deletion notes.
- Updated `theme.js` to inject a common footer on pages using `theme.js`.
- Updated `print.html` so the generated PDF back cover includes a compact legal/share caution.
- Updated `flight.html`, `hotel.html`, `tour.html`, and `rental.html` with external-search/legal caution copy.
- Added styles in `styles.css` for the legal page, common footer, and print legal note.
- Verification completed at that time:
  - `node --check theme.js`
  - `node --check tests/travel_plan_pdf_e2e.mjs`
  - inline script parsing for touched HTML files
  - `git diff --check` for touched files
  - mojibake scan for touched legal/release-risk files
  - `node tests/schedule_auto_place.test.mjs`

### 2026-05-11 Codex six-plan full-page/PDF verification

- Added `tests/travel_plan_pdf_e2e.mjs` to seed six draft travel plans, load major pages, create PDFs from `print.html`, scan visible text for mojibake, and check print-map label/pin/MAP badge rectangle overlaps.
- Fixed `print.html` PDF preparation so maps render before `window.print()`.
- Fixed `schedule.html` auto-placement/provisional flight behavior for airport meet/dismiss cases.
- `node tests/travel_plan_pdf_e2e.mjs`, `node tests/schedule_auto_place.test.mjs`, `node --check app.js`, and relevant inline-script checks passed at that time.

### Map Preview Caution Summary

- `chooseLabelPlacements()` in `app.js` uses actual Leaflet layer coordinates for spot-label placement.
- Do not hard-code all labels to one direction.
- Do not add `overflow-wrap: anywhere` to `.spot-label` or schedule SPOTS names.
- Keep `.spot-label` horizontal with `white-space: nowrap`, `word-break: keep-all`, and `writing-mode: horizontal-tb`.
- `chooseLabelPlacements()` must return `rect`; overview cluster labels use those occupied rects.
