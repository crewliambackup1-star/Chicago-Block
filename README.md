# Chicago Block — The Realism Update (V3)

A browser-based 3D neighborhood exploration game set in an original, fictional Chicago-inspired district. V3 is a **graphics-only overhaul** of the existing V2 world. It does not expand the map or introduce new gameplay systems.

## V3 visual overhaul

### Rendering, materials, and atmosphere
- Reworked the renderer for higher desktop pixel density, tuned mobile resolution, ACES filmic tone mapping, and soft PCF shadows.
- Added a procedural equirectangular environment map to provide ambient reflections without relying on external HDR downloads.
- Added physically based materials for car paint, glass, lights, and metal, with more convincing roughness, clearcoat, and reflection response.
- Rebuilt 1024px procedural brick, concrete, asphalt, sidewalk, and grass textures with matching bump and roughness data.
- Added surface grain, brick variation, concrete weathering, asphalt wear/cracks, grass detail, and more pronounced sidewalk joints.

### Architecture and street detail
- Added layered stone plinths, pilasters, parapet/cornice accents, window mullions, and projecting stone sills.
- Added curb geometry, metal manhole covers, and storm-drain grates along the existing road grid.
- Kept the existing fictional 3-by-3 neighborhood layout and building footprints.

### Vehicles, people, and landscaping
- Upgraded sedan paint with clearcoat and environment reflections.
- Added visible seats, headrests, steering wheel, cabin trim, improved glass, sidewall detail, brake discs, and refined wheel assemblies.
- Improved pedestrian head, ear, face, clothing, sleeve, and shoe geometry while retaining the existing walkers and animation.
- Rebuilt tree silhouettes with trunks, branches, layered foliage, and more natural variation.

### Presentation
- Updated the title screen and HUD styling for V3 while keeping the existing control layout and functionality.
- Preserved the time-of-day, clear/rain/fog states, activities, traffic, pedestrians, driving, and camera modes.

## What V3 deliberately does not do
- No new missions, activities, or gameplay mechanics.
- No map expansion or new neighborhood areas.
- No changes to the driving model, movement, camera behavior, or controls except fixes required to preserve existing behavior.
- No new major systems unrelated to rendering or visual quality.

## Validation

Automated checks run JavaScript syntax and source-level tests, then launch Chromium and WebKit to exercise the existing game:
- WebGL scene boot and runtime-error checks.
- Player movement, pedestrian and traffic motion, first-/third-person camera, and clock.
- Existing weather states, all five collectibles, and package delivery.
- Vehicle acceleration, steering directions, and wheel rotation.
- Mobile portrait/landscape layout, touch movement, activity, weather, and braking.

Automated WebKit runs are engine coverage, not hands-on tests on every physical Safari device. The published game should still be checked on the target device after deployment.

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

GitHub Actions runs checks on pushes and pull requests. The browser automation interface is local-only and is not enabled on the published game.
