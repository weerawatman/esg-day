import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createApp } from '../server.js';

test('large live room stays clear on phones and 16:9 screens', { timeout: 90000 }, async t => {
  const server = createApp({ persist: false });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const call = async (path, body, token) => {
    const response = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    assert.equal(response.ok, true, JSON.stringify(data));
    return data;
  };

  try {
    const room = await call('/api/rooms', {});
    const first = await call(`/api/rooms/${room.code}/join`, { teamName: 'Audit Team 1' });
    for (let i = 2; i <= 20; i++) await call(`/api/rooms/${room.code}/join`, { teamName: `Audit Team ${i}` });
    await call(`/api/rooms/${room.code}/control`, { action: 'settings', seconds: 15 }, room.hostToken);
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const player = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await player.addInitScript(({ code, token }) => localStorage.setItem(`dg:player:${code}`, token), { code: room.code, token: first.token });
    await player.goto(`${base}/?join=${room.code}`);
    await call(`/api/rooms/${room.code}/control`, { action: 'start' }, room.hostToken);
    await player.locator('[data-choice="1"]').waitFor({ timeout: 10000 });
    await player.locator('[data-choice="1"]').click();
    await player.locator('#app[data-phase="closed"]').waitFor({ timeout: 25000 });

    await t.test('an unsubmitted choice loses its checkmark when time expires', async () => {
      const state = await call(`/api/rooms/${room.code}`);
      assert.equal(state.answered, 0);
      assert.equal(await player.locator('.live-options .option.selected').count(), 0);
      assert.equal(await player.locator('.live-options .answer-check').count(), 0);
    });

    await call(`/api/rooms/${room.code}/control`, { action: 'reveal' }, room.hostToken);
    await call(`/api/rooms/${room.code}/control`, { action: 'leaderboard' }, room.hostToken);
    const screen = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await screen.goto(`${base}/?screen=${room.code}`);
    await screen.locator('.ranking-row').first().waitFor();

    await t.test('20 teams fit on each projected leaderboard page', async () => {
      for (const [width, height] of [[1366, 768], [1920, 1080]]) {
        await screen.setViewportSize({ width, height });
        const metrics = await screen.evaluate(() => {
          const main = document.querySelector('main');
          return { scroll: main.scrollHeight - main.clientHeight, rows: document.querySelectorAll('.ranking-row').length };
        });
        assert.ok(metrics.scroll <= 1, `${width}x${height}: main scrolls ${metrics.scroll}px`);
        assert.ok(metrics.rows <= 8, `${width}x${height}: ${metrics.rows} rows shown at once`);
        if (width === 1366) {
          await mkdir('output/playwright', { recursive: true });
          await screen.screenshot({ path: 'output/playwright/leaderboard-20-fixed.png', animations: 'disabled' });
        }
      }
    });

    await t.test('the projected leaderboard rotates through every team', async () => {
      await screen.locator('.ranking-page', { hasText: 'หน้า 2/3' }).waitFor({ timeout: 10000 });
      assert.match(await screen.locator('.ranking-list').innerText(), /Audit Team 9/);
      await screen.locator('.ranking-page', { hasText: 'หน้า 3/3' }).waitFor({ timeout: 10000 });
      assert.match(await screen.locator('.ranking-list').innerText(), /Audit Team 20/);
    });

    await t.test('all teams remain available on a phone without horizontal overflow', async () => {
      await screen.setViewportSize({ width: 390, height: 844 });
      await screen.reload();
      await screen.locator('.ranking-row').first().waitFor();
      assert.equal(await screen.locator('.ranking-row').count(), 20);
      assert.equal(await screen.evaluate(() => document.documentElement.scrollWidth), 390);
    });
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
