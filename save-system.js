export const SAVE_SCHEMA_VERSION = 1;
export const SAVE_STORAGE_KEY = 'chicago-block-save-v6';

export function createSavePayload(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new TypeError('A save snapshot object is required.');
  }
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: Number.isFinite(snapshot.savedAt) ? snapshot.savedAt : Date.now(),
    profile: snapshot.profile,
    campaignState: snapshot.campaignState,
    deliveriesCompleted: snapshot.deliveriesCompleted,
    carryingPackage: Boolean(snapshot.carryingPackage),
    discoveredLandmarks: Array.isArray(snapshot.discoveredLandmarks) ? snapshot.discoveredLandmarks : [],
    player: snapshot.player,
    car: snapshot.car,
    gameHours: snapshot.gameHours,
    weatherMode: snapshot.weatherMode
  };
}

export function serializeSave(snapshot) {
  return JSON.stringify(createSavePayload(snapshot));
}

export function parseSave(serialized) {
  if (typeof serialized !== 'string' || serialized.length > 50000) return null;
  try {
    const value = JSON.parse(serialized);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (value.schemaVersion !== SAVE_SCHEMA_VERSION) return null;
    if (!value.profile || typeof value.profile !== 'object' || Array.isArray(value.profile)) return null;
    if (!value.campaignState || typeof value.campaignState !== 'object' || Array.isArray(value.campaignState)) return null;
    const validPoint = point => point && typeof point === 'object'
      && Number.isFinite(point.x) && Number.isFinite(point.z)
      && Math.abs(point.x) <= 151 && Math.abs(point.z) <= 151;
    if (!validPoint(value.player) || !validPoint(value.car)) return null;
    if (!Number.isFinite(value.gameHours) || value.gameHours < 0 || value.gameHours >= 24) return null;
    if (!Number.isSafeInteger(value.deliveriesCompleted) || value.deliveriesCompleted < 0) return null;
    if (!Array.isArray(value.discoveredLandmarks)) return null;
    if (value.discoveredLandmarks.some(id => typeof id !== 'string')) return null;
    if (!['clear', 'rain', 'fog'].includes(value.weatherMode)) return null;
    return {
      ...value,
      savedAt: Number.isFinite(value.savedAt) ? value.savedAt : 0,
      carryingPackage: Boolean(value.carryingPackage),
      discoveredLandmarks: [...new Set(value.discoveredLandmarks)].slice(0, 5)
    };
  } catch {
    return null;
  }
}
