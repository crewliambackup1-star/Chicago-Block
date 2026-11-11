# Third-party texture sources

The V4.1 environment refinement optionally loads 1K PBR maps directly from Poly Haven. These sources are CC0 1.0 Universal according to their individual asset pages. The game has procedural materials ready immediately and keeps them as fallbacks if a remote map cannot load.

| Asset | Use in game | License | Source |
|---|---|---|---|
| Worn Brick Wall | Building brick color, normal and roughness maps | CC0 1.0 | https://polyhaven.com/a/worn_brick_wall |
| Asphalt 03 | Road color, normal and roughness maps | CC0 1.0 | https://polyhaven.com/a/asphalt_03 |
| Concrete Pavement | Sidewalk color, normal and roughness maps | CC0 1.0 | https://polyhaven.com/a/concrete_pavement |

The browser fetches the 1K JPEG maps from Poly Haven's download host only after the initial procedural textures are ready. A failed request leaves the procedural material in place. The Three.js render loop does not wait for external downloads.

Poly Haven license information: https://polyhaven.com/license
