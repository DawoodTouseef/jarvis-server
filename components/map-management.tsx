"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  AlertCircle, 
  Locate, 
  MapPin, 
  Home, 
  Search, 
  Layers, 
  ZoomIn, 
  ZoomOut,
  Satellite,
  Map as MapIcon,
  Filter,
  Sun,
  Moon,
  X
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents,useMapEvent } from "react-leaflet";

// Map layer types
type MapLayer = 'street' | 'satellite' | 'terrain' | 'night' | 'hybrid';

// Directions types
type TransportMode = 'car' | 'walk' | 'bike' | 'train' | 'bus';

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  location: [number, number];
}

interface RouteData {
  distance: number;
  duration: number;
  coordinates: [number, number][];
  steps: RouteStep[];
}

// Smart interactions types
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  lat: number;
  lng: number;
}

interface RoutePoint {
  id: string;
  position: [number, number];
  type: 'start' | 'end' | 'waypoint';
}

interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

interface EntityStateChangedData {
  type: string;
  data: {
    entity_id: string;
    new_state: {
      state: string;
      attributes: Record<string, any>;
    };
  };
}

function MapManagement() {
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);
  const [useMap, setUseMap] = useState<any>(null);
  const [useMapEvents, setUseMapEvents] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [CircleMarker, setCircleMarker] = useState<any>(null);
  const [Polyline, setPolyline] = useState<any>(null);
  
  const [entities, setEntities] = useState<EntityState[]>([]);
  const [deviceLocations, setDeviceLocations] = useState<{[key: string]: [number, number]}>({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  
  const [isClient, setIsClient] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLocatingRef = useRef(false); 
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityState | null>(null);
  const [isEntitySheetOpen, setIsEntitySheetOpen] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayer>('street');
  const [zoomLevel, setZoomLevel] = useState(13);
  const [filteredEntities, setFilteredEntities] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Directions state
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [transportMode, setTransportMode] = useState<TransportMode>('car');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
  const [isGettingDirections, setIsGettingDirections] = useState(false);
  
  // New state for Google Maps features
  const [showTraffic, setShowTraffic] = useState(false);
  const [showTransit, setShowTransit] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [nextTurn, setNextTurn] = useState<string>('');
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number>(0);
  const [eta, setEta] = useState<string>('');
  const navigationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add new state variables for smart interactions
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    lat: 0,
    lng: 0
  });
  
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  
  // Add new state variables for user personalization
  const [customMarkers, setCustomMarkers] = useState<RoutePoint[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  
  const getCurrentLocation = () => {
    // Prevent multiple concurrent requests
    if (isLocatingRef.current) {
      return;
    }
    
    // Clear any existing error when trying again
    setError(null);
    
    // Check if geolocation is available
    if (typeof window === 'undefined') {
      setError("Geolocation is not available in this environment");
      return;
    }
    
    // More robust check for geolocation API
    if (!navigator || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser or is disabled");
      return;
    }

    setIsLocating(true);
    isLocatingRef.current = true;
    console.log("Attempting to get current location...");

    // Clear any existing error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    // Try geolocation with different options as fallbacks
    const tryGeolocation = (options: PositionOptions, attempt: number) => {
      // Additional safety check
      if (!navigator || !navigator.geolocation) {
        setIsLocating(false);
        isLocatingRef.current = false;
        setError("Geolocation is not supported by your browser or is disabled");
        return;
      }
      
       if ('geolocation' in navigator){
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log(`Geolocation success on attempt ${attempt}:`, position);
                const { latitude, longitude } = position.coords;
                const currentPosition: [number, number] = [latitude, longitude];
                
                // Update map center and marker position
                setMapCenter(currentPosition);
                setMarkerPosition(currentPosition);
                
                // Fly to user's location with smooth animation
                if (mapRef.current && mapRef.current.flyTo) {
                  mapRef.current.flyTo(currentPosition, 16, {
                    animate: true,
                    duration: 1.5
                  });
                }
                
                setIsLocating(false);
                isLocatingRef.current = false;
              },
              (error) => {
                
                // If this is the first attempt, try again with different options
                if (attempt === 1) {

                  // Try with high accuracy enabled
                  tryGeolocation({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                  }, 2);
                  return;
                }
                
                // If this is the second attempt, try again with even more relaxed options
                if (attempt === 2) {
                  console.log("Retrying geolocation with relaxed options...");
                  // Try with high accuracy disabled and longer timeout
                  tryGeolocation({
                    enableHighAccuracy: false,
                    timeout: 20000,
                    maximumAge: 600000 // 10 minutes
                  }, 3);
                  return;
                }
                
                // All attempts failed
                setIsLocating(false);
                isLocatingRef.current = false;
                let errorMessage = "Unable to retrieve your location. Please try searching instead.";
                
                // Provide more specific error messages if we have error details
                // Handle empty error objects which can occur in some browsers/security configurations
                if (error && typeof error === 'object') {
                  // Check if error object is empty
                  const isEmpty = Object.keys(error).length === 0 && error.constructor === Object;
                  
                  if (isEmpty) {
                    // Handle completely empty error object
                    errorMessage = "Location service error. Please check your browser and device settings and try again. (Error object was empty)";
                  } else if (error.code) {
                    switch (error.code) {
                      case 1: // PERMISSION_DENIED
                        errorMessage = "Location access denied. Please enable location permissions in your browser settings and refresh the page.";
                        break;
                      case 2: // POSITION_UNAVAILABLE
                        errorMessage = "Location information is unavailable. This may happen if your device's location services are disabled or if you're in an area with poor GPS coverage. Please check your device settings and try again.";
                        break;
                      case 3: // TIMEOUT
                        errorMessage = "Location request timed out. Please try again or search for a location instead.";
                        break;
                      default:
                        errorMessage = error.message || "An unknown error occurred while retrieving your location.";
                    }
                  } else if (error.message) {
                    errorMessage = error.message;
                  } else {
                    // Handle error object with no code or message
                    errorMessage = "Location service error. Please check your browser and device settings and try again.";
                  }
                } else if (error) {
                  // Handle non-object errors (strings, etc.)
                  errorMessage = String(error);
                } else {
                  // Handle completely null/undefined error
                  errorMessage = "Location service is not responding. Please check your browser and device settings and try again.";
                }
                
                setError(errorMessage);
              },
              options
            );
        
          } else {
          
          setIsLocating(false);
          isLocatingRef.current = false;
          setError("Geolocation is not supported by your browser or is disabled");
        }
    };


    
    tryGeolocation({
      enableHighAccuracy: false,  
      timeout: 15000,             
      maximumAge: 600000          
    }, 1);
  };
  
  // Debounced search for autocomplete suggestions
  const fetchAutocompleteResults = async (query: string) => {
    if (!query.trim()) {
      setAutocompleteResults([]);
      return;
    }
    
    try {
      // Call OpenStreetMap Nominatim API for autocomplete suggestions
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch autocomplete results');
      }
      
      const results = await response.json();
      setAutocompleteResults(results);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setAutocompleteResults([]);
    }
  };
  
  // Handle search query changes with debounce
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for autocomplete
    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchAutocompleteResults(query);
        setShowAutocomplete(true);
      }, 300); // 300ms debounce
    } else {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  };
  
  // Search functionality
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      // Add to search history
      if (!searchHistory.includes(searchQuery)) {
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
      
      // Hide autocomplete
      setShowAutocomplete(false);
      
      // Call OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      const results = await response.json();
      
      if (results.length === 0) {
        setError('No results found for your search');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      // Use the first result to center the map
      const firstResult = results[0];
      const lat = parseFloat(firstResult.lat);
      const lon = parseFloat(firstResult.lon);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        const newPosition: [number, number] = [lat, lon];
        setMapCenter(newPosition);
        
        // Fly to the location
        if (mapRef.current && mapRef.current.flyTo) {
          mapRef.current.flyTo(newPosition, 15, {
            animate: true,
            duration: 1.5
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search for location. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Toggle favorite location
  const toggleFavorite = (location: string) => {
    setFavorites(prev => 
      prev.includes(location) 
        ? prev.filter(fav => fav !== location) 
        : [...prev, location]
    );
  };
  
  // Get directions functionality
  const handleGetDirections = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation.trim() || !toLocation.trim()) return;
    
    setIsGettingDirections(true);
    setError(null);
    
    try {
      // Check if API key is available
      const apiKey = process.env.OPENROUTESERVICE_API_KEY || 'YOUR_API_KEY_HERE';
      
      if (apiKey === 'YOUR_API_KEY_HERE') {
        // Use mock data when no API key is available
        console.warn('No OpenRouteService API key found, using mock data');
        
        // Generate mock route data
        const mockRouteData: RouteData = {
          distance: 15.5, // km
          duration: 30, // minutes
          coordinates: [
            [mapCenter[0], mapCenter[1]],
            [mapCenter[0] + 0.01, mapCenter[1] + 0.01],
            [mapCenter[0] + 0.02, mapCenter[1] + 0.02],
            [mapCenter[0] + 0.03, mapCenter[1] + 0.03]
          ],
          steps: [
            {
              instruction: "Head northeast on Main St toward 1st Ave",
              distance: 0.5,
              duration: 2,
              maneuver: "turn-left",
              location: [mapCenter[0], mapCenter[1]]
            },
            {
              instruction: "Turn left onto 2nd Ave",
              distance: 1.2,
              duration: 5,
              maneuver: "turn-left",
              location: [mapCenter[0] + 0.01, mapCenter[1] + 0.01]
            },
            {
              instruction: "Continue straight for 2 km",
              distance: 2.0,
              duration: 8,
              maneuver: "straight",
              location: [mapCenter[0] + 0.02, mapCenter[1] + 0.02]
            },
            {
              instruction: "Turn right onto Destination St",
              distance: 0.8,
              duration: 3,
              maneuver: "turn-right",
              location: [mapCenter[0] + 0.03, mapCenter[1] + 0.03]
            },
            {
              instruction: "Arrive at your destination",
              distance: 0,
              duration: 0,
              maneuver: "arrive",
              location: [mapCenter[0] + 0.03, mapCenter[1] + 0.03]
            }
          ]
        };
        
        setRouteData(mockRouteData);
        
        // Fly to the route bounds
        if (mapRef.current && mapRef.current.fitBounds) {
          const bounds = [
            [Math.min(...mockRouteData.coordinates.map((c: [number, number]) => c[0])), Math.min(...mockRouteData.coordinates.map((c: [number, number]) => c[1]))],
            [Math.max(...mockRouteData.coordinates.map((c: [number, number]) => c[0])), Math.max(...mockRouteData.coordinates.map((c: [number, number]) => c[1]))]
          ];
          mapRef.current.fitBounds(bounds, { padding: [50, 50], duration: 1.5, animate: true });
        }
        
        setError("Using mock data. Add OPENROUTESERVICE_API_KEY to .env for real directions.");
        setTimeout(() => setError(null), 5000);
        return;
      }
      
      // Get coordinates for from and to locations
      const fromCoords = await geocodeLocation(fromLocation);
      const toCoords = await geocodeLocation(toLocation);
      
      if (!fromCoords || !toCoords) {
        throw new Error('Could not geocode one or both locations');
      }
      
      // Type guard to ensure fromCoords and toCoords are not null
      if (!fromCoords || !toCoords) {
        throw new Error('Could not geocode one or both locations');
      }
      
      // Map transport modes to OpenRouteService profiles
      const profileMap = {
        'car': 'driving-car',
        'walk': 'foot-walking',
        'bike': 'cycling-regular',
        'train': 'driving-car', // Using car as default for train (would need transit API for real implementation)
        'bus': 'driving-car'    // Using car as default for bus (would need transit API for real implementation)
      };
      
      const profile = profileMap[transportMode] || 'driving-car';
      
      // Call OpenRouteService API for directions
      const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [
            [fromCoords.lon, fromCoords.lat],
            [toCoords.lon, toCoords.lat]
          ],
          format: 'geojson',
          instructions: 'true'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch directions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract route information
      const route = data.features[0];
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]); // Convert [lon, lat] to [lat, lon]
      
      // Extract steps and convert to our format
      const steps: RouteStep[] = route.properties.segments[0].steps.map((step: any) => ({
        instruction: step.instruction,
        distance: step.distance / 1000, // Convert meters to km
        duration: step.duration / 60,   // Convert seconds to minutes
        maneuver: step.type,
        location: [step.way_points[0] ? coordinates[step.way_points[0]][0] : coordinates[0][0], 
                  step.way_points[0] ? coordinates[step.way_points[0]][1] : coordinates[0][1]]
      }));
      
      const routeData: RouteData = {
        distance: route.properties.segments[0].distance / 1000, // Convert meters to km
        duration: route.properties.segments[0].duration / 60,   // Convert seconds to minutes
        coordinates: coordinates,
        steps: steps
      };
      
      setRouteData(routeData);
      
      // Fly to the route bounds
      if (mapRef.current && mapRef.current.fitBounds) {
        const bounds = [
          [Math.min(...coordinates.map((c: [number, number]) => c[0])), Math.min(...coordinates.map((c: [number, number]) => c[1]))],
          [Math.max(...coordinates.map((c: [number, number]) => c[0])), Math.max(...coordinates.map((c: [number, number]) => c[1]))]
        ];
        mapRef.current.fitBounds(bounds, { padding: [50, 50], duration: 1.5, animate: true });
      }
    } catch (error) {
      console.error('Directions error:', error);
      setError(`Failed to get directions: ${(error as Error).message || 'Please try again.'}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGettingDirections(false);
    }
  };
  
  // Geocode a location using OpenStreetMap Nominatim
  const geocodeLocation = async (location: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to geocode location');
      }
      
      const results = await response.json();
      
      if (results.length === 0) {
        return null;
      }
      
      const result = results[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };
  
  // Start navigation simulation
  const startNavigation = () => {
    if (!routeData || !routeData.coordinates.length) return;
    
    setIsNavigating(true);
    setCurrentStep(0);
    setUserPosition([routeData.coordinates[0][0], routeData.coordinates[0][1]]);
    
    // Clear any existing interval
    if (navigationIntervalRef.current) {
      clearInterval(navigationIntervalRef.current);
    }
    
    // Set up navigation simulation
    navigationIntervalRef.current = setInterval(() => {
      setCurrentStep(prevStep => {
        const nextStep = prevStep + 1;
        
        // If we've reached the end of the route
        if (nextStep >= routeData.coordinates.length) {
          if (navigationIntervalRef.current) {
            clearInterval(navigationIntervalRef.current);
          }
          setIsNavigating(false);
          return prevStep;
        }
        
        // Update user position
        setUserPosition([routeData.coordinates[nextStep][0], routeData.coordinates[nextStep][1]]);
        
        // Update next turn information
        if (nextStep < routeData.steps.length) {
          setNextTurn(routeData.steps[nextStep].instruction);
          setDistanceToNextTurn(routeData.steps[nextStep].distance);
          
          // Calculate ETA (simplified)
          const remainingSteps = routeData.steps.length - nextStep;
          const avgTimePerStep = routeData.duration / routeData.steps.length;
          const remainingTime = remainingSteps * avgTimePerStep;
          setEta(`${Math.round(remainingTime)} min`);
        }
        
        // Fly to user position
        if (mapRef.current && mapRef.current.flyTo) {
          mapRef.current.flyTo([routeData.coordinates[nextStep][0], routeData.coordinates[nextStep][1]], 18, {
            animate: true,
            duration: 1.0
          });
        }
        
        return nextStep;
      });
    }, 2000); // Move to next step every 2 seconds
  };
  
  // Stop navigation simulation
  const stopNavigation = () => {
    if (navigationIntervalRef.current) {
      clearInterval(navigationIntervalRef.current);
    }
    setIsNavigating(false);
    setUserPosition(null);
    setNextTurn('');
    setDistanceToNextTurn(0);
    setEta('');
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (navigationIntervalRef.current) {
        clearInterval(navigationIntervalRef.current);
      }
    };
  }, []);
  
  // Filter entities by type
  const toggleEntityFilter = (entityType: string) => {
    setFilteredEntities(prev => 
      prev.includes(entityType) 
        ? prev.filter(type => type !== entityType) 
        : [...prev, entityType]
    );
  };
  
  useEffect(() => {
    setIsClient(true);
    getCurrentLocation();
  }, []);
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }
    
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);
  
  // Function to fetch weather data for a location
  const fetchWeatherData = async (lat: number, lng: number) => {
    setIsWeatherLoading(true);
    try {
      // In a real implementation, you would call a weather API like OpenWeatherMap
      // For now, we'll use mock data
      const mockWeatherData = {
        location: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
        temperature: Math.floor(Math.random() * 30) + 10, // Random temp between 10-40°C
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 50) + 30, // Random humidity 30-80%
        windSpeed: (Math.random() * 20).toFixed(1), // Random wind speed 0-20 km/h
        icon: ['☀️', '☁️', '🌧️', '⛅'][Math.floor(Math.random() * 4)]
      };
      setWeatherData(mockWeatherData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData(null);
    } finally {
      setIsWeatherLoading(false);
    }
  };
  
  if (!isClient) {
    return (
      <div className="w-full h-full flex flex-col">
        <Card className="flex-1 border-0 rounded-none">
          <CardContent className="p-0 h-full">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      {/* Google Maps Style Layout */}
      <div className="flex-1 flex flex-col h-full relative">
        <MapComponent 
          isLocating={isLocating} 
          setIsLocating={setIsLocating} 
          mapRef={mapRef} 
          getCurrentLocation={getCurrentLocation}
          error={error}
          setError={setError}
          markerPosition={markerPosition}
          mapCenter={mapCenter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchHistory={searchHistory}
          setSearchHistory={setSearchHistory}
          autocompleteResults={autocompleteResults}
          setAutocompleteResults={setAutocompleteResults}
          showAutocomplete={showAutocomplete}
          setShowAutocomplete={setShowAutocomplete}
          handleSearchQueryChange={handleSearchQueryChange}
          handleSearch={handleSearch}
          selectedEntity={selectedEntity}
          setSelectedEntity={setSelectedEntity}
          isEntitySheetOpen={isEntitySheetOpen}
          setIsEntitySheetOpen={setIsEntitySheetOpen}
          mapLayer={mapLayer}
          setMapLayer={setMapLayer}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          filteredEntities={filteredEntities}
          toggleEntityFilter={toggleEntityFilter}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          // Directions props
          fromLocation={fromLocation}
          setFromLocation={setFromLocation}
          toLocation={toLocation}
          setToLocation={setToLocation}
          transportMode={transportMode}
          setTransportMode={setTransportMode}
          routeData={routeData}
          setRouteData={setRouteData}
          isDirectionsOpen={isDirectionsOpen}
          setIsDirectionsOpen={setIsDirectionsOpen}
          isGettingDirections={isGettingDirections}
          setIsGettingDirections={setIsGettingDirections}
          handleGetDirections={handleGetDirections}
          // Google Maps features
          showTraffic={showTraffic}
          setShowTraffic={setShowTraffic}
          showTransit={showTransit}
          setShowTransit={setShowTransit}
          showWeather={showWeather}
          setShowWeather={setShowWeather}
          favorites={favorites}
          setFavorites={setFavorites}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          toggleFavorite={toggleFavorite}
          // Navigation features
          isNavigating={isNavigating}
          setIsNavigating={setIsNavigating}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          userPosition={userPosition}
          setUserPosition={setUserPosition}
          nextTurn={nextTurn}
          setNextTurn={setNextTurn}
          distanceToNextTurn={distanceToNextTurn}
          setDistanceToNextTurn={setDistanceToNextTurn}
          eta={eta}
          setEta={setEta}
          startNavigation={startNavigation}
          stopNavigation={stopNavigation}
          // Smart interactions
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          routePoints={routePoints}
          setRoutePoints={setRoutePoints}
          setMarkerPosition={setMarkerPosition}
          // User personalization
          customMarkers={customMarkers}
          setCustomMarkers={setCustomMarkers}
          weatherData={weatherData}
          isWeatherLoading={isWeatherLoading}
          fetchWeatherData={fetchWeatherData}
        />
      </div>
    </div>
  );
};

// Update the MapComponent props interface
interface MapComponentProps {
  isLocating: boolean;
  setIsLocating: (isLocating: boolean) => void;
  mapRef: React.MutableRefObject<any>;
  getCurrentLocation: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  markerPosition: [number, number] | null;
  mapCenter: [number, number];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
  autocompleteResults: any[];
  setAutocompleteResults: (results: any[]) => void;
  showAutocomplete: boolean;
  setShowAutocomplete: (show: boolean) => void;
  handleSearchQueryChange: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  selectedEntity: EntityState | null;
  setSelectedEntity: (entity: EntityState | null) => void;
  isEntitySheetOpen: boolean;
  setIsEntitySheetOpen: (isOpen: boolean) => void;
  mapLayer: MapLayer;
  setMapLayer: (layer: MapLayer) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  filteredEntities: string[];
  toggleEntityFilter: (entityType: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  // Directions props
  fromLocation: string;
  setFromLocation: (location: string) => void;
  toLocation: string;
  setToLocation: (location: string) => void;
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
  routeData: RouteData | null;
  setRouteData: (data: RouteData | null) => void;
  isDirectionsOpen: boolean;
  setIsDirectionsOpen: (isOpen: boolean) => void;
  isGettingDirections: boolean;
  setIsGettingDirections: (isGetting: boolean) => void;
  handleGetDirections: (e: React.FormEvent) => void;
  // Google Maps features
  showTraffic: boolean;
  setShowTraffic: (show: boolean) => void;
  showTransit: boolean;
  setShowTransit: (show: boolean) => void;
  showWeather: boolean;
  setShowWeather: (show: boolean) => void;
  favorites: string[];
  setFavorites: (favorites: string[]) => void;
  toggleFavorite: (location: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  // Navigation state
  isNavigating: boolean;
  setIsNavigating: (isNavigating: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  userPosition: [number, number] | null;
  setUserPosition: (position: [number, number] | null) => void;
  nextTurn: string;
  setNextTurn: (turn: string) => void;
  distanceToNextTurn: number;
  setDistanceToNextTurn: (distance: number) => void;
  eta: string;
  setEta: (eta: string) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  // Smart interactions
  contextMenu: ContextMenuState;
  setContextMenu: (contextMenu: ContextMenuState) => void;
  routePoints: RoutePoint[];
  setRoutePoints: (points: RoutePoint[]) => void;
  setMarkerPosition: (position: [number, number] | null) => void;
  // User personalization
  customMarkers: RoutePoint[];
  setCustomMarkers: (markers: RoutePoint[]) => void;
  weatherData: any;
  isWeatherLoading: boolean;
  fetchWeatherData: (lat: number, lng: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = (props) => {
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [Polyline, setPolyline] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);
  const [useMap, setUseMap] = useState<any>(null);
  const [useMapEvents, setUseMapEvents] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [CircleMarker, setCircleMarker] = useState<any>(null);
  
  const [entities, setEntities] = useState<EntityState[]>([]);
  const [deviceLocations, setDeviceLocations] = useState<{[key: string]: [number, number]}>({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isWeatherIconVisible, setIsWeatherIconVisible] = useState(false);
  // Function to get user location icon (profile marker or home icon) with modern design
  const getUserLocationIcon = (state?: string) => {
    if (!L) return null;
    
    // If state is "home", show home icon
    if (state === "home") {
     
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#00c8ff" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#00c8ff" stop-opacity="0"/>
          </radialGradient>
          <filter id="blurFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>
        <!-- Glowing circle background -->
        <circle cx="20" cy="20" r="18" fill="url(#glow)" filter="url(#blurFilter)" />
        <!-- Direction cone -->
        <path d="M20 5 L25 15 L20 13 L15 15 Z" fill="#00c8ff" />
        <!-- Central dot -->
        <circle cx="20" cy="20" r="6" fill="#00c8ff" stroke="white" stroke-width="2"/>
        <!-- Pulse animation -->
        <circle cx="20" cy="20" r="8" fill="none" stroke="#00c8ff" stroke-width="1" stroke-opacity="0.5">
          <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    `;
    
    // Convert SVG to data URL
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;
    
    return new L.Icon({
      iconUrl: svgDataUrl,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    }); 
    }
    return new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/844/844754.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
  };

  // Function to get icon based on entity state with modern design
  const getEntityIcon = (entity: EntityState) => {
    if (!L) return null;
    
    // Modern entity icon design
    let fillColor = "#00c8ff"; // Default neon blue
    
    if (entity.state === "on" || entity.state === "home") {
      fillColor = "#10b981"; // Green for active/on/home
    } else if (entity.state === "off" || entity.state === "not_home") {
      fillColor = "#ef4444"; // Red for inactive/off/not_home
    } else if (entity.state === "closed" || entity.state === "locked") {
      fillColor = "#f97316"; // Orange for closed/locked
    }

    // Create a custom SVG icon for entities
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <defs>
          <radialGradient id="entityGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${fillColor}" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="${fillColor}" stop-opacity="0"/>
          </radialGradient>
          <filter id="entityBlurFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        <!-- Glowing background -->
        <circle cx="16" cy="16" r="14" fill="url(#entityGlow)" filter="url(#entityBlurFilter)" />
        <!-- Central marker -->
        <path d="M16 4 C12 4 9 7 9 11 C9 14 16 28 16 28 C16 28 23 14 23 11 C23 7 20 4 16 4 Z" fill="${fillColor}" stroke="white" stroke-width="1"/>
        <circle cx="16" cy="11" r="3" fill="white"/>
      </svg>
    `;
    
    // Convert SVG to data URL
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;
    
    return new L.Icon({
      iconUrl: svgDataUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };
  
  // Find user entity (person.*) to determine if state is "home"
  const userEntity = entities.find(entity => entity.entity_id.startsWith("person."));
  const userState = userEntity ? userEntity.state : undefined;
  
  // Memoize the markers to prevent unnecessary re-renders
  const memoizedMarkers = useMemo(() => {
    // Filter entities based on selected filters
    const getFilteredDeviceLocations = () => {
      if (props.filteredEntities.includes("person")) {
        // If person filter is active, only show person entities
        const personEntities = Object.keys(deviceLocations).filter(id => id.startsWith("person."));
        return Object.fromEntries(
          Object.entries(deviceLocations).filter(([id]) => personEntities.includes(id))
        );
      }
      return deviceLocations;
    };
    
    const filteredDeviceLocations = getFilteredDeviceLocations();
    
    return Object.entries(filteredDeviceLocations).map(([entityId, position]) => {
      if (!position || position.length < 2 || isNaN(position[0]) || isNaN(position[1])) {
        return null;
      }
      const entity = entities.find(e => e.entity_id === entityId);
      if (!entity) return null;
      
      return (
        <Marker 
          key={entityId} 
          position={position} 
          icon={getEntityIcon(entity)}
          eventHandlers={{
            click: () => {
              props.setSelectedEntity(entity);
              props.setIsEntitySheetOpen(true);
            }
          }}
        >
          <Popup className="scale-in">
            <div className="min-w-48">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{entity.attributes.friendly_name || entityId}</h4>
                <Badge variant={entity.state === "home" || entity.state === "on" ? "default" : "secondary"}>
                  {entity.state}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {entity.attributes.address}
              </p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="font-medium">Lat:</span>
                <span>{position[0].toFixed(4)}</span>
                <span className="font-medium">Lng:</span>
                <span>{position[1].toFixed(4)}</span>
              </div>
              <Button 
                size="sm" 
                className="mt-2 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  props.setSelectedEntity(entity);
                  props.setIsEntitySheetOpen(true);
                }}
              >
                View Details
              </Button>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [deviceLocations, entities, props]);
  
  // Dynamically import leaflet components only on client side
  useEffect(() => {
    const loadLeafletComponents = async () => {
      try {
        // Load CSS files first
        if (typeof window !== 'undefined') {
          // Dynamically create link elements for CSS
          const leafletCss = document.createElement('link');
          leafletCss.rel = 'stylesheet';
          leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(leafletCss);
          
          const compatibilityCss = document.createElement('link');
          compatibilityCss.rel = 'stylesheet';
          compatibilityCss.href = 'https://cdn.jsdelivr.net/npm/leaflet-defaulticon-compatibility@0.1.2/dist/leaflet-defaulticon-compatibility.css';
          document.head.appendChild(compatibilityCss);
        }
        
        // Then load the JavaScript modules
        const leafletModule = await import('leaflet');
        setL(() => leafletModule.default);
        
        const reactLeafletModule = await import('react-leaflet');
        setMapContainer(() => reactLeafletModule.MapContainer);
        setTileLayer(() => reactLeafletModule.TileLayer);
        setMarker(() => reactLeafletModule.Marker);
        setPopup(() => reactLeafletModule.Popup);
        setUseMap(() => reactLeafletModule.useMap);
        setUseMapEvents(() => reactLeafletModule.useMapEvents);
        setCircleMarker(() => reactLeafletModule.CircleMarker);
        setPolyline(() => reactLeafletModule.Polyline);
      } catch (error) {
        console.error('Error loading Leaflet components:', error);
      }
    };
    
    loadLeafletComponents();
  }, []);

  // Custom component to handle map size updates (only on client side)
  const MapSizeController = () => {
    if (!useMap) return null;
    
    const map = useMap();
    
    useEffect(() => {
      const handleResize = () => {
        map.invalidateSize({
          pan: false,
          debounceMoveend: true
        });
      };
      
      // Debounce resize events
      const debouncedResize = debounce(handleResize, 300);
      
      window.addEventListener('resize', debouncedResize);
      
      // Initial size update
      const timer = setTimeout(() => {
        map.invalidateSize({
          pan: false,
          debounceMoveend: true
        });
      }, 100);
      
      return () => {
        window.removeEventListener('resize', debouncedResize);
        clearTimeout(timer);
      };
    }, [map]);
    
    return null;
  };
  
  // Debounce function to limit how often a function can be called
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Custom component to handle map events including right-click
  const MapEventHandler = () => {
    const map = useMapEvents({
      contextmenu: (e: any) => {
        // Show context menu on right-click
        props.setContextMenu({
          visible: true,
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      },
      click: () => {
        // Hide context menu on map click
        props.setContextMenu({
          visible: false,
          x: 0,
          y: 0,
          lat: 0,
          lng: 0
        });
      },
      zoomstart: () => {
        // Add a class to indicate zooming for smooth transitions
        const container = map.getContainer();
        container.classList.add('map-zooming');
      },
      zoomend: () => {
        // Remove the zooming class after a delay
        setTimeout(() => {
          const container = map.getContainer();
          container.classList.remove('map-zooming');
        }, 300);
        
        if (map) {
          props.setZoomLevel(map.getZoom());
          // Adjust label visibility based on zoom level
          adjustLabelVisibility(map);
        }
      },
      moveend: () => {
        // Adjust label visibility when map moves
        adjustLabelVisibility(map);
      }
    });
    
    useEffect(() => {
      if (map) {
        setMapInstance(map);
        props.mapRef.current = map;
        // Initial label adjustment
        adjustLabelVisibility(map);
      }
    }, [map]);
    
    // Function to adjust label visibility based on zoom level
    const adjustLabelVisibility = (mapInstance: any) => {
      if (!mapInstance || !L) return;
      
      const zoomLevel = mapInstance.getZoom();
      
      // Get all map panes
      const pane = mapInstance.getPanes().overlayPane;
      if (!pane) return;
      
      // Adjust label visibility based on zoom level
      const labels = pane.querySelectorAll('.leaflet-marker-icon, .leaflet-popup');
      labels.forEach((label: HTMLElement) => {
        if (zoomLevel < 10) {
          // Hide labels when zoomed out
          label.style.opacity = '0.7';
          label.style.transform = 'scale(0.8)';
          label.style.transition = 'all 0.3s ease-in-out';
        } else if (zoomLevel < 15) {
          // Semi-transparent labels at medium zoom
          label.style.opacity = '0.9';
          label.style.transform = 'scale(0.9)';
          label.style.transition = 'all 0.3s ease-in-out';
        } else {
          // Full visibility when zoomed in
          label.style.opacity = '1';
          label.style.transform = 'scale(1)';
          label.style.transition = 'all 0.3s ease-in-out';
        }
      });
      
      // Adjust tile contrast based on zoom level
      const tiles = pane.querySelectorAll('.leaflet-tile-container');
      tiles.forEach((tile: HTMLElement) => {
        if (zoomLevel < 12) {
          tile.style.filter = 'contrast(0.9) brightness(0.95)';
        } else if (zoomLevel < 16) {
          tile.style.filter = 'contrast(1) brightness(1)';
        } else {
          tile.style.filter = 'contrast(1.1) brightness(1.05)';
        }
      });
    };
    
    return null;
  };

  // Custom component to render controls inside the map
  const MapControls = () => {
    if (!useMap) return null;
    
    const handleZoomIn = () => {
      if (mapInstance) {
        mapInstance.zoomIn();
      }
    };
    
    const handleZoomOut = () => {
      if (mapInstance) {
        mapInstance.zoomOut();
      }
    };
    
    const toggleTheme = () => {
      props.setIsDarkMode(!props.isDarkMode);
    };
    
    const toggleSidebar = () => {
      props.setIsSidebarCollapsed(!props.isSidebarCollapsed);
    };
    
    return (
      <>
    
        
        {/* Google Maps Style Right Controls */}
        <div className="leaflet-top leaflet-right mt-24">
          <div className="leaflet-control flex flex-col gap-3 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            
            {/* Location Button */}
            <button 
              type="button" 
              onClick={props.getCurrentLocation}
              disabled={props.isLocating}
              className="flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg h-10 w-10 p-0 transition-colors duration-200 shadow"
              aria-label="My Location"
            >
              <Locate className={`w-5 h-5 ${props.isLocating ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Map Layers Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    onClick={() => {
                      const layers: MapLayer[] = ['street', 'satellite', 'terrain', 'night', 'hybrid'];
                      const currentIndex = layers.indexOf(props.mapLayer);
                      const nextIndex = (currentIndex + 1) % layers.length;
                      props.setMapLayer(layers[nextIndex]);
                    }}
                    className="flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg h-10 w-10 p-0 transition-colors duration-200 shadow"
                    aria-label="Map Layers"
                  >
                    {props.mapLayer === 'street' && <MapIcon className="w-5 h-5" />}
                    {props.mapLayer === 'satellite' && <Satellite className="w-5 h-5" />}
                    {props.mapLayer === 'terrain' && <Layers className="w-5 h-5" />}
                    {props.mapLayer === 'night' && <Moon className="w-5 h-5" />}
                    {props.mapLayer === 'hybrid' && <MapIcon className="w-5 h-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
                  <p>Map Layers: {props.mapLayer.charAt(0).toUpperCase() + props.mapLayer.slice(1)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Traffic Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    onClick={() => props.setShowTraffic(!props.showTraffic)}
                    className={`flex items-center justify-center rounded-lg h-10 w-10 p-0 transition-colors duration-200 shadow ${props.showTraffic ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    aria-label="Traffic"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
                  <p>Traffic</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Weather Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    onClick={() => props.setShowWeather(!props.showWeather)}
                    className={`flex items-center justify-center rounded-lg h-10 w-10 p-0 transition-colors duration-200 shadow ${props.showWeather ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    aria-label="Weather"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
                  <p>Weather</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Mobile Controls - Google Maps Style */}
        <div className="leaflet-bottom leaflet-center mb-4 md:hidden">
          <div className="leaflet-control flex gap-3 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            {/* Location Button */}
            <button 
              type="button" 
              onClick={props.getCurrentLocation}
              disabled={props.isLocating}
              className="flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg h-12 w-12 p-0 transition-colors duration-200 shadow"
              aria-label="My Location"
            >
              <Locate className={`w-6 h-6 ${props.isLocating ? 'animate-spin' : ''}`} />
            </button>
            
            
            {/* Map Layers Button */}
            <button 
              type="button" 
              onClick={() => {
                const layers: MapLayer[] = ['street', 'satellite', 'terrain', 'night', 'hybrid'];
                const currentIndex = layers.indexOf(props.mapLayer);
                const nextIndex = (currentIndex + 1) % layers.length;
                props.setMapLayer(layers[nextIndex]);
              }}
              className="flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg h-12 w-12 p-0 transition-colors duration-200 shadow"
              aria-label="Map Layers"
            >
              {props.mapLayer === 'street' && <MapIcon className="w-6 h-6" />}
              {props.mapLayer === 'satellite' && <Satellite className="w-6 h-6" />}
              {props.mapLayer === 'terrain' && <Layers className="w-6 h-6" />}
              {props.mapLayer === 'night' && <Moon className="w-6 h-6" />}
              {props.mapLayer === 'hybrid' && <MapIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Error Toast */}
        {props.error && (
          <div className="leaflet-top leaflet-center mt-20">
            <div className="leaflet-control">
              <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-3 rounded-2xl shadow-xl max-w-md flex items-start gap-2 border border-destructive/50 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium">Error</span>
                  <p className="text-sm mt-1">{props.error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Google Maps Style Bottom Controls */}
        <div className="leaflet-bottom leaflet-left mb-4 ml-4">
          <div className="leaflet-control bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 text-sm font-medium flex gap-4 items-center">
            {/* Scale Bar */}
            <div className="flex items-center gap-1">
              <div className="h-1 bg-black dark:bg-white w-8"></div>
              <span className="text-gray-700 dark:text-gray-300">100 m</span>
            </div>
            
            {/* Map Attribution */}
            <div className="text-gray-700 dark:text-gray-300">
              Leaflet | OpenStreetMap contributors
            </div>
          </div>
        </div>
        
        {/* Zoom Level Indicator */}
        <div className="leaflet-bottom leaflet-right mb-4 mr-4">
          <div className="leaflet-control bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 text-sm font-medium">
            Zoom: {props.zoomLevel}
          </div>
        </div>
        
        
      </>
    );
  };

  
  // Add custom markers to the map
  const CustomMarkers = () => {
    if (!Marker) return null;
    
    return (
      <>
        {props.customMarkers.map((marker) => (
          <Marker 
            key={marker.id}
            position={marker.position}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="font-semibold">Custom Marker</div>
              <div className="text-sm">
                {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
              </div>
              <button
                onClick={() => {
                  // Remove this marker
                  props.setCustomMarkers(
                    props.customMarkers.filter(m => m.id !== marker.id)
                  );
                }}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Remove Marker
              </button>
            </Popup>
          </Marker>
        ))}
      </>
    );
  };
  
  // Add context menu component
  const ContextMenu = () => {
    if (!props.contextMenu.visible) return null;
    
    return (
      <div 
        className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 py-2 min-w-48"
        style={{ 
          left: props.contextMenu.x, 
          top: props.contextMenu.y,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium">
            {props.contextMenu.lat.toFixed(6)}, {props.contextMenu.lng.toFixed(6)}
          </div>
        </div>
        <button
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
          onClick={() => {
            // Add marker at this location
            props.setMarkerPosition([props.contextMenu.lat, props.contextMenu.lng]);
            props.setContextMenu({ ...props.contextMenu, visible: false });
          }}
        >
          <MapPin className="w-4 h-4" />
          Add Marker
        </button>
        <button
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
          onClick={() => {
            // Start directions from this location
            props.setFromLocation(`${props.contextMenu.lat}, ${props.contextMenu.lng}`);
            props.setIsDirectionsOpen(true);
            props.setIsSidebarCollapsed(false);
            props.setContextMenu({ ...props.contextMenu, visible: false });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Start Directions from Here
        </button>
        <button
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
          onClick={() => {
            // Measure distance from last point
            if (props.routePoints.length > 0) {
              const lastPoint = props.routePoints[props.routePoints.length - 1];
              // In a real implementation, you would calculate the actual distance
              alert(`Distance from last point: ~${Math.sqrt(
                Math.pow(props.contextMenu.lat - lastPoint.position[0], 2) + 
                Math.pow(props.contextMenu.lng - lastPoint.position[1], 2)
              ).toFixed(2)} degrees`);
            } else {
              alert('No previous point to measure from');
            }
            props.setContextMenu({ ...props.contextMenu, visible: false });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Measure Distance
        </button>
        <button
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
          onClick={() => {
            // Save location to favorites
            const location = `${props.contextMenu.lat}, ${props.contextMenu.lng}`;
            props.setFavorites([...props.favorites, location]);
            props.setContextMenu({ ...props.contextMenu, visible: false });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          Save Location
        </button>
      </div>
    );
  };

  // Listen for WebSocket events to update entity states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get token from localStorage
      const token = localStorage.getItem("authToken");
      
      if (token) {
        // Create Socket.IO connection for location tracking
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080", {
          path: "/ws",
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          auth: {
            token: token
          }
        });

        socket.on('connect', () => {
          console.log('Connected to location tracking Socket.IO');
        });

        // Listen for state changes
        socket.on('state_changed', (data: EntityStateChangedData) => {
          try {
            if (data.type === 'state_changed') {
              const { entity_id, new_state } = data.data;
              
              // Update entities state
              setEntities(prev => prev.map(entity => 
                entity.entity_id === entity_id 
                  ? {
                      ...entity,
                      state: new_state.state,
                      attributes: new_state.attributes || entity.attributes,
                      last_changed: new Date().toISOString(),
                      last_updated: new Date().toISOString()
                    }
                  : entity
              ));
              
              // Update device locations if this is a location entity
              if (new_state.attributes?.latitude && new_state.attributes?.longitude) {
                setDeviceLocations(prev => ({
                  ...prev,
                  [entity_id]: [
                    new_state.attributes.latitude,
                    new_state.attributes.longitude
                  ]
                }));
              }
            }
          } catch (err) {
            console.error('Error parsing Socket.IO message:', err);
          }
        });

        socket.on('connect_error', (err: Error) => {
          console.error('Location tracking Socket.IO connection error:', err);
        });

        socket.on('error', (err: Error) => {
          console.error('Location tracking Socket.IO error:', err);
        });

        socket.on('disconnect', (reason: string) => {
          console.log('Location tracking Socket.IO connection closed:', reason);
        });

        // Clean up the connection on unmount
        return () => {
          socket.disconnect();
        };
      }
    }
  }, []);

  // Fetch Home Assistant entities
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getHomeAssistantEntities();
        console.log('Entities:', response.data);
        if (response.success && response.data) {
          // Transform Entity[] to EntityState[]
          const entityStates: EntityState[] = response.data.map((entity: any) => ({
            entity_id: entity.entity_id,
            state: entity.state,
            attributes: entity.attributes || {},
            last_changed: entity.last_changed || new Date().toISOString(),
            last_updated: entity.last_updated || new Date().toISOString()
          }));
          
          setEntities(entityStates);
          
          // Extract device locations from entities
          const locations: {[key: string]: [number, number]} = {};
          entityStates.forEach(entity => {
            // Check if entity has latitude and longitude attributes
            if (entity.attributes.latitude && entity.attributes.longitude) {
              locations[entity.entity_id] = [
                entity.attributes.latitude,
                entity.attributes.longitude
              ];
            }
          });
          setDeviceLocations(locations);
        }
      } catch (error) {
        console.error("Error fetching Home Assistant entities:", error);
      } finally {
        setLoading(false);
      }
    };

    if (MapContainer) {
      fetchEntities();
      
      // Refresh entities every 30 seconds
      const interval = setInterval(fetchEntities, 30000);
      
      return () => clearInterval(interval);
    }
  }, [MapContainer]);

  // Get appropriate tile layer URL based on selected layer and theme
  const getTileLayerUrl = () => {
    // For dark mode, use specialized dark map tiles when available
    if (props.isDarkMode) {
      switch (props.mapLayer) {
        case 'satellite':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        case 'terrain':
          return 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png';
        case 'night':
          return 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
        case 'hybrid':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        case 'street':
        default:
          return 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
      }
    }
    
    // For light mode, use standard tiles
    switch (props.mapLayer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'night':
        return 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
      case 'hybrid':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'street':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  // Get appropriate attribution based on selected layer
  const getTileLayerAttribution = () => {
    if (props.isDarkMode) {
      switch (props.mapLayer) {
        case 'satellite':
          return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
        case 'terrain':
          return '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        case 'night':
          return '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        case 'hybrid':
          return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
        case 'street':
        default:
          return '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
      }
    }
    
    switch (props.mapLayer) {
      case 'satellite':
        return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'terrain':
        return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
      case 'night':
        return '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
      case 'hybrid':
        return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'street':
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  // Show loading state while components are loading
  if (!MapContainer || !TileLayer || !Marker || !Popup || !L || !useMapEvents) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading map components...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we prepare your map experience</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      <MapContainer
        center={props.mapCenter}
        zoom={props.zoomLevel}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full transition-all duration-300 ease-in-out"
        whenCreated={(map: any) => {
          props.mapRef.current = map;
          setMapInstance(map);
        }}
      >
        <MapSizeController />
        <MapEventHandler />
        <MapControls />
        <TileLayer
          attribution={getTileLayerAttribution()}
          url={getTileLayerUrl()}
        />
        
        {/* User Location Marker */}
        {props.markerPosition && props.markerPosition.length >= 2 && !isNaN(props.markerPosition[0]) && !isNaN(props.markerPosition[1]) && (
          <Marker 
            position={props.markerPosition} 
            icon={getUserLocationIcon(userState)}
          >
            <Popup className="scale-in">
              <div className="min-w-32">
                <div className="flex items-center gap-2 mb-1">
                  {userState === "home" ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  <h3 className="font-semibold">
                    {userState === "home" ? "Home Location" : "Your Location"}
                  </h3>
                </div>
                <p className="text-sm">Lat: {props.markerPosition[0].toFixed(6)}</p>
                <p className="text-sm">Lng: {props.markerPosition[1].toFixed(6)}</p>
                {userState === "home" && (
                  <Badge variant="default" className="mt-1">
                    Home
                  </Badge>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {memoizedMarkers}
        
        {/* Entity Detail Sheet */}
        <Sheet open={props.isEntitySheetOpen} onOpenChange={props.setIsEntitySheetOpen}> 
          <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto glass rounded-l-2xl border-l border-primary/20 shadow-2xl backdrop-blur-lg fade-in">
            {props.selectedEntity ? (
              <>
                <SheetHeader className="border-b border-border/50 pb-4">
                  <SheetTitle className="flex items-center gap-2 text-2xl">
                    {props.selectedEntity.entity_id.startsWith("person.") ? (
                      <Home className="w-6 h-6" />
                    ) : (
                      <MapPin className="w-6 h-6" />
                    )}
                    {props.selectedEntity.attributes.friendly_name || props.selectedEntity.entity_id}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 pr-2">
                  <div className="glass rounded-xl p-4 border border-primary/10">
                    <h3 className="text-lg font-semibold mb-3">Entity Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-sm">State</p>
                        <Badge 
                          variant={props.selectedEntity.state === "home" || props.selectedEntity.state === "on" ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {props.selectedEntity.state}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Entity ID</p>
                        <p className="text-sm mt-1 break-all">{props.selectedEntity.entity_id}</p>
                      </div>
                    </div>
                  </div>
                  
                  {props.selectedEntity.attributes.latitude && props.selectedEntity.attributes.longitude && (
                    <div className="glass rounded-xl p-4 border border-primary/10">
                      <h3 className="text-lg font-semibold mb-3">Location</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground text-sm">Latitude</p>
                          <p className="text-sm mt-1">{props.selectedEntity.attributes.latitude.toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">Longitude</p>
                          <p className="text-sm mt-1">{props.selectedEntity.attributes.longitude.toFixed(6)}</p>
                        </div>
                        {props.selectedEntity.attributes.address && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground text-sm">Address</p>
                            <p className="text-sm mt-1">{props.selectedEntity.attributes.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="glass rounded-xl p-4 border border-primary/10">
                    <h3 className="text-lg font-semibold mb-3">Timestamps</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-sm">Last Changed</p>
                        <p className="text-sm mt-1">
                          {new Date(props.selectedEntity.last_changed).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Last Updated</p>
                        <p className="text-sm mt-1">
                          {new Date(props.selectedEntity.last_updated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {Object.keys(props.selectedEntity.attributes).length > 0 && (
                    <div className="glass rounded-xl p-4 border border-primary/10">
                      <h3 className="text-lg font-semibold mb-3">Attributes</h3>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {Object.entries(props.selectedEntity.attributes)
                          .filter(([key]) => !['latitude', 'longitude', 'friendly_name', 'address'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
                              <span className="text-sm font-medium text-muted-foreground">{key}</span>
                              <span className="text-sm text-right break-all max-w-[60%]">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Loading state for sheet
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading details...</p>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
        
        {/* Add context menu */}
        <ContextMenu />
        
        {/* Add draggable route points */}
        {Marker && props.routePoints.map((point) => (
          <Marker 
            key={point.id}
            position={point.position}
            draggable={true}
            eventHandlers={{
              dragend: (e: any) => {
                // Update route point position when dragged
                const newPosition: [number, number] = [e.target._latlng.lat, e.target._latlng.lng];
                props.setRoutePoints(
                  props.routePoints.map(p => 
                    p.id === point.id 
                      ? { ...p, position: newPosition } 
                      : p
                  )
                );
                
                // Recalculate route if we have at least 2 points
                if (props.routePoints.length >= 2) {
                  // In a real implementation, you would call the routing API here
                  console.log('Route recalculated after dragging point');
                }
              }
            }}
            icon={new L.Icon({
              iconUrl: point.type === 'start' 
                ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
                : point.type === 'end'
                ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
                : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="font-semibold">
                {point.type === 'start' ? 'Start' : point.type === 'end' ? 'End' : 'Waypoint'}
              </div>
              <div className="text-sm">
                {point.position[0].toFixed(6)}, {point.position[1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        ))}
        
        
        {/* Add custom markers */}
        <CustomMarkers />
      </MapContainer>
    </div>
  );

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      {/* Google Maps Style Layout */}
      <div className="flex-1 flex flex-col h-full relative">
        <MapComponent 
          isLocating={props.isLocating} 
          setIsLocating={props.setIsLocating} 
          mapRef={props.mapRef} 
          getCurrentLocation={props.getCurrentLocation}
          error={props.error}
          setError={props.setError}
          markerPosition={props.markerPosition}
          mapCenter={props.mapCenter}
          searchQuery={props.searchQuery}
          setSearchQuery={props.  setSearchQuery}
          searchHistory={props.searchHistory}
          setSearchHistory={props.setSearchHistory}
          autocompleteResults={props.autocompleteResults}
          setAutocompleteResults={props.setAutocompleteResults}
          showAutocomplete={props.showAutocomplete}
          setShowAutocomplete={props.setShowAutocomplete}
          handleSearchQueryChange={props.handleSearchQueryChange}
          handleSearch={props.handleSearch}
          selectedEntity={props.selectedEntity}
          setSelectedEntity={props.setSelectedEntity}
          isEntitySheetOpen={props.isEntitySheetOpen}
          setIsEntitySheetOpen={props.setIsEntitySheetOpen}
          mapLayer={props.mapLayer}
          setMapLayer={props.setMapLayer}
          zoomLevel={props.zoomLevel}
          setZoomLevel={props.setZoomLevel}
          filteredEntities={props.filteredEntities}
          toggleEntityFilter={props.toggleEntityFilter}
          isDarkMode={props.isDarkMode}
          setIsDarkMode={props.setIsDarkMode}
          // Directions props
          fromLocation={props.fromLocation}
          setFromLocation={props.setFromLocation}
          toLocation={props.toLocation}
          setToLocation={props.setToLocation}
          transportMode={props.transportMode}
          setTransportMode={props.setTransportMode}
          routeData={props.routeData}
          setRouteData={props.setRouteData}
          isDirectionsOpen={props.isDirectionsOpen}
          setIsDirectionsOpen={props.setIsDirectionsOpen}
          isGettingDirections={props.isGettingDirections}
          setIsGettingDirections={props.setIsGettingDirections}
          handleGetDirections={props.handleSearch}
          // Google Maps features
          showTraffic={props.showTraffic}
          setShowTraffic={props.setShowTraffic}
          showTransit={props.showTransit}
          setShowTransit={props.setShowTransit}
          showWeather={props.showWeather}
          setShowWeather={props.setShowWeather}
          favorites={props.favorites}
          setFavorites={props.setFavorites}
          isSidebarCollapsed={props.isSidebarCollapsed}
          setIsSidebarCollapsed={props.setIsSidebarCollapsed}
          toggleFavorite={(location: string) => {
            props.setFavorites((prev: string[]) => {
              prev.includes(location) 
                ? prev.filter(fav => fav !== location) 
                : [...prev, location]
            });
          }}
          // Navigation features
          isNavigating={props.isNavigating}
          setIsNavigating={props.setIsNavigating}
          currentStep={props.currentStep}
          setCurrentStep={props.setCurrentStep}
          userPosition={props.userPosition}
          setUserPosition={props.setUserPosition}
          nextTurn={props.nextTurn}
          setNextTurn={props.setNextTurn}
          distanceToNextTurn={props.distanceToNextTurn}
          setDistanceToNextTurn={props.setDistanceToNextTurn}
          eta={props.eta}
          setEta={props.setEta}
          startNavigation={() => props.setIsNavigating(true)}
          stopNavigation={() => props.setIsNavigating(false)}
          // Smart interactions
          contextMenu={props.contextMenu}
          setContextMenu={props.setContextMenu}
          routePoints={props.routePoints}
          setRoutePoints={props.setRoutePoints}
          setMarkerPosition={props.setMarkerPosition}
          // User personalization
          customMarkers={props.customMarkers}
          setCustomMarkers={props.setCustomMarkers}
          weatherData={weatherData}
          isWeatherLoading={isWeatherLoading}
          fetchWeatherData={fetchWeatherData}
        />
      </div>
    </div>
  );
};


export default MapManagement;