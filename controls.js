// Pure vehicle controls, kept separate so steering and exit placement can be tested without WebGL.
// A / Left arrow = positive steering (left); D / Right arrow = negative steering (right).
export function getCarSteeringInput(leftPressed, rightPressed) {
  return Number(Boolean(leftPressed)) - Number(Boolean(rightPressed));
}

export function findVehicleExitPosition(x, z, heading, isBlocked, offset = 3.1) {
  if (![x, z, heading, offset].every(Number.isFinite) || offset <= 0) {
    throw new TypeError('Vehicle exit coordinates, heading and offset must be finite; offset must be positive.');
  }
  if (typeof isBlocked !== 'function') {
    throw new TypeError('Vehicle exit placement requires a collision-check function.');
  }

  // Try the driver's side first, then the passenger side, then clear space at either end.
  const directions = [
    { x: -Math.cos(heading), z: Math.sin(heading) },
    { x: Math.cos(heading), z: -Math.sin(heading) },
    { x: -Math.sin(heading), z: -Math.cos(heading) },
    { x: Math.sin(heading), z: Math.cos(heading) }
  ];
  for (const direction of directions) {
    const candidate = { x: x + direction.x * offset, z: z + direction.z * offset };
    if (!isBlocked(candidate.x, candidate.z)) return candidate;
  }
  return null;
}
