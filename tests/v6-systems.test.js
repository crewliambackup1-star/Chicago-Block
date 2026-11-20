import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPlayerReward,
  createPlayerProfile,
  getPlayerLevel,
  normalizePlayerProfile
} from '../progression.js';
import {
  createSavePayload,
  parseSave,
  serializeSave
} from '../save-system.js';
import {
  advancePedestrianRoutine,
  getNeighborhoodSchedule
} from '../world-simulation.js';

const validSnapshot = () => ({
  profile: { cash: 175, xp: 120, deliveriesCompleted: 2, snapshotsFound: 1 },
  campaignState: { objectiveIndex: 1, collectedSupplies: [], completedMissionIds: ['welcome'], completed: false },
  deliveriesCompleted: 2,
  carryingPackage: false,
  discoveredLandmarks: ['West Avenue Mural'],
  player: { x: -20, z: 12 },
  car: { x: -7, z: -14 },
  gameHours: 14.25,
  weatherMode: 'clear',
  savedAt: 12345
});

test('new profile begins with no cash, XP or completed activities', () => {
  assert.deepEqual(createPlayerProfile(), {
    cash: 0, xp: 0, deliveriesCompleted: 0, snapshotsFound: 0
  });
  assert.equal(getPlayerLevel(0).level, 1);
  assert.equal(getPlayerLevel(0).title, 'New Neighbor');
});

test('cash and XP rewards safely update profile and level titles', () => {
  const first = applyPlayerReward(createPlayerProfile(), { cash: 75, xp: 90 });
  assert.equal(first.profile.cash, 75);
  assert.equal(first.profile.xp, 90);
  assert.equal(first.levelInfo.level, 1);
  assert.equal(first.leveledUp, false);
  const levelUp = applyPlayerReward(first.profile, { cash: 30, xp: 20 });
  assert.equal(levelUp.levelInfo.level, 2);
  assert.equal(levelUp.levelInfo.title, 'Neighborhood Helper');
  assert.equal(levelUp.leveledUp, true);
});

test('profile normalization clamps unsafe or invalid saved values', () => {
  assert.deepEqual(normalizePlayerProfile({
    cash: -4, xp: Number.MAX_SAFE_INTEGER + 1, deliveriesCompleted: 7.5, snapshotsFound: 99
  }), { cash: 0, xp: 0, deliveriesCompleted: 0, snapshotsFound: 5 });
});

test('save payload round-trips validated profile, campaign, player and vehicle state', () => {
  const raw = serializeSave(validSnapshot());
  const restored = parseSave(raw);
  assert.equal(restored.schemaVersion, 1);
  assert.deepEqual(restored.profile, validSnapshot().profile);
  assert.deepEqual(restored.player, validSnapshot().player);
  assert.deepEqual(restored.car, validSnapshot().car);
  assert.deepEqual(restored.discoveredLandmarks, ['West Avenue Mural']);
  assert.equal(restored.gameHours, 14.25);
});

test('save parser rejects corrupt, oversized, unknown-version and unsafe-coordinate data', () => {
  assert.equal(parseSave('{bad json'), null);
  assert.equal(parseSave('x'.repeat(50001)), null);
  assert.equal(parseSave(JSON.stringify({ ...createSavePayload(validSnapshot()), schemaVersion: 99 })), null);
  assert.equal(parseSave(JSON.stringify({ ...createSavePayload(validSnapshot()), player: { x: 1000, z: 0 } })), null);
  assert.equal(parseSave(JSON.stringify({ ...createSavePayload(validSnapshot()), gameHours: 24 })), null);
  assert.equal(parseSave(JSON.stringify({ ...createSavePayload(validSnapshot()), weatherMode: 'storm' })), null);
});

test('neighborhood event schedule changes across morning, day, evening and quiet hours', () => {
  assert.equal(getNeighborhoodSchedule(8).id, 'morning-market');
  assert.equal(getNeighborhoodSchedule(14).id, 'courtyard-social');
  assert.equal(getNeighborhoodSchedule(19).id, 'evening-stroll');
  assert.equal(getNeighborhoodSchedule(23).id, 'quiet-hours');
  assert.equal(getNeighborhoodSchedule(3).trafficSpeed, .72);
});

test('pedestrians stop and notice the player, then resume after a cooldown', () => {
  const initial = { mode: 'walking', pauseTimer: 0, reactionTimer: 0, reactionCooldown: 0 };
  const noticed = advancePedestrianRoutine(initial, { dt: .1, distanceToPlayer: 3, gameHours: 14 });
  assert.equal(noticed.mode, 'noticing');
  const waiting = advancePedestrianRoutine(noticed, { dt: .5, distanceToPlayer: 3, gameHours: 14 });
  assert.equal(waiting.mode, 'noticing');
  const resumed = advancePedestrianRoutine(waiting, { dt: 1, distanceToPlayer: 3, gameHours: 14 });
  assert.equal(resumed.mode, 'walking');
  assert.ok(resumed.reactionCooldown > 0);
});

test('pedestrians take brief waypoint breaks and move slower during quiet hours', () => {
  const paused = advancePedestrianRoutine(
    { mode: 'walking', pauseTimer: 0, reactionTimer: 0, reactionCooldown: 2 },
    { dt: .1, distanceToPlayer: 20, gameHours: 12, arrivedAtWaypoint: true, plannedPause: 1.5 }
  );
  assert.equal(paused.mode, 'pausing');
  assert.equal(paused.pauseTimer, 1.5);
  const night = advancePedestrianRoutine(
    { mode: 'walking', pauseTimer: 0, reactionTimer: 0, reactionCooldown: 2 },
    { dt: .1, distanceToPlayer: 20, gameHours: 23 }
  );
  assert.equal(night.speedMultiplier, .72);
});
