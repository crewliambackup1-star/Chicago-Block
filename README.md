# CHICAGO BLOCK — The Living City (Update 1)

A browser-based 3D neighborhood exploration game built with Three.js. The setting is an original, fictional Chicago-inspired district, not a precise recreation of any real residential property.

## What's in Update 1

### 1. Playable foundation
- Third-person character model and first-person camera option.
- Mouse-look on desktop and drag-look on touch screens.
- Walking, sprinting, jumping, basic building collision, and a responsive HUD.
- Keyboard and on-screen mobile controls.

### 2. Expanded neighborhood
- A compact 3-by-3 street grid with intersections, crosswalks, sidewalks, and lane markings.
- A mix of fictional apartment buildings, a corner market, courtyard green space, benches, trees, streetlights, and a recreation pad.
- A minimap and neighborhood zone label.

### 3. Living city
- 20 pedestrian characters following sidewalk routes.
- 7 traffic vehicles circulating on a neighborhood loop.
- A parked blue sedan that the player can enter, drive, and exit.
- A running in-game clock and changing daylight.

## Play

Open the GitHub Pages site after Pages is enabled. The game is also designed to run from a local web server because browsers restrict ES modules opened directly from a file.

\`\`\`bash
python3 -m http.server 8080
\`\`\`

Then open \`http://localhost:8080\`.

An internet connection is required because Three.js is loaded from jsDelivr.

## Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Move / drive | WASD or arrow keys | Direction pad |
| Sprint | Shift | — |
| Jump | Space (on foot) | — |
| Enter / exit car | E | Interact button |
| First / third person | V | Camera button |
| Look around | Mouse | Drag on the game view |
| Brake | Space (while driving) | Brake button |
| Advance displayed time | N | — |
| Release mouse capture | Esc | — |

To enter the blue sedan, walk close to it and press **E** (or tap **Interact**). Use **WASD / arrows** to drive. Press **E** again to exit.

## Checks

The repository includes dependency-free checks:

\`\`\`bash
npm test
npm run check
\`\`\`

GitHub Actions runs these checks on pushes and pull requests. These checks verify the JavaScript syntax and key game structure; they do not replace a real Safari / Chrome playtest on the target device.

## Current scope

This is an early playable release, not a finished open-world game. Interiors, advanced vehicle physics, mission progression, saved game state, and full weather simulation are not included in Update 1. Those are candidates for later updates.