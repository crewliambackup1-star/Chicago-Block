// V4.9 soft contact shadows ground characters and vehicles without a
// heavyweight screen-space post-processing pass or extra per-subject draw calls.
const CONTACT_SHADOW_PROFILES = Object.freeze({
  pedestrian: Object.freeze({ width: 0.78, depth: 1.12, height: -0.012 }),
  avatar: Object.freeze({ width: 0.88, depth: 1.26, height: -0.012 }),
  vehicle: Object.freeze({ width: 2.72, depth: 5.2, height: -0.073 })
});

export function getContactShadowProfile(kind, { coarsePointer = false } = {}) {
  const profile = CONTACT_SHADOW_PROFILES[kind];
  if (!profile) throw new RangeError(`Unknown contact shadow subject: ${kind}`);
  const densityScale = coarsePointer ? 0.94 : 1;
  return Object.freeze({
    width: profile.width * densityScale,
    depth: profile.depth * densityScale,
    height: profile.height
  });
}

export function createContactShadowTexture(THREE) {
  if (!THREE?.CanvasTexture || typeof document === 'undefined') {
    throw new TypeError('Three.js CanvasTexture and a browser document are required');
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas context is required for contact shadows');

  const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(9, 13, 16, 0.42)');
  gradient.addColorStop(0.28, 'rgba(9, 13, 16, 0.30)');
  gradient.addColorStop(0.66, 'rgba(9, 13, 16, 0.12)');
  gradient.addColorStop(1, 'rgba(9, 13, 16, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export function createContactShadowBatch(THREE, { count, texture, opacity = 0.72 } = {}) {
  if (!THREE?.InstancedMesh || !THREE?.PlaneGeometry || !texture) {
    throw new TypeError('Three.js instancing and a contact-shadow texture are required');
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('Contact-shadow instance count must be a positive integer');
  }
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const batch = new THREE.InstancedMesh(geometry, material, count);
  batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  batch.castShadow = false;
  batch.receiveShadow = false;
  batch.frustumCulled = false;
  batch.renderOrder = 2;
  batch.userData.visualQuality = 'v4.9-instanced-soft-contact-shadows';
  return batch;
}

export function updateContactShadowBatch(THREE, batch, targets, { coarsePointer = false } = {}) {
  if (!THREE?.Object3D || !batch?.setMatrixAt || !Array.isArray(targets)) {
    throw new TypeError('A Three.js instanced mesh and a target array are required');
  }
  if (targets.length > batch.count) {
    throw new RangeError('Contact-shadow targets exceed the allocated instance count');
  }

  const transform = new THREE.Object3D();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const planeRotation = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0), -Math.PI / 2
  );
  const yawRotation = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const hiddenScale = new THREE.Vector3(0, 0, 0);

  for (let index = 0; index < batch.count; index++) {
    const entry = targets[index];
    const object = entry?.object;
    if (!object || object.visible === false) {
      transform.position.set(0, -1000, 0);
      transform.quaternion.identity();
      transform.scale.copy(hiddenScale);
    } else {
      const profile = getContactShadowProfile(entry.kind, { coarsePointer });
      position.set(object.position.x, profile.height, object.position.z);
      yawRotation.setFromAxisAngle(worldUp, Number(object.rotation?.y) || 0);
      transform.position.copy(position);
      transform.quaternion.copy(yawRotation).multiply(planeRotation);
      scale.set(profile.width, profile.depth, 1);
      transform.scale.copy(scale);
    }
    transform.updateMatrix();
    batch.setMatrixAt(index, transform.matrix);
  }
  batch.instanceMatrix.needsUpdate = true;
  return batch.count;
}
