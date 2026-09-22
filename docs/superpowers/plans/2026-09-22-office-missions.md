# Office Missions Implementation Plan

> Execute inline using the approved proposal from this conversation. Review the resulting diff with a code reviewer before delivery.

**Goal:** Build the approved Thai “ภารกิจออฟฟิศเกือบหลุด” experience with ten slide-aligned questions and office scenarios.

**Architecture:** Keep the existing vanilla browser client and shared Game engine. Store optional scene metadata with each question so it survives shuffling and room snapshots. Render scenes as accessible HTML/CSS office artifacts. Reveal answer distributions only once answering closes; award visual team recognition only after scoring.

**Tech Stack:** Node.js, existing vanilla ES modules/CSS, node:test, existing Playwright browser runner.

## Constraints and approved design

- Preserve all existing workspace edits (baseline copied to ignored output/office-missions-baseline).
- 10 questions, rounds 4/4/2, 3 teams, one point per question; preserve normalized ranking and legacy room rules.
- Default to 30 seconds for new rooms. Existing snapshots keep their own timing/questions.
- Content follows slides 2–8 of ESG_DAY_2026_Data_Governance_Data_Security 3.pptx, as approved in chat.
- Signature: readable chat/file/share/AI scenes beside the question. No real employee or customer data.
- Palette: stage #281451, violet #7651e8, paper #fffdf7, gold #ffe082, teal #158776, ink #30204d. Thai UI uses Leelawadee UI/Tahoma; scores use Trebuchet MS.
- Desktop: question and timer left, office artifact right, four answers beneath. Mobile stacks scenario and question above answers. Reduce motion on request; keep explicit answer confirmation.
- Hide scene/title/slide attribution if admin changes the default content. Retain saved custom questions, never silently reset them.

## Tasks

- [x] 1. Add behavior tests for safe scene metadata after admin edits, closed-phase histogram without answers, perfect-team recognition including missing answers/voids, and the new default timer. Run tests and verify expected failures.
- [x] 2. Replace bundled question bank with the approved ten questions, scene objects and source slide numbers. Strip obsolete scene metadata on custom content. Update Game.create to 30 seconds; expose distributions in closed phase and perfectTeamIds only after reveal.
- [x] 3. Add public/missions.js and public/missions.css. Render the ten office scenes, round labels, closed-phase suspense, slide attribution, all-correct team badges and final three-second reminder. Register assets in server.js. Update home and admin copy.
- [x] 4. Extend the existing browser runner to check scenes, closed histogram, badges, question metadata across all ten questions, mobile overflow and projector layout. Update README with new rounds/default timer and saved custom-bank reset guidance.
- [x] 5. Run npm test and npm run test:browser against an isolated in-memory test server. Inspect desktop/mobile/projector screenshots; fix layout issues. Request bounded code review and resolve substantive findings. Deliver working local changes without deployment.

## Verification commands

```powershell
node --test tests/questions.test.js tests/game.test.js
npm test
$env:TEST_URL='http://127.0.0.1:3100'
npm run test:browser
git diff --check
```

Expected: complete tests pass; ten-question end-to-end game and equal normalized ranking remain correct, no browser errors or horizontal overflow, no solution before reveal.

## Verification results

- npm test: 41 passed.
- npm run test:browser: passed complete 20-player, 10-question flow including new scenes, closed histogram and perfect-team badges.
- Additional visual QA: all ten questions at 1280x720 and 390x844; no projector scrolling; all mobile answer buttons reachable; screenshots inspected.
- Independent code review: no substantive findings; legacy snapshots and edited custom banks checked.
- Existing public/live.css and public/room.css match the pre-task baseline byte-for-byte.
- Local app running at http://localhost:3000; no deployment or database reset.
