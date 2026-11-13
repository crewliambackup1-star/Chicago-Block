# Chicago Block — V4.10 Instant Update Delivery

V4.10 makes the latest published build appear as soon as the game opens, rather than waiting for a browser's cached page or module URLs to expire.

- Checks a tiny `version.json` release manifest on every opening with a cache-bypassing request.
- If the open page is stale, performs one cache-busted navigation to the latest published HTML before starting the game.
- Loads the game entry module and each local JavaScript dependency with the current release version in its URL.
- Carries the same release key into pedestrian and vehicle GLB requests, preventing Safari from reusing an older cached model after a model update.
- Updates the visible page title and in-game version label from the live manifest.
- Falls back to the bundled version when offline or when the version check cannot complete.

The first opening after this release should use the cache-busting link supplied with the release. After that, the live version check handles later releases automatically.

## Previous release: V4.9 Final Graphics Polish


V4.9 is the closing graphics-only pass before the roadmap shifts toward deeper gameplay. It adds a soft, instanced contact-shadow layer to ground characters and vehicles visually while preserving the established world, rendering budget, movement, driving and activities.

## V4.9 final graphics polish

- Adds a radial soft-shadow texture and one dynamic instanced mesh beneath all 20 pedestrians, the player avatar, the player sedan and seven traffic vehicles: 29 moving subjects total.
- Updates each shadow from its subject's current position and heading, follows pedestrian LOD swaps, and hides the avatar shadow in first-person or while driving.
- Uses one instanced draw call rather than one mesh draw per character or vehicle, with a slightly tighter footprint on touch devices.
- Keeps the existing real-time sun shadows, day/night lighting, fog, rain reflections, PBR surfaces, model assets, routes, collisions, controls and activities unchanged.

## V4.8 character and vehicle realism

V4.8 builds on the existing CC0 character and sedan assets with more carefully tuned surface response, the complete locomotion clip set, and a more complete player cockpit. It is a focused model-quality pass that preserves the established world and controls.

## V4.8 character and vehicle realism

- Classifies human meshes into skin, hair, fabric and footwear surfaces, tuning roughness, subtle sheen and environment response while retaining each source texture.
- Applies per-character fabric variation without replacing the underlying clothing textures.
- Activates the existing seven-clip human animation set: idle, relaxed walk, brisk walk, jog, run, carry walk and sit/stand. The player transitions from idle to walking and to a run when sprint is held; faster pedestrians use the brisk walk clip.
- Refines vehicle materials by surface type: clear-coated body paint, more reflective glazing, matte rubber, restrained metal trim, and softer interior materials.
- Adds headrests, a clearer instrument cluster, center-console trim and a gear selector to the player sedan's cockpit.
- Exposes available character clips, material-profile counts and cockpit-detail counts through diagnostics.
- Keeps original model dimensions, pedestrian routes, car handling, vehicle routes, LOD fallbacks and asset-loading behavior intact.

## V4.7 world and environment realism
- Adds varied mid-rise balcony assemblies, raised stoops with short stair runs and metal handrails, and wall-mounted utility meter/conduit details to selected building façades.
- Builds repeated façade details as material-grouped instanced meshes, keeping the new geometry batched instead of creating a large number of separate draw calls.
- Gives existing street trees fuller, layered crowns with 128 small instanced foliage clusters per tree and a more irregular silhouette.
- Adds asphalt repair patches, fine crack lines, and subdued grime along the road gutters using batched geometry.
- Adds tactile curb-warning pads at all 36 street corners, plus mulch beds, scattered fallen leaves and low understory shrubs around the six existing trees.
- Exposes balcony, stoop, utility-meter, tree-canopy and foliage counts to browser diagnostics.
- Preserves the existing street grid, building footprints, collision boundaries, pedestrian routes, traffic, vehicles, camera, weather, lighting and activities.



V4.6 introduces an actual asset-based model path instead of relying exclusively on procedural primitive assemblies. Nearby pedestrians and the player avatar can use a textured, clothed CC0 human GLB; the player car and traffic can use a separate CC0 sedan GLB with PBR coachwork, glazing, lamps, wheels and trim. Existing procedural models remain as graceful fallbacks and as lower-detail pedestrian models at distance. Existing movement, pedestrian routes, vehicle physics, traffic routes, weather, cameras and activities are preserved.

## V4.6 high-fidelity people and vehicles
- Adds asynchronous GLB loading through Three.js GLTFLoader. The model binaries are downloaded during CI and Pages publishing into the site's own `assets/models/` folder, so the game loads them same-origin rather than depending on third-party browser CORS. Missing or failed local files leave procedural models active.
- Uses the Innerscene CC0 Maya human GLB, built from MakeHuman/MPFB assets, for close pedestrians and the player avatar. It includes a skinned skeleton and seven named locomotion clips (idle, relaxed walk, brisk walk, jog, run, carry walk, sit/stand); Three.js AnimationMixer drives idle and walking on the player and pedestrians. NPCs retain route-based movement, while the original procedural articulated character remains the far-distance LOD and offline fallback.
- Uses the Innerscene CC0 sedan exterior asset for the player vehicle and seven traffic vehicles. Existing vehicle groups preserve physics, scale, routes and movement. High-detail assets are used near the camera; the existing procedural vehicle remains the far-distance fallback. The fallback retains V4.5's four distinct traffic body-size variants: sedan, SUV, wagon and compact.
- Adds a player cockpit detail pass because the source sedan asset focuses on the exterior.
- Model loading is skipped in automation mode for the gameplay smoke tests; a separate normal-mode browser integration test verifies both same-origin GLB files load and become active.
- The character clips are authored procedural motion, not motion-captured. Additional distinct character variants, contextual actions and multiple vehicle body styles remain future refinements.

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
- V4.6: real CC0 human and vehicle GLB assets, distance-based fallback and non-blocking loading.
- V4.7: more varied building façades, balconies, raised entrances, utility details and fuller street-tree canopies.
- V4.8: refined human surface materials, full locomotion-clip selection, refined vehicle PBR materials and a more detailed player cockpit.
- V4.9: final graphics polish with soft instanced contact shadows beneath people and vehicles.

## Validation
`npm run check` validates the game, visual-profile helpers, controls, renderer and atmosphere model. `npm test` covers source behavior, adaptive-resolution rules, day/night/weather atmosphere curves, architecture/PBR wiring, material classification and locomotion selection. Browser automation checks Chromium on desktop and touch-enabled mobile viewport sizes, including runtime character proportions, vehicle body styles, driving, movement, façade-detail counts, tree-canopy density, road-surface detail, curb-warning pads and landscaping diagnostics. This covers responsive touch controls; a separate Safari/WebKit engine pass remains a later validation item.

Automated screenshots are saved as GitHub Actions artifacts. V4.9 browser checks also verify that the 29 contact-shadow subjects remain combined into a single instanced draw call. Tests use the local `?automation=1` mode; normal player graphics are not reduced by those headless-test settings.

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. Three.js and its GLTFLoader addon load from jsDelivr. V4.6 CC0 GLB model assets load asynchronously from Innerscene; the existing procedural assets remain active if remote loading fails. Optional CC0 PBR images load from Poly Haven when available; procedural fallbacks remain if those requests fail.

## Automated checks

```bash
npm run check
npm test
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

## Asset licensing
See [`assets/ASSET_LICENSES.md`](assets/ASSET_LICENSES.md) for the CC0 human, vehicle and texture sources.

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
