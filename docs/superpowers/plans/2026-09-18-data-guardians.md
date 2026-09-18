# Data Guardians Implementation Plan

**Goal:** Deliver the approved Thai multiplayer quiz, with QR entry, four teams, host controls and repeatable sessions.
**Architecture:** One Node HTTP server owns room state, time, identity and scoring. Browser clients poll a filtered room view. JSON snapshots persist rooms locally; QR codes point at a configurable reachable server URL.
**Tech stack:** Node 24, vanilla JavaScript/CSS, qrcode, Node test runner, Playwright.

## Constraints and design
- 12 questions, three rounds; 100/100/200 points, no speed bonus.
- Teams locked at start; normalize ranking by initial team size; ties share rank.
- Server hides answers until reveal and requires host/player tokens for mutations.
- Thai mobile-first controls. Navy #14283F, paper #F4F6F9, teal #168979, orange #ED824C, violet #8773CE, blue #508AD5.
- Typography: Thai system Tahoma/Leelawadee UI, display Trebuchet MS. Signature: a four-team mission board around a shield emblem.

## Tasks
- [x] 1. tests/game.test.js: specify 20-player balancing, duplicate/late/stale answer rejection, hidden solutions, host permissions, scoring and new room isolation; run red.
- [x] 2. lib/questions.js and lib/game.js: implement create/join/view/answer/control with an injected clock; run green.
- [x] 3. server.js: JSON API, host authentication, atomic persistence, local assets, QR and LAN address configuration; exercise with real HTTP integration tests.
- [x] 4. public/index.html, public/app.js, public/style.css: implement home, join, lobby, live question, explanation, ranking and winner views; demo is explicitly labeled and uses simulated participants.
- [x] 5. tests/browser.mjs: exercise host/player on desktop and mobile, finish 12 questions, check overflow and save screenshots.
- [x] 6. README.md and Start-Game.ps1: document launch, LAN QR, firewall limitations, host recovery and results export; run checks and leave server available locally.

## Review and verification
- Independent read-only review found a host network form draft lost on roster polling. Reproduced in browser test, fixed and verified.
- Browser testing found Windows EPERM on atomic snapshot replacement. Added bounded retry for transient file locks, retained old complete snapshot until success, verified with injected locks and full live run.
- OS route detection now prefers the reachable primary adapter over virtual adapters for the QR URL.
- Nine Node tests passed; complete desktop/mobile 20-player flow passed with no page errors or horizontal overflow.
- Real phones and venue Wi-Fi still require an on-site connectivity check.

## Validation commands
`npm test`: game rules plus real HTTP session with 20 participants.
`npm run test:browser`: rendered browser interaction, no unexpected console errors.
`npm start`: UI and room API available on port 3000, listening on all network interfaces.

User approved the proposal with “ทำเลย”; execute inline without another approval checkpoint. No existing repository or source files to preserve beyond the proposal.
