import * as THREE from 'three';

export const WEAPON_TYPES = {
  pickaxe: {
    id: 'pickaxe',
    name: 'Harvesting Tool',
    rarity: 'common',
    damage: 25,
    headshotMult: 1.0,
    fireRate: 0.45,
    range: 3.5,
    isConsumable: false,
    color: 0x999999
  },
  ar: {
    id: 'ar',
    name: 'Assault Rifle',
    rarity: 'rare',
    damage: 32,
    headshotMult: 1.5,
    fireRate: 0.12,
    magSize: 30,
    range: 180,
    bloom: 0.022,
    isConsumable: false,
    color: 0x0099ff
  },
  shotgun: {
    id: 'shotgun',
    name: 'Pump Shotgun',
    rarity: 'epic',
    damage: 12, // per pellet (8 pellets = 96 body damage)
    pellets: 8,
    headshotMult: 1.5,
    fireRate: 0.85,
    magSize: 5,
    range: 45,
    spread: 0.065,
    isConsumable: false,
    color: 0x9933ff
  },
  shield: {
    id: 'shield',
    name: 'Mini Shield Potion',
    rarity: 'uncommon',
    healAmount: 25,
    healType: 'shield',
    maxCap: 50,
    useTime: 2.0,
    isConsumable: true,
    color: 0x22cc44
  },
  medkit: {
    id: 'medkit',
    name: 'Medkit',
    rarity: 'rare',
    healAmount: 100,
    healType: 'health',
    maxCap: 100,
    useTime: 4.0,
    isConsumable: true,
    color: 0x0099ff
  }
};

export const RARITY_COLORS = {
  common: '#b0b5be',
  uncommon: '#2ecc71',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f39c12'
};

export function createGroundItem(typeId, x, y, z, scene) {
  const def = WEAPON_TYPES[typeId] || WEAPON_TYPES.ar;
  const group = new THREE.Group();
  group.position.set(x, y + 0.35, z);

  // Rarity color
  const colorHex = def.color;

  // 3D Item Icon Mesh
  let itemMesh;
  if (def.id === 'ar') {
    itemMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.22, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 })
    );
  } else if (def.id === 'shotgun') {
    itemMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.2, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x442255, metalness: 0.6, roughness: 0.4 })
    );
  } else if (def.id === 'shield') {
    itemMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x00c8ff, roughness: 0.1, transparent: true, opacity: 0.85 })
    );
  } else {
    itemMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xee3333, roughness: 0.4 })
    );
  }

  itemMesh.castShadow = true;
  group.add(itemMesh);

  // Vertical glowing rarity beam (Fortnite style!)
  const beamMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const beamGeo = new THREE.CylinderGeometry(0.08, 0.25, 3.5, 8, 1, true);
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 1.75;
  group.add(beam);

  // Point light for ground glow
  const light = new THREE.PointLight(colorHex, 1.5, 4);
  light.position.y = 0.5;
  group.add(light);

  scene.add(group);

  return {
    group,
    typeId,
    def,
    position: group.position,
    picked: false,
    update(dt) {
      group.rotation.y += dt * 1.8;
      itemMesh.position.y = Math.sin(Date.now() * 0.003) * 0.08;
    },
    remove() {
      scene.remove(group);
    }
  };
}

// Drops 1 gun + 1 shield/medkit when chest opens
export function dropChestLoot(x, y, z, scene) {
  const items = [];
  const guns = ['ar', 'shotgun'];
  const heals = ['shield', 'medkit'];

  const randomGun = guns[Math.floor(Math.random() * guns.length)];
  const randomHeal = heals[Math.floor(Math.random() * heals.length)];

  items.push(createGroundItem(randomGun, x + 0.9, y, z + 0.3, scene));
  items.push(createGroundItem(randomHeal, x - 0.9, y, z + 0.3, scene));

  return items;
}
