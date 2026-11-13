import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCarSteeringInput } from '../controls.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const licenses = readFileSync(new URL('../assets/ASSET_LICENSES.md', import.meta.url), 'utf8');
const modelAssetsJs = readFileSync(new URL('../model-assets.js', import.meta.url), 'utf8');

test('page loads the game module and includes essential controls', () => {
  assert.match(html, /<script type="module" src="\.\/game\.js"><\/script>/);
  for (const id of ['game', 'startScreen', 'playButton', 'minimap', 'objectiveText', 'mode', 'speed', 'interactButton', 'cameraButton', 'brakeButton', 'activityButton', 'weatherButton', 'collectionLabel']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing required element: ' + id);
  }
  assert.match(html, /UPDATE 4\.6 · REALISTIC 3D PEOPLE & VEHICLES/);
  assert.match(html, /Realistic 3D Model Overhaul \(V4\.6\)/);
  assert.match(html, /REALISTIC 3D PEOPLE & VEHICLES · V4\.6/);
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
  assert.ok(game.includes('getAtmosphereState(gameHours,weatherMode)'));
  assert.ok(game.includes('cloudDome.rotation.y'));
  assert.ok(game.includes('moonLight.intensity=night*.24'));
  assert.ok(game.includes("M.road.clearcoat=weatherMode==='rain'?.72:.06"));
});

test('V2 sedan uses a sloped, beveled body and separate cabin glass', () => {
  for (const feature of [
    'new THREE.ExtrudeGeometry(profile',
    'bevelEnabled:true,bevelSegments:5',
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

test('V4 render foundation uses adaptive quality and focused shadows', () => {
  assert.match(game, /PCFSoftShadowMap/);
  assert.match(game, /scene\.environment=environmentTexture/);
  assert.match(game, /createGraphicsProfile/);
  assert.match(game, /createAdaptiveResolutionController/);
  assert.match(game, /adaptiveResolution\.update/);
  assert.match(game, /adaptiveResolution\.resize/);
  assert.match(game, /sun\.target\.position\.set\(player\.x,0,player\.z\)/);
  assert.match(game, /sun\.shadow\.camera\.left=-100/);
  assert.match(game, /v4-3-lighting-atmosphere/);
});

test('car steering maps A/left to left and D/right to right', () => {
  assert.equal(getCarSteeringInput(true, false), 1, 'A / Left Arrow should steer left');
  assert.equal(getCarSteeringInput(false, true), -1, 'D / Right Arrow should steer right');
  assert.equal(getCarSteeringInput(false, false), 0, 'No input should not steer');
  assert.equal(getCarSteeringInput(true, true), 0, 'Opposing simultaneous inputs should cancel');
});

test('README documents V4 scope, preserved gameplay and validation commands', () => {
  assert.match(readme, /V4\.7 World & Environment Realism/);
  assert.match(readme, /V4\.6 high-fidelity people and vehicles/);
  assert.match(readme, /V4\.3 lighting and atmosphere/);
  assert.match(readme, /npm test/);
  assert.match(readme, /npm run check/);
  assert.match(readme, /fictional/);
  assert.match(readme, /package delivery/);
  assert.match(readme, /weather states/);
  assert.match(readme, /all five collectibles/);
  assert.match(readme, /touch-enabled mobile viewport/);
});
test('Current renderer retains the V4.3 atmosphere pipeline', () => {
  assert.match(game, /renderProfile=createGraphicsProfile/);
  assert.match(game, /shadowMapSize/);
  assert.match(game, /__CHICAGO_BLOCK_RENDER__/);
  assert.match(game, /v4-3-lighting-atmosphere/);
});

test('V4.2 retains optional CC0 scanned PBR maps with non-blocking procedural fallbacks', () => {
  for (const feature of [
    'worn-brick-wall', 'asphalt-02', 'concrete-pavement',
    'loadOptionalPbrMap', 'procedural-fallback', 'pbrSourceManifest.forEach(applyOptionalPbrSource)'
  ]) assert.ok(game.includes(feature), 'Missing V4.1 material pipeline feature: ' + feature);
  assert.match(readme, /procedural material fallback/);
});

test('V4.2 retains varied architecture, deep windows, rooftop and sidewalk detail', () => {
  for (const feature of [
    'const floorHeight=style===1?3.15:style===2?3.55:3.3',
    'architecturalDetailCounts.rooftopPenthouses++',
    'windowRecessMesh', 'windowLintelMesh',
    'horizontalJointPositions', 'verticalJointPositions',
    'fireEscapeStairFlights+=stairFlights'
  ]) assert.ok(game.includes(feature), 'Missing V4.1 architectural feature: ' + feature);
  assert.match(readme, /switchback stairs/);
  assert.match(readme, /building-number plaques/);
});
test('V4.5 human models use smoother natural proportions and articulated gait rigs', () => {
  for (const feature of [
    'new THREE.LatheGeometry([', 'g.userData.visualQuality=\'v4.5-smooth-anatomy\'',
    'const headPivot=new THREE.Group()', 'headPivot.scale.setScalar(.78)', 'g.userData.head=headPivot',
    'g.userData.headScale=.78', 'g.userData.hairStyle=', 'g.userData.animationRig=\'v4.5-articulated-gait\'',
    'const elbowPivot=new THREE.Group()', 'const shinPivot=new THREE.Group()',
    'const liftLeft=Math.max(0,Math.sin(phase))*.58',
    'p.g.userData.torso.position.y=1.18+Math.abs(Math.sin(phase*2))*.018'
  ]) assert.ok(game.includes(feature), 'Missing V4.2 character feature: ' + feature);
  assert.match(readme, /four distinct procedural hairstyles/);
  assert.match(readme, /gait cycle/);
});

test('V4.5 vehicles use rounded silhouettes, soft wheel geometry and distinct traffic body styles', () => {
  for (const feature of [
    'const vehiclePaintTexture=makeTexture', 'vehiclePaintHeight',
    'roughness:.22,metalness:.56', 'windowMaterial.clearcoatRoughness=.045',
    'const panelLineMaterial=', 'const lugMaterial=', 'g.userData.wheelLugs=wheelLugCount',
    'g.userData.visualQuality=\'v4.5-sculpted-vehicle\'', 'profile.quadraticCurveTo(',
    'new THREE.TorusGeometry(.285,.105,16,48)', 'roofShape.quadraticCurveTo(', 'vehicleStyle===\'suv\'',
    'vehicleStyle===\'wagon\'', 'vehicleStyle===\'compact\'', 'g.userData.tireProfile=\'rounded-torus\'',
    'g.userData.paintFinish=\'microflake-clearcoat\'', 'g.userData.interiorType=detailedInterior?'
  ]) assert.ok(game.includes(feature), 'Missing V4.2 vehicle feature: ' + feature);
  assert.match(readme, /wheel lug nuts/);
  assert.match(readme, /traffic cars/);
  assert.match(readme, /four distinct traffic body-size variants/);
});

test('V4.6 loads real CC0 human and vehicle GLB assets with safe procedural fallbacks', async () => {
  const { V46_MODEL_ASSET_URLS } = await import('../model-assets.js');
  assert.ok(new URL(V46_MODEL_ASSET_URLS.pedestrian).pathname.endsWith('/assets/models/human-locomotion.glb'));
  assert.ok(new URL(V46_MODEL_ASSET_URLS.vehicle).pathname.endsWith('/assets/models/sedan-exterior.glb'));
  for (const feature of [
    'loadModelAssets','new THREE.LOD()','installHumanAssets','installVehicleAsset',
    'updateVehicleAssetLods','procedural-fallback','automation-fallback',
    'v4.6-cc0-rigged-animated-human-glb','v4.6-cc0-realistic-vehicle-glb'
  ]) assert.ok(game.includes(feature)||modelAssetsJs.includes(feature),'Missing V4.6 feature: '+feature);
  assert.match(readme,/skinned skeleton and seven named locomotion clips/);
  assert.match(game,/new THREE.AnimationMixer\(model\)/);
  assert.match(game,/switchHumanAnimation/);
  assert.match(licenses,/CC0/);
});


test('V4.7 adds efficient architectural variety and fuller tree canopies', () => {
  for (const feature of [
    'buildingDetailInstances', 'flushBuildingDetailInstances',
    'architecturalDetailCounts.balconies++', 'architecturalDetailCounts.stoops++',
    'architecturalDetailCounts.utilityMeters++', 'v4.7-layered-canopy',
    'new THREE.IcosahedronGeometry(.075,1),foliageLight,128',
    'treeCanopies:world.userData.treeCanopies', 'leafPodsPerTree:world.userData.leafPodsPerTree'
  ]) assert.ok(game.includes(feature), 'Missing V4.7 environment feature: ' + feature);
  assert.match(readme, /128 small instanced foliage clusters per tree/);
  assert.match(readme, /material-grouped instanced meshes/);
});
