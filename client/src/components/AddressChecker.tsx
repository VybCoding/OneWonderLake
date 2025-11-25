import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { rawVillageData } from "@/data/village-data";
import WonderLakeMap from "@/components/WonderLakeMap";
import InterestForm from "@/components/InterestForm";

type ResultStatus = "resident" | "annexation" | null;

export default function AddressChecker() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultStatus>(null);
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
        setLoading(false);
        return;
      }

      const { lat, lon } = data[0];
      const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
      const userPoint = point([parseFloat(lon), parseFloat(lat)]);

      // Check if point is inside the polygon
      const polygon = rawVillageData.features[0];
      const isInside = booleanPointInPolygon(userPoint, polygon as any);

      setResult(isInside ? "resident" : "annexation");
      setMarkerPosition(coords);
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
            isInside={result === "resident"}
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

        {result === "annexation" && (
          <div className="p-6 bg-yellow-100 dark:bg-yellow-950 border-2 border-yellow-500 rounded-md text-center" data-testid="result-annexation">
            <div className="text-4xl mb-2">📢</div>
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
