import * as THREE from 'three';
import { sfx } from './audio.js';

export function createStorm(scene) {
  // Current storm boundary
  const currentCenter = new THREE.Vector2(0, 0);
  let currentRadius = 210;

  // Next safe zone boundary
  const nextCenter = new THREE.Vector2(15, -10);
  let nextRadius = 120;

  // Phase timing
  let phase = 1;
  let phaseState = 'WAITING'; // 'WAITING' or 'SHRINKING'
  let timer = 35; // seconds until shrink
  let shrinkDuration = 30;
  let elapsedShrink = 0;
  let initialRadius = currentRadius;
  let initialCenter = currentCenter.clone();

  // 3D Storm Visual (Translucent purple cylinder enclosing the island)
  const stormHeight = 160;
  const stormGeo = new THREE.CylinderGeometry(currentRadius, currentRadius, stormHeight, 48, 1, true);
  const stormMat = new THREE.MeshBasicMaterial({
    color: 0x9922dd,
    transparent: true,
    opacity: 0.35,
    side: THREE.BackSide,
    wireframe: false
  });
  const stormMesh = new THREE.Mesh(stormGeo, stormMat);
  stormMesh.position.set(currentCenter.x, stormHeight / 2, currentCenter.y);
  scene.add(stormMesh);

  // Safe zone marker ring on the ground
  const ringGeo = new THREE.RingGeometry(nextRadius - 0.8, nextRadius + 0.8, 64);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  const safeRing = new THREE.Mesh(ringGeo, ringMat);
  safeRing.position.set(nextCenter.x, 2, nextCenter.y);
  scene.add(safeRing);

  function startNextPhase() {
    phase++;
    phaseState = 'WAITING';

    if (phase === 2) {
      timer = 30;
      shrinkDuration = 25;
      nextRadius = 65;
      nextCenter.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50);
    } else if (phase === 3) {
      timer = 20;
      shrinkDuration = 20;
      nextRadius = 25;
      nextCenter.set(nextCenter.x + (Math.random() - 0.5) * 20, nextCenter.y + (Math.random() - 0.5) * 20);
    } else {
      timer = 15;
      shrinkDuration = 20;
      nextRadius = 5;
    }

    // Update safe ring geometry
    safeRing.geometry.dispose();
    safeRing.geometry = new THREE.RingGeometry(Math.max(1, nextRadius - 0.8), nextRadius + 0.8, 64);
    safeRing.geometry.rotateX(-Math.PI / 2);
    safeRing.position.set(nextCenter.x, 2, nextCenter.y);
  }

  return {
    getCenter() { return currentCenter; },
    getRadius() { return currentRadius; },
    getNextCenter() { return nextCenter; },
    getNextRadius() { return nextRadius; },
    getPhase() { return phase; },
    getTimer() { return Math.ceil(timer); },
    getPhaseState() { return phaseState; },

    isInsideSafeZone(x, z) {
      const dist = Math.hypot(x - currentCenter.x, z - currentCenter.y);
      return dist <= currentRadius;
    },

    getDamagePerSecond() {
      if (phase === 1) return 1.5;
      if (phase === 2) return 3.0;
      return 6.0;
    },

    update(dt) {
      if (phaseState === 'WAITING') {
        timer -= dt;
        if (timer <= 0) {
          phaseState = 'SHRINKING';
          timer = shrinkDuration;
          elapsedShrink = 0;
          initialRadius = currentRadius;
          initialCenter.copy(currentCenter);
          sfx.stormAlert();
        }
      } else if (phaseState === 'SHRINKING') {
        elapsedShrink += dt;
        const progress = Math.min(1, elapsedShrink / shrinkDuration);

        // Smooth interpolation
        currentRadius = THREE.MathUtils.lerp(initialRadius, nextRadius, progress);
        currentCenter.x = THREE.MathUtils.lerp(initialCenter.x, nextCenter.x, progress);
        currentCenter.y = THREE.MathUtils.lerp(initialCenter.y, nextCenter.y, progress);

        timer = Math.max(0, shrinkDuration - elapsedShrink);

        if (progress >= 1) {
          startNextPhase();
        }
      }

      // Update 3D Storm Mesh
      stormMesh.position.set(currentCenter.x, stormHeight / 2, currentCenter.y);
      const scaleXZ = currentRadius / 210;
      stormMesh.scale.set(scaleXZ, 1, scaleXZ);

      // Pulse the storm opacity slightly
      stormMat.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.08;
    }
  };
}
