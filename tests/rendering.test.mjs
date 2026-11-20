import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdaptiveResolutionController,
  createGraphicsProfile
} from '../rendering.js';
import { getAtmosphereState } from '../atmosphere.js';

test('desktop profile starts at high pixel density with a larger shadow map', () => {
  const profile = createGraphicsProfile({
    devicePixelRatio: 2,
    isCoarsePointer: false,
    maxTextureSize: 8192
  });
  assert.equal(profile.name, 'desktop-ultra');
  assert.equal(profile.initialPixelRatio, 1.6);
  assert.equal(profile.shadowMapSize, 1536);
  assert.equal(profile.shadowsEnabled, true);
  assert.equal(profile.adaptiveResolution, true);
});

test('mobile profile keeps touch rendering within a practical budget', () => {
  const profile = createGraphicsProfile({
    devicePixelRatio: 3,
    isCoarsePointer: true,
    maxTextureSize: 4096
  });
  assert.equal(profile.name, 'mobile-high');
  assert.equal(profile.initialPixelRatio, 1.2);
  assert.equal(profile.shadowMapSize, 768);
  assert.equal(profile.renderEveryNthFrame, 1);
});

test('automation profile remains lightweight and does not adapt', () => {
  const profile = createGraphicsProfile({
    automationMode: true,
    devicePixelRatio: 2,
    maxTextureSize: 4096
  });
  assert.equal(profile.initialPixelRatio, 0.55);
  assert.equal(profile.shadowsEnabled, false);
  assert.equal(profile.adaptiveResolution, false);
  assert.equal(profile.renderEveryNthFrame, 3);
});

test('adaptive resolution lowers pixel ratio after sustained slow frames', () => {
  const calls = [];
  const renderer = {
    setPixelRatio: value => calls.push(['ratio', value]),
    setSize: (width, height, updateStyle) => calls.push(['size', width, height, updateStyle])
  };
  const profile = createGraphicsProfile({ devicePixelRatio: 2 });
  const controller = createAdaptiveResolutionController(renderer, profile, {
    getViewport: () => ({ width: 1440, height: 900 })
  });

  for (let window = 0; window < 2; window++) {
    for (let i = 0; i < 90; i++) controller.update(0.024, true);
  }
  assert.ok(controller.pixelRatio < 2);
  assert.equal(calls.at(-2)[0], 'ratio');
  assert.deepEqual(calls.at(-1), ['size', 1440, 900, true]);
  assert.match(controller.getSnapshot().lastChangeReason, /frame time/);
});

test('adaptive resolution recovers cautiously after sustained headroom', () => {
  const renderer = { setPixelRatio() {}, setSize() {} };
  const profile = createGraphicsProfile({ devicePixelRatio: 2 });
  const controller = createAdaptiveResolutionController(renderer, profile);
  for (let window = 0; window < 5; window++) {
    for (let i = 0; i < 90; i++) controller.update(0.014, true);
  }
  assert.ok(controller.pixelRatio > 1.6 - 0.001);
});

test('adaptive controller ignores suspended-tab deltas and disabled updates', () => {
  const renderer = { setPixelRatio() {}, setSize() {} };
  const profile = createGraphicsProfile({ devicePixelRatio: 2 });
  const controller = createAdaptiveResolutionController(renderer, profile);
  for (let i = 0; i < 120; i++) controller.update(0.5, true);
  for (let i = 0; i < 120; i++) controller.update(0.01, false);
  assert.equal(controller.pixelRatio, profile.initialPixelRatio);
});

test('V4.3 atmosphere model separates day, golden hour, night and weather', () => {
  const noon = getAtmosphereState(12, 'clear');
  const sunset = getAtmosphereState(18, 'clear');
  const night = getAtmosphereState(0, 'clear');
  const rain = getAtmosphereState(12, 'rain');
  const fog = getAtmosphereState(12, 'fog');
  assert.ok(noon.daylight > 0.99);
  assert.ok(sunset.goldenHour > 0.5);
  assert.equal(night.daylight, 0);
  assert.ok(night.night > 0.99);
  assert.ok(rain.sunIntensity < noon.sunIntensity);
  assert.ok(fog.fogFar < rain.fogFar);
  assert.ok(rain.cloudOpacity > noon.cloudOpacity);
  assert.ok(noon.environmentIntensity > night.environmentIntensity);
  assert.equal(getAtmosphereState(-6, 'clear').hour, 18);
});


test('desktop graphics profile caps resolution and shadows for performance', () => {
  const profile = createGraphicsProfile({ devicePixelRatio: 2.5, maxTextureSize: 8192 });
  assert.equal(profile.initialPixelRatio, 1.6);
  assert.equal(profile.minimumPixelRatio, 0.85);
  assert.equal(profile.shadowMapSize, 1536);
});
