import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
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

// Wonder Lake area bounding box (roughly 2+ miles around the village)
const WONDER_LAKE_BOUNDS = {
  minLat: 42.35,
  maxLat: 42.45,
  minLon: -88.42,
  maxLon: -88.32,
};

// Direction mappings (both ways)
const DIRECTION_MAPPINGS: Record<string, string> = {
  'east': 'e',
  'west': 'w',
  'north': 'n',
  'south': 's',
  'northeast': 'ne',
  'northwest': 'nw',
  'southeast': 'se',
  'southwest': 'sw',
  'e': 'east',
  'w': 'west',
  'n': 'north',
  's': 'south',
  'ne': 'northeast',
  'nw': 'northwest',
  'se': 'southeast',
  'sw': 'southwest',
};

// Street type mappings (both ways)
const STREET_TYPE_MAPPINGS: Record<string, string> = {
  'road': 'rd',
  'street': 'st',
  'avenue': 'ave',
  'drive': 'dr',
  'lane': 'ln',
  'court': 'ct',
  'circle': 'cir',
  'boulevard': 'blvd',
  'place': 'pl',
  'terrace': 'ter',
  'trail': 'trl',
  'way': 'wy',
  'parkway': 'pkwy',
  'rd': 'road',
  'st': 'street',
  'ave': 'avenue',
  'dr': 'drive',
  'ln': 'lane',
  'ct': 'court',
  'cir': 'circle',
  'blvd': 'boulevard',
  'pl': 'place',
  'ter': 'terrace',
  'trl': 'trail',
  'wy': 'way',
  'pkwy': 'parkway',
};

// Local Wonder Lake area street name variations
const LOCAL_STREET_VARIATIONS: Record<string, string[]> = {
  'lake shore': ['lakeshore', 'lake shore'],
  'lakeshore': ['lake shore', 'lakeshore'],
  'wonder lake': ['wonderlake', 'wonder lake'],
  'wonderlake': ['wonder lake', 'wonderlake'],
};

// Normalize address by swapping directions and street types
function normalizeAddress(addr: string, useAbbreviations: boolean): string {
  let normalized = addr.toLowerCase().trim();
  
  // Handle directions
  for (const [key, value] of Object.entries(DIRECTION_MAPPINGS)) {
    if (useAbbreviations && key.length > 2) {
      // Replace full words with abbreviations
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      normalized = normalized.replace(regex, value.toUpperCase());
    } else if (!useAbbreviations && key.length <= 2) {
      // Replace abbreviations with full words
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      normalized = normalized.replace(regex, value.charAt(0).toUpperCase() + value.slice(1));
    }
  }
  
  // Handle street types
  for (const [key, value] of Object.entries(STREET_TYPE_MAPPINGS)) {
    if (useAbbreviations && key.length > 3) {
      // Replace full words with abbreviations
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      normalized = normalized.replace(regex, value.charAt(0).toUpperCase() + value.slice(1));
    } else if (!useAbbreviations && key.length <= 4) {
      // Replace abbreviations with full words
      const regex = new RegExp(`\\b${key}\\.?\\b`, 'gi');
      normalized = normalized.replace(regex, value.charAt(0).toUpperCase() + value.slice(1));
    }
  }
  
  // Capitalize first letter of each word for proper formatting
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Get local street name variations
function getLocalVariations(addr: string): string[] {
  const variations: string[] = [];
  const lowerAddr = addr.toLowerCase();
  
  for (const [key, values] of Object.entries(LOCAL_STREET_VARIATIONS)) {
    if (lowerAddr.includes(key)) {
      for (const variant of values) {
        if (variant !== key) {
          variations.push(addr.replace(new RegExp(key, 'gi'), variant));
        }
      }
    }
  }
  
  return variations;
}

// Generate multiple address variations to try - PRIORITIZED ORDER
// Most specific (Wonder Lake, IL) queries first for faster results
function generateAddressVariations(addr: string): string[] {
  const variations: string[] = [];
  const trimmedAddr = addr.trim();
  const lowerAddr = trimmedAddr.toLowerCase();
  
  // Check if address already has location context (more precise check)
  // Match "wonder lake", "illinois", or standalone "il" (with word boundaries)
  const hasWonderLake = lowerAddr.includes('wonder lake');
  const hasIllinois = lowerAddr.includes('illinois');
  const hasILAbbrev = /\bil\b/.test(lowerAddr) || lowerAddr.endsWith(', il') || lowerAddr.includes(', il ');
  const hasContext = hasWonderLake || hasIllinois || hasILAbbrev;
  
  // PRIORITY 1: Most specific - with Wonder Lake, IL context (most likely to succeed)
  if (!hasContext) {
    variations.push(`${trimmedAddr}, Wonder Lake, IL`);
  }
  
  // PRIORITY 2: Original address (in case user included full context)
  variations.push(trimmedAddr);
  
  // PRIORITY 3: Abbreviated version with Wonder Lake context
  const abbreviated = normalizeAddress(trimmedAddr, true);
  if (abbreviated !== trimmedAddr && !hasContext) {
    variations.push(`${abbreviated}, Wonder Lake, IL`);
  }
  
  // PRIORITY 4: Expanded version with Wonder Lake context
  const expanded = normalizeAddress(trimmedAddr, false);
  if (expanded !== trimmedAddr && expanded !== abbreviated && !hasContext) {
    variations.push(`${expanded}, Wonder Lake, IL`);
  }
  
  // PRIORITY 5: Local street name variations with Wonder Lake context
  const localVariations = getLocalVariations(trimmedAddr);
  for (const variant of localVariations) {
    if (!hasContext) {
      variations.push(`${variant}, Wonder Lake, IL`);
    }
  }
  
  // LOWER PRIORITY: Fallback variations without specific context
  if (abbreviated !== trimmedAddr) {
    variations.push(abbreviated);
  }
  if (expanded !== trimmedAddr && expanded !== abbreviated) {
    variations.push(expanded);
  }
  for (const variant of localVariations) {
    variations.push(variant);
  }
  
  // LOWEST PRIORITY: McHenry County context
  if (!trimmedAddr.toLowerCase().includes('mchenry')) {
    variations.push(`${trimmedAddr}, McHenry County, IL`);
  }
  
  // Remove duplicates while preserving order
  return Array.from(new Set(variations));
}

// Search with Nominatim API using bounding box
async function searchNominatim(query: string): Promise<any[]> {
  const { minLat, maxLat, minLon, maxLon } = WONDER_LAKE_BOUNDS;
  const viewbox = `${minLon},${maxLat},${maxLon},${minLat}`;
  
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=0&limit=5`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch address data");
  }
  
  const data = await response.json();
  
  // Filter results to prefer those within or near the bounding box
  if (data && data.length > 0) {
    const inBoundsResults = data.filter((result: any) => {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      // Slightly expanded bounds for filtering
      return lat >= minLat - 0.05 && lat <= maxLat + 0.05 &&
             lon >= minLon - 0.05 && lon <= maxLon + 0.05;
    });
    
    // Return in-bounds results if available, otherwise return all
    return inBoundsResults.length > 0 ? inBoundsResults : data;
  }
  
  return data || [];
}

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

// Type for address suggestions
type AddressSuggestion = {
  displayName: string;
  lat: string;
  lon: string;
  distanceToWonderLake: number;
};

// Collect all nearby address candidates from search results
async function collectNearbyCandidates(variations: string[]): Promise<AddressSuggestion[]> {
  const candidates: AddressSuggestion[] = [];
  const seenLocations = new Set<string>();
  
  const wonderLakePolygon = rawVillageData.features[0];
  const boundaryLine = polygonToLine(wonderLakePolygon as any);
  
  for (const variation of variations) {
    try {
      const data = await searchNominatim(variation);
      if (data && data.length > 0) {
        for (const result of data) {
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          const locationKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
          
          // Skip duplicates
          if (seenLocations.has(locationKey)) continue;
          seenLocations.add(locationKey);
          
          const userPoint = point([lon, lat]);
          const nearestPoint = nearestPointOnLine(boundaryLine as any, userPoint);
          const dist = distance(userPoint, nearestPoint, { units: 'miles' });
          
          // Only include results within 2 miles of Wonder Lake
          if (dist <= MAX_DISTANCE_MILES) {
            candidates.push({
              displayName: result.display_name,
              lat: result.lat,
              lon: result.lon,
              distanceToWonderLake: dist,
            });
          }
        }
      }
    } catch (err) {
      // Continue to next variation
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Sort by distance to Wonder Lake (closest first)
  candidates.sort((a, b) => a.distanceToWonderLake - b.distanceToWonderLake);
  
  // Return top 5 unique candidates
  return candidates.slice(0, 5);
}

export default function AddressChecker() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultStatus>(null);
  const [municipalityName, setMunicipalityName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);

  // Process a specific location (used for both initial search and suggestion selection)
  const processLocation = async (lat: string, lon: string, displayAddress: string) => {
    const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
    const userPoint = point([parseFloat(lon), parseFloat(lat)]);

    const wonderLakePolygon = rawVillageData.features[0];
    const isInsideWonderLake = booleanPointInPolygon(userPoint, wonderLakePolygon as any);

    if (isInsideWonderLake) {
      setResult("resident");
      setMarkerPosition(coords);
      saveSearchedAddress(displayAddress, "resident", undefined, lat, lon);
      return;
    }

    // Check if point is inside any neighboring municipality
    for (const feature of neighboringMunicipalities.features) {
      const isInsideMunicipality = booleanPointInPolygon(userPoint, feature as any);
      if (isInsideMunicipality) {
        setResult("other_municipality");
        setMunicipalityName(feature.properties.CORPNAME);
        setMarkerPosition(coords);
        saveSearchedAddress(displayAddress, "other_municipality", feature.properties.CORPNAME, lat, lon);
        return;
      }
    }

    // Not in Wonder Lake or any other municipality - eligible for annexation
    setResult("annexation");
    setMarkerPosition(coords);
    saveSearchedAddress(displayAddress, "annexation", undefined, lat, lon);
  };

  // Handle selecting a suggested address
  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setResult(null);
    setMunicipalityName(null);
    
    // Extract just the street address part (first part before the first comma)
    const streetAddress = suggestion.displayName.split(',')[0].trim();
    setAddress(streetAddress);
    
    try {
      await processLocation(suggestion.lat, suggestion.lon, streetAddress);
    } catch (err) {
      console.error("Error processing suggestion:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if a result is within service area
  const isWithinServiceArea = (lat: string, lon: string): boolean => {
    const userPoint = point([parseFloat(lon), parseFloat(lat)]);
    const wonderLakePolygon = rawVillageData.features[0];
    const boundaryLine = polygonToLine(wonderLakePolygon as any);
    const nearestPoint = nearestPointOnLine(boundaryLine as any, userPoint);
    const dist = distance(userPoint, nearestPoint, { units: 'miles' });
    return dist <= MAX_DISTANCE_MILES;
  };

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
    setSuggestions([]);

    try {
      // Generate address variations to try (prioritized order)
      const variations = generateAddressVariations(address);
      let validResult: any = null;
      let outsideAreaResult: any = null;
      
      // Try each variation - EARLY EXIT when we find a valid result in service area
      for (const variation of variations) {
        try {
          const data = await searchNominatim(variation);
          if (data && data.length > 0) {
            // Check the first result immediately
            const result = data[0];
            if (isWithinServiceArea(result.lat, result.lon)) {
              // Found a valid result within service area - use it immediately!
              validResult = result;
              break; // EARLY EXIT - no need to try more variations
            } else if (!outsideAreaResult) {
              // Store first outside-area result as fallback
              outsideAreaResult = result;
            }
          }
        } catch (err) {
          // Continue to next variation
          console.log(`Variation "${variation}" failed, trying next...`);
        }
        
        // Small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // If we found a valid result within service area, process it immediately
      if (validResult) {
        await processLocation(validResult.lat, validResult.lon, address);
        return;
      }

      // No valid result in service area - check if we have any result at all
      if (!outsideAreaResult) {
        // No results at all - try to find nearby candidates
        const nearbyCandidates = await collectNearbyCandidates(variations);
        if (nearbyCandidates.length > 0) {
          setSuggestions(nearbyCandidates);
          setError("Address not found. Did you mean one of these?");
        } else {
          setError("Address not found. Try including 'Wonder Lake, IL' or check the spelling of street names.");
        }
        saveSearchedAddress(address, "not_found");
        setLoading(false);
        return;
      }

      // We have a result but it's outside service area - offer alternatives
      const nearbyCandidates = await collectNearbyCandidates(variations);
      
      if (nearbyCandidates.length > 0) {
        setSuggestions(nearbyCandidates);
        setError("The address found is outside our service area. Did you mean one of these Wonder Lake addresses?");
      } else {
        setError(`This address is outside our service area. Please enter an address within ${MAX_DISTANCE_MILES} miles of Wonder Lake.`);
      }
      saveSearchedAddress(address, "outside_area", undefined, outsideAreaResult.lat, outsideAreaResult.lon);
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

        <div className="flex gap-3 mb-4">
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
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Check Status
              </>
            )}
          </Button>
        </div>

        {/* Loading indicator with subtle animation */}
        {loading && (
          <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-md flex items-center justify-center gap-3" data-testid="loading-indicator">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="text-muted-foreground">Locating your address...</span>
          </div>
        )}

        {/* Did you mean? Suggestions - Dropdown below text box */}
        {suggestions.length > 0 && (
          <div className="mb-8 p-4 bg-card border border-border rounded-md" data-testid="suggestions-container">
            <p className="text-sm font-medium text-muted-foreground mb-3">Did you mean?</p>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => {
                // Format display: show street address prominently, then city/state smaller
                const parts = suggestion.displayName.split(',');
                const streetAddress = parts[0]?.trim() || suggestion.displayName;
                const cityState = parts.slice(1, 3).join(',').trim();
                
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left p-3 rounded-md border border-border bg-background hover-elevate active-elevate-2 transition-colors"
                    data-testid={`suggestion-${index}`}
                  >
                    <span className="font-medium text-foreground">{streetAddress}</span>
                    {cityState && (
                      <span className="text-sm text-muted-foreground ml-2">
                        {cityState}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
            <div className="flex gap-3 justify-center flex-wrap" data-testid="interest-buttons-container">
              <InterestForm 
                source="address_checker" 
                prefillAddress={address}
                interested={true}
                buttonClassName="bg-yellow-700 hover:bg-yellow-800 text-white"
                latitude={markerPosition ? markerPosition[0].toString() : undefined}
                longitude={markerPosition ? markerPosition[1].toString() : undefined}
              />
              <InterestForm 
                source="address_checker" 
                prefillAddress={address}
                interested={false}
                buttonClassName="bg-gray-600 hover:bg-gray-700 text-white"
                latitude={markerPosition ? markerPosition[0].toString() : undefined}
                longitude={markerPosition ? markerPosition[1].toString() : undefined}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
