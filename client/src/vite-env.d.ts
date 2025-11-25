/// <reference types="vite/client" />

// Declare GeoJSON module support
declare module '*.geojson' {
  const value: any;
  export default value;
}
