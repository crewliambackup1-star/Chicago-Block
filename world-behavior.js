export function getPedestrianRoutineSpeed(gameHours) {
  if (!Number.isFinite(gameHours)) return 1;
  const hour=((gameHours%24)+24)%24;
  if (hour < 6 || hour >= 22) return 0.72;
  if (hour >= 7 && hour < 10) return 1.12;
  if (hour >= 16 && hour < 20) return 0.92;
  return 1;
}

export function getPedestrianReactionDuration(distance) {
  if (!Number.isFinite(distance) || distance < 0 || distance >= 6.5) return 0;
  return distance < 3.9 ? 1.2 : 0.65;
}
