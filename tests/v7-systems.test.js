import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stepVehiclePhysics } from '../vehicle-physics.js';
import {
  CLEANUP_SPOTS, NEIGHBORS, collectCleanupSpot, createCommunityState,
  getCommunityProgress, greetNeighbor, normalizeCommunityState
} from '../community-activities.js';

const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const release = JSON.parse(readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const packageInfo = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('V7 release version matches package and the actual loaded game module is identified', () => {
  assert.equal(release.version, '7.0.0');
  assert.equal(packageInfo.version, release.version);
  assert.match(game, /new URL\(import\.meta\.url\)\.searchParams\.get\('v'\)/);
  assert.match(game, /window\.__CHICAGO_BLOCK_BUILD__/);
  assert.match(game, /manifestVersion:expected,manifestVerified:verified,matched:verified&&matches/);
  assert.doesNotMatch(game, /V4\.8 CHARACTER & VEHICLE PASS|CHARACTER & VEHICLE REALISM · V4\.8/);
  assert.match(html, /manifestVerified/);
  assert.match(html, /cache: 'no-store'/);
  assert.match(html, /id="communityLabel"/);
});

test('vehicle physics accelerates, moves forward and steers with the intended direction', () => {
  const first = stepVehiclePhysics({ x: 0, z: 0, heading: 0, velocity: 0 }, { forward: true }, 0.05);
  assert.ok(first.velocity > 0);
  assert.ok(first.z < 0, 'forward at heading zero should move toward negative Z');

  const left = stepVehiclePhysics({ x: 0, z: 0, heading: 0, velocity: 10 }, { left: true }, 0.05);
  const right = stepVehiclePhysics({ x: 0, z: 0, heading: 0, velocity: 10 }, { right: true }, 0.05);
  assert.ok(left.heading > 0, 'left steering should rotate positively while moving forward');
  assert.ok(right.heading < 0, 'right steering should rotate negatively while moving forward');
});

test('vehicle braking slows the car and collisions stop movement safely', () => {
  const coast = stepVehiclePhysics({ x: 0, z: 0, heading: 0, velocity: 12 }, {}, 0.05);
  const braking = stepVehiclePhysics({ x: 0, z: 0, heading: 0, velocity: 12 }, { brake: true }, 0.05);
  assert.ok(braking.velocity < coast.velocity, 'braking should decelerate more than coasting');

  const collision = stepVehiclePhysics({ x: 2, z: 3, heading: 0, velocity: 8 }, { forward: true }, 0.05, () => true);
  assert.equal(collision.collided, true);
  assert.equal(collision.x, 2);
  assert.equal(collision.z, 3);
  assert.ok(collision.velocity < 0, 'collision response should reduce and reverse the velocity');
});

test('vehicle physics clamps frame time and validates collision callbacks', () => {
  const normal = stepVehiclePhysics({ x: 0, z: 0, heading: 0, velocity: 0 }, { forward: true }, 0.05);
  const delayed = stepVehiclePhysics({ x: 0, z: 0, heading: 0, velocity: 0 }, { forward: true }, 5);
  assert.deepEqual(delayed, normal, 'large frame gaps must not create a huge physics jump');
  assert.throws(() => stepVehiclePhysics({}, {}, 0.016, null), /collision-check function/);
});

test('neighbor introductions give a one-time reward and complete after three distinct people', () => {
  assert.equal(NEIGHBORS.length, 20);
  let state = createCommunityState();
  const first = greetNeighbor(state, NEIGHBORS[0].id, 9);
  assert.equal(first.firstGreeting, true);
  assert.equal(first.completedNow, false);
  assert.deepEqual(first.reward, { cash: 12, xp: 8 });
  state = first.state;

  const repeat = greetNeighbor(state, NEIGHBORS[0].id, 15);
  assert.equal(repeat.firstGreeting, false);
  assert.deepEqual(repeat.reward, { cash: 0, xp: 0 });

  state = greetNeighbor(state, NEIGHBORS[1].id, 12).state;
  const third = greetNeighbor(state, NEIGHBORS[2].id, 18);
  assert.equal(third.completedNow, true);
  assert.ok(third.reward.cash > 12);
  assert.equal(getCommunityProgress(third.state).introductionsComplete, true);
});

test('courtyard cleanup is tracked, rewarded and cannot be farmed twice', () => {
  let state = createCommunityState();
  for (const [index, spot] of CLEANUP_SPOTS.entries()) {
    const result = collectCleanupSpot(state, spot.id);
    assert.equal(result.accepted, true);
    assert.equal(result.completedNow, index === CLEANUP_SPOTS.length - 1);
    state = result.state;
  }
  const duplicate = collectCleanupSpot(state, CLEANUP_SPOTS[0].id);
  assert.equal(duplicate.accepted, false);
  assert.equal(getCommunityProgress(state).cleanupComplete, true);
});

test('community saves normalize unknown IDs and keep prior V6 saves compatible', () => {
  const oldSaveState = normalizeCommunityState(undefined);
  assert.deepEqual(oldSaveState, {
    greetedNeighborIds: [], cleanedSpotIds: [], completedActivityIds: []
  });
  const restored = normalizeCommunityState({
    greetedNeighborIds: [NEIGHBORS[0].id, 'unknown', NEIGHBORS[0].id],
    cleanedSpotIds: [CLEANUP_SPOTS[1].id, 'invalid'],
    completedActivityIds: ['courtyard-cleanup', 'not-an-activity']
  });
  assert.deepEqual(restored.greetedNeighborIds, [NEIGHBORS[0].id]);
  assert.deepEqual(restored.cleanedSpotIds, [CLEANUP_SPOTS[1].id]);
  assert.deepEqual(restored.completedActivityIds, ['courtyard-cleanup']);
});

test('game integrates the new side activities and physics module', () => {
  assert.match(game, /stepVehiclePhysics\(/);
  assert.match(game, /greetNeighbor\(/);
  assert.match(game, /collectCleanupSpot\(/);
  assert.match(game, /communityState/);
  assert.match(game, /updateCommunityHud/);
  assert.match(game, /getNearbyNeighbor/);
  assert.match(game, /getNearbyCleanupTarget/);
  assert.match(game, /cleanupTargets/);
});
