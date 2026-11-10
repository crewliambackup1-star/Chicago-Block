# CHICAGO BLOCK — Life on the Streets (V2 development)

A browser-based 3D neighborhood exploration game built with Three.js. The setting is an original, fictional Chicago-inspired district, not a precise recreation of any real residential property.

## V2 development progress

### Visual foundation pass
- Procedural asphalt, sidewalk, brick, and concrete surface textures.
- More detailed building facades with exterior trim, floor bands, corner columns, and framed windows.
- Instanced illuminated window accents to add depth without a separate draw call for every window.
- Improved directional shadow resolution and tone-mapping exposure.
- Detailed sedan body accents, wheel hubs, mirrors, and front/rear lights.
- Streetlamp bulbs and local lights that respond to the in-game day/night cycle.
- A neighborhood delivery activity with a pickup point at the corner market and a drop-off marker in the courtyard.
- Switchable clear, rain, and fog modes; rain includes animated rainfall and road-side puddle accents.

### Driving controls
- Corrected car steering mapping: A / Left Arrow steers left; D / Right Arrow steers right.
- Press F near the gold marker to collect and deliver a package; press R to cycle clear, rain, and fog weather.
- Steering mapping is isolated in controls.js so it can be tested without launching WebGL.

### Preserved V1 gameplay
- Third-person character and first-person camera option.
- Walking, sprinting, jumping, building collision, and keyboard/mobile controls.
- 3-by-3 fictional street grid, sidewalks, crosswalks, market, courtyard, trees, benches, and minimap.
- 20 pedestrians, 7 traffic vehicles, a drivable blue sedan, and a changing day/night clock.

## Planned for later V2 passes
- More playable activities, delivery tasks, and exploration challenges.
- Weather effects such as rain, fog, and wet-road reflections.
- Further visual refinement and optimization based on real-device performance.

Additional missions, more activity types, deeper weather polish, and further environmental effects remain planned for later V2 passes.

## Run locally

Use a web server because browsers restrict ES modules opened directly from a file:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. An internet connection is required because Three.js is loaded from jsDelivr.

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

To enter the blue sedan, walk close to it and press E (or tap Interact). Use A / Left Arrow to steer left and D / Right Arrow to steer right. Press E again to exit.

## Automated checks

```bash
npm run check
npm test
```

GitHub Actions runs syntax and smoke tests on pushes and pull requests. The steering helper has a direct automated unit test. Automated checks do not replace a real Safari/WebGL playtest; camera behavior, visuals, touch input, frame rate, and driving still need target-device testing before V2 can be called complete.