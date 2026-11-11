import { DEFAULT_CITY_TILE_SIZE_METERS, getVisibleTileKeys } from './geodata.js';

const TILE_KEY_PATTERN = /^-?\d+:-?\d+$/;

function validateTileKey(tileKey) {
  if (typeof tileKey !== 'string' || !TILE_KEY_PATTERN.test(tileKey)) {
    throw new TypeError('tileKey must use the "x:z" integer format');
  }
}

function makeAbortError() {
  const error = new Error('City tile request is no longer needed');
  error.name = 'AbortError';
  return error;
}

/**
 * Bounded, request-deduplicating city tile cache. The loader is injected so
 * the manager works with static GitHub Pages assets, local development data,
 * or a future tile service without coupling the game to a server today.
 */
export function createCityTileManager({
  loadTile,
  maxCacheEntries = 36,
  tileSizeMeters = DEFAULT_CITY_TILE_SIZE_METERS
} = {}) {
  if (typeof loadTile !== 'function') throw new TypeError('loadTile must be a function');
  if (!Number.isInteger(maxCacheEntries) || maxCacheEntries < 1 || maxCacheEntries > 512) {
    throw new RangeError('maxCacheEntries must be an integer from 1 to 512');
  }
  if (!Number.isFinite(tileSizeMeters) || tileSizeMeters <= 0) {
    throw new RangeError('tileSizeMeters must be greater than zero');
  }

  const cache = new Map();
  const pending = new Map();
  let desired = new Set();
  let disposed = false;
  let hits = 0;
  let misses = 0;
  let evictions = 0;
  let aborts = 0;

  function touch(tileKey) {
    const value = cache.get(tileKey);
    if (value === undefined) return undefined;
    cache.delete(tileKey);
    cache.set(tileKey, value);
    return value;
  }

  function trimCache() {
    while (cache.size > maxCacheEntries) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
      evictions++;
    }
  }

  function request(tileKey) {
    validateTileKey(tileKey);
    if (disposed) return Promise.reject(new Error('City tile manager has been disposed'));
    if (cache.has(tileKey)) {
      hits++;
      return Promise.resolve(touch(tileKey));
    }
    const existing = pending.get(tileKey);
    if (existing) {
      hits++;
      return existing.promise;
    }

    misses++;
    const controller = new AbortController();
    const entry = { controller, promise: null };
    entry.promise = Promise.resolve()
      .then(() => loadTile(tileKey, { signal: controller.signal }))
      .then(tile => {
        if (controller.signal.aborted || disposed) throw makeAbortError();
        if (tile === undefined || tile === null) throw new Error('Tile loader returned no data for ' + tileKey);
        if (pending.get(tileKey) === entry) pending.delete(tileKey);
        cache.set(tileKey, tile);
        trimCache();
        return tile;
      })
      .catch(error => {
        if (pending.get(tileKey) === entry) pending.delete(tileKey);
        throw error;
      });
    pending.set(tileKey, entry);
    return entry.promise;
  }

  function setVisibleTiles(tileKeys) {
    if (disposed) throw new Error('City tile manager has been disposed');
    if (!Array.isArray(tileKeys)) throw new TypeError('tileKeys must be an array');
    const next = new Set(tileKeys);
    for (const tileKey of next) validateTileKey(tileKey);
    desired = next;

    for (const [tileKey, entry] of pending) {
      if (!desired.has(tileKey)) {
        aborts++;
        pending.delete(tileKey);
        entry.controller.abort();
      }
    }

    for (const tileKey of desired) touch(tileKey);
    return Object.freeze([...desired]);
  }

  async function loadVisibleTiles(tileKeys) {
    const visible = setVisibleTiles(tileKeys);
    return Promise.allSettled(visible.map(tileKey => request(tileKey)));
  }

  function preloadAround(worldX, worldZ, range = 1) {
    const visible = getVisibleTileKeys(worldX, worldZ, range, tileSizeMeters);
    return loadVisibleTiles(visible);
  }

  function get(tileKey) {
    validateTileKey(tileKey);
    return touch(tileKey);
  }

  function getSnapshot() {
    return Object.freeze({
      cacheKeys: Object.freeze([...cache.keys()]),
      pendingKeys: Object.freeze([...pending.keys()]),
      desiredKeys: Object.freeze([...desired]),
      cacheSize: cache.size,
      maxCacheEntries,
      hits,
      misses,
      evictions,
      aborts,
      disposed
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const entry of pending.values()) {
      aborts++;
      entry.controller.abort();
    }
    pending.clear();
    desired.clear();
    cache.clear();
  }

  return Object.freeze({
    request,
    setVisibleTiles,
    loadVisibleTiles,
    preloadAround,
    get,
    getSnapshot,
    dispose
  });
}
