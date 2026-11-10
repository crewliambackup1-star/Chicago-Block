import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173/';
await mkdir('artifacts', { recursive: true });

async function sendKey(page, key, type = 'keydown') {
  await page.evaluate(({ key, type }) => {
    document.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
  }, { key, type });
}

async function waitForReady(page) {
  await page.goto(baseUrl + '?automation=1', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    () => document.querySelector('#loading')?.textContent === 'Neighborhood ready',
    null,
    { timeout: 60000 }
  );
  assert.equal(await page.locator('#game canvas').count(), 1, '3D renderer canvas should exist');
  const canvasData = await page.locator('#game canvas').evaluate(canvas => canvas.toDataURL('image/png'));
  assert.ok(canvasData.startsWith('data:image/png;base64,'), 'renderer canvas should produce an image');
}

test('desktop browser playthrough: movement, camera, weather, snapshots, delivery, and driving', async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await waitForReady(page);
    await page.screenshot({ path: 'artifacts/v2-chromium-before-play.png' });
    await page.locator('#playButton').click();
    await page.waitForFunction(() => window.__CHICAGO_BLOCK_TEST__?.getState().started === true);
    const initial = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    assert.equal(initial.pedestrians, 20);
    assert.equal(initial.traffic, 7);
    await sendKey(page, 'w', 'keydown');
    await page.waitForTimeout(500);
    await sendKey(page, 'w', 'keyup');
    const walkingState = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    assert.ok(walkingState.player.z < initial.player.z, 'W should move the player forward');

    await sendKey(page, 'v');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).firstPerson, true);

    await sendKey(page, 'r');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).weatherMode, 'rain');
    await sendKey(page, 'r');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).weatherMode, 'fog');
    await sendKey(page, 'r');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).weatherMode, 'clear');

    const snapshotLocations = [[-91, -40], [-5, -92], [92, 44], [-48, 52], [12, 93]];
    for (const [x, z] of snapshotLocations) {
      await page.evaluate(([nextX, nextZ]) => window.__CHICAGO_BLOCK_TEST__.teleport(nextX, nextZ), [x, z]);
      await sendKey(page, 'f');
    }
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).discoveredLandmarks, 5);

    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.teleport(39, -27));
    await sendKey(page, 'f');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).carryingPackage, true);
    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.teleport(-35, 38));
    await sendKey(page, 'f');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).deliveriesCompleted, 1);

    await page.evaluate(() => {
      const state = window.__CHICAGO_BLOCK_TEST__.getState();
      window.__CHICAGO_BLOCK_TEST__.teleport(state.car.x, state.car.z);
    });
    await sendKey(page, 'e');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).inCar, true);
    const headingBefore = (await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).car.heading;
    await sendKey(page, 'w', 'keydown');
    await page.waitForTimeout(350);
    await sendKey(page, 'a', 'keydown');
    await page.waitForTimeout(350);
    await sendKey(page, 'a', 'keyup');
    await sendKey(page, 'w', 'keyup');
    const leftState = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    assert.ok(leftState.car.heading > headingBefore + 0.05, 'A should rotate the moving car left');
    assert.notEqual(leftState.car.z, -14, 'the car should move when W is held');

    await sendKey(page, 'w', 'keydown');
    await sendKey(page, 'd', 'keydown');
    await page.waitForTimeout(350);
    await sendKey(page, 'd', 'keyup');
    await sendKey(page, 'w', 'keyup');
    const rightState = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    assert.ok(rightState.car.heading < leftState.car.heading - 0.05, 'D should rotate the moving car right');
    await sendKey(page, 'e');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).inCar, false);

    await page.screenshot({ path: 'artifacts/v2-chromium-after-play.png' });
    assert.deepEqual(pageErrors, [], 'page should not throw runtime exceptions');
  } finally {
    await browser.close();
  }
});

test('mobile-size WebKit playthrough: responsive controls and touch buttons', async () => {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await waitForReady(page);
    await page.locator('#playButton').tap();
    await page.waitForFunction(() => window.__CHICAGO_BLOCK_TEST__?.getState().started === true);
    assert.equal(await page.locator('#mobile').isVisible(), true, 'mobile control dock should be visible');
    const beforeMove = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState().player.z);
    const forwardButton = page.locator('[data-key="forward"]');
    const bounds = await forwardButton.boundingBox();
    assert.ok(bounds, 'mobile forward button should be visible');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(250);
    await page.mouse.up();
    const afterMove = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState().player.z);
    assert.ok(afterMove < beforeMove, 'holding the mobile forward control should move the player');
    await page.locator('#weatherButton').tap();
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).weatherMode, 'rain');
    await page.locator('#cameraButton').tap();
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).firstPerson, true);
    await page.locator('#activityButton').tap();
    assert.equal(await page.locator('#objectiveText').count(), 1);
    await page.screenshot({ path: 'artifacts/v2-webkit-mobile.png' });
    assert.deepEqual(pageErrors, [], 'WebKit page should not throw runtime exceptions');
  } finally {
    await context.close();
    await browser.close();
  }
});
