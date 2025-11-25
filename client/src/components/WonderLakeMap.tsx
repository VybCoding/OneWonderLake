import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { rawVillageData } from "@/data/village-data";

// Fix for default marker icons in Leaflet with Webpack/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type ResultStatus = "resident" | "annexation" | "other_municipality" | null;

interface WonderLakeMapProps {
  markerPosition?: [number, number] | null;
  result?: ResultStatus;
  municipalityName?: string | null;
}

// Component to handle map view changes
function MapViewController({ markerPosition }: { markerPosition?: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (markerPosition) {
      // Zoom to marker location
      map.setView(markerPosition, 14, { animate: true });
    }
  }, [markerPosition, map]);
  
  return null;
}

// Format municipality name for display (title case)
const formatMunicipalityName = (name: string) => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function WonderLakeMap({ markerPosition, result, municipalityName }: WonderLakeMapProps) {
  // Default center: Wonder Lake, IL
  const defaultCenter: [number, number] = [42.38, -88.35];
  const mapRef = useRef<L.Map | null>(null);

  // Style for the village boundary
  const boundaryStyle = {
    color: '#005f73',
    weight: 3,
    opacity: 0.8,
    fillColor: '#94d2bd',
    fillOpacity: 0.2,
  };

  // Get popup content based on result
  const getPopupContent = () => {
    switch (result) {
      case "resident":
        return {
          title: "Village Resident",
          subtitle: "Already part of Wonder Lake Village",
          icon: "check-circle",
          color: "text-green-600"
        };
      case "other_municipality":
        return {
          title: `Part of ${municipalityName ? formatMunicipalityName(municipalityName) : 'Another Municipality'}`,
          subtitle: "Not eligible for annexation",
          icon: "building",
          color: "text-slate-500"
        };
      case "annexation":
        return {
          title: "Annexation Zone",
          subtitle: "Eligible for annexation",
          icon: "megaphone",
          color: "text-yellow-600"
        };
      default:
        return null;
    }
  };

  const popupContent = getPopupContent();

  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-md overflow-hidden border-2 border-border shadow-lg" data-testid="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        scrollWheelZoom={false}
        zoomControl={false}
        doubleClickZoom={false}
        touchZoom={false}
        dragging={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Village Boundary */}
        <GeoJSON 
          data={rawVillageData as any} 
          style={boundaryStyle}
        />
        
        {/* Address Marker */}
        {markerPosition && popupContent && (
          <Marker position={markerPosition}>
            <Popup>
              <div className="text-center">
                <strong className={popupContent.color}>
                  {popupContent.title}
                </strong>
                <br />
                <span className="text-sm text-gray-600">
                  {popupContent.subtitle}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
        
        <MapViewController markerPosition={markerPosition} />
      </MapContainer>
    </div>
  );
}
