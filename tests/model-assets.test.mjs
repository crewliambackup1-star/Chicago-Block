import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { V46_MODEL_ASSET_URLS } from '../model-assets.js';

const workflow = await readFile(new URL('../.github/workflows/publish-model-assets.yml', import.meta.url), 'utf8');
const downloader = await readFile(new URL('../scripts/download-model-assets.mjs', import.meta.url), 'utf8');

test('V4.6 production models resolve to same-origin local GLB paths', () => {
  assert.ok(new URL(V46_MODEL_ASSET_URLS.pedestrian).pathname.endsWith('/assets/models/human-locomotion.glb'));
  assert.ok(new URL(V46_MODEL_ASSET_URLS.vehicle).pathname.endsWith('/assets/models/sedan-exterior.glb'));
});

test('V4.6 model publisher explicitly rebuilds branch-based GitHub Pages after its GITHUB_TOKEN push', () => {
  assert.match(workflow, /contents:\s*write/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /POST/);
  assert.match(workflow, /\/pages\/builds/);
  assert.match(workflow, /Request GitHub Pages rebuild/);
});

test('V4.6 model downloads have a timeout and validate the GLB container length', () => {
  assert.match(downloader, /AbortSignal\.timeout\(120_000\)/);
  assert.match(downloader, /readUInt32LE\(8\)!==bytes\.length/);
});
