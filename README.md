# Chicago Block — V4.1 Architecture & Environment

V4.1 builds on the V4.0 adaptive renderer with a focused environment pass. The existing neighborhood footprint, street grid, gameplay, driving, camera, traffic and pedestrian routes remain unchanged.

## V4.1 architecture and environment changes
- Adds optional CC0 scanned PBR texture maps for worn brick, asphalt and concrete pavement. Each has a procedural material fallback that is available immediately, so failed external requests do not block startup.
- Uses 1K diffuse, OpenGL normal and roughness maps from Poly Haven through its download host; texture requests are asynchronous and update materials only when maps arrive.
- Adds a source/license manifest at `assets/ASSET_LICENSES.md`.
- Gives buildings more varied floor spacing, framed street-level entries, glazed door panels, thresholds, awnings, building-number plaques and more distinct rooflines.
- Adds selected rooftop penthouses, parapets and vent stacks to break up flat repeated roof silhouettes.
- Adds instanced dark window reveals and stone lintels for depth around façade openings.
- Adds instanced expansion joints to divide long sidewalks into concrete slabs.
- Rebuilds the existing fire escapes with switchback stairs, connected landings, handrails and supports.

## V4.0 rendering foundation
- Desktop starts at up to 2x device pixel ratio with a 2048px directional shadow map, when device capabilities permit.
- Touch devices use a separate high-quality profile capped at 1.45x pixel ratio and a 1024px shadow map.
- Adaptive resolution adjusts pixel density gradually only after sustained frame-time pressure; it does not alter simulation speed or controls.
- Directional shadows follow the player, concentrating shadow detail near the active area.
- Headless automation uses a separate low-resolution, no-shadow profile and reduced draw frequency.

## Performance approach
- Primary target: MacBook Air M3 with 16 GB unified memory.
- Use instancing for repeated sidewalk seams, window details, grass and foliage to reduce draw calls.
- Keep PBR textures at 1K for this web-focused pass; preserve procedural fallbacks if network assets fail.
- Adaptive resolution is a safeguard, not a promise of a fixed FPS. Physical M3 performance still needs manual confirmation.

## Scope
- No new missions or gameplay systems.
- No changes to map footprint, driving, movement, camera, traffic paths, pedestrian paths, or controls.
- No full Chicago map expansion in V4.1. Geographic mapping and streamed city sections remain later roadmap work.
- The current playable district is fictional and Chicago-inspired; it is not a one-to-one reconstruction of real homes or private residential properties.

## V4 roadmap
- V4.0: adaptive renderer, quality profiles and player-centered shadow coverage.
- V4.1: architecture, street environment and scanned PBR materials.
- V4.2: higher-fidelity people, vehicles and animation refinement.
- V4.3: lighting, reflections, sky and weather atmosphere.
- V4.4: geographic data and streamed city sections.

## Validation
`npm run check` validates the main game, controls and rendering module. `npm test` covers source behavior, adaptive renderer profiles and V4.1 environment/asset wiring. Browser automation uses desktop Chromium and mobile WebKit to check startup, render profiles, movement, cameras, weather, driving, activities and mobile controls.

Automated screenshots are saved as GitHub Actions artifacts. Tests use the special local `?automation=1` profile; normal players do not use those reduced test settings.

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. Three.js is loaded from jsDelivr. Optional CC0 PBR images are loaded from Poly Haven when available; procedural fallbacks remain if those requests fail.

## Automated checks

```bash
npm run check
npm test
npm install --no-save playwright
npx playwright install chromium webkit
npm run test:browser
```

## Asset licensing
See [`assets/ASSET_LICENSES.md`](assets/ASSET_LICENSES.md) for the individual CC0 source pages and the material maps used.