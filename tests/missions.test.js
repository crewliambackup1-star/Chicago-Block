import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCampaignInteraction,
  createCampaignState,
  getCampaignObjective,
  getCampaignProgress
} from '../missions.js';
import { findVehicleExitPosition, getCarSteeringInput } from '../controls.js';

test('campaign starts with an optional welcome objective at Maya', () => {
  const state = createCampaignState();
  assert.equal(getCampaignObjective(state).id, 'meet-maya');
  assert.deepEqual(getCampaignObjective(state).targetIds, ['maya']);
  assert.equal(getCampaignProgress(state).completedMissions, 0);
});

test('unrelated interactions do not advance the campaign', () => {
  const state = createCampaignState();
  const result = applyCampaignInteraction(state, 'supply-market');
  assert.equal(result.accepted, false);
  assert.equal(result.state.objectiveIndex, 0);
  assert.deepEqual(state, createCampaignState());
});

test('supply collection accepts any order and ignores duplicate crates', () => {
  let state = createCampaignState();
  state = applyCampaignInteraction(state, 'maya').state;
  const first = applyCampaignInteraction(state, 'supply-garden');
  assert.equal(first.accepted, true);
  assert.equal(first.stageCompleted, false);
  const duplicate = applyCampaignInteraction(first.state, 'supply-garden');
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.state.collectedSupplies.length, 1);
  const second = applyCampaignInteraction(duplicate.state, 'supply-market');
  assert.equal(second.state.collectedSupplies.length, 2);
  const third = applyCampaignInteraction(second.state, 'supply-west');
  assert.equal(third.stageCompleted, true);
  assert.equal(getCampaignObjective(third.state).id, 'report-to-maya');
});

test('three connected missions complete in sequence and persist cleanly', () => {
  let state = createCampaignState();
  state = applyCampaignInteraction(state, 'maya').state;
  for (const target of ['supply-market', 'supply-west', 'supply-garden']) {
    state = applyCampaignInteraction(state, target).state;
  }
  const pitchIn = applyCampaignInteraction(state, 'maya');
  assert.equal(pitchIn.missionCompleted, true);
  state = pitchIn.state;
  assert.equal(getCampaignObjective(state).id, 'collect-decorations');
  state = applyCampaignInteraction(state, 'market-decorations').state;
  const final = applyCampaignInteraction(state, 'courtyard-dropoff');
  assert.equal(final.campaignCompleted, true);
  assert.equal(final.missionCompleted, true);
  assert.equal(getCampaignObjective(final.state), null);
  assert.deepEqual(final.state.completedMissionIds, ['welcome', 'pitch-in', 'courtyard-day']);
  assert.equal(getCampaignProgress(final.state).completedMissions, 3);
});

test('steering maps A/left and D/right to opposite, stable inputs', () => {
  assert.equal(getCarSteeringInput(true, false), 1);
  assert.equal(getCarSteeringInput(false, true), -1);
  assert.equal(getCarSteeringInput(true, true), 0);
  assert.equal(getCarSteeringInput(false, false), 0);
});

test('vehicle exit uses the first clear candidate relative to vehicle heading', () => {
  const blocked = [];
  const result = findVehicleExitPosition(10, 20, Math.PI, (x, z) => blocked.some(p => p.x === x && p.z === z), 3);
  assert.ok(Math.abs(result.x - 13) < 1e-9);
  assert.ok(Math.abs(result.z - 20) < 1e-9);
});

test('vehicle exit checks alternatives and returns null when every side is blocked', () => {
  const coordinates = [];
  const result = findVehicleExitPosition(0, 0, 0, (x, z) => {
    coordinates.push([x, z]);
    return true;
  });
  assert.equal(result, null);
  assert.equal(coordinates.length, 4);
});

test('vehicle exit rejects invalid inputs rather than placing the player unpredictably', () => {
  assert.throws(() => findVehicleExitPosition(NaN, 0, 0, () => false), TypeError);
  assert.throws(() => findVehicleExitPosition(0, 0, 0, null), TypeError);
});
