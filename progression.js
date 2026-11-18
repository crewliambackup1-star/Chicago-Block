export const SAVE_KEY = 'chicago-block-player-save-v1';
export const SAVE_SCHEMA_VERSION = 1;

export const VEHICLE_PAINTS = Object.freeze([
  Object.freeze({ id: 'blue', label: 'Lake Blue', hex: '#315e83', price: 0, requiredLevel: 1 }),
  Object.freeze({ id: 'graphite', label: 'Graphite', hex: '#3b444b', price: 100, requiredLevel: 2 }),
  Object.freeze({ id: 'burgundy', label: 'Burgundy', hex: '#743b43', price: 220, requiredLevel: 3 })
]);

const MISSION_IDS = new Set(['welcome', 'pitch-in', 'courtyard-day']);
const LANDMARK_IDS = new Set([
  'west-avenue-mural', 'north-brick-row', 'east-side-corner',
  'courtyard-garden', 'south-street-view'
]);
const PAINT_IDS = new Set(VEHICLE_PAINTS.map(paint => paint.id));
const finiteWhole = (value, fallback = 0, max = 1_000_000_000) =>
  Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : fallback;

export function createDefaultProgress() {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    xp: 0,
    credits: 0,
    deliveriesCompleted: 0,
    completedMissionIds: [],
    discoveredLandmarks: [],
    greetedNeighbors: [],
    campaign: {
      objectiveIndex: 0,
      collectedSupplies: [],
      completedMissionIds: [],
      completed: false
    },
    unlockedPaints: ['blue'],
    selectedPaint: 'blue'
  };
}

function uniqueKnown(values, allowed, maxLength = 100) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter(value => typeof value === 'string' && allowed.has(value)))].slice(0, maxLength);
}

export function sanitizeProgress(input) {
  const defaults = createDefaultProgress();
  const source = input && typeof input === 'object' ? input : {};
  const sourceCampaign = source.campaign && typeof source.campaign === 'object' ? source.campaign : {};
  const completedMissionIds = uniqueKnown(source.completedMissionIds, MISSION_IDS, 3);
  const campaignMissionIds = uniqueKnown(sourceCampaign.completedMissionIds, MISSION_IDS, 3);
  const unlockedPaints = uniqueKnown(source.unlockedPaints, PAINT_IDS, VEHICLE_PAINTS.length);
  if (!unlockedPaints.includes('blue')) unlockedPaints.unshift('blue');
  const selectedPaint = unlockedPaints.includes(source.selectedPaint) ? source.selectedPaint : 'blue';

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    xp: finiteWhole(source.xp),
    credits: finiteWhole(source.credits),
    deliveriesCompleted: finiteWhole(source.deliveriesCompleted),
    completedMissionIds,
    discoveredLandmarks: uniqueKnown(source.discoveredLandmarks, LANDMARK_IDS, LANDMARK_IDS.size),
    greetedNeighbors: Array.isArray(source.greetedNeighbors)
      ? [...new Set(source.greetedNeighbors.filter(id => typeof id === 'string' && /^neighbor-\d{1,3}$/.test(id)))].slice(0, 100)
      : [],
    campaign: {
      objectiveIndex: Math.min(5, finiteWhole(sourceCampaign.objectiveIndex)),
      collectedSupplies: Array.isArray(sourceCampaign.collectedSupplies)
        ? [...new Set(sourceCampaign.collectedSupplies.filter(id =>
            ['supply-market', 'supply-west', 'supply-garden'].includes(id)))].slice(0, 3)
        : [],
      completedMissionIds: campaignMissionIds,
      completed: sourceCampaign.completed === true
    },
    unlockedPaints,
    selectedPaint
  };
}

export function getProgressSummary(progress) {
  const state = sanitizeProgress(progress);
  const level = Math.floor(state.xp / 250) + 1;
  const currentLevelXp = (level - 1) * 250;
  const nextLevelXp = level * 250;
  return {
    level,
    xp: state.xp,
    xpIntoLevel: state.xp - currentLevelXp,
    xpToNextLevel: nextLevelXp - state.xp,
    nextLevelXp,
    credits: state.credits,
    deliveriesCompleted: state.deliveriesCompleted,
    completedMissions: state.completedMissionIds.length,
    discoveredSnapshots: state.discoveredLandmarks.length,
    greetedNeighbors: state.greetedNeighbors.length,
    selectedPaint: state.selectedPaint,
    unlockedPaints: [...state.unlockedPaints],
    availablePaints: VEHICLE_PAINTS.filter(paint => level >= paint.requiredLevel)
      .map(paint => ({ ...paint, owned: state.unlockedPaints.includes(paint.id) }))
  };
}

export function awardProgress(progress, { xp = 0, credits = 0, deliveries = 0 } = {}) {
  const state = sanitizeProgress(progress);
  return sanitizeProgress({
    ...state,
    xp: state.xp + finiteWhole(xp),
    credits: state.credits + finiteWhole(credits),
    deliveriesCompleted: state.deliveriesCompleted + finiteWhole(deliveries)
  });
}

export function updateProgress(progress, patch = {}) {
  const state = sanitizeProgress(progress);
  const nextCampaign = patch.campaign && typeof patch.campaign === 'object'
    ? { ...state.campaign, ...patch.campaign }
    : state.campaign;
  return sanitizeProgress({ ...state, ...patch, campaign: nextCampaign });
}

export function purchaseVehiclePaint(progress, paintId) {
  const state = sanitizeProgress(progress);
  const paint = VEHICLE_PAINTS.find(item => item.id === paintId);
  if (!paint || paint.id === 'blue') return { state, purchased: false, message: 'That paint is not available.' };
  if (state.unlockedPaints.includes(paint.id)) {
    return { state, purchased: false, message: paint.label + ' is already unlocked.' };
  }
  if (getProgressSummary(state).level < paint.requiredLevel) {
    return { state, purchased: false, message: 'Reach level ' + paint.requiredLevel + ' to unlock ' + paint.label + '.' };
  }
  if (state.credits < paint.price) {
    return { state, purchased: false, message: 'You need ' + paint.price + ' credits for ' + paint.label + '.' };
  }
  const next = sanitizeProgress({
    ...state,
    credits: state.credits - paint.price,
    unlockedPaints: [...state.unlockedPaints, paint.id],
    selectedPaint: paint.id
  });
  return { state: next, purchased: true, message: paint.label + ' paint unlocked!' };
}

export function selectVehiclePaint(progress, paintId) {
  const state = sanitizeProgress(progress);
  if (!state.unlockedPaints.includes(paintId)) {
    return { state, selected: false, message: 'Unlock that paint at the Corner Market first.' };
  }
  return {
    state: sanitizeProgress({ ...state, selectedPaint: paintId }),
    selected: true,
    message: VEHICLE_PAINTS.find(paint => paint.id === paintId)?.label + ' selected.'
  };
}

export function cycleVehiclePaint(progress, direction = 1) {
  const state = sanitizeProgress(progress);
  const paints = VEHICLE_PAINTS.filter(paint => state.unlockedPaints.includes(paint.id));
  const currentIndex = Math.max(0, paints.findIndex(paint => paint.id === state.selectedPaint));
  const step = direction < 0 ? -1 : 1;
  const next = paints[(currentIndex + step + paints.length) % paints.length];
  return selectVehiclePaint(state, next.id);
}

export function loadProgress(storage) {
  const defaults = createDefaultProgress();
  if (!storage || typeof storage.getItem !== 'function') {
    return { state: defaults, available: false, error: 'Browser storage is unavailable.' };
  }
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return { state: defaults, available: true, error: null };
    return { state: sanitizeProgress(JSON.parse(raw)), available: true, error: null };
  } catch (error) {
    return {
      state: defaults,
      available: false,
      error: error instanceof Error ? error.message : 'Could not read the local save.'
    };
  }
}

export function saveProgress(storage, progress) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(sanitizeProgress(progress)));
    return true;
  } catch {
    return false;
  }
}
