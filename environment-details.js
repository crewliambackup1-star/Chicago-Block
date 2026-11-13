function deterministicSample(index, salt = 0) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/**
 * Creates deterministic, renderer-independent placements for small world
 * details. Keeping the layout pure makes desktop/mobile density testable.
 */
export function buildEnvironmentDetailLayout({ coarsePointer = false } = {}) {
  const streets = [-82, 0, 82];
  const roadRepairPatches = [];
  let patchIndex = 0;

  for (const street of streets) {
    for (let lane = -1; lane <= 1; lane += 2) {
      for (let segment = 0; segment < 6; segment++) {
        const along = -138 + segment * 55 + (deterministicSample(segment, street + lane) - 0.5) * 13;
        if (streets.some(crossing => Math.abs(along - crossing) < 19)) continue;
        const width = 1.25 + deterministicSample(patchIndex, 4) * 2.05;
        const depth = 0.46 + deterministicSample(patchIndex, 9) * 0.7;
        roadRepairPatches.push({
          x: lane === 1 ? along : street + lane * (4.8 + deterministicSample(patchIndex, 12) * 1.7),
          z: lane === 1 ? street + lane * (4.8 + deterministicSample(patchIndex, 12) * 1.7) : along,
          width,
          depth,
          rotation: (deterministicSample(patchIndex, 17) - 0.5) * 0.38
        });
        patchIndex++;
        roadRepairPatches.push({
          x: lane === 1 ? street + lane * (4.6 + deterministicSample(patchIndex, 22) * 1.8) : along + 8,
          z: lane === 1 ? along + 8 : street + lane * (4.6 + deterministicSample(patchIndex, 22) * 1.8),
          width: depth * 1.7,
          depth: width * 0.62,
          rotation: (deterministicSample(patchIndex, 27) - 0.5) * 0.42
        });
        patchIndex++;
      }
    }
  }

  const gutterWearSegments = [];
  for (const street of streets) {
    for (const side of [-1, 1]) {
      for (let along = -145; along <= 145; along += 9.5) {
        if (streets.some(crossing => Math.abs(along - crossing) < 15)) continue;
        gutterWearSegments.push({ x: along, z: street + side * 8.12, rotation: 0 });
        gutterWearSegments.push({ x: street + side * 8.12, z: along, rotation: Math.PI / 2 });
      }
    }
  }

  const curbWarningPads = [];
  for (const x of streets) {
    for (const z of streets) {
      for (const sideX of [-1, 1]) {
        for (const sideZ of [-1, 1]) {
          curbWarningPads.push({
            x: x + sideX * 9.72,
            z: z + sideZ * 9.72,
            rotation: (sideX === sideZ ? 0 : Math.PI / 2)
          });
        }
      }
    }
  }

  const trees = [[-58, 17], [-13, 17], [-58, 58], [-13, 58], [-48, 7], [-22, 69]];
  const treeMulchBeds = trees.map(([x, z]) => ({ x, z, radius: 1.28 }));
  const groundLeafLitter = [];
  const understoryShrubs = [];

  trees.forEach(([x, z], treeIndex) => {
    const litterCount = coarsePointer ? 7 : 14;
    for (let leaf = 0; leaf < litterCount; leaf++) {
      const angle = leaf * 2.399963 + treeIndex * 0.41;
      const radius = 0.72 + deterministicSample(leaf, treeIndex + 31) * 0.52;
      groundLeafLitter.push({
        x: x + Math.cos(angle) * radius,
        z: z + Math.sin(angle) * radius,
        rotation: angle,
        scale: 0.72 + deterministicSample(leaf, treeIndex + 47) * 0.62
      });
    }
    const shrubCount = coarsePointer ? 3 : 5;
    for (let shrub = 0; shrub < shrubCount; shrub++) {
      const angle = shrub * (Math.PI * 2 / shrubCount) + treeIndex * 0.63;
      const radius = 1.28 + deterministicSample(shrub, treeIndex + 61) * 0.22;
      understoryShrubs.push({
        x: x + Math.cos(angle) * radius,
        z: z + Math.sin(angle) * radius,
        scale: 0.82 + deterministicSample(shrub, treeIndex + 73) * 0.42
      });
    }
  });

  const densityFilter = items => coarsePointer ? items.filter((_, index) => index % 2 === 0) : items;
  return Object.freeze({
    roadRepairPatches: Object.freeze(densityFilter(roadRepairPatches)),
    gutterWearSegments: Object.freeze(densityFilter(gutterWearSegments)),
    curbWarningPads: Object.freeze(curbWarningPads),
    treeMulchBeds: Object.freeze(treeMulchBeds),
    groundLeafLitter: Object.freeze(densityFilter(groundLeafLitter)),
    understoryShrubs: Object.freeze(densityFilter(understoryShrubs))
  });
}

/**
 * Installs the V4.7 street-surface and planting detail pass using batched
 * meshes. It does not create colliders or alter movement/navigation.
 */
export function addWorldEnvironmentDetails(THREE, { world, coarsePointer = false } = {}) {
  if (!THREE || !world || typeof world.add !== 'function') {
    throw new TypeError('A Three.js namespace and world group are required');
  }

  const layout = buildEnvironmentDetailLayout({ coarsePointer });
  const transform = new THREE.Object3D();

  const repairMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, metalness: 0, polygonOffset: true,
    polygonOffsetFactor: -1, depthWrite: false
  });
  const repairMesh = new THREE.InstancedMesh(
    new THREE.CircleGeometry(1, 20), repairMaterial, layout.roadRepairPatches.length
  );
  const repairColors = [0x333a3d, 0x41484a, 0x383f40, 0x4a4d49];
  layout.roadRepairPatches.forEach((patch, index) => {
    transform.position.set(patch.x, -0.056, patch.z);
    transform.rotation.set(-Math.PI / 2, 0, patch.rotation);
    transform.scale.set(patch.width / 2, patch.depth / 2, 1);
    transform.updateMatrix();
    repairMesh.setMatrixAt(index, transform.matrix);
    repairMesh.setColorAt(index, new THREE.Color(repairColors[index % repairColors.length]));
  });
  repairMesh.instanceMatrix.needsUpdate = true;
  if (repairMesh.instanceColor) repairMesh.instanceColor.needsUpdate = true;
  repairMesh.castShadow = false;
  repairMesh.receiveShadow = false;
  world.add(repairMesh);

  const crackPositions = [];
  layout.roadRepairPatches.forEach((patch, index) => {
    const angle = patch.rotation + deterministicSample(index, 88) * Math.PI;
    const length = 0.38 + deterministicSample(index, 91) * 0.58;
    const branch = 0.16 + deterministicSample(index, 94) * 0.22;
    const startX = patch.x - Math.cos(angle) * length * 0.5;
    const startZ = patch.z - Math.sin(angle) * length * 0.5;
    const midX = patch.x + Math.cos(angle) * length * 0.12;
    const midZ = patch.z + Math.sin(angle) * length * 0.12;
    const endX = patch.x + Math.cos(angle) * length * 0.5;
    const endZ = patch.z + Math.sin(angle) * length * 0.5;
    crackPositions.push(startX, -0.052, startZ, midX, -0.052, midZ);
    crackPositions.push(midX, -0.052, midZ, endX, -0.052, endZ);
    crackPositions.push(midX, -0.052, midZ, midX + Math.cos(angle + branch) * 0.28, -0.052, midZ + Math.sin(angle + branch) * 0.28);
  });
  const crackGeometry = new THREE.BufferGeometry();
  crackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(crackPositions, 3));
  const crackLines = new THREE.LineSegments(crackGeometry, new THREE.LineBasicMaterial({
    color: 0x202729, transparent: true, opacity: 0.56, depthWrite: false
  }));
  crackLines.frustumCulled = false;
  world.add(crackLines);

  const gutterMaterial = new THREE.MeshStandardMaterial({
    color: 0x343a37, roughness: 1, transparent: true, opacity: 0.32,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1
  });
  const gutterMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1), gutterMaterial, layout.gutterWearSegments.length
  );
  layout.gutterWearSegments.forEach((segment, index) => {
    transform.position.set(segment.x, -0.049, segment.z);
    transform.rotation.set(0, segment.rotation, 0);
    transform.scale.set(7.1, 0.008, 0.11);
    transform.updateMatrix();
    gutterMesh.setMatrixAt(index, transform.matrix);
  });
  gutterMesh.instanceMatrix.needsUpdate = true;
  gutterMesh.castShadow = false;
  gutterMesh.receiveShadow = false;
  world.add(gutterMesh);

  const warningMaterial = new THREE.MeshStandardMaterial({
    color: 0x9c8b65, roughness: 0.94, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -1
  });
  const warningPads = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1), warningMaterial, layout.curbWarningPads.length
  );
  layout.curbWarningPads.forEach((pad, index) => {
    transform.position.set(pad.x, -0.004, pad.z);
    transform.rotation.set(-Math.PI / 2, 0, pad.rotation);
    transform.scale.set(1.25, 0.78, 1);
    transform.updateMatrix();
    warningPads.setMatrixAt(index, transform.matrix);
  });
  warningPads.instanceMatrix.needsUpdate = true;
  warningPads.castShadow = false;
  warningPads.receiveShadow = false;
  world.add(warningPads);

  const studsPerPad = coarsePointer ? 8 : 12;
  const warningStudCount = layout.curbWarningPads.length * studsPerPad;
  const warningStuds = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.024, 8),
    new THREE.MeshStandardMaterial({ color: 0xc2b18b, roughness: 0.86 }),
    warningStudCount
  );
  let studIndex = 0;
  layout.curbWarningPads.forEach(pad => {
    const columns = studsPerPad === 8 ? 4 : 4;
    const rows = studsPerPad / columns;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        transform.position.set(
          pad.x + (column - (columns - 1) / 2) * 0.19,
          0.011,
          pad.z + (row - (rows - 1) / 2) * 0.19
        );
        transform.rotation.set(0, 0, 0);
        transform.scale.set(1, 1, 1);
        transform.updateMatrix();
        warningStuds.setMatrixAt(studIndex++, transform.matrix);
      }
    }
  });
  warningStuds.instanceMatrix.needsUpdate = true;
  warningStuds.castShadow = false;
  warningStuds.receiveShadow = false;
  world.add(warningStuds);

  const mulchMesh = new THREE.InstancedMesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshStandardMaterial({ color: 0x66513b, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 }),
    layout.treeMulchBeds.length
  );
  layout.treeMulchBeds.forEach((bed, index) => {
    transform.position.set(bed.x, -0.001, bed.z);
    transform.rotation.set(-Math.PI / 2, 0, 0);
    transform.scale.set(bed.radius, bed.radius * 0.92, 1);
    transform.updateMatrix();
    mulchMesh.setMatrixAt(index, transform.matrix);
  });
  mulchMesh.instanceMatrix.needsUpdate = true;
  mulchMesh.castShadow = false;
  mulchMesh.receiveShadow = false;
  world.add(mulchMesh);

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b7655, roughness: 0.98, side: THREE.DoubleSide,
    transparent: true, opacity: 0.9, depthWrite: false
  });
  const leafGeometry = new THREE.PlaneGeometry(0.16, 0.07);
  const leafMesh = new THREE.InstancedMesh(leafGeometry, leafMaterial, layout.groundLeafLitter.length);
  layout.groundLeafLitter.forEach((leaf, index) => {
    transform.position.set(leaf.x, 0.004, leaf.z);
    transform.rotation.set(-Math.PI / 2, 0, leaf.rotation);
    transform.scale.set(leaf.scale, leaf.scale, 1);
    transform.updateMatrix();
    leafMesh.setMatrixAt(index, transform.matrix);
    leafMesh.setColorAt(index, new THREE.Color(index % 3 === 0 ? 0x76583d : index % 3 === 1 ? 0x9a8056 : 0x66513d));
  });
  leafMesh.instanceMatrix.needsUpdate = true;
  if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
  leafMesh.castShadow = false;
  leafMesh.receiveShadow = false;
  world.add(leafMesh);

  const shrubMesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.3, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.98 }),
    layout.understoryShrubs.length
  );
  layout.understoryShrubs.forEach((shrub, index) => {
    transform.position.set(shrub.x, 0.22, shrub.z);
    transform.rotation.set(0, deterministicSample(index, 119) * Math.PI, 0);
    transform.scale.set(shrub.scale * 1.25, shrub.scale * 0.76, shrub.scale);
    transform.updateMatrix();
    shrubMesh.setMatrixAt(index, transform.matrix);
    shrubMesh.setColorAt(index, new THREE.Color(index % 4 === 0 ? 0x496c43 : index % 3 === 0 ? 0x66834d : 0x54764a));
  });
  shrubMesh.instanceMatrix.needsUpdate = true;
  if (shrubMesh.instanceColor) shrubMesh.instanceColor.needsUpdate = true;
  shrubMesh.castShadow = true;
  shrubMesh.receiveShadow = true;
  world.add(shrubMesh);

  const counts = Object.freeze({
    roadRepairPatches: layout.roadRepairPatches.length,
    roadCrackSegments: layout.roadRepairPatches.length * 3,
    gutterWearSegments: layout.gutterWearSegments.length,
    curbWarningPads: layout.curbWarningPads.length,
    curbWarningStuds: warningStudCount,
    treeMulchBeds: layout.treeMulchBeds.length,
    groundLeafLitter: layout.groundLeafLitter.length,
    understoryShrubs: layout.understoryShrubs.length
  });
  world.userData.environmentDetails = counts;
  return counts;
}
