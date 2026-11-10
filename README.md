# Chicago Block — Life on the Streets (V2)

A browser-based 3D neighborhood exploration game built with Three.js. The setting is an original, fictional Chicago-inspired district, not a precise recreation of any real residential property.

## What's new in V2

### A more detailed neighborhood
- Procedural asphalt, sidewalk, brick, and concrete surface textures.
- More detailed building facades with exterior trim, floor bands, corner columns, framed windows, and illuminated window accents.
- A procedural sky with clouds, a day/night cycle, stars, and a moving sun.
- Rooftop HVAC units and a wooden water tank, plus storefront signage, street bins, and hydrants.
- More detailed pedestrians with animated arms and legs.
- A more detailed blue sedan with a front grille, door handles, custom front/rear plates, wheel hubs, mirrors, and front/rear lights.
- Four readable street-name signs along the sidewalk corners.
- Streetlamp bulbs and local lights that respond to the in-game day/night cycle.
- Improved shadows, brighter material/lighting balance, clearer double-yellow center lines, dashed lane dividers, and crosswalk markings.
- Animated wheel rotation on the player sedan and traffic cars, with headlights and taillights that brighten naturally at night.

### Things to do
- Find five collectible neighborhood snapshots at distinct landmarks. Cyan beacons appear on the minimap; press F nearby to collect each one.
- Complete repeatable package deliveries from the corner market to the courtyard. Follow the gold marker and press F near each stop.
- Explore in clear, rain, and fog weather. Press R to cycle; rain adds animated rainfall and wet-road puddles.
- Advance the displayed time by four hours with N, or let the clock progress naturally.
- Switch between first-person and third-person camera views with V.

### Driving and controls
- Corrected steering: A / Left Arrow steers left; D / Right Arrow steers right.
- Walk up to the blue sedan and press E to enter; press E again to exit.
- While driving, W / Up Arrow accelerates, S / Down Arrow reverses or slows, A / Left Arrow turns left, D / Right Arrow turns right, and Space brakes.

### The neighborhood you can explore
- A 3-by-3 fictional street grid with roads, sidewalks, crosswalks, a market, courtyard, trees, benches, and a minimap.
- 20 pedestrians, 7 traffic vehicles, and a drivable blue sedan.
- Walking, sprinting, jumping, building collision, keyboard controls, and mobile touch controls.

## Browser support and validation

The automated test suite runs syntax and source-level checks, then launches Chromium and WebKit to exercise:
- WebGL scene loading and runtime error checks.
- Player movement, pedestrian and traffic movement, both camera views, and the in-game clock.
- Clear, rain, and fog transitions.
- All five snapshot collectibles and a complete delivery.
- Vehicle acceleration and both steering directions.
- Mobile portrait and landscape layouts, HUD spacing, touch movement, activity, weather, and brake controls.

These automated runs cover Chromium and the WebKit engine, but they are not a hands-on test on every physical Safari device. The public build should still be checked on your device after deployment.

## Run locally

Use a web server because browsers restrict ES modules opened directly from a file:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. An internet connection is required because Three.js is loaded from jsDelivr.

## Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Move | WASD or arrow keys | Direction pad |
| Sprint | Shift | — |
| Jump | Space (on foot) | — |
| Enter / exit car | E | Interact button |
| First / third person | V | Camera button |
| Look around | Mouse | Drag on the game view |
| Accelerate / reverse | W / S or Up / Down | Direction pad while in car |
| Steering | A / D or Left / Right | Direction pad while in car |
| Brake | Space (while driving) | Brake button |
| Snapshot / delivery activity | F | Activity button |
| Cycle weather | R | Weather button |
| Advance displayed time | N | — |
| Release mouse capture | Esc | — |

## Automated checks

```bash
npm run check
npm test
npm install --no-save playwright
npx playwright install chromium webkit
npm run test:browser
```

GitHub Actions runs these checks on pushes and pull requests. Browser tests use a local-only automation interface; it is not exposed on the published game site.
