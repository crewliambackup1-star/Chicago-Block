import test from 'node:test';
import assert from 'node:assert/strict';
import { getContactShadowProfile } from '../contact-shadows.js';

test('contact-shadow profiles are proportional for people and vehicles', () => {
  const pedestrian = getContactShadowProfile('pedestrian');
  const avatar = getContactShadowProfile('avatar');
  const vehicle = getContactShadowProfile('vehicle');
  assert.ok(pedestrian.width > 0 && pedestrian.depth > pedestrian.width);
  assert.ok(avatar.width > pedestrian.width && avatar.depth > pedestrian.depth);
  assert.ok(vehicle.width > avatar.width && vehicle.depth > avatar.depth);
  assert.ok(pedestrian.height > vehicle.height);
});

test('touch profiles trim decorative footprints without removing shadows', () => {
  for (const kind of ['pedestrian', 'avatar', 'vehicle']) {
    const desktop = getContactShadowProfile(kind);
    const mobile = getContactShadowProfile(kind, { coarsePointer: true });
    assert.ok(mobile.width > 0 && mobile.depth > 0);
    assert.ok(mobile.width < desktop.width);
    assert.ok(mobile.depth < desktop.depth);
    assert.equal(mobile.height, desktop.height);
  }
});

test('unknown contact-shadow subjects are rejected explicitly', () => {
  assert.throws(() => getContactShadowProfile('unknown'), {
    name: 'RangeError',
    message: /Unknown contact shadow subject/
  });
});
