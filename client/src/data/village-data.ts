// Official Wonder Lake Village Boundary GeoJSON
// Source: Municipal Boundaries data for Wonder Lake, Illinois
import boundaryData from './wonder-lake-boundary.json';

export const rawVillageData = boundaryData;

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
