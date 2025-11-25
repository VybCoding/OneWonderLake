// Official Wonder Lake Village Boundary GeoJSON
// Source: Municipal Boundaries data for Wonder Lake, Illinois
import boundaryData from './wonder-lake-boundary.json';

// 60097 ZIP Code Boundary GeoJSON
// Source: US Census Bureau ZCTA (ZIP Code Tabulation Area) data
import zipBoundaryData from './zip-60097-boundary.json';

export const rawVillageData = boundaryData;
export const rawZipData = zipBoundaryData;

// Type for the GeoJSON structure
export type VillageBoundary = {
  type: "FeatureCollection";
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: Array<{
    type: "Feature";
    id: number;
    geometry: {
      type: "Polygon";
      coordinates: number[][][];
    };
    properties?: Record<string, any>;
  }>;
};
