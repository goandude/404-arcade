# 404 Arcade

A collection of browser games built around a 404 page. Nothing to install and nothing to build — the 2D games are plain HTML, CSS, and Canvas, and the 3D prototypes ship with prebuilt bundles.

**Play online:** https://goandude.github.io/404-arcade/arcade.html

Open `arcade.html` to browse the arcade, or open any game's HTML file directly.

## The games

| Game | Files | What it is |
| --- | --- | --- |
| **The Void Explorer** | `void-explorer.html`, `game.js`, `style.css` | Endless lunar platformer. Run right forever across generated terrain. |
| **404 Invaders** | `invaders.html`, `invaders.js`, `invaders.css`, `invaders-music.js`, `invaders-theme.mp3` | Five waves of alien glitches, with a timed lyric ticker. |
| **BreakOut of Cache** | `breakout.html`, `arcade.js`, `arcade.css` | Three brick layouts, starting with a 404 made of bricks. |
| **Flappy Byte / Cosmic Courier** | `flappy.html`, `arcade.js`, `arcade.css`, `cosmic.js` | Fly a mail ship through crystal asteroids and collect lost envelopes. |
| **Coastal Cruise** | `racer.html`, `racer.js`, `racer.css`, `arcade.css` | Top-down retro racer. Dodge cars, cones, barriers, and oil slicks. |
| **Sssite Not Found** | `snake.html`, `arcade.js`, `arcade.css` | Classic snake. Standalone — not linked from the arcade menu, which lists Coastal Cruise in its place. |

The five games linked from `arcade.html` are Void Explorer, Invaders, BreakOut, Flappy Byte, and Coastal Cruise. Snake still works and is kept for anyone who wants it, but it was replaced in the menu.

### Shared behaviour

Every game has generated sound with a saved mute preference, locally saved best scores, and automatic pause when the window loses focus. `Enter` starts or retries and `P` pauses or resumes. Touch controls are included throughout. Everything runs offline; Google Fonts are optional, with system fallbacks.

### Controls

- **Void Explorer** — A/D or arrows move. W, up, or Space jumps; land on aliens to stomp them. Space or tap restarts after game over. Coins award 35 points, stomps 100, and each new 100 metres 100. Distance measures furthest progress, so backtracking earns nothing. Falling costs a life and returns you to the last ground platform reached. Three lives.
- **404 Invaders** — A/D or arrows move; hold Space to fire. Beat five levels before the aliens reach your ship. Each level raises invader speed, bullet speed, and firing rate. Glitches award 10–30 points, clearing a level 100. Three lives.
- **BreakOut of Cache** — Arrows/A/D or pointer move the paddle; Space or tap launches. Three lives.
- **Flappy Byte** — Space, up, or tap flaps. Envelopes award 5 points, gaps 1. Difficulty follows gaps passed, not bonus points.
- **Coastal Cruise** — Arrows/A/D steer; hold Space to boost and release to recharge. Three lanes, with solid obstacles costing a life and oil slicks cutting steering grip for 1.3 seconds. Brief protection after an impact. Best distance is saved.
- **Sssite Not Found** — Arrows/WASD or touch buttons steer. Bytes award 10 points; speed increases as you grow. Walls and your own trail end the run.

### Invaders music

`invaders-music.js` uses locally extracted vocal-line timestamps for `invaders-theme.mp3` (113.2 seconds). The timings are approximate, not word-level karaoke alignment — the board shows detected verse and chorus lines, and the complete supplied text stays in **Read lyrics**. Deploy the music script and the MP3 alongside Invaders.

## 3D prototypes

These are separate Three.js + Rapier projects with their own `package.json`, and they are not linked from the arcade menu.

### `afterburn/` — Afterburn: Coastal Canyon

A first-person flight and combat prototype, plus **Razorwing Pursuit** (`drift.html`), a third-person dogfight. Both ship with prebuilt bundles that embed Three.js and Rapier's WebAssembly, so `index.html` and `drift.html` open straight from disk. See [`afterburn/README.md`](afterburn/README.md) for controls, build commands, and the local server.

### `Battle Royale/` — Zero Build 3D Shooter

A third-person battle royale with a glider drop-in, nine AI bots, chest loot, and a shrinking storm. See [`Battle Royale/README.md`](Battle%20Royale/README.md).

### Running the 3D projects from a clone

Dependencies are installed once in `afterburn/`, and `Battle Royale/node_modules` is a symlink to it that does not survive a clone. To rebuild or run the test suites:

```sh
cd afterburn && npm install
```

Then, from either folder, `npm start` serves the game and `npm test` runs its checks. Playing the prebuilt bundles needs no install at all.

## Hosting as a real 404 page

Copy a game's files into your site and configure your server to serve that page for missing URLs **while preserving HTTP status 404**. Use absolute stylesheet and script URLs matching their deployed location so nested missing URLs still resolve. Point the home link at your homepage, and change the page title and story text for other error types.

`.audio-tools/` and `.audio-models/` are development-only transcription downloads, not game dependencies, and must not be deployed. They are excluded from this repository, as is the source video under `background song/`.
