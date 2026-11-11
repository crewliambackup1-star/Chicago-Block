import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CHICAGO_ORIGIN,
  DEFAULT_CITY_TILE_SIZE_METERS,
  getTileCoordinates,
  getTileKey,
  getTileWorldBounds,
  getVisibleTileKeys,
  latLonToLocalMeters,
  localMetersToLatLon,
  normalizeGeoJsonFeature,
  normalizeGeoJsonFeatureCollection
} from '../geodata.js';

test('Chicago reference origin projects to the local world origin', () => {
  assert.deepEqual(
    latLonToLocalMeters(DEFAULT_CHICAGO_ORIGIN.latitude, DEFAULT_CHICAGO_ORIGIN.longitude),
    { x: 0, z: -0 }
  );
});

test('local metre projection round-trips Chicago coordinates', () => {
  const source = { latitude: 41.8819, longitude: -87.6278 };
  const projected = latLonToLocalMeters(source.latitude, source.longitude);
  const restored = localMetersToLatLon(projected.x, projected.z);
  assert.ok(Math.abs(restored.latitude - source.latitude) < 1e-8);
  assert.ok(Math.abs(restored.longitude - source.longitude) < 1e-8);
  assert.ok(projected.x > 0, 'east of the origin should map to positive X');
  assert.ok(projected.z < 0, 'north of the origin should map to negative Z');
});

test('tile coordinates handle positive and negative world positions', () => {
  assert.deepEqual(getTileCoordinates(0, 0), { x: 0, z: 0 });
  assert.deepEqual(getTileCoordinates(512, -0.01), { x: 1, z: -1 });
  assert.deepEqual(getTileCoordinates(-0.01, -512), { x: -1, z: -1 });
  assert.equal(getTileKey(-2, 3), '-2:3');
  assert.equal(DEFAULT_CITY_TILE_SIZE_METERS, 512);
});

test('tile bounds are stable for negative and positive tile indices', () => {
  assert.deepEqual(getTileWorldBounds(-1, 2), {
    minX: -512, minZ: 1024, maxX: 0, maxZ: 1536
  });
});

test('visible tile selection returns a center-first neighborhood', () => {
  const visible = getVisibleTileKeys(520, 12, 1);
  assert.equal(visible.length, 9);
  assert.equal(visible[0], '1:0');
  assert.ok(visible.includes('0:-1'));
  assert.ok(visible.includes('2:1'));
});

test('GeoJSON road and building features convert to local coordinates', () => {
  const road = normalizeGeoJsonFeature({
    type: 'Feature',
    id: 'road-1',
    properties: { name: 'Example Avenue', lanes: 2 },
    geometry: {
      type: 'LineString',
      coordinates: [[-87.6298, 41.8781], [-87.6288, 41.8781]]
    }
  });
  assert.equal(road.id, 'road-1');
  assert.equal(road.properties.name, 'Example Avenue');
  assert.equal(road.geometry.type, 'LineString');
  assert.deepEqual(road.geometry.coordinates[0], [0, -0]);
  assert.ok(road.geometry.coordinates[1][0] > 0);

  const footprint = normalizeGeoJsonFeature({
    type: 'Feature',
    properties: { height: 18 },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.6298, 41.8781], [-87.6297, 41.8781],
        [-87.6297, 41.8782], [-87.6298, 41.8781]
      ]]
    }
  });
  assert.equal(footprint.geometry.type, 'Polygon');
  assert.deepEqual(footprint.geometry.coordinates[0][0], footprint.geometry.coordinates[0][3]);
});

test('projection and GeoJSON normalization reject invalid coordinates', () => {
  assert.throws(() => latLonToLocalMeters(91, -87.6), RangeError);
  assert.throws(() => latLonToLocalMeters(41.8, 181), RangeError);
  assert.throws(() => getTileCoordinates(0, 0, 0), RangeError);
  assert.throws(() => getVisibleTileKeys(0, 0, -1), RangeError);
  assert.throws(() => normalizeGeoJsonFeature({
    type: 'Feature',
    geometry: { type: 'GeometryCollection', geometries: [] }
  }), /Unsupported GeoJSON geometry type/);
});

test('FeatureCollection import normalizes batches and enforces memory bounds', () => {
  const collection = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { kind: 'street' },
      geometry: { type: 'Point', coordinates: [-87.6298, 41.8781] }
    }]
  };
  const normalized = normalizeGeoJsonFeatureCollection(collection);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].properties.kind, 'street');
  assert.deepEqual(normalized[0].geometry.coordinates, [0, -0]);
  assert.throws(
    () => normalizeGeoJsonFeatureCollection(collection, { maxFeatures: 0 }),
    RangeError
  );
  assert.throws(
    () => normalizeGeoJsonFeatureCollection({ ...collection, features: [collection.features[0], collection.features[0]] }, { maxFeatures: 1 }),
    /split the import into bounded batches/
  );
});
