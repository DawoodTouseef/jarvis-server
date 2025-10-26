"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
  Filter
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
  const [selectedEntity, setSelectedEntity] = useState<EntityState | null>(null);
  const [isEntitySheetOpen, setIsEntitySheetOpen] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayer>('street');
  const [zoomLevel, setZoomLevel] = useState(13);
  const [filteredEntities, setFilteredEntities] = useState<string[]>([]);
  
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
                
                // Fly to user's location
                if (mapRef.current && mapRef.current.setView) {
                  mapRef.current.setView(currentPosition, 16);
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
  
  // Search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // In a real implementation, this would call a geocoding API
    // For now, we'll just show an example
    setError(`Search functionality would look for "${searchQuery}"`);
    setTimeout(() => setError(null), 3000);
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
  toggleEntityFilter: (entityType: string) => void
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
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, [map]);
    
    return null;
  };

  // Custom component to handle map events
  const MapEventHandler = () => {
    const map = useMapEvents({
      zoomend: () => {
        if (map) {
          props.setZoomLevel(map.getZoom());
        }
      }
    });
    
    useEffect(() => {
      if (map) {
        setMapInstance(map);
        props.mapRef.current = map;
      }
    }, [map]);
    
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
    
    return (
      <>
        {/* Top Controls */}
        <div className="leaflet-top leaflet-left">
          <div className="leaflet-control flex flex-col gap-2">
            {/* Zoom Controls */}
            <div className="flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
              <button 
                type="button" 
                onClick={handleZoomIn}
                className="flex items-center justify-center h-10 w-10 hover:bg-gray-100 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="border-t border-gray-200" />
              <button 
                type="button" 
                onClick={handleZoomOut}
                className="flex items-center justify-center h-10 w-10 hover:bg-gray-100 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>
            
            {/* Layer Selector */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white rounded-lg shadow-lg">
                    <Select value={props.mapLayer} onValueChange={(value: MapLayer) => props.setMapLayer(value)}>
                      <SelectTrigger className="h-10 w-10 p-0 border-0">
                        {props.mapLayer === 'street' && <MapIcon className="w-5 h-5 mx-auto" />}
                        {props.mapLayer === 'satellite' && <Satellite className="w-5 h-5 mx-auto" />}
                        {props.mapLayer === 'terrain' && <Layers className="w-5 h-5 mx-auto" />}
                      </SelectTrigger>
                      <SelectContent>
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
                <TooltipContent>
                  <p>Map Layers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Right Controls */}
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control flex flex-col gap-2">
            {/* Location Button */}
            <button 
              type="button" 
              onClick={props.getCurrentLocation}
              disabled={props.isLocating}
              className="flex items-center justify-center gap-2 bg-white/90 hover:bg-white text-gray-800 shadow-lg rounded-full h-12 w-12 p-0 transition-all hover:shadow-xl"
              aria-label="My Location"
            >
              <Locate className={`w-5 h-5 ${props.isLocating ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Filter Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-white rounded-lg shadow-lg">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-10 w-10 p-0"
                      onClick={() => props.toggleEntityFilter("person")}
                    >
                      <Filter className="w-5 h-5" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter Entities</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="leaflet-top leaflet-center">
          <div className="leaflet-control w-full max-w-md">
            <form onSubmit={props.handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search for places..."
                  value={props.searchQuery}
                  onChange={(e) => props.setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
              <Button type="submit" size="icon" className="h-10 w-10">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
        
        {/* Error Toast */}
        {props.error && (
          <div className="leaflet-top leaflet-center">
            <div className="leaflet-control">
              <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-md shadow-lg max-w-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{props.error}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Zoom Level Indicator */}
        <div className="leaflet-bottom leaflet-right">
          <div className="leaflet-control bg-white/80 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1 text-sm">
            Zoom: {props.zoomLevel}
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

  // Function to get icon based on entity state
  const getEntityIcon = (entity: EntityState) => {
    if (!L) return null;
    
    let iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png";
    
    if (entity.state === "on" || entity.state === "home") {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png";
    } else if (entity.state === "off" || entity.state === "not_home") {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
    }
    else if (entity.state === "closed" || entity.state === "locked") {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png";
    }

    return new L.Icon({
      iconUrl,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png" ,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Function to get user location icon (profile marker or home icon)
  const getUserLocationIcon = (state?: string) => {
    if (!L) return null;
    
    // If state is "home", show home icon
    if (state === "home") {
      return new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/844/844754.png", // Home icon
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    }
    
    // Otherwise show user profile marker
    return new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Get appropriate tile layer URL based on selected layer
  const getTileLayerUrl = () => {
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
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map components...</p>
        </div>
      </div>
    );
  }
  
  // Find user entity (person.*) to determine if state is "home"
  const userEntity = entities.find(entity => entity.entity_id.startsWith("person."));
  const userState = userEntity ? userEntity.state : undefined;
  
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
  
  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      <MapContainer
        center={props.mapCenter}
        zoom={props.zoomLevel}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full"
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
            <Popup>
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
        
        {Object.entries(filteredDeviceLocations).map(([entityId, position]) => {
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
              <Popup>
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
        })}
        {/* Entity Detail Sheet */}
      <Sheet open={props.isEntitySheetOpen} onOpenChange={props.setIsEntitySheetOpen}> 
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          {props.selectedEntity && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {props.selectedEntity.entity_id.startsWith("person.") ? (
                    <Home className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                  {props.selectedEntity.attributes.friendly_name || props.selectedEntity.entity_id}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Entity Information</h3>
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
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Location</h3>
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
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Timestamps</h3>
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
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Attributes</h3>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                      {Object.entries(props.selectedEntity.attributes)
                        .filter(([key]) => !['latitude', 'longitude', 'friendly_name', 'address'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between items-start py-1 border-b">
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
          )}
        </SheetContent>
      </Sheet>
      </MapContainer>
    </div>
  );
};