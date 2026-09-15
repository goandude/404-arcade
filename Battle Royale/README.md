# Battle Royale — Zero Build 3D Shooter

A lightweight, fast-loading 3D third-person battle royale shooter built with Three.js and Rapier physics (WASM).

## Features
- **Over-the-Shoulder Third-Person Camera**: Smooth pointer-lock aiming, crosshair reticle with spread bloom, and colored pop-up damage numbers (Blue for shield, White for flesh, Yellow for headshot crit).
- **Glider Drop-In**: Start high above the island, freefall dive through the sky, deploy your glider, and steer down to choose your landing zone.
- **Stylized Island Arena**: Ocean-bordered island with rolling green hills, sandy beaches, pine forests, rocky outcrops, and rustic cabins.
- **Golden Treasure Chests & Ground Loot**: Open chests with glowing rarity beams to collect Assault Rifles, Pump Shotguns, Mini Shield Potions, and Medkits.
- **Shrinking Purple Storm**: A glowing translucent storm wall constricts toward random safe zones, damaging anyone caught outside.
- **9 Enemy AI Bots**: Bots glide in, scavenge loot, hunt, strafe, and engage in shootouts.
- **Victory Royale**: Eliminate all opponents to win the match with victory fanfare!

## Controls
- **WASD**: Move
- **Mouse**: Look and aim (Pointer Lock)
- **Left Click**: Fire weapon / attack / drink potion
- **Space**: Jump (or toggle glider while falling)
- **Shift**: Sprint
- **1 – 5**: Select weapon / item slot
- **E**: Open chest / pick up loot

## Running Locally
Run `npm start` in this folder and open http://127.0.0.1:4174 in your browser.

Dependencies live in `../afterburn/node_modules`, reached through a `node_modules` symlink that a fresh clone will not have. Run `npm install` in `../afterburn` first if `npm start`, `npm test`, or `npm run build` cannot resolve Three.js or Rapier. Playing the prebuilt `bundle.js` needs no install.
