import test from 'node:test';
import assert from 'node:assert/strict';
import { V46_MODEL_ASSET_URLS } from '../model-assets.js';

test('V4.6 model sources are CC0-hosted GLB files', () => {
  assert.match(V46_MODEL_ASSET_URLS.pedestrian, /^https:\/\/files\.innerscene\.com\/.*walking-cross-step\.glb$/);
  assert.match(V46_MODEL_ASSET_URLS.vehicle, /^https:\/\/files\.innerscene\.com\/.*sedan-original\.glb$/);
});
