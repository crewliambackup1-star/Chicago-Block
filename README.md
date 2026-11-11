# Chicago Block — V4.3 Lighting, Reflections & Atmosphere

V4.3 builds on the V4.2 people and vehicle pass with a higher fidelity lighting, reflection and weather pipeline. The existing neighborhood footprint, gameplay systems, driving physics, controls, camera behavior, traffic routes and pedestrian routes remain unchanged.

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
- V4.4: geographic data foundation and streamed city sections (foundation in progress on `v4-4-geographic-data-foundation`).

## Validation
`npm run check` validates the game, controls, renderer and atmosphere model. `npm test` covers source behavior, adaptive-resolution rules, day/night/weather atmosphere curves, architecture/PBR wiring and V4.2 model/animation code. Browser automation checks Chromium and WebKit: desktop Chromium and mobile WebKit, including runtime character, vehicle, driving, movement and environment diagnostics.

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
npx playwright install chromium webkit
npm run test:browser
```

## Asset licensing
See [`assets/ASSET_LICENSES.md`](assets/ASSET_LICENSES.md) for third-party CC0 texture sources.

## V4.4 geographic-data foundation (in progress)

A separate V4.4 development branch now contains the first geographic-data layer:
- A Chicago-centered WGS84-to-local-metre projection and its inverse.
- Negative-Z north/east-positive-X world orientation for Three.js.
- 512-metre tile addressing, bounds and player-centered visible-tile key selection.
- GeoJSON normalization helpers for street centerlines and building footprint geometries.
- A source manifest, normalized tile schema and pipeline notes for the City of Chicago datasets.

This is groundwork only. It does not alter the currently playable fictional district or add real Chicago geometry yet. The next stages are source-data inspection, clipping/cleaning, bounded tile generation, and a tested streaming/cache manager. Do not describe the live map as geographically accurate until those stages are integrated and validated.
