# Raw city data inputs

Place the downloaded City of Chicago GeoJSON exports here as `streets.geojson` and `buildings.geojson`. Keep raw downloads uncommitted until their size and dataset reuse terms have been reviewed. The tile builder reads these local files and never fetches external data automatically.

The authoritative Building Footprints source is large; the importer handles up to one million features and processes the street and building datasets sequentially. Keep the raw source files out of the public repository until the reuse terms and generated tile sizes are reviewed.
