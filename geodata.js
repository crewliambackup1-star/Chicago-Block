const EARTH_RADIUS_METERS = 6378137;
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;
const MAX_MERCATOR_LATITUDE = 85.0511287798066;

export const DEFAULT_CHICAGO_ORIGIN = Object.freeze({
  latitude: 41.8781,
  longitude: -87.6298
});

export const DEFAULT_CITY_TILE_SIZE_METERS = 512;

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(label + ' must be a finite number');
}

function validateLatLon(latitude, longitude) {
  assertFiniteNumber(latitude, 'latitude');
  assertFiniteNumber(longitude, 'longitude');
  if (latitude < -MAX_MERCATOR_LATITUDE || latitude > MAX_MERCATOR_LATITUDE) {
    throw new RangeError('latitude is outside the Web Mercator range');
  }
  if (longitude < -180 || longitude > 180) {
    throw new RangeError('longitude must be between -180 and 180');
  }
}

function validateOrigin(origin) {
  if (!origin || typeof origin !== 'object') throw new TypeError('origin must be an object');
  validateLatLon(origin.latitude, origin.longitude);
}

function mercatorY(latitudeRadians) {
  return Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
}

/**
 * Projects WGS84 longitude/latitude to local ground metres around a Chicago
 * origin. X points east; negative Z points north, matching Three.js world
 * convention. The local scale is corrected at the origin latitude.
 */
export function latLonToLocalMeters(latitude, longitude, origin = DEFAULT_CHICAGO_ORIGIN) {
  validateLatLon(latitude, longitude);
  validateOrigin(origin);
  const originLatitude = origin.latitude * DEGREES_TO_RADIANS;
  const latitudeRadians = latitude * DEGREES_TO_RADIANS;
  const scale = Math.cos(originLatitude);
  const x = EARTH_RADIUS_METERS
    * (longitude - origin.longitude) * DEGREES_TO_RADIANS * scale;
  const northing = EARTH_RADIUS_METERS
    * (mercatorY(latitudeRadians) - mercatorY(originLatitude)) * scale;
  return Object.freeze({ x, z: -northing });
}

/**
 * Inverse of latLonToLocalMeters for the same origin and local projection.
 */
export function localMetersToLatLon(x, z, origin = DEFAULT_CHICAGO_ORIGIN) {
  assertFiniteNumber(x, 'x');
  assertFiniteNumber(z, 'z');
  validateOrigin(origin);
  const originLatitude = origin.latitude * DEGREES_TO_RADIANS;
  const scale = Math.cos(originLatitude);
  const longitude = origin.longitude + (x / (EARTH_RADIUS_METERS * scale)) * RADIANS_TO_DEGREES;
  const projectedY = mercatorY(originLatitude) - z / (EARTH_RADIUS_METERS * scale);
  const latitude = (2 * Math.atan(Math.exp(projectedY)) - Math.PI / 2) * RADIANS_TO_DEGREES;
  validateLatLon(latitude, longitude);
  return Object.freeze({ latitude, longitude });
}

function validateTileSize(tileSizeMeters) {
  assertFiniteNumber(tileSizeMeters, 'tileSizeMeters');
  if (tileSizeMeters <= 0) throw new RangeError('tileSizeMeters must be greater than zero');
}

export function getTileCoordinates(
  worldX,
  worldZ,
  tileSizeMeters = DEFAULT_CITY_TILE_SIZE_METERS
) {
  assertFiniteNumber(worldX, 'worldX');
  assertFiniteNumber(worldZ, 'worldZ');
  validateTileSize(tileSizeMeters);
  return Object.freeze({
    x: Math.floor(worldX / tileSizeMeters),
    z: Math.floor(worldZ / tileSizeMeters)
  });
}

export function getTileKey(tileX, tileZ) {
  if (!Number.isInteger(tileX) || !Number.isInteger(tileZ)) {
    throw new TypeError('tile coordinates must be integers');
  }
  return tileX + ':' + tileZ;
}

export function getTileWorldBounds(
  tileX,
  tileZ,
  tileSizeMeters = DEFAULT_CITY_TILE_SIZE_METERS
) {
  if (!Number.isInteger(tileX) || !Number.isInteger(tileZ)) {
    throw new TypeError('tile coordinates must be integers');
  }
  validateTileSize(tileSizeMeters);
  const minX = tileX * tileSizeMeters;
  const minZ = tileZ * tileSizeMeters;
  return Object.freeze({
    minX,
    minZ,
    maxX: minX + tileSizeMeters,
    maxZ: minZ + tileSizeMeters
  });
}

/**
 * Returns a center-first square of tile keys. A range of 1 requests the
 * current tile plus its eight neighbors; callers can stream/unload as needed.
 */
export function getVisibleTileKeys(
  worldX,
  worldZ,
  range = 1,
  tileSizeMeters = DEFAULT_CITY_TILE_SIZE_METERS
) {
  if (!Number.isInteger(range) || range < 0 || range > 32) {
    throw new RangeError('range must be an integer from 0 to 32');
  }
  const center = getTileCoordinates(worldX, worldZ, tileSizeMeters);
  const tiles = [];
  for (let dz = -range; dz <= range; dz++) {
    for (let dx = -range; dx <= range; dx++) {
      tiles.push({
        x: center.x + dx,
        z: center.z + dz,
        distance: dx * dx + dz * dz
      });
    }
  }
  tiles.sort((a, b) => a.distance - b.distance || a.z - b.z || a.x - b.x);
  return Object.freeze(tiles.map(tile => getTileKey(tile.x, tile.z)));
}

function transformCoordinates(coordinates, origin) {
  if (!Array.isArray(coordinates)) throw new TypeError('GeoJSON coordinates must be arrays');
  if (coordinates.length >= 2 && typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    const [longitude, latitude] = coordinates;
    const local = latLonToLocalMeters(latitude, longitude, origin);
    return Object.freeze([local.x, local.z]);
  }
  if (coordinates.length === 0) throw new TypeError('GeoJSON coordinate arrays cannot be empty');
  return Object.freeze(coordinates.map(value => transformCoordinates(value, origin)));
}

/**
 * Convert supported GeoJSON features into local metre coordinates. Supported
 * geometry types cover road centerlines and building footprints.
 */
export function normalizeGeoJsonFeature(feature, { origin = DEFAULT_CHICAGO_ORIGIN } = {}) {
  validateOrigin(origin);
  if (!feature || feature.type !== 'Feature' || !feature.geometry) {
    throw new TypeError('Expected a GeoJSON Feature with geometry');
  }
  const geometryType = feature.geometry.type;
  if (!['Point', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'].includes(geometryType)) {
    throw new TypeError('Unsupported GeoJSON geometry type: ' + geometryType);
  }
  const properties = feature.properties && typeof feature.properties === 'object'
    ? { ...feature.properties }
    : {};
  return Object.freeze({
    type: 'Feature',
    id: feature.id ?? properties.id ?? null,
    properties: Object.freeze(properties),
    geometry: Object.freeze({
      type: geometryType,
      coordinates: transformCoordinates(feature.geometry.coordinates, origin)
    })
  });
}
