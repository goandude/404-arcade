import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { createCharacter } from './character.js';
import { createIsland, getTerrainHeight } from './map.js';
import { createStorm } from './storm.js';
import { createBot } from './bot.js';
import { WEAPON_TYPES, createGroundItem, dropChestLoot } from './weapons.js';
import { sfx, initAudio } from './audio.js';

const canvas = document.getElementById('view');
let renderer, scene, camera, world;

// Game State: 'MENU', 'PLAYING', 'VICTORY', 'ELIMINATED'
let gameState = 'MENU';
let isPointerLocked = false;

// Player Attributes
let health = 100;
let shield = 100;
let eliminations = 0;
let isAlive = true;

// Player Position, Movement & Physics
const playerPos = new THREE.Vector3(0, 140, 0);
const playerVel = new THREE.Vector3(0, 0, 0);
let isGrounded = false;
let isGliding = true;
let isFreefalling = true;

// Camera Controls
let camYaw = 0;
let camPitch = -0.15;
const camDistance = 4.2;
const camHeight = 1.6;
const camShoulder = 0.8;

// Character Visual
let playerCharacter;

// Inventory (5 Slots)
const inventory = [
  { id: 'pickaxe', count: 1, ammo: Infinity },
  { id: 'ar', count: 1, ammo: 30 },
  { id: 'shotgun', count: 1, ammo: 5 },
  { id: 'shield', count: 2, ammo: 2 },
  { id: 'medkit', count: 1, ammo: 1 }
];
let activeSlot = 1; // Default to Assault Rifle
let fireCooldown = 0;

// Action/Consumable Timer
let actionTimer = 0;
let actionMax = 0;
let actionItem = null;

// World Entities
let island;
let storm;
const bots = [];
let groundItems = [];
const bulletTracers = [];
const particles = [];

// Input state
const keys = {
  w: false, a: false, s: false, d: false,
  shift: false, space: false, spacePressed: false,
  e: false, r: false,
  click: false
};

// UI Elements
const $ = id => document.getElementById(id);
const ui = {
  menu: $('menu-overlay'),
  btnPlay: $('btn-play'),
  btnPlayAgain: $('btn-play-again'),
  btnRetry: $('btn-retry'),
  victory: $('victory-screen'),
  gameover: $('gameover-screen'),
  victoryStats: $('victory-stats'),
  defeatStats: $('defeat-stats'),
  defeatPlacement: $('defeat-placement'),
  healthFill: $('health-fill'),
  shieldFill: $('shield-fill'),
  healthText: $('health-text'),
  shieldText: $('shield-text'),
  statAlive: $('stat-alive'),
  statElims: $('stat-elims'),
  stormTimer: $('storm-timer'),
  stormPhaseLabel: $('storm-phase-label'),
  stormVignette: $('storm-vignette'),
  interactPrompt: $('interaction-prompt'),
  gliderPrompt: $('glider-prompt'),
  hitmarker: $('hitmarker'),
  damageContainer: $('damage-container'),
  actionBar: $('action-bar-container'),
  actionBarFill: $('action-bar-fill'),
  actionBarLabel: $('action-bar-label'),
  compassTape: $('compass-tape'),
  minimap: $('minimap'),
  slots: document.querySelectorAll('.slot')
};

// --- DAMAGE NUMBER POPUPS ---
function showDamageNumber(damage, isHeadshot = false, isShield = false) {
  const tag = document.createElement('div');
  tag.className = 'damage-tag ' + (isHeadshot ? 'headshot' : isShield ? 'shield' : 'flesh');
  tag.textContent = Math.round(damage) + (isHeadshot ? ' CRIT!' : '');

  // Place near center with slight random scatter
  const x = window.innerWidth / 2 + (Math.random() - 0.5) * 60;
  const y = window.innerHeight / 2 - 40 + (Math.random() - 0.5) * 40;
  tag.style.left = x + 'px';
  tag.style.top = y + 'px';

  ui.damageContainer.appendChild(tag);

  setTimeout(() => {
    tag.style.transform = `translate(-50%, -100px) scale(${isHeadshot ? 1.4 : 1.0})`;
    tag.style.opacity = '0';
  }, 20);

  setTimeout(() => tag.remove(), 450);
}

function flashHitmarker() {
  ui.hitmarker.classList.remove('active');
  void ui.hitmarker.offsetWidth; // trigger reflow
  ui.hitmarker.classList.add('active');
  setTimeout(() => ui.hitmarker.classList.remove('active'), 120);
}

// --- SHOOTING & WEAPONS ---
function fireWeapon() {
  const slot = inventory[activeSlot];
  if (!slot || fireCooldown > 0) return;

  const def = WEAPON_TYPES[slot.id];
  if (!def) return;

  // 1. Consumables
  if (def.isConsumable) {
    startConsumable(slot);
    return;
  }

  // 2. Ammo check
  if (slot.ammo !== Infinity && slot.ammo <= 0) {
    // Empty clip sound or reload
    return;
  }

  if (slot.ammo !== Infinity) {
    slot.ammo--;
    updateHotbarUI();
  }

  fireCooldown = def.fireRate;

  // Camera Aim Point in Distance (Crosshair Target)
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const targetPoint = raycaster.ray.at(120, new THREE.Vector3());

  const muzzlePos = new THREE.Vector3();
  playerCharacter.getMuzzleWorldPosition(muzzlePos);
  playerCharacter.triggerRecoil();

  // Direction from gun barrel directly to the crosshair target point!
  const baseAimDir = targetPoint.clone().sub(muzzlePos).normalize();

  if (def.id === 'pickaxe') {
    // Melee swing
    sfx.shootAR();
    // Check nearby chests or bots
    bots.forEach(bot => {
      if (bot.isAlive() && bot.getPosition().distanceTo(playerPos) < def.range) {
        damageBot(bot, def.damage, false);
      }
    });
    return;
  }

  showMuzzleFlash(muzzlePos);

  if (def.id === 'ar') {
    sfx.shootAR();

    // Raycast with bloom
    const dir = baseAimDir.clone();
    dir.x += (Math.random() - 0.5) * def.bloom;
    dir.y += (Math.random() - 0.5) * def.bloom;
    dir.z += (Math.random() - 0.5) * def.bloom;
    dir.normalize();

    performHitscan(muzzlePos, dir, def.range, def.damage, def.headshotMult);
  } else if (def.id === 'shotgun') {
    sfx.shootShotgun();

    // Multi-pellet spread
    for (let p = 0; p < def.pellets; p++) {
      const dir = baseAimDir.clone();
      dir.x += (Math.random() - 0.5) * def.spread;
      dir.y += (Math.random() - 0.5) * def.spread;
      dir.z += (Math.random() - 0.5) * def.spread;
      dir.normalize();

      performHitscan(muzzlePos, dir, def.range, def.damage, def.headshotMult, true);
    }
  }
}

function showMuzzleFlash(pos) {
  const flash = new THREE.PointLight(0xffdd44, 4, 8);
  flash.position.copy(pos);
  scene.add(flash);
  setTimeout(() => scene.remove(flash), 40);
}

function performHitscan(origin, direction, range, damage, headMult, isPellet = false) {
  const hitRay = new THREE.Ray(origin, direction);
  let closestDist = range;
  let hitBot = null;
  let hitHead = false;

  bots.forEach(bot => {
    if (!bot.isAlive()) return;
    const bPos = bot.getPosition();
    const headPos = bPos.clone().add(new THREE.Vector3(0, 1.8, 0));
    const bodyPos = bPos.clone().add(new THREE.Vector3(0, 1.0, 0));

    // Head sphere check
    const headSphere = new THREE.Sphere(headPos, 0.4);
    if (hitRay.intersectsSphere(headSphere)) {
      const d = origin.distanceTo(headPos);
      if (d < closestDist) {
        closestDist = d;
        hitBot = bot;
        hitHead = true;
      }
    }

    // Body cylinder/sphere check
    const bodySphere = new THREE.Sphere(bodyPos, 0.75);
    if (hitRay.intersectsSphere(bodySphere)) {
      const d = origin.distanceTo(bodyPos);
      if (d < closestDist) {
        closestDist = d;
        hitBot = bot;
        hitHead = false;
      }
    }
  });

  const hitPoint = origin.clone().addScaledVector(direction, closestDist);
  createBulletTracer(origin, hitPoint);

  if (hitBot) {
    const finalDamage = hitHead ? damage * headMult : damage;
    damageBot(hitBot, finalDamage, hitHead);
  }
}

function damageBot(bot, amount, isHeadshot) {
  const result = bot.takeDamage(amount, isHeadshot);
  if (result.damageDealt > 0) {
    flashHitmarker();
    sfx.hitmarker(isHeadshot, result.hitShield);
    showDamageNumber(result.damageDealt, isHeadshot, result.hitShield);

    if (result.dead) {
      eliminations++;
      ui.statElims.textContent = eliminations;
      checkMatchStatus();
    }
  }
}

function createBulletTracer(start, end) {
  const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xffe680,
    transparent: true,
    opacity: 0.9,
    linewidth: 2
  });
  const line = new THREE.Line(lineGeo, lineMat);
  scene.add(line);
  bulletTracers.push({ line, life: 0.06 });
}

// Consumable drinking
function startConsumable(slot) {
  const def = WEAPON_TYPES[slot.id];
  if (!def || slot.ammo <= 0) return;

  if (def.healType === 'shield' && shield >= def.maxCap) return;
  if (def.healType === 'health' && health >= def.maxCap) return;

  actionItem = slot;
  actionMax = def.useTime;
  actionTimer = actionMax;

  ui.actionBarLabel.textContent = `USING ${def.name.toUpperCase()}...`;
  ui.actionBar.style.display = 'flex';
  sfx.drinkPotion();
}

function cancelConsumable() {
  actionTimer = 0;
  actionItem = null;
  ui.actionBar.style.display = 'none';
}

function finishConsumable() {
  if (!actionItem) return;
  const def = WEAPON_TYPES[actionItem.id];
  if (!def) return;

  if (def.healType === 'shield') {
    shield = Math.min(def.maxCap, shield + def.healAmount);
  } else if (def.healType === 'health') {
    health = Math.min(def.maxCap, health + def.healAmount);
  }

  actionItem.ammo--;
  if (actionItem.ammo <= 0) {
    inventory[activeSlot] = { id: 'pickaxe', count: 1, ammo: Infinity };
  }

  updateHotbarUI();
  updateVitalsUI();
  cancelConsumable();
}

// --- INVENTORY UI & SLOTS ---
function selectSlot(idx) {
  if (idx < 0 || idx >= inventory.length) return;
  activeSlot = idx;
  cancelConsumable();

  ui.slots.forEach((s, i) => {
    s.classList.toggle('active', i === activeSlot);
  });

  playerCharacter.setWeapon(inventory[activeSlot].id);
}

function updateHotbarUI() {
  $('ar-ammo').textContent = inventory[1].ammo;
  $('shotgun-ammo').textContent = inventory[2].ammo;
  $('shield-count').textContent = inventory[3].ammo;
  $('medkit-count').textContent = inventory[4].ammo;
}

function updateVitalsUI() {
  ui.healthFill.style.width = health + '%';
  ui.shieldFill.style.width = shield + '%';
  ui.healthText.textContent = Math.ceil(health);
  ui.shieldText.textContent = Math.ceil(shield);
}

// --- PLAYER DAMAGE & DEATH ---
function takePlayerDamage(amount, isHeadshot = false) {
  if (!isAlive || gameState !== 'PLAYING') return;

  if (shield > 0) {
    shield -= amount;
    if (shield < 0) {
      health += shield;
      shield = 0;
      sfx.shieldBreak();
    }
  } else {
    health -= amount;
  }

  sfx.hitmarker(false, false);
  updateVitalsUI();

  if (health <= 0) {
    health = 0;
    isAlive = false;
    gameState = 'ELIMINATED';
    sfx.eliminated();
    document.exitPointerLock();

    const aliveCount = bots.filter(b => b.isAlive()).length + 1;
    ui.defeatPlacement.textContent = `#${aliveCount} PLACE`;
    ui.defeatStats.textContent = `ELIMINATIONS: ${eliminations}`;
    ui.gameover.style.display = 'flex';
  }
}

function checkMatchStatus() {
  const aliveBots = bots.filter(b => b.isAlive()).length;
  const totalAlive = aliveBots + (isAlive ? 1 : 0);
  ui.statAlive.textContent = totalAlive;

  if (aliveBots === 0 && isAlive) {
    gameState = 'VICTORY';
    sfx.victoryRoyale();
    document.exitPointerLock();

    ui.victoryStats.textContent = `TOTAL ELIMINATIONS: ${eliminations}`;
    ui.victory.style.display = 'flex';
  }
}

// --- MINIMAP RENDERING ---
function drawMinimap() {
  const mCanvas = ui.minimap;
  const ctx = mCanvas.getContext('2d');
  const w = mCanvas.width;
  const h = mCanvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#102236';
  ctx.fillRect(0, 0, w, h);

  // Island landmass circle
  const islandScale = w / 420;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = '#3a802d';
  ctx.beginPath();
  ctx.arc(cx, cy, 180 * islandScale, 0, Math.PI * 2);
  ctx.fill();

  // Next Safe Zone Ring (White)
  const nextC = storm.getNextCenter();
  const nextR = storm.getNextRadius();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx + nextC.x * islandScale, cy + nextC.y * islandScale, nextR * islandScale, 0, Math.PI * 2);
  ctx.stroke();

  // Current Storm Ring (Purple)
  const stormC = storm.getCenter();
  const stormR = storm.getRadius();
  ctx.strokeStyle = '#a824e8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx + stormC.x * islandScale, cy + stormC.y * islandScale, stormR * islandScale, 0, Math.PI * 2);
  ctx.stroke();

  // Player Marker (Blue Arrow)
  ctx.save();
  ctx.translate(cx + playerPos.x * islandScale, cy + playerPos.z * islandScale);
  ctx.rotate(-camYaw);

  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(4, 4);
  ctx.lineTo(0, 2);
  ctx.lineTo(-4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// --- GAME LOOP & PHYSICS ---
function update(dt) {
  if (gameState !== 'PLAYING') return;

  // 1. Storm Updates
  storm.update(dt);
  ui.stormTimer.textContent = `${Math.floor(storm.getTimer() / 60)}:${String(storm.getTimer() % 60).padStart(2, '0')}`;
  ui.stormPhaseLabel.textContent = storm.getPhaseState() === 'SHRINKING' ? 'STORM IS SHRINKING!' : 'STORM EYE CLOSES IN';

  const inStorm = !storm.isInsideSafeZone(playerPos.x, playerPos.z);
  ui.stormVignette.classList.toggle('active', inStorm);

  if (inStorm) {
    takePlayerDamage(storm.getDamagePerSecond() * dt, false);
  }

  // 2. Gliding & Diving Flight Physics
  const groundY = getTerrainHeight(playerPos.x, playerPos.z);
  const altitude = Math.max(0, Math.round(playerPos.y - groundY));

  if (isGliding || isFreefalling) {
    ui.gliderPrompt.style.display = 'block';
    ui.gliderPrompt.textContent = isGliding
      ? `ALTITUDE: ${altitude}m · [SPACE] DIVE FASTER · [WASD] STEER`
      : `ALTITUDE: ${altitude}m · [SPACE] DEPLOY GLIDER · [W] NOSE DIVE`;

    // Toggle glider with Space
    if (keys.spacePressed) {
      keys.spacePressed = false;
      if (playerPos.y > groundY + 5) {
        isGliding = !isGliding;
        isFreefalling = !isGliding;
        playerCharacter.setGliderVisible(isGliding);
        sfx.gliderDeploy();
      }
    }

    // Descent and forward speeds
    let fallSpeed = isGliding ? 8.5 : (keys.w ? 32.0 : 22.0);
    let forwardSpeed = isGliding ? 15.0 : (keys.w ? 22.0 : 10.0);

    const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);

    playerPos.addScaledVector(forward, forwardSpeed * dt);
    if (moveX !== 0) {
      playerPos.addScaledVector(right, moveX * 8.0 * dt);
    }

    // Apply descent towards ground
    playerPos.y -= fallSpeed * dt;

    // Touchdown landing!
    if (playerPos.y <= groundY + 0.3) {
      isGliding = false;
      isFreefalling = false;
      playerPos.y = groundY;
      playerVel.set(0, 0, 0);
      isGrounded = true;
      playerCharacter.setGliderVisible(false);
      sfx.gliderDeploy();
      ui.gliderPrompt.style.display = 'none';
    }

    playerCharacter.animate(dt, true, false, false, isGliding, camPitch);
  } else {
    // 3. Ground Movement & Jumping
    const moveSpeed = keys.shift ? 8.5 : 5.5;
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

    const isMoving = moveX !== 0 || moveZ !== 0;

    const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, -moveZ);
    moveDir.addScaledVector(right, moveX);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      playerPos.addScaledVector(moveDir, moveSpeed * dt);
    }

    // Gravity
    playerVel.y -= 22 * dt;
    playerPos.y += playerVel.y * dt;

    if (playerPos.y <= groundY) {
      playerPos.y = groundY;
      playerVel.y = 0;
      isGrounded = true;
    } else {
      isGrounded = false;
    }

    // Jump
    if (keys.space && isGrounded) {
      playerVel.y = 8.5;
      isGrounded = false;
      sfx.gliderDeploy();
    }

    // Character Animation
    playerCharacter.animate(dt, isMoving, keys.shift, !isGrounded, false, camPitch);
  }

  // Update Player Mesh Position & Rotation (Faces forward along lookDir)
  playerCharacter.root.position.copy(playerPos);
  playerCharacter.root.rotation.y = camYaw + Math.PI;

  // 4. Update Camera (Smooth Over-The-Shoulder Follow)
  const shoulderOffset = new THREE.Vector3(camShoulder, camHeight, 0);
  shoulderOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), camYaw);

  const targetCamPos = playerPos.clone().add(shoulderOffset);
  const lookDir = new THREE.Vector3(
    -Math.sin(camYaw) * Math.cos(camPitch),
    Math.sin(camPitch),
    -Math.cos(camYaw) * Math.cos(camPitch)
  );

  targetCamPos.addScaledVector(lookDir, -camDistance);
  // Ensure camera doesn't dip below terrain
  const camTerrainY = getTerrainHeight(targetCamPos.x, targetCamPos.z) + 0.5;
  targetCamPos.y = Math.max(targetCamPos.y, camTerrainY);

  camera.position.lerp(targetCamPos, 0.4);
  camera.lookAt(playerPos.clone().add(new THREE.Vector3(0, camHeight, 0)).addScaledVector(lookDir, 20));

  // 5. Fire Cooldown & Shooting
  if (fireCooldown > 0) fireCooldown -= dt;
  if (keys.click && fireCooldown <= 0 && !isGliding) {
    fireWeapon();
  }

  // Consumable Action Progress
  if (actionItem && actionTimer > 0) {
    actionTimer -= dt;
    const progress = 1 - Math.max(0, actionTimer / actionMax);
    ui.actionBarFill.style.width = (progress * 100) + '%';
    if (actionTimer <= 0) finishConsumable();
  }

  // 6. Chest & Ground Item Interactions
  checkInteractions();

  // 7. Update Enemy Bots
  bots.forEach(bot => {
    bot.update(dt, playerPos, storm, (muzzle, target, botWeapon) => {
      // Bot shoot callback
      sfx.shootAR();
      createBulletTracer(muzzle, target);

      // Check if bot bullet hit player
      const bulletRay = new THREE.Ray(muzzle, target.clone().sub(muzzle).normalize());
      const pSphere = new THREE.Sphere(playerPos.clone().add(new THREE.Vector3(0, 1, 0)), 0.85);
      if (bulletRay.intersectsSphere(pSphere)) {
        takePlayerDamage(botWeapon === 'ar' ? 18 : 35);
      }
    });
  });

  // 8. Update Tracers
  for (let i = bulletTracers.length - 1; i >= 0; i--) {
    const t = bulletTracers[i];
    t.life -= dt;
    if (t.life <= 0) {
      scene.remove(t.line);
      bulletTracers.splice(i, 1);
    }
  }

  // 9. Update Ground Items
  groundItems.forEach(item => item.update(dt));

  // 10. Update Compass Tape
  const compassDeg = ((camYaw * (180 / Math.PI)) % 360 + 360) % 360;
  ui.compassTape.style.transform = `translateX(${-(compassDeg / 360) * 280}px)`;

  // 11. Draw Minimap
  drawMinimap();
}

function checkInteractions() {
  let promptText = '';

  // Check Chests
  island.chests.forEach(chest => {
    if (!chest.opened && playerPos.distanceTo(chest.position) < 3.8) {
      promptText = '[E] OPEN GOLDEN CHEST';
      if (keys.e) {
        chest.opened = true;
        sfx.openChest();
        chest.group.rotation.x = -0.6; // Pop open lid
        chest.light.intensity = 3.5;
        const drops = dropChestLoot(chest.position.x, chest.position.y + 0.5, chest.position.z, scene);
        groundItems.push(...drops);
        keys.e = false;
      }
    }
  });

  // Check Ground Items
  for (let i = groundItems.length - 1; i >= 0; i--) {
    const item = groundItems[i];
    if (playerPos.distanceTo(item.position) < 3.0) {
      promptText = `[E] PICK UP ${item.def.name.toUpperCase()}`;
      if (keys.e) {
        pickupItem(item.typeId);
        item.remove();
        groundItems.splice(i, 1);
        keys.e = false;
        break;
      }
    }
  }

  if (promptText) {
    ui.interactPrompt.textContent = promptText;
    ui.interactPrompt.style.display = 'block';
  } else {
    ui.interactPrompt.style.display = 'none';
  }
}

function pickupItem(typeId) {
  sfx.openChest();
  if (typeId === 'ar') {
    inventory[1].ammo += 30;
  } else if (typeId === 'shotgun') {
    inventory[2].ammo += 5;
  } else if (typeId === 'shield') {
    inventory[3].ammo += 2;
  } else if (typeId === 'medkit') {
    inventory[4].ammo += 1;
  }
  updateHotbarUI();
}

// --- BOOT & INITIALIZATION ---
async function init() {
  await RAPIER.init();
  world = new RAPIER.World({ x: 0, y: -18, z: 0 });

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8bc3eb);
  scene.fog = new THREE.FogExp2(0xb8dcfa, 0.0022);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // Sky Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x446633, 1.4);
  scene.add(hemiLight);

  const sun = new THREE.DirectionalLight(0xfffaed, 2.5);
  sun.position.set(120, 180, 80);
  sun.castShadow = true;
  scene.add(sun);

  // Generate Island & Storm
  island = createIsland(scene, world);
  storm = createStorm(scene);

  // Create Player Character
  playerCharacter = createCharacter(false, 0x0099ff);
  scene.add(playerCharacter.root);
  playerCharacter.setGliderVisible(true);
  playerCharacter.setWeapon('ar');

  // Spawn 9 Enemy Bots in Sky
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    const dist = 50 + Math.random() * 80;
    const spawnPos = new THREE.Vector3(
      Math.cos(angle) * dist,
      135 + Math.random() * 15,
      Math.sin(angle) * dist
    );
    const bot = createBot(i + 1, spawnPos, scene, getTerrainHeight);
    bots.push(bot);
  }

  // Pre-scatter some ground weapons
  const initialDrops = [
    { type: 'ar', x: 10, z: 15 },
    { type: 'shotgun', x: -20, z: -10 },
    { type: 'shield', x: 25, z: -35 },
    { type: 'ar', x: -40, z: 40 }
  ];
  initialDrops.forEach(d => {
    groundItems.push(createGroundItem(d.type, d.x, getTerrainHeight(d.x, d.z), d.z, scene));
  });

  updateVitalsUI();
  updateHotbarUI();
  selectSlot(1);

  // Event Listeners
  setupEventListeners();

  // Render Loop
  let lastTime = performance.now();
  function animate(time) {
    requestAnimationFrame(animate);
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    update(dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}

function setupEventListeners() {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Pointer Lock
  canvas.addEventListener('click', () => {
    initAudio();
    if (gameState === 'PLAYING' && !isPointerLocked) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener('mousemove', e => {
    if (!isPointerLocked) return;
    const sens = 0.0022;
    camYaw -= e.movementX * sens;
    camPitch = Math.max(-1.15, Math.min(1.15, camPitch - e.movementY * sens));
  });

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'shift', ' '].includes(k)) {
      if (k === ' ') {
        if (!keys.space) keys.spacePressed = true;
        keys.space = true;
      }
      if (k === 'w') keys.w = true;
      if (k === 'a') keys.a = true;
      if (k === 's') keys.s = true;
      if (k === 'd') keys.d = true;
      if (k === 'shift') keys.shift = true;
    }
    if (k === 'e') keys.e = true;
    if (['1', '2', '3', '4', '5'].includes(k)) {
      selectSlot(parseInt(k, 10) - 1);
    }
  });

  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === ' ') {
      keys.space = false;
      keys.spacePressed = false;
    }
    if (k === 'w') keys.w = false;
    if (k === 'a') keys.a = false;
    if (k === 's') keys.s = false;
    if (k === 'd') keys.d = false;
    if (k === 'shift') keys.shift = false;
    if (k === 'e') keys.e = false;
  });

  window.addEventListener('mousedown', e => {
    if (e.button === 0) keys.click = true;
  });

  window.addEventListener('mouseup', e => {
    if (e.button === 0) keys.click = false;
  });

  // Hotbar UI Clicks
  ui.slots.forEach((s, idx) => {
    s.addEventListener('click', () => selectSlot(idx));
  });

  // Menu Buttons
  ui.btnPlay.addEventListener('click', () => {
    initAudio();
    ui.menu.style.display = 'none';
    gameState = 'PLAYING';
    canvas.requestPointerLock();
  });

  ui.btnPlayAgain.addEventListener('click', () => window.location.reload());
  ui.btnRetry.addEventListener('click', () => window.location.reload());
}

init();
