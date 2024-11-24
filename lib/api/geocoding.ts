import { cityData } from '../cities';

interface GeocodingResult {
  city: string;
  country: string;
  name: string;
  codes: string[];
  lat?: number;
  lng?: number;
  population?: number;
  region?: string;
  timezone?: string;
}

// GeoNames API configuration
const GEONAMES_USERNAME = 'demo'; // Replace with your GeoNames username
const GEONAMES_API = 'http://api.geonames.org';

// OpenStreetMap Nominatim API configuration
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  try {
    // First, search local database
    const localResults = searchLocalDatabase(query);
    
    // Then, fetch from external APIs in parallel
    const [geonamesResults, nominatimResults] = await Promise.all([
      searchGeoNames(query),
      searchNominatim(query)
    ]);

    // Merge and deduplicate results
    const allResults = mergeResults([
      ...localResults,
      ...geonamesResults,
      ...nominatimResults
    ]);

    return allResults.slice(0, 15); // Limit to 15 results for performance
  } catch (error) {
    console.error('Error searching locations:', error);
    // Fallback to local database if APIs fail
    return searchLocalDatabase(query);
  }
}

function searchLocalDatabase(query: string): GeocodingResult[] {
  const searchTerm = query.toLowerCase();
  return Object.entries(cityData)
    .filter(([city, data]) => {
      const cityMatch = city.includes(searchTerm);
      const nameMatch = data.name.toLowerCase().includes(searchTerm);
      return cityMatch || nameMatch;
    })
    .map(([city, data]) => ({
      city,
      country: data.country,
      name: data.name,
      codes: data.codes
    }));
}

async function searchGeoNames(query: string): Promise<GeocodingResult[]> {
  try {
    const response = await fetch(
      `${GEONAMES_API}/searchJSON?q=${encodeURIComponent(query)}&maxRows=10&username=${GEONAMES_USERNAME}&cities=cities1000`
    );
    
    if (!response.ok) throw new Error('GeoNames API request failed');
    
    const data = await response.json();
    
    return data.geonames.map((item: any) => ({
      city: item.name.toLowerCase(),
      country: item.countryCode,
      name: item.name,
      codes: [], // Will be populated with postal codes if available
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lng),
      population: parseInt(item.population),
      timezone: item.timezone
    }));
  } catch (error) {
    console.error('GeoNames API error:', error);
    return [];
  }
}

async function searchNominatim(query: string): Promise<GeocodingResult[]> {
  try {
    const response = await fetch(
      `${NOMINATIM_API}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`
    );
    
    if (!response.ok) throw new Error('Nominatim API request failed');
    
    const data = await response.json();
    
    return data
      .filter((item: any) => item.type === 'city' || item.type === 'town')
      .map((item: any) => ({
        city: item.display_name.split(',')[0].toLowerCase(),
        country: item.address.country_code?.toUpperCase(),
        name: item.display_name.split(',')[0],
        codes: [], // Will be populated with postal codes if available
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        region: item.address.state || item.address.region
      }));
  } catch (error) {
    console.error('Nominatim API error:', error);
    return [];
  }
}

function mergeResults(results: GeocodingResult[]): GeocodingResult[] {
  const seen = new Set();
  return results.filter(result => {
    const key = `${result.city}-${result.country}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}