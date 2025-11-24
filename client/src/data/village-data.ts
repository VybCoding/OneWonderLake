// Mock GeoJSON polygon for Wonder Lake, IL (approx Lat 42.38, Long -88.35)
// This is a simple square box covering the Wonder Lake area for testing
export const rawVillageData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Wonder Lake Mock Village Boundary"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-88.37, 42.36],  // Southwest corner
            [-88.37, 42.40],  // Northwest corner
            [-88.33, 42.40],  // Northeast corner
            [-88.33, 42.36],  // Southeast corner
            [-88.37, 42.36]   // Close the polygon
          ]
        ]
      }
    }
  ]
} as const;
