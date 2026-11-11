import test from 'node:test';
import assert from 'node:assert/strict';
import { V46_MODEL_ASSET_URLS } from '../model-assets.js';

test('V4.6 production models resolve to same-origin local GLB paths', () => {
  assert.ok(new URL(V46_MODEL_ASSET_URLS.pedestrian).pathname.endsWith('/assets/models/human-locomotion.glb'));
  assert.ok(new URL(V46_MODEL_ASSET_URLS.vehicle).pathname.endsWith('/assets/models/sedan-exterior.glb'));
});
