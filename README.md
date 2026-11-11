# Chicago Block — V4.5 Smooth People & Vehicle Models

V4.5 replaces angular people and repeated traffic silhouettes with smaller, more naturally proportioned character heads and shoulders, rounded anatomical and footwear geometry, smoother curved vehicle bodies, rounded roof and tyre profiles, and four distinct traffic body-size variants. Pedestrian gait, traffic routes, driving physics, controls and camera behavior remain unchanged. The V4.3 lighting, reflections and weather pipeline and V4.4 geographic-data foundation are retained.

## V4.5 people and vehicle model refinement
- Character head assemblies are proportionally reduced around a pivot, preserving the existing head animation while bringing head-to-body scale closer to natural adult proportions.
- Shoulder span, torso width, arm and leg profiles, shoes and soles are refined with smoother, less block-like shapes.
- Vehicle side profiles use rounded quadratic corners and deeper multi-segment bevels; the roof panel, tyres and wheel spokes use softer curved geometry.
- Four distinct traffic body-size variants include sedan, SUV, wagon and compact silhouettes while preserving all seven traffic routes and the player sedan's handling dimensions.
- Character and vehicle material finishes, interior silhouettes, wheel hardware, lighting and adaptive rendering remain active.

## V4.2 human model and animation changes (retained)
- Replaces the single-sphere torso with a tapered lathed body profile that defines the shoulders, chest, waist and abdomen more naturally.
- Adds garment construction details such as a zipper, chest pockets, pocket flaps, buttons, stitching seams and a layered neckline.
- Adds four distinct procedural hairstyles: curly, cropped, short twists and tied-back.
- Reworks arms and legs into articulated shoulder/elbow and hip/knee/shin/foot groups, with more natural hands, fingers, shoes and soles.
- Replaces the simple walk swing with a gait cycle that coordinates hip swing, knee lift, elbow bend, foot pitch, torso bob and subtle head movement.
- Preserves pedestrian speed, destinations, routes and the existing player controls.

## V4.2 vehicle changes (retained)
- Adds shared microflake paint texture, subtle surface relief, higher metalness and a clearer coat finish.
- Improves window glass clearcoat, reflection and transmission settings.
- Adds readable cabin silhouettes to traffic cars, with a more detailed cockpit retained for the player car.
- Adds hood, trunk and door panel lines, sill details and refined fender forms.
- Refines headlights and tail lamps with separate lens geometry, LED-style strips and improved mirror glass.
- Adds wheel lug nuts, brake calipers, rotor hardware and improved wheel detailing.
- Preserves vehicle dimensions, steering, wheel rotation, acceleration, braking and traffic routes.

## V4.1 architecture and environment retained
- building-number plaques, recessed window reveals, stone lintels, sidewalk joints and switchback fire escapes remain in the environment.
- Scanned PBR materials keep their procedural material fallback, so external asset requests never block startup.
- Optional CC0 scanned 1K PBR maps for worn brick, grey asphalt and concrete pavement, with procedural fallbacks that never block startup.
- Varied building floor spacing, framed entries, rooftop penthouses and vent stacks.
- Building-number plaques, recessed window reveals, stone lintels, sidewalk expansion joints and connected fire-escape switchback stairs.
- Asset source and license records in `assets/ASSET_LICENSES.md`.

## V4.3 lighting and atmosphere
- Desktop ultra profile up to 2x device pixel ratio and 3072px directional shadow map, subject to device support.
- A deterministic solar model adds warm sunrise/sunset color, directional moonlight, subtle sky bounce, a soft sun glow and a visible moon at night.
- A second drifting cloud shell adds layered sky motion without a post-processing pass.
- Rain changes asphalt clearcoat, roughness, environment response and puddle reflections; fog and rain adjust atmospheric scattering distance and sky color.
- Adaptive pixel density remains active so higher shadow detail can step down under sustained frame-time pressure.
- Touch-device profile capped at 1.45x pixel ratio and 1024px shadow map.
- Adaptive resolution reacts only to sustained frame-time pressure and does not change simulation speed.
- Directional shadows follow the player to concentrate detail near the active area.
- Headless automation uses a separate low-resolution, no-shadow profile.

## Performance target
- Primary target: MacBook Air M3 with 16 GB unified memory.
- Instancing remains in use for repeated environment details.
- Character rigs add more geometry, but the number of pedestrians and traffic vehicles remains unchanged.
- Adaptive resolution is a safeguard, not a guaranteed FPS. Physical M3 performance still needs a manual check after deployment.

## Scope
- No new missions, objectives or gameplay systems.
- No changes to the current map footprint, routes, driving physics, movement, controls or camera.
- Existing package delivery, all five collectibles and the clear/rain/fog weather states are retained.
- The playable district remains fictional and Chicago-inspired; geographically grounded expansion is later roadmap work.

## V4 roadmap
- V4.0: adaptive renderer and player-centered shadow coverage.
- V4.1: architecture, scanned PBR materials and street environment.
- V4.2: human and vehicle models, materials and animations.
- V4.3: lighting, reflections, sky and weather atmosphere.
- V4.4: geographic data foundation and streamed city sections.
- V4.5: smooth, naturally proportioned people and varied vehicle models.

## Validation
`npm run check` validates the game, controls, renderer and atmosphere model. `npm test` covers source behavior, adaptive-resolution rules, day/night/weather atmosphere curves, architecture/PBR wiring and V4.2 model/animation code. Browser automation checks Chromium on desktop and touch-enabled mobile viewport sizes, including runtime character proportions, vehicle body styles, driving, movement and environment diagnostics. This covers responsive touch controls; a separate Safari/WebKit engine pass remains a later validation item.

Automated screenshots are saved as GitHub Actions artifacts. Tests use the local `?automation=1` mode; normal player graphics are not reduced by those headless-test settings.

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. Three.js loads from jsDelivr. Optional CC0 PBR images load from Poly Haven when available; procedural fallbacks remain if those requests fail.

## Automated checks

```bash
npm run check
npm test
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

## Asset licensing
See [`assets/ASSET_LICENSES.md`](assets/ASSET_LICENSES.md) for third-party CC0 texture sources.

## V4.4 geographic-data foundation

V4.4 adds reusable infrastructure for a future, data-driven Chicago map while leaving the currently playable district unchanged:

- WGS84 longitude/latitude to local metre projection and inverse conversion around a documented Chicago reference origin.
- East-positive X / north-negative Z axes, 512-metre tile addressing, bounds and player-centered tile selection.
- Bounded GeoJSON normalization for street centerlines and building footprints.
- A normalized tile schema, source manifest and local GeoJSON-to-tile build command.
- Feature-to-tile partitioning that preserves continuity across tile seams, with a maximum-tiles-per-feature guard.
- A request-deduplicating tile manager with cancellation, bounded LRU caching, prefetch and diagnostics.

**Status:** this is a data foundation, not a geographically accurate playable map. No raw City of Chicago source export is bundled, no real Chicago geometry is rendered by the game, and the existing fictional Chicago-inspired district remains the playable area. City source reuse terms and attribution must be checked before distributing processed datasets. Large-scale geometry clipping, deduplication, tile compression and scene integration remain later stages.

The source inputs expected by the builder are documented in city-data/README.md. After placing reviewed GeoJSON exports at the documented local paths, run npm run build:city-tiles to produce a local tile pack. Raw source files are intentionally excluded from the repository.
