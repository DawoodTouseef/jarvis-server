"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { apiClient } from "@/lib/api";

interface User {
  token: string;
  token_type: string;
  expires_at: string | null;
  id: string;
  email: string;
  name: string;
  role: string;
  profile_image_url: string;
  permissions: string[];
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  altitude?: number;
  speed?: number;
}

export function LocationTracker() {
  const socketRef = useRef<Socket | null>(null);
  const locationTrackingRef = useRef<NodeJS.Timeout | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current user information
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiClient.getSessionUser();
        if (response.success && response.data) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Connect to WebSocket
  const connectToWebSocket = () => {
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Get token from localStorage
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      console.error("No auth token found");
      return;
    }

    // Get the base URL from the API client
    const baseUrl = apiClient.getBaseUrl();
    
    // Create new Socket.IO connection
    const socket = io(baseUrl, {
      path: "/ws",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // 10 second timeout
      auth: {
        token: token
      }
    });

    socket.on("connect", () => {
      console.log("Connected to location tracking Socket.IO");
    });

    socket.on("connect_error", (err) => {
      console.error("Location tracking Socket.IO connection error:", err);
      setLocationError("Connection error: " + err.message);
    });

    socket.on("error", (err) => {
      console.error("Location tracking Socket.IO error:", err);
      setLocationError("Socket error: " + (err as Error).message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Location tracking Socket.IO connection closed:", reason);
      if (reason === "io server disconnect") {
        // The disconnection was initiated by the server, you need to reconnect manually
        setTimeout(() => {
          if (socketRef.current === socket) {
            socket.connect();
          }
        }, 1000);
      }
    });

    socketRef.current = socket;
  };

  // Get current location with enhanced information
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          if (position.coords.accuracy !== null) {
            locationData.accuracy = position.coords.accuracy;
          }
          
          if (position.coords.altitude !== null) {
            locationData.altitude = position.coords.altitude;
          }
          
          if (position.coords.speed !== null) {
            locationData.speed = position.coords.speed;
          }

          resolve(locationData);
        },
        (error) => {
          let errorMessage = "Unable to retrieve your location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Reverse geocode to get address using OpenStreetMap Nominatim
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      // Use OpenStreetMap Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'JARVIS-App/1.0' // Required by Nominatim terms
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      } else {
        // Fallback to coordinates if no address found
        return `Approximate location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (error) {
      console.error("Error getting address from coordinates:", error);
      // Fallback to coordinates if geocoding fails
      return `Approximate location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Send location to backend via WebSocket
  const sendLocationToBackend = async (locationData: LocationData) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error("WebSocket is not connected");
      setLocationError("Not connected to server");
      return;
    }

    if (!currentUser) {
      console.error("No current user found");
      setLocationError("User not authenticated");
      return;
    }

    try {
      // Get address from coordinates
      const address = await getAddressFromCoordinates(
        locationData.latitude, 
        locationData.longitude
      );

      const locationPayload = {
        id: currentUser.id,
        name: currentUser.name,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: address,
        accuracy: locationData.accuracy,
        altitude: locationData.altitude,
        speed: locationData.speed,
        timestamp: Date.now()
      };

      socketRef.current.emit("get_location", locationPayload);
      console.log("Location sent to backend:", locationPayload);
      setLastLocation(locationData);
      setLocationError(null);
    } catch (error: any) {
      console.error("Error sending location to backend:", error);
      setLocationError("Failed to send location: " + error.message);
    }
  };

  // Start location tracking
  const startLocationTracking = () => {
    if (isTracking) return;
    
    setIsTracking(true);
    setLocationError(null);
    
    // Send location immediately
    getCurrentLocation()
      .then(sendLocationToBackend)
      .catch((error) => {
        console.error("Error getting initial location:", error);
        setLocationError(error.message);
      });

    // Set up periodic location updates (every 5 minutes)
    locationTrackingRef.current = setInterval(async () => {
      try {
        const locationData = await getCurrentLocation();
        await sendLocationToBackend(locationData);
      } catch (error: any) {
        console.error("Error getting location:", error);
        setLocationError(error.message);
        // Don't stop tracking on error, just continue trying
      }
    }, 300000); // 5 minutes
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    setIsTracking(false);
    
    if (locationTrackingRef.current) {
      clearInterval(locationTrackingRef.current);
      locationTrackingRef.current = null;
    }
  };

  // Initialize when user is authenticated
  useEffect(() => {
    if (currentUser) {
      // Check if geolocation is available before starting
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        connectToWebSocket();
        startLocationTracking();
      } else {
        console.warn("Geolocation is not available in this environment");
        setLocationError("Geolocation is not supported by this browser");
      }
    }

    return () => {
      stopLocationTracking();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser]);

  // Render nothing - this is a background component
  return null;
}