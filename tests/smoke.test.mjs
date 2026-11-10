import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCarSteeringInput } from '../controls.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

test('page loads the game module and includes essential controls', () => {
  assert.match(html, /<script type="module" src="\.\/game\.js"><\/script>/);
  for (const id of ['game', 'startScreen', 'playButton', 'minimap', 'objectiveText', 'mode', 'speed', 'interactButton', 'cameraButton', 'brakeButton', 'activityButton', 'weatherButton', 'collectionLabel']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing required element: ' + id);
  }
  assert.match(html, /UPDATE 2/);
  assert.ok(html.includes('id="weatherLabel"'), 'Missing weather status');
});

test('V1 gameplay systems remain present after the V2 visual pass', () => {
  for (const feature of ['function movePlayer', 'function updateCamera', 'function walkNPCs', 'function moveTraffic', 'function interact', 'const playerCar', 'const routes', 'const roadLoop']) {
    assert.ok(game.includes(feature), 'Missing expected game feature: ' + feature);
  }
  assert.match(game, /for\(let i=0;i<20;i\+\+\)/);
  assert.match(game, /for\(let i=0;i<7;i\+\+\)/);
});

test('V2 contains procedural materials, facade detail, and dynamic lamps', () => {
  for (const feature of ['brickTexture', 'concreteTexture', 'asphaltTexture', 'sidewalkTexture', 'windowFrameMesh', 'windowLightMesh', 'nightLights', 'toneMappingExposure', 'rainLines', 'puddleGroup', 'function cycleWeather', 'function handleActivity', 'deliveryMarker', 'marketSignCanvas', 'function streetBin', 'function hydrant', 'const landmarks', 'updateActivityHud', 'clearInputState']) {
    assert.ok(game.includes(feature), 'Missing V2 visual feature: ' + feature);
  }
});

test('V2 adds readable street details and animated vehicle wheels', () => {
  for (const feature of ['function createMural', 'function streetSign', 'function fireEscape', 'function courtyardPlanter', 'const wheelAssembly=new THREE.Group()', 'spoke.rotation.x=angle', 'arch.position.set(sx*1.05,.42,sz*1.38)', 'g.userData.wheels=wheels', 'wheel.rotation.x-=velocity*dt/.39', 'vehicleWheelCount', 'carWheelRotations']) {
    assert.ok(game.includes(feature), 'Missing V2 polish feature: ' + feature);
  }
  assert.match(game, /new THREE\.HemisphereLight\([^\n]+1\.62\)/);
  assert.match(game, /ambientLight\.intensity=\(1\.28\+daylight\*\.55\)/);
});

test('mapped road and sidewalk textures are not darkened by duplicate base tints', () => {
  assert.match(game, /M\.brick\.color\.setHex\(0xffffff\)/);
  assert.match(game, /M\.road\.color\.setHex\(0xffffff\)/);
  assert.match(game, /M\.walk\.color\.setHex\(0xffffff\)/);
  assert.match(game, /M\.dark\.color\.setHex\(0xcabbb2\)/);
  assert.match(game, /M\.cream\.color\.setHex\(0xf0e4ce\)/);
});

test('asphalt stays readable under shadowed lighting', () => {
  assert.match(game, /ctx\.fillStyle='#50595e';ctx\.fillRect\(0,0,w,h\)/);
  assert.match(game, /rgba\(17,24,28,\.035\)/);
  assert.match(game, /M\.road\.color\.setHex\(0xffffff\)/);
});

test('dusk and night lighting stays readable across the neighborhood', () => {
  assert.match(game, /ambientLight\.intensity=\(1\.28\+daylight\*\.55\)/);
  assert.match(game, /new THREE\.PointLight\(0xffc77b,0,32,2\)/);
  assert.match(game, /item\.glow\.intensity=night\*2\.6/);
  assert.match(game, /\.29\+daylight\*\.27/);
});

test('renderer uses the current soft shadow-map setting', () => {
  assert.match(game, /renderer\.shadowMap\.type = THREE\.PCFShadowMap/);
  assert.doesNotMatch(game, /PCFSoftShadowMap/);
});

test('car steering maps A/left to left and D/right to right', () => {
  assert.equal(getCarSteeringInput(true, false), 1, 'A / Left Arrow should steer left');
  assert.equal(getCarSteeringInput(false, true), -1, 'D / Right Arrow should steer right');
  assert.equal(getCarSteeringInput(false, false), 0, 'No input should not steer');
  assert.equal(getCarSteeringInput(true, true), 0, 'Opposing simultaneous inputs should cancel');
});

test('README documents the V2 features and validation commands', () => {
  assert.match(readme, /Life on the Streets/);
  assert.match(readme, /npm test/);
  assert.match(readme, /npm run check/);
  assert.match(readme, /fictional/);
  assert.match(readme, /package deliveries/);
  assert.match(readme, /clear, rain, and fog/);
  assert.match(readme, /five collectible neighborhood snapshots/);
  assert.match(readme, /Chromium and WebKit/);
});