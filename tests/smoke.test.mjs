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
  for (const feature of ['brickTexture', 'concreteTexture', 'asphaltTexture', 'sidewalkTexture', 'windowFrameMesh', 'windowLightMesh', 'nightLights', 'toneMappingExposure', 'rainLines', 'puddleGroup', 'function cycleWeather', 'function handleActivity', 'deliveryMarker', 'marketSignCanvas', 'function streetBin', 'function hydrant', 'function streetSign', 'streetSigns', 'licensePlateMaterial', 'doorHandle', 'wheelRigs', 'wheelRotations', 'M.headlight.emissiveIntensity', 'const landmarks', 'updateActivityHud', 'clearInputState']) {
    assert.ok(game.includes(feature), 'Missing V2 visual feature: ' + feature);
  }
});

test('V2 visual polish adds neighborhood landmarks and readable road materials', () => {
  for (const feature of [
    'function fireEscape', 'function courtyardPlanter', 'function createMural',
    'fireEscape(-45,-18.3,4)', 'courtyardPlanter(-55,31', 'createMural(-101.78,-38.5)',
    'visualDetailCounts', '6200;i++', 'M.road.color.setHex(0xffffff)',
    'M.walk.color.setHex(0xffffff)', 'M.brick.color.setHex(0xffffff)'
  ]) {
    assert.ok(game.includes(feature), 'Missing V2 visual upgrade: ' + feature);
  }
  assert.match(game, /new THREE\\.HemisphereLight\\([^\\n]+1\\.62\\)/);
  assert.match(game, /ambientLight\\.intensity=\\(\\.72\\+daylight\\*\\.86\\)/);
});

test('V2 sedan has detailed rotating wheels while retaining plates and door handles', () => {
  for (const feature of [
    'wheelSpokeCount=0', 'new THREE.TorusGeometry(.205,.028,8,22)',
    'spoke.rotation.x=angle', 'g.userData.wheelSpokes=wheelSpokeCount',
    'g.userData.wheelArches=4', 'g.userData.plates=2;g.userData.doorHandles=4'
  ]) {
    assert.ok(game.includes(feature), 'Missing sedan detail: ' + feature);
  }
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