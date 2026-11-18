export const LEVEL_THRESHOLDS = Object.freeze([0, 100, 250, 450, 700, 1000, 1400, 1850]);
export const LEVEL_TITLES = Object.freeze([
  'New Neighbor',
  'Neighborhood Helper',
  'Block Regular',
  'Community Builder',
  'Courtyard Favorite',
  'Neighborhood Leader',
  'Community Star',
  'Neighborhood Legend'
]);

export function createPlayerProfile() {
  return { cash: 0, xp: 0, deliveriesCompleted: 0, snapshotsFound: 0 };
}

export function normalizePlayerProfile(value) {
  const fallback = createPlayerProfile();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const safeInteger = (candidate, maximum) =>
    Number.isSafeInteger(candidate) && candidate >= 0 ? Math.min(candidate, maximum) : 0;
  return {
    cash: safeInteger(value.cash, 999999999),
    xp: safeInteger(value.xp, 999999999),
    deliveriesCompleted: safeInteger(value.deliveriesCompleted, 1000000),
    snapshotsFound: safeInteger(value.snapshotsFound, 5)
  };
}

export function getPlayerLevel(xp) {
  const safeXp = Number.isSafeInteger(xp) && xp >= 0 ? xp : 0;
  let level = 1;
  for (let index = 1; index < LEVEL_THRESHOLDS.length; index++) {
    if (safeXp < LEVEL_THRESHOLDS[index]) break;
    level = index + 1;
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null;
  return {
    level,
    title: LEVEL_TITLES[level - 1] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1],
    currentThreshold,
    nextThreshold,
    progressToNext: nextThreshold === null ? 1 : (safeXp - currentThreshold) / (nextThreshold - currentThreshold),
    xpRemaining: nextThreshold === null ? 0 : Math.max(0, nextThreshold - safeXp)
  };
}

export function applyPlayerReward(profile, reward = {}) {
  const current = normalizePlayerProfile(profile);
  const cash = Number.isSafeInteger(reward.cash) && reward.cash > 0 ? Math.min(reward.cash, 1000000) : 0;
  const xp = Number.isSafeInteger(reward.xp) && reward.xp > 0 ? Math.min(reward.xp, 1000000) : 0;
  const beforeLevel = getPlayerLevel(current.xp).level;
  const next = normalizePlayerProfile({
    ...current,
    cash: Math.min(999999999, current.cash + cash),
    xp: Math.min(999999999, current.xp + xp)
  });
  const levelInfo = getPlayerLevel(next.xp);
  return {
    profile: next,
    reward: { cash, xp },
    levelInfo,
    leveledUp: levelInfo.level > beforeLevel
  };
}
