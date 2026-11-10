// Pure keyboard steering mapping, kept separate so it can be tested without a WebGL context.
// A / Left arrow = positive steering (left); D / Right arrow = negative steering (right).
export function getCarSteeringInput(leftPressed, rightPressed) {
  return Number(Boolean(leftPressed)) - Number(Boolean(rightPressed));
}
