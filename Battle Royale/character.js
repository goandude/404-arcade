import * as THREE from 'three';

export function createCharacter(isBot = false, customColor = null) {
  const root = new THREE.Group();

  // --- HIGH-FIDELITY PBR MATERIALS (TACTICAL DESERT SCOUT) ---
  const skinMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0xb5805e : 0xcfa57d,
    roughness: 0.65,
    metalness: 0.05
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0x22110c : 0x2e2016,
    roughness: 0.85
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0x6e2626 : (customColor || 0xb89d70),
    roughness: 0.75
  });

  const vestMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0x3d1414 : 0x475236,
    roughness: 0.65
  });

  const scarfMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0x4a1818 : 0xd1c69f,
    roughness: 0.85
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0x26292b : 0x3d472e,
    roughness: 0.72
  });

  const armorPlateMat = new THREE.MeshStandardMaterial({
    color: 0x1f2326,
    roughness: 0.4,
    metalness: 0.35
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x382414,
    roughness: 0.6
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x221b14,
    roughness: 0.75
  });

  const goggleFrameMat = new THREE.MeshStandardMaterial({
    color: 0x181c20,
    roughness: 0.4
  });

  const goggleLensMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0xff3311 : 0x112233,
    roughness: 0.1,
    metalness: 0.9,
    emissive: isBot ? 0x550a00 : 0x051a26
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b424a,
    roughness: 0.35,
    metalness: 0.75
  });

  const wristDisplayMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00c8ff,
    emissiveIntensity: 0.8
  });

  // --- SKELETON & BODY STRUCTURE ---
  // Pelvis / Hip Center
  const hip = new THREE.Group();
  hip.position.y = 0.95;
  root.add(hip);

  // Upper Torso / Spine (Tilts with Aim Pitch)
  const torsoGroup = new THREE.Group();
  hip.add(torsoGroup);

  // 1. Muscular Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.65, 12), shirtMat);
  torso.position.y = 0.36;
  torso.castShadow = true;
  torsoGroup.add(torso);

  // Tactical Chest Rig / Plate Carrier
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.46, 0.36), vestMat);
  vest.position.y = 0.38;
  vest.castShadow = true;
  torsoGroup.add(vest);

  // Ammo Pouches on Chest
  for (let p = -1; p <= 1; p++) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.20, 0.10), vestMat);
    pouch.position.set(p * 0.15, 0.35, 0.21);
    pouch.castShadow = true;
    torsoGroup.add(pouch);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), metalMat);
    buckle.position.set(p * 0.15, 0.40, 0.26);
    torsoGroup.add(buckle);
  }

  // Tactical Web Belt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.10, 12), leatherMat);
  belt.position.y = 0.06;
  torsoGroup.add(belt);

  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), metalMat);
  beltBuckle.position.set(0, 0.06, 0.24);
  torsoGroup.add(beltBuckle);

  // Desert Shemagh Scarf
  const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 16), scarfMat);
  scarfCollar.rotation.x = Math.PI / 2;
  scarfCollar.position.y = 0.68;
  torsoGroup.add(scarfCollar);

  const scarfTail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), scarfMat);
  scarfTail.position.set(-0.08, 0.52, 0.20);
  scarfTail.rotation.set(0.3, 0.1, -0.4);
  torsoGroup.add(scarfTail);

  // 2. Head & Neck
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.82;
  torsoGroup.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.19, 14, 12);
  headGeo.scale(0.9, 1.15, 1.0);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 0.14;
  head.castShadow = true;
  headGroup.add(head);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), skinMat);
  jaw.position.set(0, 0.05, 0.06);
  headGroup.add(jaw);

  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), hairMat);
  hairBase.position.set(0, 0.20, -0.02);
  headGroup.add(hairBase);

  for (let h = 0; h < 6; h++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), hairMat);
    const angle = (h / 6) * Math.PI - 0.5;
    tuft.position.set(Math.cos(angle) * 0.12, 0.30, Math.sin(angle) * 0.10);
    tuft.rotation.set(0.2, angle, 0.3);
    headGroup.add(tuft);
  }

  // Forehead Goggles
  const goggleStrap = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.025, 6, 16), goggleFrameMat);
  goggleStrap.rotation.x = Math.PI / 2;
  goggleStrap.position.set(0, 0.22, 0);
  headGroup.add(goggleStrap);

  const goggleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.08), goggleFrameMat);
  goggleFrame.position.set(0, 0.22, 0.16);
  headGroup.add(goggleFrame);

  for (const lx of [-0.07, 0.07]) {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.02, 10), goggleLensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(lx, 0.22, 0.20);
    headGroup.add(lens);
  }

  // Backpack & Bedroll
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.22), vestMat);
  backpack.position.set(0, 0.40, -0.26);
  backpack.castShadow = true;
  torsoGroup.add(backpack);

  const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.42, 8), scarfMat);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 0.65, -0.24);
  torsoGroup.add(bedroll);

  const canteen = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), metalMat);
  canteen.position.set(-0.23, 0.35, -0.22);
  torsoGroup.add(canteen);

  // 3. Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0, 0);
  hip.add(leftLeg);

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.42, 10), pantsMat);
  leftThigh.position.y = -0.22;
  leftThigh.castShadow = true;
  leftLeg.add(leftThigh);

  const leftKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), armorPlateMat);
  leftKneePad.position.set(0, -0.44, 0.10);
  leftLeg.add(leftKneePad);

  const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.09, 0.38, 10), pantsMat);
  leftShin.position.y = -0.62;
  leftShin.castShadow = true;
  leftLeg.add(leftShin);

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.32), bootMat);
  leftBoot.position.set(0, -0.84, 0.04);
  leftBoot.castShadow = true;
  leftLeg.add(leftBoot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0, 0);
  hip.add(rightLeg);

  const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.42, 10), pantsMat);
  rightThigh.position.y = -0.22;
  rightThigh.castShadow = true;
  rightLeg.add(rightThigh);

  const holster = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 0.14), leatherMat);
  holster.position.set(0.14, -0.22, 0);
  rightLeg.add(holster);
  const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.10, 0.06), metalMat);
  pistolGrip.position.set(0.14, -0.09, 0.02);
  pistolGrip.rotation.x = -0.4;
  rightLeg.add(pistolGrip);

  const rightKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), armorPlateMat);
  rightKneePad.position.set(0, -0.44, 0.10);
  rightLeg.add(rightKneePad);

  const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.09, 0.38, 10), pantsMat);
  rightShin.position.y = -0.62;
  rightShin.castShadow = true;
  rightLeg.add(rightShin);

  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.32), bootMat);
  rightBoot.position.set(0, -0.84, 0.04);
  rightBoot.castShadow = true;
  rightLeg.add(rightBoot);

  // --- TWO-HANDED TACTICAL WEAPON AIM RIG ---
  // Weapon Anchor (firmly seated at right shoulder pocket, pointing forward +Z!)
  const weaponAnchor = new THREE.Group();
  // Positioned at chest height, slightly to the right shoulder
  weaponAnchor.position.set(0.18, 0.38, 0.18);
  torsoGroup.add(weaponAnchor);

  // Recoil Offset Group
  const weaponRecoilGroup = new THREE.Group();
  weaponAnchor.add(weaponRecoilGroup);

  // 1. Tactical Assault Rifle (Points along +Z)
  const arGroup = new THREE.Group();
  // Stock (braced at shoulder)
  const arStock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.24), goggleFrameMat);
  arStock.position.set(0, 0.04, -0.12);
  arGroup.add(arStock);
  // Receiver
  const arBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.40), metalMat);
  arBody.position.set(0, 0.04, 0.18);
  arGroup.add(arBody);
  // Barrel pointing forward +Z
  const arBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.52, 8), metalMat);
  arBarrel.rotation.x = Math.PI / 2;
  arBarrel.position.set(0, 0.07, 0.60);
  arGroup.add(arBarrel);
  // Flash hider
  const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.024, 0.08, 8), metalMat);
  flashHider.rotation.x = Math.PI / 2;
  flashHider.position.set(0, 0.07, 0.88);
  arGroup.add(flashHider);
  // Scope / Sight
  const arSight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.15), goggleFrameMat);
  arSight.position.set(0, 0.15, 0.16);
  arGroup.add(arSight);
  const arDot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), goggleLensMat);
  arDot.position.set(0, 0.15, 0.23);
  arGroup.add(arDot);
  // Curved Mag
  const arMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.12), metalMat);
  arMag.position.set(0, -0.12, 0.22);
  arMag.rotation.x = -0.3;
  arGroup.add(arMag);
  weaponRecoilGroup.add(arGroup);

  // 2. Heavy Pump Shotgun
  const shotgunGroup = new THREE.Group();
  const shotStock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.22), goggleFrameMat);
  shotStock.position.set(0, 0.04, -0.10);
  shotgunGroup.add(shotStock);
  const shotBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.38), metalMat);
  shotBody.position.set(0, 0.04, 0.18);
  shotgunGroup.add(shotBody);
  const shotBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.58, 8), metalMat);
  shotBarrel.rotation.x = Math.PI / 2;
  shotBarrel.position.set(0, 0.06, 0.62);
  shotgunGroup.add(shotBarrel);
  const shotTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.52, 8), metalMat);
  shotTube.rotation.x = Math.PI / 2;
  shotTube.position.set(0, -0.01, 0.58);
  shotgunGroup.add(shotTube);
  const pumpSlide = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.20, 8), goggleFrameMat);
  pumpSlide.rotation.x = Math.PI / 2;
  pumpSlide.position.set(0, -0.01, 0.48);
  shotgunGroup.add(pumpSlide);
  shotgunGroup.visible = false;
  weaponRecoilGroup.add(shotgunGroup);

  // 3. Tactical Pickaxe
  const pickaxeGroup = new THREE.Group();
  const pickShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8), metalMat);
  pickShaft.rotation.x = -Math.PI / 3;
  pickShaft.position.set(0, 0.15, 0.30);
  pickaxeGroup.add(pickShaft);
  const pickBlade = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.08), metalMat);
  pickBlade.position.set(0, 0.45, 0.65);
  pickBlade.rotation.z = 0.25;
  pickaxeGroup.add(pickBlade);
  pickaxeGroup.visible = false;
  weaponRecoilGroup.add(pickaxeGroup);

  // 4. Potion
  const potionGroup = new THREE.Group();
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.28, 10),
    new THREE.MeshStandardMaterial({ color: 0x00d0ff, roughness: 0.1, transparent: true, opacity: 0.85 })
  );
  bottle.position.set(0, 0.1, 0.35);
  potionGroup.add(bottle);
  potionGroup.visible = false;
  weaponRecoilGroup.add(potionGroup);

  // 4. Arms Connected to Weapon
  // Right Arm (Trigger hand)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.64, 0);
  torsoGroup.add(rightArm);

  const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), shirtMat);
  rightArm.add(rightShoulder);

  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.32, 8), shirtMat);
  rightUpperArm.position.y = -0.14;
  rightUpperArm.castShadow = true;
  rightArm.add(rightUpperArm);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.32, 8), skinMat);
  rightForearm.position.set(-0.06, -0.32, 0.12);
  rightForearm.rotation.x = -0.6;
  rightForearm.rotation.y = -0.3;
  rightForearm.castShadow = true;
  rightArm.add(rightForearm);

  const rightGlove = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.14, 8), leatherMat);
  rightGlove.position.set(-0.10, -0.42, 0.22);
  rightGlove.rotation.x = -0.6;
  rightArm.add(rightGlove);

  // Left Arm (Reaches across to support front handguard)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 0.64, 0);
  torsoGroup.add(leftArm);

  const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), shirtMat);
  leftArm.add(leftShoulder);

  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.32, 8), shirtMat);
  leftUpperArm.position.y = -0.14;
  leftUpperArm.castShadow = true;
  leftArm.add(leftUpperArm);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.34, 8), skinMat);
  leftForearm.position.set(0.18, -0.28, 0.18);
  leftForearm.rotation.x = -0.85;
  leftForearm.rotation.y = 0.55;
  leftForearm.castShadow = true;
  leftArm.add(leftForearm);

  const leftGlove = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.14, 8), leatherMat);
  leftGlove.position.set(0.28, -0.38, 0.32);
  leftGlove.rotation.x = -0.85;
  leftGlove.rotation.y = 0.55;
  leftArm.add(leftGlove);

  // 5. Deployable Tactical Glider
  const gliderGroup = new THREE.Group();
  gliderGroup.position.set(0, 2.0, 0);
  gliderGroup.visible = false;
  root.add(gliderGroup);

  const gliderWingMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0x662222 : 0x3d472e,
    roughness: 0.5,
    side: THREE.DoubleSide
  });

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.6);
  wingShape.lineTo(1.6, -0.4);
  wingShape.lineTo(1.4, -0.7);
  wingShape.lineTo(0, -0.3);
  wingShape.lineTo(-1.4, -0.7);
  wingShape.lineTo(-1.6, -0.4);
  wingShape.closePath();

  const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.04, bevelEnabled: false });
  wingExtrude.rotateX(Math.PI / 2);
  const gliderWing = new THREE.Mesh(wingExtrude, gliderWingMat);
  gliderWing.position.y = 0.6;
  gliderGroup.add(gliderWing);

  const frameBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.8), metalMat);
  frameBar.rotation.z = Math.PI / 2;
  frameBar.position.set(0, 0.58, -0.1);
  gliderGroup.add(frameBar);

  for (const hx of [-0.4, 0.4]) {
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65), metalMat);
    handleBar.position.set(hx, 0.25, 0);
    gliderGroup.add(handleBar);
  }

  // Muzzle Flash Point (World Tip of Rifle Barrel along +Z)
  const muzzleLocalPoint = new THREE.Vector3(0, 0.07, 0.92);

  let walkCycle = 0;
  let recoilAmount = 0;

  return {
    root,
    headGroup,
    gliderGroup,
    setGliderVisible(visible) {
      gliderGroup.visible = visible;
    },
    setWeapon(weaponId) {
      pickaxeGroup.visible = weaponId === 'pickaxe';
      arGroup.visible = weaponId === 'ar';
      shotgunGroup.visible = weaponId === 'shotgun';
      potionGroup.visible = weaponId === 'shield' || weaponId === 'medkit';
    },
    triggerRecoil() {
      recoilAmount = 0.08;
    },
    getMuzzleWorldPosition(targetVec) {
      arGroup.localToWorld(targetVec.copy(muzzleLocalPoint));
      return targetVec;
    },
    animate(dt, isMoving, isRunning, isJumping, isGliding, aimPitch = 0) {
      // Recoil recovery
      if (recoilAmount > 0) {
        recoilAmount = Math.max(0, recoilAmount - dt * 0.5);
        weaponRecoilGroup.position.z = -recoilAmount;
      }

      // 1. Gliding State
      if (isGliding) {
        gliderGroup.visible = true;
        weaponAnchor.visible = false;
        leftArm.rotation.set(-2.6, 0, 0.35);
        rightArm.rotation.set(-2.6, 0, -0.35);
        leftLeg.rotation.set(0.35, 0, -0.15);
        rightLeg.rotation.set(0.35, 0, 0.15);
        headGroup.rotation.x = -0.35;
        torsoGroup.rotation.x = 0.25;
        return;
      }

      gliderGroup.visible = false;
      weaponAnchor.visible = true;

      // 2. Dynamic Aim Pitch Tracking (Upper torso and weapon track crosshair!)
      // Pitching the torsoGroup directly tilts the torso, arms, and gun straight towards the crosshair!
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, -aimPitch, 0.4);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -aimPitch * 0.4, 0.4);

      // 3. Jumping State
      if (isJumping) {
        leftLeg.rotation.set(-0.65, 0, 0);
        rightLeg.rotation.set(0.45, 0, 0);
        return;
      }

      // 4. Ground Walk / Run cycle
      if (isMoving) {
        const speedMult = isRunning ? 16 : 10;
        walkCycle += dt * speedMult;
        const legAngle = Math.sin(walkCycle) * (isRunning ? 0.90 : 0.60);

        leftLeg.rotation.x = legAngle;
        rightLeg.rotation.x = -legAngle;

        torsoGroup.position.y = Math.abs(Math.sin(walkCycle * 2)) * 0.04;
      } else {
        walkCycle += dt * 2.5;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        torsoGroup.position.y = Math.sin(walkCycle) * 0.015;
      }
    }
  };
}
