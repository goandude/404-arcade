import * as THREE from 'three';
import { createCharacter } from './character.js';
import { sfx } from './audio.js';
import { createGroundItem } from './weapons.js';

export function createBot(id, spawnPos, scene, getTerrainHeight) {
  const character = createCharacter(true, 0x882222);
  const root = character.root;
  root.position.copy(spawnPos);
  scene.add(root);

  let health = 100;
  let shield = 50;
  let isAlive = true;

  // State: 'GLIDING', 'ROAMING', 'ATTACKING', 'FLEEING_STORM'
  let state = spawnPos.y > 20 ? 'GLIDING' : 'ROAMING';
  let targetPos = new THREE.Vector3(spawnPos.x + (Math.random() - 0.5) * 60, 0, spawnPos.z + (Math.random() - 0.5) * 60);
  let shootTimer = 0.5 + Math.random() * 1.5;
  let strafeTimer = 0;
  let strafeDir = 1;
  let weaponId = Math.random() > 0.5 ? 'ar' : 'shotgun';
  character.setWeapon(weaponId);

  const speed = 4.8;
  const fallSpeed = 7.5;

  return {
    id,
    root,
    isAlive() { return isAlive; },
    getHealth() { return health; },
    getShield() { return shield; },
    getPosition() { return root.position; },

    takeDamage(amount, isHeadshot = false) {
      if (!isAlive) return { dead: false, damageDealt: 0, hitShield: false };

      let hitShield = false;
      let actualDamage = amount;

      if (shield > 0) {
        hitShield = true;
        shield -= actualDamage;
        if (shield < 0) {
          health += shield; // subtract remaining
          shield = 0;
          sfx.shieldBreak();
        }
      } else {
        health -= actualDamage;
      }

      if (health <= 0) {
        health = 0;
        isAlive = false;
        root.visible = false;
        scene.remove(root);

        // Drop loot upon death
        createGroundItem(weaponId, root.position.x, root.position.y, root.position.z, scene);
        if (Math.random() > 0.4) {
          createGroundItem('shield', root.position.x + 0.8, root.position.y, root.position.z, scene);
        }

        return { dead: true, damageDealt: actualDamage, hitShield };
      }

      return { dead: false, damageDealt: actualDamage, hitShield };
    },

    update(dt, playerPos, storm, onBotShoot) {
      if (!isAlive) return;

      const currentPos = root.position;
      const groundY = getTerrainHeight(currentPos.x, currentPos.z);

      // 1. Gliding down to island
      if (state === 'GLIDING') {
        character.setGliderVisible(true);
        currentPos.y -= fallSpeed * dt;

        // Drift towards target landing area
        const toTarget = targetPos.clone().sub(currentPos);
        toTarget.y = 0;
        if (toTarget.lengthSq() > 1) {
          toTarget.normalize();
          currentPos.addScaledVector(toTarget, speed * 1.5 * dt);
          root.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        }

        if (currentPos.y <= groundY + 0.2) {
          currentPos.y = groundY;
          state = 'ROAMING';
          character.setGliderVisible(false);
          character.setWeapon(weaponId);
        }

        character.animate(dt, true, false, false, true, 0);
        return;
      }

      // Keep on terrain surface
      currentPos.y = groundY;

      // Check storm distance
      const inStorm = !storm.isInsideSafeZone(currentPos.x, currentPos.z);
      if (inStorm) {
        // Take storm damage
        health -= storm.getDamagePerSecond() * dt;
        if (health <= 0) {
          isAlive = false;
          root.visible = false;
          scene.remove(root);
          return;
        }
        // Flee to storm center
        const stormCenter = storm.getCenter();
        targetPos.set(stormCenter.x, 0, stormCenter.y);
      }

      // Distance to Player
      const distToPlayer = currentPos.distanceTo(playerPos);

      if (!inStorm && distToPlayer < 40) {
        // 2. Attack Player State
        state = 'ATTACKING';
        const lookDir = playerPos.clone().sub(currentPos).normalize();
        root.rotation.y = Math.atan2(lookDir.x, lookDir.z);

        // Strafe left and right while aiming
        strafeTimer -= dt;
        if (strafeTimer <= 0) {
          strafeTimer = 1.0 + Math.random() * 1.5;
          strafeDir = Math.random() > 0.5 ? 1 : -1;
        }

        const rightVec = new THREE.Vector3(lookDir.z, 0, -lookDir.x);
        currentPos.addScaledVector(rightVec, strafeDir * speed * 0.6 * dt);

        // Keep distance (retreat if too close, approach if far)
        if (distToPlayer > 25) {
          currentPos.addScaledVector(lookDir, speed * 0.4 * dt);
        } else if (distToPlayer < 10) {
          currentPos.addScaledVector(lookDir, -speed * 0.4 * dt);
        }

        // Shooting timer
        shootTimer -= dt;
        if (shootTimer <= 0) {
          shootTimer = weaponId === 'ar' ? 0.25 + Math.random() * 0.3 : 1.2 + Math.random() * 0.5;

          // Bot aim inaccuracy
          const spread = 0.08;
          const aimTarget = playerPos.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * spread * distToPlayer,
            0.8 + (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * spread * distToPlayer
          ));

          onBotShoot(root.position.clone().add(new THREE.Vector3(0, 1.2, 0)), aimTarget, weaponId);
        }

        character.animate(dt, true, false, false, false, 0);
      } else {
        // 3. Roaming / Navigating Island
        const toTarget = targetPos.clone().sub(currentPos);
        toTarget.y = 0;

        if (toTarget.lengthSq() < 4) {
          // Pick new random waypoint
          targetPos.set(
            (Math.random() - 0.5) * 160,
            0,
            (Math.random() - 0.5) * 160
          );
        } else {
          toTarget.normalize();
          currentPos.addScaledVector(toTarget, speed * dt);
          root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, Math.atan2(toTarget.x, toTarget.z), 0.1);
        }

        character.animate(dt, true, false, false, false, 0);
      }
    }
  };
}
