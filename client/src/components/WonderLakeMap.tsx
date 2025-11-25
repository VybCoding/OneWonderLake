import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { rawVillageData, rawZipData } from "@/data/village-data";

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type ResultStatus = "resident" | "annexation" | "outside" | null;

interface WonderLakeMapProps {
  markerPosition?: [number, number] | null;
  resultStatus?: ResultStatus;
}

function MapViewController({ markerPosition }: { markerPosition?: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (markerPosition) {
      map.setView(markerPosition, 14, { animate: true });
    }
  }, [markerPosition, map]);
  
  return null;
}

export default function WonderLakeMap({ markerPosition, resultStatus }: WonderLakeMapProps) {
  const defaultCenter: [number, number] = [42.38, -88.35];
  const mapRef = useRef<L.Map | null>(null);

  const villageBoundaryStyle = {
    color: '#005f73',
    weight: 3,
    opacity: 0.9,
    fillColor: '#94d2bd',
    fillOpacity: 0.25,
  };

  const zipBoundaryStyle = {
    color: '#6b7280',
    weight: 2,
    opacity: 0.7,
    fillColor: '#d1d5db',
    fillOpacity: 0.1,
    dashArray: '8, 6',
  };

  const getPopupContent = () => {
    switch (resultStatus) {
      case "resident":
        return {
          title: "Village Resident",
          description: "Already part of Wonder Lake Village"
        };
      case "annexation":
        return {
          title: "Annexation Zone",
          description: "Eligible for annexation into Wonder Lake Village"
        };
      case "outside":
        return {
          title: "Outside Target Area",
          description: "Likely outside the target annexation area (60097)"
        };
      default:
        return {
          title: "Location",
          description: "Enter an address to check status"
        };
    }
  };

  const popupContent = getPopupContent();

  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-md overflow-hidden border-2 border-border shadow-lg" data-testid="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={12}
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
        
        <GeoJSON 
          data={rawZipData as any} 
          style={zipBoundaryStyle}
        />
        
        <GeoJSON 
          data={rawVillageData as any} 
          style={villageBoundaryStyle}
        />
        
        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>
              <div className="text-center">
                <strong>{popupContent.title}</strong>
                <br />
                <span className="text-sm text-muted-foreground">
                  {popupContent.description}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
        
        <MapViewController markerPosition={markerPosition} />
      </MapContainer>
      
      <div className="bg-background/95 px-4 py-2 border-t border-border flex flex-wrap gap-4 text-sm" data-testid="map-legend">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-[#94d2bd] border-2 border-[#005f73] rounded-sm"></div>
          <span className="text-foreground">Village Boundary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-[#d1d5db]/30 border-2 border-dashed border-[#6b7280] rounded-sm"></div>
          <span className="text-foreground">60097 ZIP Code (Target Area)</span>
        </div>
      </div>
    </div>
  );
}
