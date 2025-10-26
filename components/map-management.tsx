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


// Define types for Home Assistant entities
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

// Map layer types
type MapLayer = 'street' | 'satellite' | 'terrain';

export default function MapManagement() {
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
  const [selectedEntity, setSelectedEntity] = useState<EntityState | null>(null);
  const [isEntitySheetOpen, setIsEntitySheetOpen] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayer>('street');
  const [zoomLevel, setZoomLevel] = useState(13);
  const [filteredEntities, setFilteredEntities] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
  
  // Search functionality with autocomplete
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      // Add to search history
      if (!searchHistory.includes(searchQuery)) {
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
      
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
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 rounded-none relative">
        <CardContent className="p-0 h-full">
          <div className="h-full w-full">
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
            />
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}

// Client-side only map component
const MapComponent = (props: {
  isLocating: boolean, 
  setIsLocating: (value: boolean) => void, 
  mapRef: React.MutableRefObject<any>, 
  getCurrentLocation: () => void, 
  error: string | null, 
  setError: (error: string | null) => void,
  markerPosition: [number, number] | null,
  mapCenter: [number, number],
  searchQuery: string,
  setSearchQuery: (query: string) => void,
  searchHistory: string[],
  setSearchHistory: (history: string[]) => void,
  handleSearch: (e: React.FormEvent) => void,
  selectedEntity: EntityState | null,
  setSelectedEntity: (entity: EntityState | null) => void,
  isEntitySheetOpen: boolean,
  setIsEntitySheetOpen: (open: boolean) => void,
  mapLayer: MapLayer,
  setMapLayer: (layer: MapLayer) => void,
  zoomLevel: number,
  setZoomLevel: (zoom: number) => void,
  filteredEntities: string[],
  toggleEntityFilter: (entityType: string) => void,
  isDarkMode: boolean,
  setIsDarkMode: (isDark: boolean) => void
}) => {
  const [MapContainer, setMapContainer] = useState<any>(null);
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
  
  // Function to get user location icon (profile marker or home icon) with modern design
  const getUserLocationIcon = (state?: string) => {
    if (!L) return null;
    
    // If state is "home", show home icon
    if (state === "home") {
      return new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/844/844754.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    }
    
    // Modern user location icon with glowing effect
    // Create a custom SVG icon for the user location
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

  // Custom component to handle map events
  const MapEventHandler = () => {
    const map = useMapEvents({
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
    
    return (
      <>
        {/* Top Controls - Compact Header */}
        <div className="leaflet-top leaflet-left w-full">
          <div className="leaflet-control w-full px-4 py-3">
            <div className="flex items-center justify-between gap-3 sm:gap-2">
              {/* Search Bar with Frosted Glass Effect and Autocomplete */}
              <div className="flex-1 max-w-2xl relative md:max-w-xl sm:max-w-md">
                <form onSubmit={props.handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <Input
                    type="text"
                    placeholder="Search for places..."
                    value={props.searchQuery}
                    onChange={(e) => props.setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-2 w-full glass rounded-full border-0 shadow-lg backdrop-blur-md bg-white/20 dark:bg-black/20 focus:bg-white/30 dark:focus:bg-black/30 transition-all duration-300 ease-in-out placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  {props.searchQuery && (
                    <button
                      type="button"
                      onClick={() => props.setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>
                
                {/* Search History Dropdown */}
                {props.searchQuery.length === 0 && props.searchHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass z-20 max-h-60 overflow-y-auto custom-scrollbar rounded-xl">
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between items-center">
                        <span>Recent Searches</span>
                        <button 
                          onClick={() => props.setSearchHistory([])}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                        >
                          Clear All
                        </button>
                      </div>
                      {props.searchHistory.map((query, index) => (
                        <div key={index} className="flex items-center justify-between px-4 py-2 hover:bg-white/50 dark:hover:bg-black/50 transition-colors duration-200 rounded-lg mx-2">
                          <button
                            type="button"
                            onClick={() => {
                              props.setSearchQuery(query);
                              // Submit the search
                              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                              props.handleSearch(fakeEvent);
                            }}
                            className="flex-1 text-left flex items-center gap-3 py-1"
                          >
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{query}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newHistory = [...props.searchHistory];
                              newHistory.splice(index, 1);
                              props.setSearchHistory(newHistory);
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Autocomplete Suggestions */}
                {props.searchQuery.length > 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass z-20 max-h-60 overflow-y-auto custom-scrollbar rounded-xl">
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Search Suggestions
                      </div>
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Showing results for "{props.searchQuery}"
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black glass rounded-full h-10 w-10 p-0 transition-all shadow-lg backdrop-blur-md md:flex hidden hover:shadow-xl duration-300 ease-in-out"
                aria-label="Toggle theme"
              >
                {props.isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Controls - Vertical Toolbar (Responsive) */}
        <div className="leaflet-top leaflet-right mt-24 md:mt-24 sm:mt-20">
          <div className="leaflet-control flex flex-col gap-2 p-2 bg-white/30 dark:bg-black/30 glass rounded-2xl shadow-xl backdrop-blur-md border border-white/20 dark:border-black/20">
            {/* Location Button */}
            <button 
              type="button" 
              onClick={props.getCurrentLocation}
              disabled={props.isLocating}
              className="flex items-center justify-center gap-2 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-gray-200 shadow-lg rounded-xl h-14 w-14 p-0 transition-all hover:shadow-xl hover:scale-110 backdrop-blur-sm md:h-14 md:w-14 sm:h-12 sm:w-12 duration-300 ease-in-out border border-white/30 dark:border-black/30"
              aria-label="My Location"
            >
              <Locate className={`w-6 h-6 ${props.isLocating ? 'animate-spin' : ''} md:w-6 md:h-6 sm:w-5 sm:h-5`} />
            </button>
            
            {/* Zoom Controls */}
            <div className="flex flex-col bg-white/90 dark:bg-black/90 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm border border-white/30 dark:border-black/30">
              <button 
                type="button" 
                onClick={handleZoomIn}
                className="flex items-center justify-center h-12 w-14 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 md:h-12 md:w-14 sm:h-10 sm:w-12"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5 md:w-5 md:h-5 sm:w-4 sm:h-4" />
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <button 
                type="button" 
                onClick={handleZoomOut}
                className="flex items-center justify-center h-12 w-14 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 md:h-12 md:w-14 sm:h-10 sm:w-12"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5 md:w-5 md:h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
            
            {/* Layer Selector */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white/90 dark:bg-black/90 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-black/30">
                    <Select value={props.mapLayer} onValueChange={(value: MapLayer) => props.setMapLayer(value)}>
                      <SelectTrigger className="h-14 w-14 p-0 border-0 bg-transparent md:h-14 md:w-14 sm:h-12 sm:w-12 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                        {props.mapLayer === 'street' && <MapIcon className="w-6 h-6 mx-auto md:w-6 md:h-6 sm:w-5 sm:h-5" />}
                        {props.mapLayer === 'satellite' && <Satellite className="w-6 h-6 mx-auto md:w-6 md:h-6 sm:w-5 sm:h-5" />}
                        {props.mapLayer === 'terrain' && <Layers className="w-6 h-6 mx-auto md:w-6 md:h-6 sm:w-5 sm:h-5" />}
                      </SelectTrigger>
                      <SelectContent className="glass rounded-xl backdrop-blur-md border border-white/20 dark:border-black/20">
                        <SelectItem value="street">
                          <div className="flex items-center gap-2">
                            <MapIcon className="w-4 h-4" />
                            Street Map
                          </div>
                        </SelectItem>
                        <SelectItem value="satellite">
                          <div className="flex items-center gap-2">
                            <Satellite className="w-4 h-4" />
                            Satellite
                          </div>
                        </SelectItem>
                        <SelectItem value="terrain">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Terrain
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="glass rounded-lg backdrop-blur-md border border-white/20 dark:border-black/20">
                  <p>Map Layers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Filter Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white/90 dark:bg-black/90 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-black/30">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-14 w-14 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 md:h-14 md:w-14 sm:h-12 sm:w-12 transition-colors duration-200"
                      onClick={() => props.toggleEntityFilter("person")}
                    >
                      <Filter className="w-6 h-6 md:w-6 md:h-6 sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="glass rounded-lg backdrop-blur-md border border-white/20 dark:border-black/20">
                  <p>Filter Entities</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Mobile Controls - Horizontal Toolbar */}
        <div className="leaflet-bottom leaflet-center mb-4 md:hidden">
          <div className="leaflet-control flex gap-2 p-2 bg-white/30 dark:bg-black/30 glass rounded-2xl shadow-xl backdrop-blur-md border border-white/20 dark:border-black/20">
            {/* Location Button */}
            <button 
              type="button" 
              onClick={props.getCurrentLocation}
              disabled={props.isLocating}
              className="flex items-center justify-center gap-2 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-gray-200 shadow-lg rounded-xl h-12 w-12 p-0 transition-all hover:shadow-xl hover:scale-110 backdrop-blur-sm duration-300 ease-in-out border border-white/30 dark:border-black/30"
              aria-label="My Location"
            >
              <Locate className={`w-5 h-5 ${props.isLocating ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Zoom Controls */}
            <div className="flex bg-white/90 dark:bg-black/90 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm border border-white/30 dark:border-black/30">
              <button 
                type="button" 
                onClick={handleZoomIn}
                className="flex items-center justify-center h-12 w-12 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="border-l border-gray-200 dark:border-gray-700" />
              <button 
                type="button" 
                onClick={handleZoomOut}
                className="flex items-center justify-center h-12 w-12 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>
            
            {/* Layer Selector */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white/90 dark:bg-black/90 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-black/30">
                    <Select value={props.mapLayer} onValueChange={(value: MapLayer) => props.setMapLayer(value)}>
                      <SelectTrigger className="h-12 w-12 p-0 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                        {props.mapLayer === 'street' && <MapIcon className="w-5 h-5 mx-auto" />}
                        {props.mapLayer === 'satellite' && <Satellite className="w-5 h-5 mx-auto" />}
                        {props.mapLayer === 'terrain' && <Layers className="w-5 h-5 mx-auto" />}
                      </SelectTrigger>
                      <SelectContent className="glass rounded-xl backdrop-blur-md border border-white/20 dark:border-black/20">
                        <SelectItem value="street">
                          <div className="flex items-center gap-2">
                            <MapIcon className="w-4 h-4" />
                            Street Map
                          </div>
                        </SelectItem>
                        <SelectItem value="satellite">
                          <div className="flex items-center gap-2">
                            <Satellite className="w-4 h-4" />
                            Satellite
                          </div>
                        </SelectItem>
                        <SelectItem value="terrain">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Terrain
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="glass rounded-lg backdrop-blur-md border border-white/20 dark:border-black/20">
                  <p>Map Layers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        
        {/* Map Info Footer - Combined Zoom and Scale */}
        <div className="leaflet-bottom leaflet-right mb-4 mr-4">
          <div className="leaflet-control bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 text-sm font-medium border border-white/20 dark:border-black/20 flex gap-4">
            <span>Zoom: {props.zoomLevel}</span>
            <span>Scale: 1:{Math.round(156543.03 * Math.cos(props.mapCenter[0] * Math.PI / 180) / Math.pow(2, props.zoomLevel))}</span>
          </div>
        </div>
      </>
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
      </MapContainer>
    </div>
  );
};