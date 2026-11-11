# Chicago Block — V4.0 Photorealism Foundation

A browser-based 3D neighborhood game on the path toward high-fidelity, photorealistic visuals. V4.0 establishes a stronger render-quality and performance foundation before the next asset and world-detail stages.

## V4.0 rendering foundation
- Desktop starts with an ultra-quality profile: up to 2x device pixel ratio, 2048px directional shadow map (when supported), antialiasing, high precision and ACES tone mapping.
- Touch devices use a separate high-quality profile capped at 1.45x pixel ratio and 1024px shadows to keep thermal and memory pressure manageable.
- Adaptive resolution watches sustained frame times and adjusts pixel density gradually. It never changes simulation speed, movement, driving or gameplay timing.
- Directional shadows now follow the player and focus on a tighter nearby area, spending more shadow resolution where it is visible.
- Browser automation keeps a separate lightweight profile with low resolution, no real-time shadows and reduced render frequency; these settings do not affect normal players.
- A read-only render diagnostics hook exposes the selected profile, pixel ratio, shadow configuration and adaptive-resolution state for tests.

## Performance goals
- Primary target: MacBook Air M3 with 16 GB unified memory.
- Aim for 60 FPS when scene complexity permits, while maintaining a playable experience in heavier scenes.
- Preserve quality by reducing pixel density gradually only when frame time shows sustained pressure.
- Use a separate touch-device profile and retain an automated-test profile.

## V4 roadmap
- V4.0: render pipeline, quality profiles, adaptive resolution and player-centered shadow coverage.
- V4.1: realistic environment and architecture assets, material library and building/road detail.
- V4.2: higher fidelity people, vehicles and animations.
- V4.3: lighting, reflections and weather atmosphere.
- V4.4: streamed city sections, geographic data foundation and large-world optimization.

## Scope of V4.0
- No changes to map layout, movement, vehicle handling, activities, traffic routes, pedestrian routes, controls or camera behavior.
- V4.0 is a rendering foundation, not a claim that the game is already photorealistic.
- The setting remains a fictional Chicago-inspired environment while future stages prepare for the larger geographically grounded city.

## Validation
`npm run check` validates the game, controls and rendering modules. `npm test` covers source behavior and adaptive-quality rules. Browser automation covers desktop Chromium and mobile WebKit, including runtime render-profile diagnostics, existing gameplay systems and responsive controls.

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. Three.js is loaded from jsDelivr, so an internet connection is required.

## Automated checks

```bash
npm run check
npm test
npm install --no-save playwright
npx playwright install chromium webkit
npm run test:browser
```

## Prior releases
- V3.1 delivered the model and texture refinement.
- V3 delivered the original realism renderer update.
- V2 delivered the first major neighborhood gameplay update.