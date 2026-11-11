# V4.4 geographic-data foundation

This folder is the start of the data-driven Chicago map pipeline. It is not yet connected to the live scene and does not change the current fictional Chicago-inspired play area.

## Coordinate model

- Source coordinates: GeoJSON/WGS84 longitude, latitude.
- Local rendering coordinates: metres around the approximate Chicago Loop origin in `manifest.json`.
- World X points east; negative Three.js Z points north.
- Default tiles are 512 metres square and use integer grid coordinates, including negative tile indices.
- `../geodata.js` contains the projection, inverse projection, tile addressing and GeoJSON feature normalization helpers.

The local projection is scaled at the origin latitude so distances remain usable for city-scale rendering. Keep the original longitude/latitude with source records; projected coordinates are a rendering representation, not a replacement for source geodata.

## Initial source layers

1. **Street Center Lines** — City of Chicago dataset `6imu-meau`. The current data portal page is linked in `manifest.json`. Convert line features into tile-local road centerline data first; road widths, intersections and surface styling belong in the rendering stage.
2. **Building Footprints** — City of Chicago Building Footprints GeoJSON resource `syp8-uezg`. Convert Polygon and MultiPolygon outlines into tile-local footprint rings; building heights and usage should come from validated attributes when available, never guessed from footprint alone.

Review source metadata, attribution and reuse terms for each export before building a distributable tile pack. Preserve dataset identifiers and source dates in the generated tile metadata.

## Next implementation stages

- Download a small, bounded sample around the initial Chicago area and inspect geometry quality, coordinate systems, duplicate segments, invalid rings and attribute coverage.
- Normalize street and building features; clip features at tile boundaries so large roads/buildings do not require entire-city geometry in memory.
- Generate compressed tile files plus a lightweight spatial index and manifest.
- Add a client-side tile manager with request deduplication, bounded LRU cache, cancellation of distant pending requests, and player-centered prefetch.
- Replace the fictional starter block gradually, validating alignment against real street intersections before expanding the loaded radius.

## Current status

V4.4 currently provides coordinate conversion, tile addressing, source documentation and tests. No real Chicago geometry is rendered yet, and no claim is made that the current playable map is geographically accurate.
