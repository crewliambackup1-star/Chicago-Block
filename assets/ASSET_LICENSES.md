# Third-party texture sources

The V4.1 environment refinement optionally loads 1K PBR maps directly from Poly Haven. These sources are CC0 1.0 Universal according to their individual asset pages. The game has procedural materials ready immediately and keeps them as fallbacks if a remote map cannot load.

| Asset | Use in game | License | Source |
|---|---|---|---|
| Worn Brick Wall | Building brick color, normal and roughness maps | CC0 1.0 | https://polyhaven.com/a/worn_brick_wall |
| Asphalt 02 | Road color, normal and roughness maps | CC0 1.0 | https://polyhaven.com/a/asphalt_02 |
| Concrete Pavement | Sidewalk color, normal and roughness maps | CC0 1.0 | https://polyhaven.com/a/concrete_pavement |

The browser fetches the 1K JPEG maps from Poly Haven's download host only after the initial procedural textures are ready. A failed request leaves the procedural material in place. The Three.js render loop does not wait for external downloads.

Poly Haven license information: https://polyhaven.com/license

## V4.6 human model
- Source page: https://www.innerscene.com/tools/library/3d-parts/crossing-step-3d-person-walking-4235c1bb
- File: `walking-cross-step.glb` (16.1 MB).
- License: CC0 / public domain, as stated on the source page.
- Use: textured, clothed static-stride human mesh for nearby pedestrians and the player avatar. The source asset has no armature or animation; the game uses root movement and retains its procedural animated model as a distance/offline fallback.

## V4.6 vehicle model
- Source page: https://www.innerscene.com/tools/library/3d-parts/sedan-car-42109739
- File: `sedan-original.glb` (627 KB).
- License: CC0 / public domain, as stated on the source page.
- Use: unbranded exterior mesh with editable coachwork, glazing, lamps, wheels and trim. A small player cockpit detail pass is layered on top. The game retains its procedural vehicle as a distance/offline fallback.
