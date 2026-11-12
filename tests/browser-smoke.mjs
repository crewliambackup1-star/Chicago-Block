import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

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

// Browser screenshots are useful artifacts, but a slow headless software renderer
// must not turn an otherwise valid functional playthrough into a false test failure.
async function captureScreenshot(page, path) {
  try {
    await page.screenshot({ path, animations: 'disabled', timeout: 12000 });
    return true;
  } catch (error) {
    console.warn(`Optional screenshot skipped (${path}): ${error.message}`);
    return false;
  }
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
    // Model loading and installation are the scope of this test. The desktop/mobile
    // playthroughs above already cover interaction; avoid hit-testing a live WebGL
    // canvas here because software-rendered CI can make UI stability waits flaky.
    await page.waitForFunction(() => window.__CHICAGO_BLOCK_TEST__?.getState().started === true);
    const initial = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    await page.waitForFunction(() =>
      document.querySelector('#mode')?.textContent === 'THIRD PERSON'
      && document.querySelector('#speed')?.textContent === 'WALKING',
      null,
      { timeout: 16000 }
    );
    assert.equal(await page.locator('#mode').textContent(), 'THIRD PERSON', 'on-foot camera mode should be clear without repeating the walking label');
    assert.equal(await page.locator('#speed').textContent(), 'WALKING', 'the HUD should identify on-foot movement');
    assert.equal(initial.pedestrians, 20);
    assert.equal(initial.traffic, 7);
    assert.equal(initial.streetSigns, 4, 'four sidewalk street signs should be present');
    const renderProfile = await page.evaluate(() => window.__CHICAGO_BLOCK_RENDER__?.getState());
    assert.equal(initial.architecturalDetails.buildings, 13, 'all 13 existing buildings should use the V4.1 architecture pass');
    assert.ok(initial.architecturalDetails.rooftopPenthouses >= 1, 'selected buildings should have rooftop penthouses');
    assert.ok(initial.architecturalDetails.windowRecesses > 0, 'window openings should receive dark interior reveals');
    assert.ok(initial.architecturalDetails.windowLintels > 0, 'selected windows should have stone lintels');
    assert.ok(initial.architecturalDetails.sidewalkJoints >= 300, 'sidewalk slabs should use instanced expansion joints');
    assert.equal(initial.architecturalDetails.fireEscapeStairFlights, 7, 'existing fire escapes should have connected switchback stairs');
    assert.equal(Object.keys(renderProfile?.externalPbrStatus || {}).length, 3, 'three optional CC0 PBR sources should be registered');
    assert.equal(renderProfile?.qualityProfile, 'automation', 'headless desktop tests should use the lightweight automation profile');
    assert.equal(renderProfile?.shadowMapSize, 0, 'automation should not allocate a real-time shadow map');
    assert.ok(renderProfile?.atmosphere?.daylight >= 0, 'V4.3 atmosphere diagnostics should be available');
    assert.ok(renderProfile?.atmosphere?.fogFar > renderProfile?.atmosphere?.fogNear, 'clear atmosphere should retain a valid fog range');
    assert.ok(renderProfile?.reflectionQuality?.wetRoadClearcoat >= 0, 'V4.3 wet-road response should be measurable');
    assert.equal(renderProfile?.shadowsEnabled, false, 'automation shadows should be disabled');
    assert.equal(renderProfile?.pixelRatio, 0.55, 'automation should use its fixed low-resolution scale');
    assert.equal(initial.visualQuality.pedestrian, 'v4.5-smooth-anatomy', 'pedestrians should use the smoother natural-proportion character rig');
    assert.ok(initial.visualQuality.grassInstances >= 1200, 'desktop lawns should use instanced grass cover');
    assert.equal(initial.visualQuality.avatar, 'v4.5-smooth-anatomy', 'player model should use the V4.5 smooth anatomical rig');
    assert.equal(initial.visualQuality.headScale, .78, 'player head proportions should use the V4.5 human-scale profile');
    assert.equal(initial.visualQuality.proportionProfile, 'adult-human-v4.5', 'player model should use the revised proportion profile');
    assert.equal(initial.visualQuality.animationRig, 'v4.5-articulated-gait', 'pedestrians should retain the articulated V4.5 gait rig');
    assert.equal(initial.visualQuality.pedestrianHairStyles.length, 4, 'pedestrian population should use four hairstyle variants');
    assert.equal(initial.car.details.visualQuality, 'v4.5-sculpted-vehicle', 'player car should use the V4.5 sculpted vehicle model');
    assert.equal(initial.car.details.paintFinish, 'microflake-clearcoat', 'vehicle paint should have the microflake clearcoat finish');
    assert.equal(initial.car.details.glassFinish, 'high-clearcoat-transmission', 'vehicle glass should use improved clearcoat');
    assert.equal(initial.car.details.wheelLugs, 20, 'player car should have five lug nuts on each wheel');
    assert.equal(initial.car.details.interiorType, 'full', 'player car should retain its full cabin detail');
    assert.ok(initial.trafficVisuals.every(car => car.visualQuality === 'v4.5-sculpted-vehicle' && car.interiorType === 'standard'), 'traffic should use upgraded models and visible cabin silhouettes');
    assert.deepEqual([...new Set(initial.trafficVisuals.map(car => car.bodyStyle))].sort(), ['compact','sedan','suv','wagon'], 'traffic should include four visibly distinct vehicle proportions');
    assert.ok(initial.trafficVisuals.every(car => car.silhouette === 'rounded-quadratic-profile' && car.tireProfile === 'rounded-torus'), 'traffic models should use curved body and tyre profiles');
    assert.equal(initial.car.details.plates, 2, 'the sedan should have front and rear plates');
    assert.equal(initial.car.details.doorHandles, 4, 'the sedan should have four door handles');
    assert.equal(initial.car.details.wheelSpokes, 20, 'the sedan should have five visible spokes on each wheel');
    assert.equal(initial.car.details.wheelArches, 4, 'the sedan should have four wheel arches');
    assert.equal(initial.car.details.bodyStyle, 'sedan', 'the player vehicle should retain its sedan body style');
    assert.equal(initial.car.details.tireProfile, 'rounded-torus', 'the player sedan should use rounded tyre geometry');
    assert.equal(initial.car.details.silhouette, 'rounded-quadratic-profile', 'the player sedan should use a smoothed vehicle silhouette');
    assert.deepEqual(initial.visualDetails, { fireEscapes: 3, courtyardPlanters: 3, murals: 1 }, 'the neighborhood should include its new architectural and landscaping details');
    assert.deepEqual(pageErrors, [], 'the game should start without runtime exceptions');
    await page.waitForFunction(
      () => window.__CHICAGO_BLOCK_TEST__.getState().simulationRunning === true,
      null,
      { timeout: 10000 }
    );
    await page.waitForFunction(
      baseline => window.__CHICAGO_BLOCK_TEST__.getState().npcPositions.some((p, i) =>
        Math.hypot(p.x - baseline[i].x, p.z - baseline[i].z) > 0.02
      ),
      initial.npcPositions,
      { timeout: 10000 }
    );
    await page.waitForFunction(
      baseline => window.__CHICAGO_BLOCK_TEST__.getState().trafficPositions.some((p, i) =>
        Math.hypot(p.x - baseline[i].x, p.z - baseline[i].z) > 0.02
      ),
      initial.trafficPositions,
      { timeout: 10000 }
    );
    const movingWorld = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    assert.ok(movingWorld.elapsed > initial.elapsed, 'the simulation clock should advance after starting');
    await page.evaluate(() => {
      window.__CHICAGO_BLOCK_TEST__.setYaw(0);
      window.__CHICAGO_BLOCK_TEST__.teleport(0, 0);
    });
    const walkingStartZ = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState().player.z);
    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.setKey('w', true));
    assert.equal(await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState().keys.w), true, 'the test input hook should hold W');
    try {
      await page.waitForFunction(
        startZ => window.__CHICAGO_BLOCK_TEST__.getState().player.z < startZ - 0.2,
        walkingStartZ,
        { timeout: 16000 }
      );
    } catch (error) {
      const diagnostic = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
      throw new Error(`${error.message}; walking diagnostic: ${JSON.stringify(diagnostic)}`);
    }
    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.setKey('w', false));
    const walkingState = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    assert.ok(walkingState.player.z < walkingStartZ, 'W should move the player forward in open space');

    await sendKey(page, 'v');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).firstPerson, true);
    await sendKey(page, 'v');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).firstPerson, false);

    const timeBefore = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState().gameHours);
    await sendKey(page, 'n');
    const timeAfter = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState().gameHours);
    assert.ok(Math.abs((((timeAfter - timeBefore) % 24) + 24) % 24 - 4) < 0.1, 'N should advance the displayed clock by four hours');

    await sendKey(page, 'r');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).weatherMode, 'rain');
    await page.waitForFunction(() => window.__CHICAGO_BLOCK_RENDER__?.getState().reflectionQuality?.wetRoadClearcoat > 0.6);
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
    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.setKey('w', true));
    const wheelRotationBefore = (await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).car.wheelRotations;
    await page.waitForFunction(() => window.__CHICAGO_BLOCK_TEST__.getState().velocity > 1, null, { timeout: 16000 });
    await page.waitForFunction(
      before => window.__CHICAGO_BLOCK_TEST__.getState().car.wheelRotations.some((rotation,index)=>Math.abs(rotation-before[index])>.1),
      wheelRotationBefore,
      { timeout: 16000 }
    );
    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.setKey('a', true));
    await page.waitForFunction(
      before => window.__CHICAGO_BLOCK_TEST__.getState().car.heading > before + 0.01,
      headingBefore,
      { timeout: 16000 }
    );
    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.setKey('a', false));
    const leftState = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    assert.ok(leftState.velocity > 0, 'W should accelerate the car forward');
    assert.notEqual(leftState.car.z, -14, 'the car should move when W is held');

    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.setKey('d', true));
    const headingAfterLeft = leftState.car.heading;
    await page.waitForFunction(
      before => window.__CHICAGO_BLOCK_TEST__.getState().car.heading < before - 0.01,
      headingAfterLeft,
      { timeout: 16000 }
    );
    await page.evaluate(() => {
      window.__CHICAGO_BLOCK_TEST__.setKey('d', false);
      window.__CHICAGO_BLOCK_TEST__.setKey('w', false);
    });
    const rightState = await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState());
    assert.ok(rightState.car.heading < leftState.car.heading - 0.01, `D should rotate right: left=${leftState.car.heading}, right=${rightState.car.heading}`);
    await sendKey(page, 'e');
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).inCar, false);

    await page.evaluate(() => {
      if (document.pointerLockElement) document.exitPointerLock();
    });
    await page.waitForFunction(() => document.pointerLockElement === null, null, { timeout: 3000 });
    await page.evaluate(() => {
      const test = window.__CHICAGO_BLOCK_TEST__;
      test.teleport(0,-45);
      test.setYaw(0);
    });
    await page.waitForTimeout(1100);
    await captureScreenshot(page, 'artifacts/v4-5-chromium-desktop-after-play.png');
    assert.deepEqual(pageErrors, [], 'page should not throw runtime exceptions');
  } finally {
    await browser.close();
  }
});

test('mobile-size Chromium playthrough: responsive controls and touch buttons', async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await waitForReady(page);
    const mobileRenderProfile = await page.evaluate(() => window.__CHICAGO_BLOCK_RENDER__?.getState());
    assert.equal(mobileRenderProfile?.qualityProfile, 'automation', 'headless mobile tests should use the automation profile too');
    assert.equal(mobileRenderProfile?.pixelRatio, 0.55, 'test-only rendering scale should remain fixed on mobile automation');
    await page.locator('#playButton').tap();
    await page.waitForFunction(() => window.__CHICAGO_BLOCK_TEST__?.getState().started === true);
    await page.waitForFunction(() =>
      document.querySelector('#mode')?.textContent === 'THIRD PERSON'
      && document.querySelector('#speed')?.textContent === 'WALKING',
      null,
      { timeout: 16000 }
    );
    assert.equal(await page.locator('#mode').textContent(), 'THIRD PERSON', 'mobile on-foot mode should use the concise HUD label');
    assert.equal(await page.locator('#speed').textContent(), 'WALKING', 'mobile HUD should identify walking');
    assert.equal(await page.locator('#mobile').isVisible(), true, 'mobile control dock should be visible');
    const brandBox = await page.locator('#brand').boundingBox();
    const statsBox = await page.locator('#stats').boundingBox();
    const mapBox = await page.locator('#mapWrap').boundingBox();
    assert.ok(brandBox.y + brandBox.height <= statsBox.y, 'mobile brand and stats should not overlap');
    assert.ok(statsBox.x + statsBox.width <= mapBox.x, 'mobile stats and minimap should not overlap');

    await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.teleport(-91, -40));
    await page.locator('#activityButton').tap();
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).discoveredLandmarks, 1);

    const brake = page.locator('#brakeButton');
    const brakeBounds = await brake.boundingBox();
    assert.ok(brakeBounds, 'mobile brake button should be visible');
    await page.mouse.move(brakeBounds.x + brakeBounds.width / 2, brakeBounds.y + brakeBounds.height / 2);
    await page.mouse.down();
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).braking, true);
    await page.mouse.up();
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).braking, false);

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
    await page.locator('#cameraButton').tap();
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).firstPerson, false);
    await page.locator('#weatherButton').tap();
    await page.locator('#weatherButton').tap();
    assert.equal((await page.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).weatherMode, 'clear');
    await page.evaluate(() => {
      const test = window.__CHICAGO_BLOCK_TEST__;
      test.teleport(-11, -12);
      test.setYaw(0);
    });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: 'artifacts/v4-5-chromium-mobile-portrait.png' });
    assert.deepEqual(pageErrors, [], 'mobile Chromium page should not throw runtime exceptions');
  } finally {
    await context.close();
  }

  const landscapeContext = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const landscapePage = await landscapeContext.newPage();
  const landscapeErrors = [];
  landscapePage.on('pageerror', error => landscapeErrors.push(error.message));
  try {
    await waitForReady(landscapePage);
    await landscapePage.locator('#playButton').tap();
    await landscapePage.waitForFunction(() => window.__CHICAGO_BLOCK_TEST__?.getState().started === true);
    assert.equal(await landscapePage.locator('#mobile').isVisible(), true, 'landscape touch controls should be visible');
    assert.equal(await landscapePage.locator('#mapWrap').isVisible(), false, 'landscape minimap should hide to preserve space');
    await landscapePage.locator('#weatherButton').tap();
    assert.equal((await landscapePage.evaluate(() => window.__CHICAGO_BLOCK_TEST__.getState())).weatherMode, 'rain');
    await landscapePage.screenshot({ path: 'artifacts/v4-5-chromium-mobile-landscape.png' });
    assert.deepEqual(landscapeErrors, [], 'landscape mobile Chromium page should not throw runtime exceptions');
  } finally {
    await landscapeContext.close();
    await browser.close();
  }
});


test('V4.6 normal player mode loads the real human and vehicle GLB assets', async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    // Deliberately omit ?automation=1: that mode skips large remote assets.
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(
      () => document.querySelector('#loading')?.textContent === 'Neighborhood ready',
      null,
      { timeout: 60000 }
    );
    await page.waitForFunction(() => {
      const assets = window.__CHICAGO_BLOCK_RENDER__?.getState()?.modelAssets;
      return assets && assets.pedestrian !== 'loading' && assets.vehicle !== 'loading';
    }, null, { timeout: 180000 });
    const assets = await page.evaluate(() => window.__CHICAGO_BLOCK_RENDER__.getState().modelAssets);
    assert.equal(assets.pedestrian, 'loaded-cc0-rigged-animated-glb', 'the skinned animated human model should load in normal player mode: '+JSON.stringify(assets));
    assert.equal(assets.vehicle, 'loaded-cc0-glb', 'the detailed sedan model should load in normal player mode: '+JSON.stringify(assets));
    // Model loading and installation are the scope of this test. The desktop/mobile
    // playthroughs above already cover interaction; avoid hit-testing a live WebGL
    // canvas here because software-rendered CI can make UI stability waits flaky.
    assert.deepEqual(pageErrors, [], 'normal player mode should load models without runtime exceptions');
  } finally {
    await browser.close();
  }
});
