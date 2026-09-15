# The Void Explorer â€” endless 404 platformer



Open `void-explorer.html` in a browser. No installation or build required.



## Goal

Travel as far right as possible before losing all three lives. New terrain, gaps, spikes, aliens, and coins are generated ahead. There is no finish line.



- A/D or left/right arrows: move.

- W, up arrow, or Space: jump. Land on aliens to stomp them.

- P: pause or resume. Switching windows pauses; tap the canvas to resume.

- Space or tap the canvas: restart after game over.

- On-screen movement and jump buttons support touch devices.



Coins award 35 points, stomping aliens awards 100, and each new 100 metres awards 100. Distance measures your furthest progress, so backtracking does not earn distance bonuses. Falling costs a life and returns you to the last ground platform reached. The best score and sound preference are saved when browser storage is available.



## Hosting

Copy `void-explorer.html`, `style.css`, and `game.js` into your site. Configure your server to serve this page for missing URLs while preserving HTTP status 404. Use absolute stylesheet/script URLs matching their deployed location when handling nested missing URLs. Set the home link to your homepage. Change the page title and story text for other error types.



Google Fonts are optional; fallback fonts work offline. The game uses Canvas and Web Audio without external game libraries.



## 404 Invaders



Open `invaders.html` for the separate arcade shooter. A/D or arrow keys move; hold Space to fire; Enter starts or retries; P pauses. Touch controls are included. Beat five levels before the aliens reach your ship, surviving with three lives. Each level increases invader speed, enemy bullet speed, and firing frequency. Clearing level five wins the game. Glitches award 10–30 points and clearing a level awards 100. Best scores are saved locally. Deploy `invaders.html`, `invaders.css`, and `invaders.js` together to use this variant.



## New arcade games

Open `arcade.html` to browse all five games. The new games share `arcade.css` and `arcade.js`; keep both alongside their HTML files:

- `breakout.html` — BreakOut of Cache: clear three layouts, starting with 404 bricks. Move with arrows/A/D or pointer/touch; Space or tap launches. Three lives.
- `flappy.html` — Flappy Byte: Space, up arrow, or tap flaps through firewall gaps. Each gap earns one point; collision ends the run.
- `snake.html` — Sssite Not Found: arrows/WASD or touch direction buttons steer. Collect bytes for ten points; speed increases as you grow. Walls and your trail end the run.

Enter starts or retries; P pauses/resumes. All three include generated sound, a saved mute preference, local best scores, and automatic pause when the window loses focus. Gameplay works offline; Google Fonts are optional with system fallbacks. The running/platforming role remains covered by The Void Explorer.

Invaders timed lyrics: `invaders-music.js` uses locally extracted vocal-line timestamps for `invaders-theme.mp3` (113.2 seconds). Timings are approximate, not word-level karaoke alignment. The board shows detected verse/chorus lines; the complete supplied text remains in Read lyrics. Deploy the music script and MP3 with Invaders. `.audio-tools` and `.audio-models` are development-only transcription downloads, not game dependencies, and must not be deployed.

### Cosmic Courier redesign
`flappy.html` also requires `cosmic.js` for its locally drawn planets, mail ship, and crystal asteroids. Collect envelopes for 5 points and pass gaps for 1 point. Difficulty follows gaps passed, not bonus points. Keep `cosmic.js` alongside `arcade.js` and `arcade.css` when deploying Flappy Byte.

## Coastal Cruise
The arcade menu now replaces Snake with `racer.html`. Deploy it with `racer.js`, `racer.css`, and the shared `arcade.css`. Arrows/A/D steer; hold Space for boost and release to recharge. Enter starts/retries; P pauses. Three lives, traffic and road-edge collisions, brief impact protection, engine audio, touch buttons, and locally saved best distance. The original Snake files remain available separately.

Coastal Cruise now uses a top-down 2D retro view with three lanes, scrolling road markings, pixel cars, cones, barriers, and oil slicks. Solid obstacles cost a life; oil slows the car and reduces steering grip for 1.3 seconds. Space boost, touch steering, pause, and best-distance saving are retained.

## Standalone flight prototype
`afterburn/index.html` launches Afterburn: Coastal Canyon, a separate Three.js/Rapier first-person jet game. See `afterburn/README.md` for controls, practice mode, build and local server instructions.
