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
  assert.match(html, /UPDATE 4\.0/);
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
  assert.ok(game.includes('new THREE.HemisphereLight(0xd9e7f0,0x59614f,1.62)'));
  assert.ok(game.includes("ambientLight.intensity=(.72+daylight*.86)*(weatherMode==='fog'?.9:1);"));
});

test('V2 sedan uses a sloped, beveled body and separate cabin glass', () => {
  for (const feature of [
    'new THREE.ExtrudeGeometry(profile',
    'bevelEnabled:true,bevelSegments:3',
    'extrudedProfile([',
    'const addSideWindow=',
    'new THREE.PlaneGeometry(1.5,.5)',
    'const rearGlass='
  ]) {
    assert.ok(game.includes(feature), 'Missing improved sedan geometry: ' + feature);
  }
  assert.ok(!game.includes('cube(g,0,.76,0,2.1,.82,4.35,bodyMat)'), 'The old rectangular car body should be removed');
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

test('V3 renderer uses soft shadows, reflection environment, and adaptive detail', () => {
  assert.match(game, /PCFSoftShadowMap/);
  assert.match(game, /scene\.environment=environmentTexture/);
  assert.match(game, /new THREE\.MeshPhysicalMaterial/);
  assert.match(game, /bumpMap=brickHeight/);
  assert.match(game, /roughnessMap=asphaltHeight/);
  assert.match(game, /renderPixelRatio/);
  assert.match(game, /function manhole/);
  assert.match(game, /function stormDrain/);
  assert.match(game, /windowSillMesh/);
  assert.match(game, /v4-rendering-foundation/);
});

test('car steering maps A/left to left and D/right to right', () => {
  assert.equal(getCarSteeringInput(true, false), 1, 'A / Left Arrow should steer left');
  assert.equal(getCarSteeringInput(false, true), -1, 'D / Right Arrow should steer right');
  assert.equal(getCarSteeringInput(false, false), 0, 'No input should not steer');
  assert.equal(getCarSteeringInput(true, true), 0, 'Opposing simultaneous inputs should cancel');
});

test('README documents the V3 graphics scope and validation commands', () => {
  assert.match(readme, /V4\.0 Photorealism Foundation/);
  assert.match(readme, /rendering foundation/);
  assert.match(readme, /npm test/);
  assert.match(readme, /npm run check/);
  assert.match(readme, /fictional/);
  assert.match(readme, /package delivery/);
  assert.match(readme, /weather states/);
  assert.match(readme, /all five collectibles/);
  assert.match(readme, /Chromium and WebKit/);
});
test('V3.1 adds textured clothing and skin, refined human models, facades, vehicles and landscaping', () => {
  for (const feature of [
    'const fabricTexture=makeTexture', 'const skinTexture=makeTexture',
    'function person(material,appearance=0)', 'v3.1-anatomical-textured',
    'M.siding=mat', 'M.stucco=mat', 'const sidingHeight=', 'const woodTexture=makeTexture', 'const brushedMetalTexture=makeTexture',
    'function addGrassCover()', 'world.userData.grassInstances=placed', 'new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.105,1)',
    'panel gaps', 'projector-style lamps', 'v3.1-model-textures'
  ]) {
    assert.ok(game.includes(feature), 'Missing V3.1 visual feature: ' + feature);
  }
});
