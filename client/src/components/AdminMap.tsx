import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { rawVillageData } from "@/data/village-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ThumbsUp, ThumbsDown, Search } from "lucide-react";

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const greenIcon = createColoredIcon('#22c55e');
const redIcon = createColoredIcon('#ef4444');
const greyIcon = createColoredIcon('#6b7280');

interface MapPin {
  id: string;
  latitude: string;
  longitude: string;
  address: string;
  name?: string;
  type: 'interested' | 'not_interested' | 'no_preference';
  result?: string;
  date?: string;
}

interface MapData {
  interested: MapPin[];
  notInterested: MapPin[];
  noPreference: MapPin[];
  summary: {
    interested: number;
    notInterested: number;
    noPreference: number;
    total: number;
  };
}

interface AdminMapProps {
  data: MapData;
  isLoading?: boolean;
}

function MapBoundsController({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (pins.length > 0) {
      const bounds = L.latLngBounds(
        pins.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [pins, map]);
  
  return null;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function AdminMap({ data, isLoading }: AdminMapProps) {
  const defaultCenter: [number, number] = [42.38, -88.35];
  const mapRef = useRef<L.Map | null>(null);

  const boundaryStyle = {
    color: '#005f73',
    weight: 3,
    opacity: 0.8,
    fillColor: '#94d2bd',
    fillOpacity: 0.15,
  };

  const allPins = [
    ...data.interested,
    ...data.notInterested,
    ...data.noPreference,
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'interested': return greenIcon;
      case 'not_interested': return redIcon;
      default: return greyIcon;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'interested': return 'Interested in Annexation';
      case 'not_interested': return 'Not Interested';
      default: return 'No Preference Expressed';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'interested': return 'default';
      case 'not_interested': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="hover-elevate">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.summary.interested}</p>
              <p className="text-xs text-muted-foreground">Interested</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
              <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.summary.notInterested}</p>
              <p className="text-xs text-muted-foreground">Not Interested</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.summary.noPreference}</p>
              <p className="text-xs text-muted-foreground">No Preference</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.summary.total}</p>
              <p className="text-xs text-muted-foreground">Total Pins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Community Sentiment Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex gap-4 px-4 pb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Interested</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm text-muted-foreground">Not Interested</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500" />
              <span className="text-sm text-muted-foreground">No Preference</span>
            </div>
          </div>
          
          <div className="w-full h-[500px] md:h-[600px] rounded-b-md overflow-hidden border-t" data-testid="admin-map-container">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
              scrollWheelZoom={true}
              zoomControl={true}
              doubleClickZoom={true}
              touchZoom={true}
              dragging={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <GeoJSON 
                data={rawVillageData as any} 
                style={boundaryStyle}
              />
              
              {allPins.map((pin) => (
                <Marker
                  key={`${pin.type}-${pin.id}`}
                  position={[parseFloat(pin.latitude), parseFloat(pin.longitude)]}
                  icon={getIcon(pin.type)}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <div className="mb-2">
                        <Badge variant={getTypeBadgeVariant(pin.type) as any}>
                          {getTypeLabel(pin.type)}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground">{pin.address}</p>
                      {pin.name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {pin.name}
                        </p>
                      )}
                      {pin.result && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Search result: {pin.result}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(pin.date)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {allPins.length > 0 && <MapBoundsController pins={allPins} />}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {data.summary.total === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Map Data Yet</h3>
            <p className="text-muted-foreground">
              Pins will appear when residents check their addresses and express interest or when they search for addresses.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
