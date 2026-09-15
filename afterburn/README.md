# Afterburn: Coastal Canyon

A standalone first-person WebGL flight and combat prototype. Start with Flight Practice to tune handling without enemies. Mission mode adds goblin fighters, cyan cannons, green enemy lasers, flares, and score. Fly 10 km to extraction; cyan rings award 250 points.

## Play
Open `index.html` in a WebGL 2 capable browser, or run `npm start` in this folder and visit http://127.0.0.1:4173. The supplied `bundle.js` includes Three.js and Rapier's embedded WebAssembly; no remote fonts, models, or downloads are needed to play. Only `index.html`, `style.css`, and `bundle.js` are needed for deployment.

W/S pitch up/down. A/D bank and turn. Up/down arrows adjust throttle. The native crosshair cursor indicates aim; click or Space fires instant-hit twin lasers converging on the camera aim ray. Terrain blocks the aim ray. Shift afterburner; F flares; P pauses/resumes. Touch buttons support basic flight/combat. Practice and Mission buttons start fresh flights, including from pause. Window blur automatically pauses.

## Physics and scope
Fixed 120 Hz simulation. Thrust, speed-dependent drag and lift, lateral damping, and world gravity act on a unit-mass Rapier rigid body with continuous collision detection. Arcade pitch/roll control and bank-induced heading changes; optional flight assist trims vertical drift. This is an assisted flight model, not a certified aerodynamic simulation. Coarse terrain collision volumes intentionally favor clear, safe flight corridors. Terrain and fighters are procedural 3D geometry. This is a first flight playground and short combat mission, without a boss or campaign yet.

`npm test` checks flight force direction, cruise stability and high-speed terrain collision. `npm run build` rebuilds the browser bundle. Use the handling slider and flight-assist checkbox to tune response. Actual browser/GPU performance and subjective flight feel still need playtesting.

## Nebula Drift

Open `drift.html`, or visit http://127.0.0.1:4173/drift.html with the server running. A separate third-person asteroid flight study with a detailed spacecraft, generated nebula backdrop, animated exhaust, bloom, engine audio, and an endless asteroid field. All assets are embedded locally in `drift.bundle.js`; deploy it together with `drift.html` and `drift.css`.

WASD/arrows steer, Shift boosts, P pauses, R restarts. Optional mouse steering and Scenic Mode (no hull damage) are available in the menu. Deliver the power core across 12 km. Three Goblin interceptor waves attack at 1.2, 4.3, and 8.2 km. Click or hold Space to fire toward the mouse position (screen center before moving the mouse). Cyan lasers destroy asteroids and take three hits to defeat an interceptor. Cannons overheat and recover automatically. Reach 12 km with hull remaining to complete delivery. Scenic Mode disables hull damage and is identified in the completion message. Rapier integrates thrust, drag, lateral inertia, and collisions at 120 Hz. Asteroid colliders approximate each rock with a sphere.

`npm run build:drift` rebuilds the scene; `npm run test:drift` checks speed stability, boost, steering recovery, and camera placement. Browser rendering and launch were verified in the in-app browser.

Mission checks cover encounter progression, projectile segment collision, heat limits, completion only once, and restart cleanup. Flight handling is unchanged.

## Razorwing Pursuit (current drift.html)
The active scene is now a single-enemy dogfight with no asteroids or delivery objective. Up/Down change selected speed (0–330 m/s); releasing holds that speed. Left/Right move horizontally, W/S climb and dive. Click/Space fires, Shift boosts. Destroy the evasive Razorwing with 18 hits while dodging rear-fired lasers. The older delivery implementation remains in drift-mission.js; dogfight.js drives the current page.
