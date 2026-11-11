import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getTileWorldBounds,
  normalizeGeoJsonFeatureCollection,
  partitionFeaturesByTile
} from '../geodata.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = process.env.CHICAGO_CITY_DATA_DIR\n  ? resolve(process.env.CHICAGO_CITY_DATA_DIR)\n  : resolve(root, 'city-data');
const rawRoot = resolve(dataRoot, 'raw');
const outputRoot = resolve(dataRoot, 'tiles');
const manifest = JSON.parse(await readFile(resolve(dataRoot, 'manifest.json'), 'utf8'));

async function readSource(filename, label) {
  const sourcePath = resolve(rawRoot, filename);
  let raw;
  let info;
  try {
    [raw, info] = await Promise.all([
      readFile(sourcePath, 'utf8').then(JSON.parse),
      stat(sourcePath)
    ]);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'Missing ' + sourcePath + '. Download the City of Chicago ' + label +
        ' GeoJSON export and place it at this path before building tiles.'
      );
    }
    throw error;
  }
  return {
    features: normalizeGeoJsonFeatureCollection(raw, {
      origin: manifest.origin,
      maxFeatures: 1000000
    }),
    retrievedAt: info.mtime.toISOString()
  };
}

function getDataset(layer) {
  const source = manifest.dataSources.find(item => item.layer === layer);
  if (!source) throw new Error('No City of Chicago source metadata for layer: ' + layer);
  return source;
}

const tileSizeMeters = manifest.tileSizeMeters;
const streetData = await readSource('streets.geojson', 'Street Center Lines');
const streetFeatureCount = streetData.features.length;
const streetTiles = partitionFeaturesByTile(streetData.features, {
  tileSizeMeters,
  maxTilesPerFeature: 128
});
streetData.features = null;

const buildingData = await readSource('buildings.geojson', 'Building Footprints');
const buildingFeatureCount = buildingData.features.length;
const buildingTiles = partitionFeaturesByTile(buildingData.features, {
  tileSizeMeters,
  maxTilesPerFeature: 128
});
buildingData.features = null;
const tileKeys = [...new Set([
  ...Object.keys(streetTiles),
  ...Object.keys(buildingTiles)
])].sort((a, b) => {
  const [ax, az] = a.split(':').map(Number);
  const [bx, bz] = b.split(':').map(Number);
  return az - bz || ax - bx;
});

await mkdir(outputRoot, { recursive: true });
for (const filename of await readdir(outputRoot)) {
  if (/^-?\d+_-?\d+\.json$/.test(filename)) {
    await rm(resolve(outputRoot, filename));
  }
}

const streetSource = getDataset('streets');
const buildingSource = getDataset('buildings');
const tiles = [];
for (const tileId of tileKeys) {
  const [tileX, tileZ] = tileId.split(':').map(Number);
  const filename = tileX + '_' + tileZ + '.json';
  const record = {
    schemaVersion: 1,
    tileId,
    tileX,
    tileZ,
    tileSizeMeters,
    bounds: getTileWorldBounds(tileX, tileZ, tileSizeMeters),
    source: {
      publisher: 'City of Chicago',
      datasets: [
        {
          layer: 'streets',
          datasetId: streetSource.datasetId,
          retrievedAt: streetData.retrievedAt
        },
        {
          layer: 'buildings',
          datasetId: buildingSource.datasetId,
          retrievedAt: buildingData.retrievedAt
        }
      ]
    },
    streets: streetTiles[tileId] || [],
    buildings: buildingTiles[tileId] || []
  };
  await writeFile(resolve(outputRoot, filename), JSON.stringify(record));
  tiles.push({
    tileId,
    file: filename,
    streetCount: record.streets.length,
    buildingCount: record.buildings.length
  });
}

const outputManifest = {
  schemaVersion: 1,
  coordinateSystem: manifest.coordinateSystem,
  origin: manifest.origin,
  tileSizeMeters,
  generatedAt: new Date().toISOString(),
  tileCount: tiles.length,
  tiles
};
await writeFile(
  resolve(outputRoot, 'manifest.json'),
  JSON.stringify(outputManifest, null, 2) + '\n'
);
console.log(
  'Built ' + tiles.length + ' Chicago tiles from ' +
  streetFeatureCount + ' street features and ' +
  buildingFeatureCount + ' building features.'
);
console.log('Output: ' + outputRoot);
