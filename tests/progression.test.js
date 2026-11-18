import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVE_KEY,
  awardProgress,
  createDefaultProgress,
  cycleVehiclePaint,
  getProgressSummary,
  loadProgress,
  purchaseVehiclePaint,
  saveProgress,
  selectVehiclePaint,
  updateProgress
} from '../progression.js';

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('new players receive a clean level-one local profile', () => {
  const state = createDefaultProgress();
  assert.equal(getProgressSummary(state).level, 1);
  assert.equal(getProgressSummary(state).credits, 0);
  assert.deepEqual(state.unlockedPaints, ['blue']);
  assert.deepEqual(state.discoveredLandmarks, []);
});

test('progress rewards update XP, credits and delivery totals safely', () => {
  const next = awardProgress(createDefaultProgress(), { xp: 275, credits: 125, deliveries: 2 });
  const summary = getProgressSummary(next);
  assert.equal(summary.level, 2);
  assert.equal(summary.xpIntoLevel, 25);
  assert.equal(summary.credits, 125);
  assert.equal(summary.deliveriesCompleted, 2);
  assert.equal(awardProgress(next, { xp: -10, credits: Infinity }).xp, 275);
});

test('vehicle paints require level and credits, then remain selectable', () => {
  const early = purchaseVehiclePaint(createDefaultProgress(), 'graphite');
  assert.equal(early.purchased, false);
  let state = awardProgress(createDefaultProgress(), { xp: 250, credits: 400 });
  const graphite = purchaseVehiclePaint(state, 'graphite');
  assert.equal(graphite.purchased, true);
  assert.equal(graphite.state.credits, 300);
  assert.equal(graphite.state.selectedPaint, 'graphite');
  const burgundy = purchaseVehiclePaint(graphite.state, 'burgundy');
  assert.equal(burgundy.purchased, false, 'level three is required before buying burgundy');
  state = awardProgress(graphite.state, { xp: 250 });
  const unlocked = purchaseVehiclePaint(state, 'burgundy');
  assert.equal(unlocked.purchased, true);
  assert.equal(unlocked.state.credits, 80);
  assert.equal(selectVehiclePaint(unlocked.state, 'blue').selected, true);
});

test('paint cycling only selects owned cosmetics and wraps in both directions', () => {
  let state = awardProgress(createDefaultProgress(), { xp: 500, credits: 320 });
  state = purchaseVehiclePaint(state, 'graphite').state;
  state = purchaseVehiclePaint(state, 'burgundy').state;
  assert.equal(cycleVehiclePaint(state, 1).state.selectedPaint, 'blue');
  assert.equal(cycleVehiclePaint(state, -1).state.selectedPaint, 'graphite');
  assert.equal(selectVehiclePaint(state, 'unlocked-later').selected, false);
});

test('save data is sanitized and restores campaign, activities and unlocks', () => {
  const storage = memoryStorage();
  let state = awardProgress(createDefaultProgress(), { xp: 250, credits: 140, deliveries: 1 });
  state = updateProgress(state, {
    campaign: { objectiveIndex: 2, collectedSupplies: ['supply-west'], completedMissionIds: ['welcome'] },
    discoveredLandmarks: ['west-avenue-mural', 'unknown-landmark'],
    greetedNeighbors: ['neighbor-3', 'not-a-neighbor']
  });
  state = purchaseVehiclePaint(state, 'graphite').state;
  assert.equal(saveProgress(storage, state), true);
  const loaded = loadProgress(storage);
  assert.equal(loaded.available, true);
  assert.equal(loaded.error, null);
  assert.deepEqual(loaded.state, state);
  assert.equal(storage.getItem(SAVE_KEY) !== null, true);
});

test('malformed save data falls back to safe defaults', () => {
  const storage = memoryStorage({ [SAVE_KEY]: '{bad-json' });
  const loaded = loadProgress(storage);
  assert.equal(loaded.available, false);
  assert.equal(loaded.state.xp, 0);
  const sanitized = loadProgress(memoryStorage({
    [SAVE_KEY]: JSON.stringify({
      xp: -100,
      credits: '999',
      unlockedPaints: ['blue', 'unknown'],
      selectedPaint: 'burgundy',
      campaign: { objectiveIndex: 999, collectedSupplies: ['unknown'] }
    })
  })).state;
  assert.equal(sanitized.xp, 0);
  assert.equal(sanitized.credits, 0);
  assert.equal(sanitized.campaign.objectiveIndex, 5);
  assert.deepEqual(sanitized.campaign.collectedSupplies, []);
  assert.equal(sanitized.selectedPaint, 'blue', 'a paint cannot be selected unless it is owned');
});

test('unavailable browser storage is handled without throwing', () => {
  const loaded = loadProgress(null);
  assert.equal(loaded.available, false);
  assert.equal(saveProgress(null, createDefaultProgress()), false);
});
