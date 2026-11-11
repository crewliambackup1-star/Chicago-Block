import test from 'node:test';
import assert from 'node:assert/strict';
import { createCityTileManager } from '../tile-streaming.js';

test('tile manager deduplicates concurrent requests and reuses cached tiles', async () => {
  const calls = [];
  const manager = createCityTileManager({
    loadTile: async key => {
      calls.push(key);
      await Promise.resolve();
      return { key };
    }
  });
  const [first, second] = await Promise.all([
    manager.request('0:0'),
    manager.request('0:0')
  ]);
  assert.deepEqual(first, { key: '0:0' });
  assert.deepEqual(second, first);
  assert.equal(calls.length, 1);
  assert.equal(manager.getSnapshot().hits, 1);
  assert.deepEqual(await manager.request('0:0'), first);
  assert.equal(calls.length, 1);
  assert.equal(manager.getSnapshot().cacheSize, 1);
  manager.dispose();
});

test('tile cache evicts least-recently-used data at its configured bound', async () => {
  const manager = createCityTileManager({
    maxCacheEntries: 2,
    loadTile: async key => ({ key })
  });
  await manager.request('0:0');
  await manager.request('1:0');
  assert.deepEqual(manager.get('0:0'), { key: '0:0' });
  await manager.request('2:0');
  assert.deepEqual(manager.get('0:0'), { key: '0:0' });
  assert.equal(manager.get('1:0'), undefined);
  assert.deepEqual(manager.get('2:0'), { key: '2:0' });
  assert.equal(manager.getSnapshot().evictions, 1);
  manager.dispose();
});

test('re-centering aborts pending tiles outside the visible set', async () => {
  const manager = createCityTileManager({
    loadTile: (key, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    })
  });
  const oldRequest = manager.request('0:0').catch(error => error.name);
  manager.setVisibleTiles(['1:0']);
  assert.equal(await oldRequest, 'AbortError');
  assert.deepEqual(manager.getSnapshot().pendingKeys, []);
  assert.equal(manager.getSnapshot().aborts, 1);
  manager.dispose();
});

test('preloadAround requests the center tile and its visible neighbors', async () => {
  const loaded = [];
  const manager = createCityTileManager({
    loadTile: async key => {
      loaded.push(key);
      return { key };
    }
  });
  const results = await manager.preloadAround(520, 12, 1);
  assert.equal(results.length, 9);
  assert.ok(results.every(result => result.status === 'fulfilled'));
  assert.equal(manager.getSnapshot().cacheSize, 9);
  assert.equal(loaded.length, 9);
  assert.equal(manager.getSnapshot().desiredKeys[0], '1:0');
  manager.dispose();
});

test('tile manager validates identifiers, limits, and disposed state', async () => {
  assert.throws(() => createCityTileManager({ loadTile: async () => ({}), maxCacheEntries: 0 }), RangeError);
  const manager = createCityTileManager({ loadTile: async key => ({ key }) });
  assert.throws(() => manager.get('../0:0'), TypeError);
  assert.throws(() => manager.request('bad-key'), TypeError);
  manager.dispose();
  await assert.rejects(manager.request('0:0'), /disposed/);
});
