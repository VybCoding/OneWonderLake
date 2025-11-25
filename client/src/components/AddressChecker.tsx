import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import distance from "@turf/distance";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import polygonToLine from "@turf/polygon-to-line";
import { rawVillageData } from "@/data/village-data";
import neighboringMunicipalities from "@/data/neighboring-municipalities.json";
import WonderLakeMap from "@/components/WonderLakeMap";
import InterestForm from "@/components/InterestForm";

const MAX_DISTANCE_MILES = 2;

type ResultStatus = "resident" | "annexation" | "other_municipality" | null;

type SearchResult = "resident" | "annexation" | "other_municipality" | "outside_area" | "not_found";

async function saveSearchedAddress(
  address: string,
  result: SearchResult,
  municipalityName?: string,
  latitude?: string,
  longitude?: string
) {
  try {
    await fetch("/api/searched-address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        result,
        municipalityName: municipalityName || null,
        latitude: latitude || null,
        longitude: longitude || null,
      }),
    });
  } catch (err) {
    console.error("Failed to save searched address:", err);
  }
}

export default function AddressChecker() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultStatus>(null);
  const [municipalityName, setMunicipalityName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  const checkAddress = async () => {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setMunicipalityName(null);
    setMarkerPosition(null);

    try {
      // Fetch coordinates from Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address data");
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        setError("Address not found. Please try a different address.");
        saveSearchedAddress(address, "not_found");
        setLoading(false);
        return;
      }

      const { lat, lon } = data[0];
      const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
      const userPoint = point([parseFloat(lon), parseFloat(lat)]);

      // First, check if point is inside Wonder Lake Village
      const wonderLakePolygon = rawVillageData.features[0];
      
      // Calculate distance from point to Wonder Lake boundary
      const boundaryLine = polygonToLine(wonderLakePolygon as any);
      const nearestPoint = nearestPointOnLine(boundaryLine as any, userPoint);
      const distanceToWonderLake = distance(userPoint, nearestPoint, { units: 'miles' });
      
      // Reject addresses more than 2 miles from Wonder Lake boundary
      if (distanceToWonderLake > MAX_DISTANCE_MILES) {
        setError(`This address is outside our service area. Please enter an address within ${MAX_DISTANCE_MILES} miles of Wonder Lake.`);
        saveSearchedAddress(address, "outside_area", undefined, lat, lon);
        setLoading(false);
        return;
      }
      const isInsideWonderLake = booleanPointInPolygon(userPoint, wonderLakePolygon as any);

      if (isInsideWonderLake) {
        setResult("resident");
        setMarkerPosition(coords);
        saveSearchedAddress(address, "resident", undefined, lat, lon);
        return;
      }

      // Check if point is inside any neighboring municipality
      for (const feature of neighboringMunicipalities.features) {
        const isInsideMunicipality = booleanPointInPolygon(userPoint, feature as any);
        if (isInsideMunicipality) {
          setResult("other_municipality");
          setMunicipalityName(feature.properties.CORPNAME);
          setMarkerPosition(coords);
          saveSearchedAddress(address, "other_municipality", feature.properties.CORPNAME, lat, lon);
          return;
        }
      }

      // Not in Wonder Lake or any other municipality - eligible for annexation
      setResult("annexation");
      setMarkerPosition(coords);
      saveSearchedAddress(address, "annexation", undefined, lat, lon);
    } catch (err) {
      console.error("Error checking address:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      checkAddress();
    }
  };

  // Format municipality name for display (title case)
  const formatMunicipalityName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <section id="address" className="py-16 md:py-24 bg-accent/10">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground" data-testid="text-checker-title">
          Am I Included?
        </h2>
        <p className="text-center text-muted-foreground mb-8 text-lg">
          Enter your address to see if you're part of the annexation zone
        </p>

        <div className="flex gap-3 mb-8">
          <Input
            type="text"
            placeholder="Enter your Wonder Lake address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 h-12 text-base"
            data-testid="input-address"
          />
          <Button
            onClick={checkAddress}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground px-8 h-12"
            data-testid="button-check-address"
          >
            {loading ? (
              "Checking..."
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Check Status
              </>
            )}
          </Button>
        </div>

        {/* Interactive Map */}
        <div className="mb-8">
          <WonderLakeMap 
            markerPosition={markerPosition} 
            result={result}
            municipalityName={municipalityName}
          />
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-center" data-testid="text-error">
            {error}
          </div>
        )}

        {result === "resident" && (
          <div className="p-6 bg-green-100 dark:bg-green-950 border-2 border-green-500 rounded-md text-center" data-testid="result-resident">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
              You are already a Village Resident
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Help us spread the word about the benefits of One Wonder Lake!
            </p>
          </div>
        )}

        {result === "other_municipality" && municipalityName && (
          <div className="p-6 bg-slate-100 dark:bg-slate-900 border-2 border-slate-400 rounded-md text-center" data-testid="result-other-municipality">
            <div className="text-4xl mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              Already Part of {formatMunicipalityName(municipalityName)}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              This address is within the boundaries of {formatMunicipalityName(municipalityName)} and is not eligible for annexation into Wonder Lake Village.
            </p>
          </div>
        )}

        {result === "annexation" && (
          <div className="p-6 bg-yellow-100 dark:bg-yellow-950 border-2 border-yellow-500 rounded-md text-center" data-testid="result-annexation">
            <div className="text-4xl mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
              You are in the Annexation Zone
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              You are currently unincorporated. See your benefits below.
            </p>
            <InterestForm 
              source="address_checker" 
              prefillAddress={address}
              buttonClassName="bg-yellow-700 hover:bg-yellow-800 text-white"
            />
          </div>
        )}
      </div>
    </section>
  );
}
