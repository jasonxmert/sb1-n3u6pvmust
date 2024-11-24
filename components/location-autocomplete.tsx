"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MapPin, Building2, Globe2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { searchLocations } from "@/lib/api/geocoding";

interface LocationAutocompleteProps {
  onSelect: (result: any) => void;
}

export default function LocationAutocomplete({ onSelect }: LocationAutocompleteProps) {
  const [value, setValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (value.length < 2) {
      setResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await searchLocations(value);
        setResults(searchResults);
      } catch (error) {
        console.error("Error searching locations:", error);
        toast({
          title: "Error",
          description: "Failed to search locations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [value, toast]);

  const handleSelect = async (city: string, countryCode: string, postcode: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.zippopotam.us/${countryCode.toLowerCase()}/${postcode}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch location data for ${city}`);
      }
      
      const data = await response.json();
      onSelect(data);
      setValue("");
      setShowResults(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch location details. Please try again.",
        variant: "destructive",
      });
      console.error("Error fetching location details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <Input
        placeholder="Search for any city worldwide..."
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        className="w-full h-[4.5rem] text-lg px-4"
      />
      {showResults && (value.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 w-full mt-1 bg-popover text-popover-foreground shadow-md rounded-md border z-50">
          <Command>
            <CommandList className="max-h-[300px] overflow-auto">
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center p-4 text-base text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Searching locations...
                  </div>
                ) : (
                  "No matching locations found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {results.map((result, index) => (
                  <CommandItem
                    key={`${result.city}-${result.country}-${index}`}
                    onSelect={() => handleSelect(result.city, result.country, result.codes[0])}
                    className="p-3"
                  >
                    <div className="flex items-start gap-2 w-full">
                      <MapPin className="h-6 w-6 mt-1 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-lg">{result.name}</span>
                          <span className="text-base text-muted-foreground flex items-center gap-2">
                            <Globe2 className="h-4 w-4" />
                            {result.country}
                          </span>
                        </div>
                        {result.codes.length > 0 && (
                          <div className="text-base text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-5 w-5" />
                            Sample postcodes: {result.codes.slice(0, 3).join(", ")}
                            {result.codes.length > 3 && "..."}
                          </div>
                        )}
                        {result.region && (
                          <div className="text-sm text-muted-foreground">
                            {result.region}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}