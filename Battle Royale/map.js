import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

// Terrain height function for the island
export function getTerrainHeight(x, z) {
  const dist = Math.hypot(x, z);
  const islandRadius = 180;

  if (dist > islandRadius) {
    // Under ocean water
    return -5 - (dist - islandRadius) * 0.2;
  }

  // Falloff towards beach at edge
  const falloff = Math.max(0, 1 - Math.pow(dist / islandRadius, 2.5));

  // Rolling hills using multi-frequency sines
  const hill1 = Math.sin(x * 0.025) * Math.cos(z * 0.025) * 12;
  const hill2 = Math.sin(x * 0.06 + 1.2) * Math.cos(z * 0.05 + 0.8) * 6;
  const hill3 = Math.sin(x * 0.12) * Math.sin(z * 0.12) * 2;

  // Mountain peak at (x: 40, z: -30)
  const mountainDist = Math.hypot(x - 40, z + 30);
  const mountain = Math.max(0, 24 - mountainDist * 0.45);

  const baseHeight = 4 + (hill1 + hill2 + hill3 + mountain) * falloff;
  return Math.max(0.5, baseHeight);
}

export function createIsland(scene, world) {
  const colliders = [];
  const chests = [];
  const obstacles = [];

  // 1. Terrain Mesh
  const size = 420;
  const segments = 120;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = [];
  const cSand = new THREE.Color(0xd8c89d);
  const cGrass = new THREE.Color(0x4a9938);
  const cDarkGrass = new THREE.Color(0x357825);
  const cRock = new THREE.Color(0x7a7f85);

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const vy = getTerrainHeight(vx, vz);
    pos.setY(i, vy);

    // Color by height and slope
    if (vy < 2.5) {
      colors.push(cSand.r, cSand.g, cSand.b);
    } else if (vy > 25) {
      colors.push(cRock.r, cRock.g, cRock.b);
    } else {
      const blend = (Math.sin(vx * 0.1) * Math.cos(vz * 0.1) + 1) * 0.5;
      const c = cGrass.clone().lerp(cDarkGrass, blend);
      colors.push(c.r, c.g, c.b);
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.05
  });

  const terrainMesh = new THREE.Mesh(geo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // Rapier Heightfield or coarse grid colliders for terrain
  const groundDesc = RAPIER.ColliderDesc.cuboid(220, 2, 220).setTranslation(0, -2, 0);
  world.createCollider(groundDesc);

  // 2. Ocean Water Plane
  const waterGeo = new THREE.PlaneGeometry(1600, 1600);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1b7fb5,
    roughness: 0.15,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 1.2;
  scene.add(water);

  // Materials for buildings and props
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x82522e, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x9b3b28, roughness: 0.7 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
  const treeBarkMat = new THREE.MeshStandardMaterial({ color: 0x4d3319, roughness: 0.9 });
  const treeLeafMat = new THREE.MeshStandardMaterial({ color: 0x245e1d, roughness: 0.8 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6e7379, roughness: 0.9 });

  // 3. Cabin Builder
  function buildCabin(cx, cz, rotation = 0) {
    const cy = getTerrainHeight(cx, cz);
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(cx, cy, cz);
    cabinGroup.rotation.y = rotation;

    const w = 7.5;
    const d = 8.5;
    const h = 3.8;

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), floorMat);
    floor.position.y = 0.15;
    cabinGroup.add(floor);

    // Walls (Back, Left, Right, Front with door opening)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), woodMat);
    backWall.position.set(0, h / 2, -d / 2);
    cabinGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, d), woodMat);
    leftWall.position.set(-w / 2, h / 2, 0);
    cabinGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, d), woodMat);
    rightWall.position.set(w / 2, h / 2, 0);
    cabinGroup.add(rightWall);

    // Front Wall with Doorway
    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(2.5, h, 0.3), woodMat);
    frontWallL.position.set(-2.5, h / 2, d / 2);
    cabinGroup.add(frontWallL);

    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(2.5, h, 0.3), woodMat);
    frontWallR.position.set(2.5, h / 2, d / 2);
    cabinGroup.add(frontWallR);

    // Roof (two pitched planes)
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, 0.25, d + 0.6), roofMat);
    roofL.position.set(-1.8, h + 1.1, 0);
    roofL.rotation.z = 0.45;
    cabinGroup.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, 0.25, d + 0.6), roofMat);
    roofR.position.set(1.8, h + 1.1, 0);
    roofR.rotation.z = -0.45;
    cabinGroup.add(roofR);

    scene.add(cabinGroup);

    // Physics Colliders for Cabin
    const desc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2)
      .setTranslation(cx, cy + h / 2, cz)
      .setRotation({ w: Math.cos(rotation / 2), x: 0, y: Math.sin(rotation / 2), z: 0 });
    // Coarse collider for the cabin
    world.createCollider(desc);

    // Place a Golden Chest inside
    createChest(cx, cy + 0.3, cz, cabinGroup);
  }

  // 4. Pine Tree Builder
  function buildTree(tx, tz) {
    const ty = getTerrainHeight(tx, tz);
    if (ty < 1.8) return; // Don't put trees in ocean water

    const tree = new THREE.Group();
    tree.position.set(tx, ty, tz);

    const trunkH = 2.5 + Math.random() * 1.5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, trunkH, 6), treeBarkMat);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    tree.add(trunk);

    // 3 Foliage Cones
    const tiers = 3;
    for (let t = 0; t < tiers; t++) {
      const coneR = 2.2 - t * 0.5;
      const coneH = 2.4;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(coneR, coneH, 7), treeLeafMat);
      cone.position.y = trunkH + t * 1.4;
      cone.castShadow = true;
      tree.add(cone);
    }

    scene.add(tree);
    obstacles.push({ x: tx, z: tz, radius: 0.8 });

    // Rapier Trunk Collider
    world.createCollider(RAPIER.ColliderDesc.cylinder(trunkH / 2, 0.4).setTranslation(tx, ty + trunkH / 2, tz));
  }

  // 5. Rock Builder
  function buildRock(rx, rz, scale = 1) {
    const ry = getTerrainHeight(rx, rz);
    const geo = new THREE.DodecahedronGeometry(1.4 * scale, 0);
    const mesh = new THREE.Mesh(geo, rockMat);
    mesh.position.set(rx, ry + 0.5 * scale, rz);
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    mesh.scale.set(1 + Math.random() * 0.3, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.3);
    mesh.castShadow = true;
    scene.add(mesh);

    obstacles.push({ x: rx, z: rz, radius: 1.2 * scale });
    world.createCollider(RAPIER.ColliderDesc.ball(1.2 * scale).setTranslation(rx, ry + 0.5 * scale, rz));
  }

  // 6. Chest Builder
  function createChest(x, y, z) {
    const chestGroup = new THREE.Group();
    chestGroup.position.set(x, y, z);

    const chestMat = new THREE.MeshStandardMaterial({
      color: 0xda9100,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x442a00
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x664400
    });

    // Chest Body
    const chestBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.65), chestMat);
    chestBody.position.y = 0.28;
    chestGroup.add(chestBody);

    // Lid
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.92, 8, 1, false, 0, Math.PI), trimMat);
    lid.rotation.z = Math.PI / 2;
    lid.position.set(0, 0.55, 0);
    chestGroup.add(lid);

    // Glowing aura light
    const chestLight = new THREE.PointLight(0xffcc00, 1.8, 8);
    chestLight.position.set(0, 0.8, 0);
    chestGroup.add(chestLight);

    scene.add(chestGroup);

    chests.push({
      group: chestGroup,
      light: chestLight,
      position: new THREE.Vector3(x, y, z),
      opened: false,
      pulse: Math.random() * Math.PI
    });
  }

  // Place settlements / Cabins across the island
  const cabinPositions = [
    { x: -45, z: -40, rot: 0.2 },
    { x: -55, z: 20, rot: -0.4 },
    { x: 30, z: -60, rot: 0.8 },
    { x: 75, z: 15, rot: 1.5 },
    { x: 10, z: 65, rot: -0.2 },
    { x: -80, z: -85, rot: 0.5 },
    { x: 40, z: 80, rot: 0.1 },
    { x: 40, z: -30, rot: 0.0 } // Mountain peak shrine
  ];

  cabinPositions.forEach(p => buildCabin(p.x, p.z, p.rot));

  // Place free-standing hilltop chests
  createChest(0, getTerrainHeight(0, 0), 0);
  createChest(-20, getTerrainHeight(-20, 110), 110);
  createChest(110, getTerrainHeight(110, -40), -40);

  // Place Trees procedurally around the island
  const treeCount = 90;
  for (let i = 0; i < treeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 150;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;
    buildTree(tx, tz);
  }

  // Place Rocks
  const rockCount = 45;
  for (let i = 0; i < rockCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 165;
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    buildRock(rx, rz, 0.8 + Math.random() * 0.8);
  }

  return {
    terrainMesh,
    chests,
    obstacles,
    getHeight: getTerrainHeight
  };
}
