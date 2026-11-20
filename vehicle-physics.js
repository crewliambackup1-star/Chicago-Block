// Deterministic vehicle handling, separated from Three.js so physics can be tested directly.
const MAX_FRAME_DELTA = 0.05;
const MAX_FORWARD_SPEED = 19;
const MAX_REVERSE_SPEED = 7;
const ACCELERATION = 13.5;
const COAST_DRAG = 0.992;
const BRAKE_DRAG = 0.07;
const STEERING_RATE = 1.45;
const STEERING_REFERENCE_SPEED = 5.5;
const COLLISION_REBOUND = 0.16;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

/**
 * Advances the car by one fixed, bounded simulation step.
 * Heading convention matches the game world: at heading 0, forward is toward -Z.
 */
export function stepVehiclePhysics(state, controls = {}, dt = 0, isBlocked = () => false) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new TypeError('Vehicle state must be an object.');
  }
  if (typeof isBlocked !== 'function') {
    throw new TypeError('Vehicle physics requires a collision-check function.');
  }

  const delta = clamp(finite(dt), 0, MAX_FRAME_DELTA);
  const x = finite(state.x);
  const z = finite(state.z);
  let heading = finite(state.heading);
  let velocity = finite(state.velocity);
  const throttle = Number(Boolean(controls.forward)) - Number(Boolean(controls.backward));
  const steering = Number(Boolean(controls.left)) - Number(Boolean(controls.right));

  velocity += throttle * ACCELERATION * delta;
  velocity *= Math.pow(controls.brake ? BRAKE_DRAG : COAST_DRAG, delta * 60);
  velocity = clamp(velocity, -MAX_REVERSE_SPEED, MAX_FORWARD_SPEED);

  const speedRatio = Math.min(Math.abs(velocity) / STEERING_REFERENCE_SPEED, 1);
  const highSpeedStability = 1 - Math.min(Math.abs(velocity) / MAX_FORWARD_SPEED, 1) * 0.3;
  heading += steering * speedRatio * STEERING_RATE * highSpeedStability
    * delta * Math.sign(velocity || 1);

  const nextX = x - Math.sin(heading) * velocity * delta;
  const nextZ = z - Math.cos(heading) * velocity * delta;
  const moving = Math.abs(nextX - x) + Math.abs(nextZ - z) > 1e-9;
  const collided = moving && Boolean(isBlocked(nextX, nextZ));

  if (collided) {
    velocity *= -COLLISION_REBOUND;
    return { x, z, heading, velocity, collided: true };
  }

  return { x: nextX, z: nextZ, heading, velocity, collided: false };
}
