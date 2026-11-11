# Chicago Block — V3.1 Model & Texture Overhaul

A browser-based 3D neighborhood exploration game set in an original Chicago-inspired district. V3.1 is a graphics-only refinement of the V3 world. The map, player movement, driving, camera behavior, activities, weather, traffic and pedestrian routes remain unchanged.

## V3.1 visual targets

The supplied visual reference informed the broad direction: natural human proportions, textured skin and clothing, layered architectural materials, realistic glazing, and sunlight that reveals surface detail. The reference image itself is not copied into the game.

### People and clothing
- Rebuilt the shared pedestrian/player model with more natural torso, shoulder, arm, hand, leg and footwear proportions.
- Added procedural skin grain, subtle facial details, eye/eyelid/brow geometry, ears, nose, mouth, hairline and separated curls.
- Added fabric weave and surface relief to clothing, plus varied clothing and skin material palettes.
- Preserved the existing pedestrian routes and walk animation.

### Buildings and streets
- Added weathered siding and stucco material sets with color, bump and roughness data.
- Added window AC units, small metal balcony rails, roof coping, facade bands, drainage pipes and mounting straps.
- Increased asphalt patch, aggregate and crack detail while preserving the existing roads and sidewalk layout.

### Cars and landscaping
- Added body panel seams, additional chrome trim, front grille slats, projector-style lamps, rear light details, and tyre-sidewall/tread accents.
- Added more varied high-resolution tree canopy geometry and instanced leaf clusters.
- Added instanced grass blades to lawn areas to give green spaces a more natural silhouette.

## Performance approach
- The target experience remains the MacBook Air M3 with 16 GB unified memory, using full desktop graphics settings.
- Repeated grass blades and foliage detail are instanced to limit draw calls.
- Touch devices receive fewer grass instances to preserve performance.
- The local automated `?automation=1` mode still reduces render resolution and disables real-time shadows for headless software-rendered tests only.

## Scope
- No new gameplay, missions, or activities.
- No map expansion or new neighborhood area.
- No changes to movement, vehicle handling, controls or camera behavior.
- The location remains a fictional Chicago-inspired environment, not a one-to-one recreation of private residential properties.

## Validation
Automated checks run JavaScript syntax and source-level tests, followed by Chromium and WebKit browser playthroughs covering:
- 3D renderer boot and runtime exceptions.
- Movement, pedestrian and traffic simulation, both camera modes and clock.
- Existing weather states, five snapshots and package delivery.
- Vehicle acceleration, steering and wheel rotation.
- Mobile portrait/landscape layout, touch movement, activity, weather and braking.

These browser checks are not a physical benchmark of every MacBook or Safari device. The MacBook Air M3 should be manually checked after the release candidate is ready.

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

GitHub Actions runs checks on pushes and pull requests.