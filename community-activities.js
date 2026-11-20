// Optional, non-combat neighborhood activities and lightweight NPC conversations.
const NEIGHBOR_NAMES = Object.freeze([
  'Aisha', 'Jordan', 'Nia', 'Marcus', 'Talia',
  'Andre', 'Imani', 'Devon', 'Zoe', 'Malik',
  'Janelle', 'Isaiah', 'Camille', 'Darius', 'Riley',
  'Amara', 'Micah', 'Sanaa', 'Eli', 'Kiara'
]);

const CONVERSATIONS = Object.freeze([
  Object.freeze([
    'Good to see someone out enjoying the neighborhood.',
    'The block feels more lively when everyone looks out for each other.',
    'I heard the market has a fresh delivery coming in today.',
    'Hope you are enjoying the day. Take care out here.'
  ]),
  Object.freeze([
    'The courtyard has been getting a lot of love lately.',
    'A little help from everyone makes a big difference.',
    'Have you checked out the garden? It is looking great.',
    'See you around. There is always something happening nearby.'
  ]),
  Object.freeze([
    'Traffic gets busy around here, so watch the corners.',
    'The evening air around West Avenue is hard to beat.',
    'I like seeing new faces getting involved.',
    'There is plenty to explore without going too far.'
  ]),
  Object.freeze([
    'The neighborhood schedule changes throughout the day.',
    'A quick hello can make somebody\'s day.',
    'The market crew has been working hard this week.',
    'Keep an eye out for the little things that need doing.'
  ])
]);

export const NEIGHBORS = Object.freeze(NEIGHBOR_NAMES.map((name, index) => Object.freeze({
  id: 'neighbor-' + String(index + 1).padStart(2, '0'),
  name,
  conversations: CONVERSATIONS[index % CONVERSATIONS.length]
})));

export const CLEANUP_SPOTS = Object.freeze([
  Object.freeze({ id: 'cleanup-market-walk', label: 'Market-side walkway', x: -52, z: 29 }),
  Object.freeze({ id: 'cleanup-garden-path', label: 'Garden path', x: -13, z: 30 }),
  Object.freeze({ id: 'cleanup-courtyard-corner', label: 'Courtyard corner', x: -31, z: 61 })
]);

const NEIGHBOR_IDS = new Set(NEIGHBORS.map(item => item.id));
const CLEANUP_IDS = new Set(CLEANUP_SPOTS.map(item => item.id));
const ACTIVITY_IDS = new Set(['neighbor-introductions', 'courtyard-cleanup']);

export function createCommunityState() {
  return {
    greetedNeighborIds: [],
    cleanedSpotIds: [],
    completedActivityIds: []
  };
}

export function normalizeCommunityState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createCommunityState();
  const uniqueKnown = (items, valid, max) => Array.isArray(items)
    ? [...new Set(items.filter(id => typeof id === 'string' && valid.has(id)))].slice(0, max)
    : [];
  return {
    greetedNeighborIds: uniqueKnown(value.greetedNeighborIds, NEIGHBOR_IDS, NEIGHBORS.length),
    cleanedSpotIds: uniqueKnown(value.cleanedSpotIds, CLEANUP_IDS, CLEANUP_SPOTS.length),
    completedActivityIds: uniqueKnown(value.completedActivityIds, ACTIVITY_IDS, ACTIVITY_IDS.size)
  };
}

export function getNeighborById(id) {
  return NEIGHBORS.find(item => item.id === id) ?? null;
}

export function greetNeighbor(state, neighborId, gameHours = 12) {
  const current = normalizeCommunityState(state);
  const neighbor = getNeighborById(neighborId);
  if (!neighbor) {
    return { state: current, accepted: false, firstGreeting: false, completedNow: false,
      reward: { cash: 0, xp: 0 }, message: 'This neighbor is not available right now.' };
  }

  const firstGreeting = !current.greetedNeighborIds.includes(neighborId);
  const hour = Number.isFinite(gameHours) ? ((gameHours % 24) + 24) % 24 : 12;
  const lineIndex = (Math.floor(hour / 3) + Number(neighbor.id.slice(-2))) % neighbor.conversations.length;
  const message = neighbor.name + ': ' + neighbor.conversations[lineIndex];

  if (!firstGreeting) {
    return { state: current, accepted: true, firstGreeting: false, completedNow: false,
      reward: { cash: 0, xp: 0 }, message };
  }

  current.greetedNeighborIds.push(neighborId);
  const completedNow = current.greetedNeighborIds.length >= 3
    && !current.completedActivityIds.includes('neighbor-introductions');
  if (completedNow) current.completedActivityIds.push('neighbor-introductions');

  return {
    state: current,
    accepted: true,
    firstGreeting: true,
    completedNow,
    reward: { cash: 12 + (completedNow ? 60 : 0), xp: 8 + (completedNow ? 50 : 0) },
    message: completedNow ? message + ' You have now met three neighbors!' : message
  };
}

export function collectCleanupSpot(state, spotId) {
  const current = normalizeCommunityState(state);
  const spot = CLEANUP_SPOTS.find(item => item.id === spotId);
  if (!spot || current.cleanedSpotIds.includes(spotId)) {
    return { state: current, accepted: false, completedNow: false,
      reward: { cash: 0, xp: 0 }, message: spot ? 'This spot has already been cleaned.' : 'That cleanup spot is unavailable.' };
  }

  current.cleanedSpotIds.push(spotId);
  const completedNow = current.cleanedSpotIds.length === CLEANUP_SPOTS.length
    && !current.completedActivityIds.includes('courtyard-cleanup');
  if (completedNow) current.completedActivityIds.push('courtyard-cleanup');

  return {
    state: current,
    accepted: true,
    completedNow,
    reward: { cash: 15 + (completedNow ? 75 : 0), xp: 10 + (completedNow ? 55 : 0) },
    message: completedNow
      ? 'Courtyard cleanup complete! The walkways are looking better.'
      : 'Thanks for helping with the ' + spot.label.toLowerCase() + '.'
  };
}

export function getCommunityProgress(state) {
  const current = normalizeCommunityState(state);
  return {
    neighborsGreeted: current.greetedNeighborIds.length,
    neighborsRequired: 3,
    cleanupSpotsCleared: current.cleanedSpotIds.length,
    cleanupSpotsTotal: CLEANUP_SPOTS.length,
    introductionsComplete: current.completedActivityIds.includes('neighbor-introductions'),
    cleanupComplete: current.completedActivityIds.includes('courtyard-cleanup'),
    completedActivities: [...current.completedActivityIds]
  };
}
