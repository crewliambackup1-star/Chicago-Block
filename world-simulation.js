const EVENTS = Object.freeze([
  Object.freeze({
    id: 'morning-market',
    label: 'Morning Market Run',
    description: 'The Corner Market is getting its day started.',
    zone: 'CORNER MARKET',
    x: 39,
    z: -27,
    pedestrianSpeed: 1.08,
    trafficSpeed: 1.04
  }),
  Object.freeze({
    id: 'courtyard-social',
    label: 'Courtyard Social',
    description: 'Neighbors are spending time around the courtyard.',
    zone: 'COURTYARD GARDEN',
    x: -35,
    z: 38,
    pedestrianSpeed: 0.92,
    trafficSpeed: 0.96
  }),
  Object.freeze({
    id: 'evening-stroll',
    label: 'Evening Avenue Stroll',
    description: 'The neighborhood is winding down along West Avenue.',
    zone: 'WEST AVENUE',
    x: -91,
    z: -40,
    pedestrianSpeed: 0.82,
    trafficSpeed: 0.9
  }),
  Object.freeze({
    id: 'quiet-hours',
    label: 'Quiet Neighborhood',
    description: 'The streets are quieter while most neighbors are home.',
    zone: 'NORTH BLOCK',
    x: -42,
    z: -92,
    pedestrianSpeed: 0.68,
    trafficSpeed: 0.72
  })
]);

export function getNeighborhoodSchedule(gameHours) {
  const hour = Number.isFinite(gameHours) ? ((gameHours % 24) + 24) % 24 : 12;
  if (hour >= 5 && hour < 10) return { ...EVENTS[0] };
  if (hour >= 10 && hour < 17) return { ...EVENTS[1] };
  if (hour >= 17 && hour < 22) return { ...EVENTS[2] };
  return { ...EVENTS[3] };
}

export function advancePedestrianRoutine(pedestrian, {
  dt,
  distanceToPlayer = Infinity,
  gameHours = 12,
  arrivedAtWaypoint = false,
  plannedPause = 0
} = {}) {
  const next = {
    mode: pedestrian?.mode || 'walking',
    pauseTimer: Math.max(0, Number(pedestrian?.pauseTimer) || 0),
    reactionTimer: Math.max(0, Number(pedestrian?.reactionTimer) || 0),
    reactionCooldown: Math.max(0, Number(pedestrian?.reactionCooldown) || 0)
  };
  const delta = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 1)) : 0;
  next.reactionCooldown = Math.max(0, next.reactionCooldown - delta);

  if (next.mode === 'noticing') {
    next.reactionTimer = Math.max(0, next.reactionTimer - delta);
    if (next.reactionTimer === 0) next.mode = 'walking';
  } else if (Number.isFinite(distanceToPlayer) && distanceToPlayer < 4.5 && next.reactionCooldown === 0) {
    next.mode = 'noticing';
    next.reactionTimer = 1.35;
    next.reactionCooldown = 7;
    next.pauseTimer = 0;
  } else if (next.mode === 'pausing') {
    next.pauseTimer = Math.max(0, next.pauseTimer - delta);
    if (next.pauseTimer === 0) next.mode = 'walking';
  } else if (arrivedAtWaypoint && Number.isFinite(plannedPause) && plannedPause > 0) {
    next.mode = 'pausing';
    next.pauseTimer = Math.min(2.5, plannedPause);
  }

  const hour = Number.isFinite(gameHours) ? gameHours : 12;
  const scheduleMultiplier = hour >= 22 || hour < 5 ? 0.72 : hour >= 17 ? 0.88 : hour < 10 ? 1.05 : 1;
  next.speedMultiplier = scheduleMultiplier;
  return next;
}
