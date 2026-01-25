"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Lock, Mail, User, Sparkles, AlertCircle, Eye, EyeOff, MapPin, Phone, Calendar, Navigation, Search } from "lucide-react"
import { apiClient } from "@/lib/api"

// Dynamically import Leaflet components with SSR disabled
import dynamic from 'next/dynamic'

// Define types for our location data
interface LocationData {
  lat: number
  lon: number
  display_name: string
}

// Dynamically import Map components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Custom component to handle map events
const MapClickHandler = dynamic(
  () => Promise.resolve(({ onClick }: { onClick: (e: any) => void }) => {
    // @ts-ignore
    const useMapEvents = require('react-leaflet').useMapEvents
    const map = useMapEvents({
      click: onClick,
    })
    return null
  }),
  { ssr: false }
)

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Additional Info, 3: Location
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    dateOfBirth: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isTermsAccepted, setIsTermsAccepted] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<LocationData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]) // Default to London
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false) 
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [hasExistingUsers, setHasExistingUsers] = useState<boolean | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<any>(null)

  // Check if there are existing users
  useEffect(() => {
    const checkExistingUsers = async () => {
      try {
        const response = await apiClient.hasUsers();
        if (response.success && response.data) {
          setHasExistingUsers(response.data.has_users);
        }
      } catch (err) {
        setHasExistingUsers(true);
      }
    };
    
    checkExistingUsers();
  }, []);

  // Dynamically load Leaflet CSS files on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if the CSS files are already loaded to avoid duplicates
      const isLeafletCssLoaded = document.querySelector('link[href*="leaflet.css"]');
      const isCompatibilityCssLoaded = document.querySelector('link[href*="leaflet-defaulticon-compatibility.css"]');
      
      // Load Leaflet CSS if not already loaded
      if (!isLeafletCssLoaded) {
        const leafletCss = document.createElement('link');
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCss);
      }
      
      // Load Leaflet compatibility CSS if not already loaded
      if (!isCompatibilityCssLoaded) {
        const compatibilityCss = document.createElement('link');
        compatibilityCss.rel = 'stylesheet';
        compatibilityCss.href = 'https://cdn.jsdelivr.net/npm/leaflet-defaulticon-compatibility@0.1.2/dist/leaflet-defaulticon-compatibility.css';
        document.head.appendChild(compatibilityCss);
      }
    }
  }, []);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check password strength
  useEffect(() => {
    if (formData.password) {
      let strength = 0
      if (formData.password.length >= 8) strength += 1
      if (/[A-Z]/.test(formData.password)) strength += 1
      if (/[0-9]/.test(formData.password)) strength += 1
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(0)
    }
  }, [formData.password])

  // Handle location search with debounce
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        setIsSearching(true)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        )
        const data = await response.json()
        
        // Convert string lat/lon to numbers
        const processedData = data.map((item: any) => ({
          ...item,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }))
        
        setSearchResults(processedData)
      } catch (err) {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [searchQuery])

  // Try to get user's current location on mount
  useEffect(() => {
    if (step === 3 && hasExistingUsers === false && isClient) {
      // Small delay to ensure map is loaded
      const timer = setTimeout(() => {
        getCurrentLocation()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [step, hasExistingUsers, isClient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error state
    setError(null)
    
    // For the first user (admin), show all 3 steps
    // For subsequent users, only show 2 steps
    const totalSteps = hasExistingUsers === false ? 3 : 2;
    
    if (step < totalSteps) {
      // Validate current step before moving to next
      if (step === 1) {
        if (!formData.name.trim()) {
          setError("Name is required")
          return
        }
        
        if (!formData.email.trim()) {
          setError("Email is required")
          return
        }
        
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
          setError("Email is invalid")
          return
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match")
          return
        }
        
        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters long")
          return
        }
        
        if (!isTermsAccepted) {
          setError("Please accept the terms and conditions")
          return
        }
      } else if (step === 2) {
        if (!formData.mobile.trim()) {
          setError("Mobile number is required")
          return
        }
        
        if (!formData.dateOfBirth) {
          setError("Date of birth is required")
          return
        }
      }
      
      setStep(step + 1)
      return
    }
    
    // Final step - submit registration
    // For admin users (first user), location is required
    // For non-admin users, we can submit without location
    if (hasExistingUsers === false && !selectedLocation) {
      setError("Please select a location")
      return
    }
    
    setIsLoading(true)

    try {
      const signupData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        mobile: formData.mobile.trim(),
        date_of_birth: formData.dateOfBirth,
      }
      
      // Only include location for admin users (first user)
      if (hasExistingUsers === false && selectedLocation) {
        signupData.location = {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lon,
          address: selectedLocation.display_name
        }
      }
      let response
      if (!hasExistingUsers) {
        response = await apiClient.extendedSignup(signupData)
      }
      else {
        response = await apiClient.signup(signupData)
      }
      if (response.success && response.data) {
        // Store the auth token
        localStorage.setItem("authToken", response.data.token)
        router.push("/dashboard")
      } else {
        setError(response.error || "Failed to create account")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location)
    setSearchQuery("")
    setSearchResults([])
    
    // Update map center and marker position
    const position: [number, number] = [location.lat, location.lon]
    setMapCenter(position)
    setMarkerPosition(position)
    
    // Fly to the selected location
    if (mapRef.current && mapRef.current.flyTo) {
      mapRef.current.flyTo(position, 15, {
        animate: true,
        duration: 1.5
      })
    }
  }

  // Function to handle map click and update marker position
  const handleMapClick = (e: any) => {
    const lat = e.latlng.lat
    const lon = e.latlng.lng
    const position: [number, number] = [lat, lon]
    setMarkerPosition(position)
    
    // Reverse geocode to get address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(response => response.json())
      .then(data => {
        setSelectedLocation({
          lat: lat,
          lon: lon,
          display_name: data.display_name || `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`
        })
      })
      .catch(err => {
        setSelectedLocation({
          lat: lat,
          lon: lon,
          display_name: `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`
        })
      })
  }

  // Function to get user's current location
  const getCurrentLocation = () => {
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
    setError(null);

    // Try geolocation with different options as fallbacks
    const tryGeolocation = (options: PositionOptions, attempt: number) => {
      // Additional safety check
      if (!navigator || !navigator.geolocation) {
        setIsLocating(false);
        setError("Geolocation is not supported by your browser or is disabled");
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const currentPosition: [number, number] = [latitude, longitude];
          
          // Update map center and marker position
          setMapCenter(currentPosition);
          setMarkerPosition(currentPosition);
          
          // Fly to user's location
          if (mapRef.current && mapRef.current.flyTo) {
            mapRef.current.flyTo(currentPosition, 15, {
              animate: true,
              duration: 1.5
            });
          }
          
          // Reverse geocode to get address
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              setSelectedLocation({
                lat: latitude,
                lon: longitude,
                display_name: data.display_name || `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`
              });
            })
            .catch(err => {
              setSelectedLocation({
                lat: latitude,
                lon: longitude,
                display_name: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`
              });
            })
            .finally(() => {
              setIsLocating(false);
            });
        },
        (error) => {
  
          if (attempt === 1) {
            tryGeolocation({
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 
            }, 2);
            return;
          }
          
          if (attempt === 2) {
            tryGeolocation({
              enableHighAccuracy: false,
              timeout: 20000,
              maximumAge: 600000 // 10 minutes
            }, 3);
            return;
          }
          
          setIsLocating(false);
          let errorMessage = "Unable to retrieve your location. Please try searching instead.";
          

          if (error && typeof error === 'object') {
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
    };

    // Start with the most relaxed options based on best practices for reliability
    tryGeolocation({
      enableHighAccuracy: false,  // Disable for better reliability
      timeout: 15000,             // Increase timeout to 15 seconds
      maximumAge: 600000          // Accept cached locations up to 10 minutes old
    }, 1);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200"
    if (passwordStrength <= 1) return "bg-red-500"
    if (passwordStrength <= 2) return "bg-orange-500"
    if (passwordStrength <= 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return ""
    if (passwordStrength <= 1) return "Weak"
    if (passwordStrength <= 2) return "Fair"
    if (passwordStrength <= 3) return "Good"
    return "Strong"
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const getTotalSteps = () => {
    return hasExistingUsers === false ? 3 : 2;
  }

  if (hasExistingUsers === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="w-full max-w-md relative z-10">
          <Card className="glass-strong border-primary/20 p-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-primary/30 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-primary">Registration</span>
                </div>
                <h1 className="text-3xl font-bold neon-text">Create Account</h1>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card className="glass-strong border-primary/20 p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-primary/30 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-primary">Registration</span>
              </div>
              <h1 className="text-3xl font-bold neon-text">Create Account</h1>
              <p className="text-sm text-muted-foreground">Step {step} of {getTotalSteps()}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(step / getTotalSteps()) * 100}%` }}
              ></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/20 border border-destructive/30 rounded-md text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10 glass border-primary/20 focus:border-primary/50"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 glass border-primary/20 focus:border-primary/50"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10 glass border-primary/20 focus:border-primary/50"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Password Strength</span>
                          <span className={`${getPasswordStrengthColor().replace('bg-', 'text-')} font-medium`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full ${
                                level <= passwordStrength
                                  ? getPasswordStrengthColor()
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Password should contain:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li className={formData.password.length >= 8 ? "text-green-500" : ""}>
                              At least 8 characters
                            </li>
                            <li className={/[A-Z]/.test(formData.password) ? "text-green-500" : ""}>
                              One uppercase letter
                            </li>
                            <li className={/[0-9]/.test(formData.password) ? "text-green-500" : ""}>
                              One number
                            </li>
                            <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-500" : ""}>
                              One special character
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10 glass border-primary/20 focus:border-primary/50"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded border-primary/30" 
                      checked={isTermsAccepted}
                      onChange={(e) => setIsTermsAccepted(e.target.checked)}
                      required 
                      disabled={isLoading}
                    />
                    <span className="text-muted-foreground">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:text-primary/80">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:text-primary/80">
                        Privacy Policy
                      </Link>
                    </span>
                  </div>
                </div>
              )}

              {/* Step 2: Additional Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium">
                      Mobile Number (with country code)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        placeholder="+1 123 456 7890"
                        value={formData.mobile}
                        onChange={handleChange}
                        className="pl-10 glass border-primary/20 focus:border-primary/50"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                      Date of Birth
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="pl-10 glass border-primary/20 focus:border-primary/50"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Location Selection - Only shown for the first user (admin) */}
              {step === 3 && hasExistingUsers === false && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="locationSearch" className="text-sm font-medium">
                      Search for your location
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="locationSearch"
                        type="text"
                        placeholder="Search for a city, address, or landmark..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10 pr-10 glass border-primary/20 focus:border-primary/50"
                        disabled={isLoading}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    {isSearching && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Searching...
                      </div>
                    )}
                    
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-60 overflow-y-auto border rounded-md bg-background">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="p-3 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                            onClick={() => handleLocationSelect(result)}
                          >
                            <div className="font-medium">{result.display_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Lat: {result.lat.toFixed(4)}, Lon: {result.lon.toFixed(4)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Current Location Button */}
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      onClick={getCurrentLocation}
                      disabled={isLocating || isLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      {isLocating ? (
                        <>
                          <span className="animate-spin mr-2">◐</span>
                          Locating...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4 mr-2" />
                          Use Current Location
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {selectedLocation && (
                    <div className="p-4 bg-muted rounded-md">
                      <div className="font-medium mb-2">Selected Location:</div>
                      <div className="text-sm">{selectedLocation.display_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Lat: {selectedLocation.lat.toFixed(6)}, Lon: {selectedLocation.lon.toFixed(6)}
                      </div>
                    </div>
                  )}
                  
                  {/* Map Container */}
                  <div className="h-64 w-full rounded-lg overflow-hidden border relative">
                    {isClient ? (
                      <MapContainer 
                        center={mapCenter} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        ref={mapRef}
                        whenReady={() => setMapLoaded(true)}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <MapClickHandler onClick={handleMapClick} />
                        {markerPosition && (
                          <Marker position={markerPosition}>
                            <Popup>
                              {selectedLocation ? selectedLocation.display_name : 'Selected location'}
                            </Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    ) : (
                      <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">Loading map...</span>
                      </div>
                    )}
                    {!mapLoaded && isClient && (
                      <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">Loading map...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Click on the map to select a location, search for an address above, or use your current location.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(step - 1)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  className="flex-1 neon-glow" 
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : step < getTotalSteps() ? "Next" : "Create Account"}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Login link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </Card>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono">Secure Connection</span>
        </div>
      </div>
    </div>
  )
}