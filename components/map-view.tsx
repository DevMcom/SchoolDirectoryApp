"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { School, User, Users, MapPin, Plus, Trash2, Route, AlertTriangle } from "lucide-react"
import { useFavorites } from "@/contexts/favorites-context"
import dynamic from "next/dynamic"
import { LeafletSetup } from "@/components/leaflet-setup"
import { CustomMarker } from "@/components/custom-marker"
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  SCHOOLS,
  getFavoriteLocations,
  geocodeAddress,
  getRoute,
  optimizeRoute,
  type LocationData,
} from "@/lib/map-utils"

// Add these constants at the top of the file, after the imports
const CUSTOM_LOCATIONS_STORAGE_KEY = "school-directory-custom-locations"
const GEOCODE_CACHE_KEY = "school-directory-geocode-cache"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })

const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })

const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })

export function MapView() {
  const { favorites } = useFavorites()
  const [locations, setLocations] = useState<LocationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Remove these two lines:
  // const [showSchools, setShowSchools] = useState(true)
  // const [showFavorites, setShowFavorites] = useState(true)
  // Update the useState for customLocations to load from localStorage
  const [customLocations, setCustomLocations] = useState<LocationData[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedLocations = localStorage.getItem(CUSTOM_LOCATIONS_STORAGE_KEY)
        if (storedLocations) {
          return JSON.parse(storedLocations)
        }
      } catch (error) {
        console.error("Error loading custom locations:", error)
      }
    }
    return []
  })
  const [newAddress, setNewAddress] = useState("")
  const [newLocationName, setNewLocationName] = useState("")
  const [addingLocation, setAddingLocation] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [routeWaypoints, setRouteWaypoints] = useState<[number, number][]>([])
  const [routeGeometry, setRouteGeometry] = useState<any>(null)
  const [carpoolMode, setCarpoolMode] = useState(false)
  const [startLocation, setStartLocation] = useState<LocationData | null>(null)
  const [endLocation, setEndLocation] = useState<LocationData | null>(null)
  const [optimizingRoute, setOptimizingRoute] = useState(false)
  const mapRef = useRef<any>(null)
  // Add state for storing route addresses
  const [routeAddresses, setRouteAddresses] = useState<LocationData[]>([])
  // Add a state for geocoding errors
  const [geocodingErrors, setGeocodingErrors] = useState<string[]>([])

  // Load locations when favorites change
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true)
        setError(null)
        setGeocodingErrors([])

        // Make sure favorites.items is an array before processing
        const favoriteItems = favorites?.items || []

        // Get locations from favorites
        const favoriteLocations = await getFavoriteLocations(favoriteItems)

        // Check for geocoding errors
        const storedErrors = localStorage.getItem("geocoding-errors")
        if (storedErrors) {
          try {
            const errors = JSON.parse(storedErrors)
            if (errors.length > 0) {
              setGeocodingErrors(errors)
            }
          } catch (e) {
            console.error("Error parsing geocoding errors:", e)
          }
          // Clear the errors after reading them
          localStorage.removeItem("geocoding-errors")
        }

        // Combine with schools
        const allLocations = [...favoriteLocations]

        // Add schools as locations
        SCHOOLS.forEach((school) => {
          allLocations.push({
            ...school,
            type: "school",
          })
        })

        setLocations(allLocations)
      } catch (err) {
        console.error("Failed to load locations:", err)
        setError("Failed to load locations. Using fallback positions for all addresses.")

        // Even if there's an error, add the schools
        const fallbackLocations = SCHOOLS.map((school) => ({
          ...school,
          type: "school" as const,
        }))

        setLocations(fallbackLocations)
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [favorites?.items])

  // Add a useEffect to save customLocations to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CUSTOM_LOCATIONS_STORAGE_KEY, JSON.stringify(customLocations))
      } catch (error) {
        console.error("Error saving custom locations:", error)
      }
    }
  }, [customLocations])

  // Add a useEffect to load pre-geocoded data from a static file
  useEffect(() => {
    const loadPreGeocodedData = async () => {
      try {
        // Try to load pre-geocoded data from a static JSON file
        const response = await fetch("/data/geocoded-addresses.json")

        // If the file doesn't exist, this will fail silently
        if (response.ok) {
          const data = await response.json()
          console.log(`Loaded ${Object.keys(data).length} pre-geocoded addresses`)

          // Store the data in localStorage for faster access
          localStorage.setItem("pre-geocoded-data", JSON.stringify(data))
        }
      } catch (error) {
        // Silently fail if the file doesn't exist
        console.log("No pre-geocoded data file found")
      }
    }

    loadPreGeocodedData()
  }, [])

  // Add a custom location
  const handleAddLocation = async () => {
    if (!newAddress || !newLocationName) {
      setError("Please enter both a name and address for the new location.")
      return
    }

    setAddingLocation(true)
    setError(null)

    try {
      // Our updated geocodeAddress function will always return a position
      const position = await geocodeAddress(newAddress)

      // Check if this is likely a fallback position
      const isEstimated =
        !position ||
        (Math.abs(position[0] - DEFAULT_MAP_CENTER[0]) < 0.02 && Math.abs(position[1] - DEFAULT_MAP_CENTER[1]) < 0.02)

      const newLocation: LocationData = {
        id: `custom-${Date.now()}`,
        name: newLocationName,
        address: newAddress,
        position,
        icon: "custom",
        type: "custom",
        isEstimated,
      }

      setCustomLocations((prev) => [...prev, newLocation])
      setNewAddress("")
      setNewLocationName("")

      if (isEstimated) {
        setGeocodingErrors((prev) => [
          ...prev,
          `Could not accurately geocode "${newAddress}". The location has been added with an approximate position.`,
        ])
      }
    } catch (err) {
      console.error("Error adding location:", err)

      // Even if geocoding fails, create the location with an approximate position
      const fallbackPosition: [number, number] = [
        DEFAULT_MAP_CENTER[0] + (Math.random() * 0.01 - 0.005),
        DEFAULT_MAP_CENTER[1] + (Math.random() * 0.01 - 0.005),
      ]

      const newLocation: LocationData = {
        id: `custom-${Date.now()}`,
        name: newLocationName,
        address: newAddress,
        position: fallbackPosition,
        icon: "custom",
        type: "custom",
        isEstimated: true,
      }

      setCustomLocations((prev) => [...prev, newLocation])
      setNewAddress("")
      setNewLocationName("")

      // Show a warning instead of an error
      setGeocodingErrors((prev) => [
        ...prev,
        `Could not accurately geocode "${newAddress}". The location has been added with an approximate position.`,
      ])
    } finally {
      setAddingLocation(false)
    }
  }

  // Remove a custom location
  const handleRemoveLocation = (id: string) => {
    setCustomLocations((prev) => prev.filter((loc) => loc.id !== id))
    setSelectedLocations((prev) => prev.filter((locId) => locId !== id))
  }

  // Toggle location selection for routing
  const toggleLocationSelection = (id: string, location: LocationData) => {
    setSelectedLocations((prev) => {
      if (prev.includes(id)) {
        return prev.filter((locId) => locId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // Calculate route between selected locations
  const calculateRoute = async () => {
    if (selectedLocations.length < 2) {
      setError("Please select at least two locations for routing.")
      return
    }

    setOptimizingRoute(true)
    setError(null)

    try {
      console.log("Starting route calculation")
      console.log("Device info:", navigator.userAgent)
      console.log("Selected locations:", selectedLocations.length)

      // Get all visible locations
      const allVisibleLocations = [...locations, ...customLocations]

      // Filter to only selected locations
      const routeLocations = allVisibleLocations.filter((loc) => selectedLocations.includes(loc.id))
      console.log("Route locations:", routeLocations.length)

      // Sort based on carpool mode
      let sortedLocations = routeLocations

      if (carpoolMode) {
        // In carpool mode, start and end locations are fixed
        if (!startLocation || !endLocation) {
          setError("Please select both start and end locations for the carpool.")
          setOptimizingRoute(false)
          return
        }

        // Filter out start and end from the middle points
        const middlePoints = routeLocations.filter((loc) => loc.id !== startLocation.id && loc.id !== endLocation.id)

        // Create array with start, middle points, and end
        sortedLocations = [startLocation, ...middlePoints, endLocation]
      }

      // Extract waypoints
      const waypoints = sortedLocations.map((loc) => loc.position)
      console.log("Waypoints prepared:", waypoints.length)

      // Store the original order of locations for the itinerary
      let routeAddressesInOrder = sortedLocations

      // Skip optimization on mobile
      let optimizedWaypoints = waypoints
      const isMobile = /Mobi|Android/i.test(navigator.userAgent)

      if (!isMobile && carpoolMode && waypoints.length > 3) {
        try {
          console.log("Attempting to optimize route...")
          const optimized = await optimizeRoute(waypoints)

          if (optimized) {
            console.log("Route optimization successful")
            optimizedWaypoints = optimized

            // Create a more precise mapping from waypoints to locations
            const optimizedAddresses: LocationData[] = []

            // Always add the start location first
            optimizedAddresses.push(startLocation!)

            // For the middle points, find the closest match for each waypoint
            for (let i = 1; i < optimized.length - 1; i++) {
              const waypoint = optimized[i]

              // Find the location that best matches this waypoint
              // Skip the start and end locations
              const matchingLocations = sortedLocations.filter(
                (loc) => loc.id !== startLocation!.id && loc.id !== endLocation!.id,
              )

              // Find the closest match
              let bestMatch = matchingLocations[0]
              let bestDistance = Number.MAX_VALUE

              for (const loc of matchingLocations) {
                const distance = Math.pow(loc.position[0] - waypoint[0], 2) + Math.pow(loc.position[1] - waypoint[1], 2)

                if (distance < bestDistance) {
                  bestDistance = distance
                  bestMatch = loc
                }
              }

              // Only add if not already in the optimized addresses
              if (!optimizedAddresses.some((loc) => loc.id === bestMatch.id)) {
                optimizedAddresses.push(bestMatch)
              }
            }

            // Always add the end location last
            optimizedAddresses.push(endLocation!)

            routeAddressesInOrder = optimizedAddresses
          } else {
            console.warn("Route optimization returned null, using original waypoints")
          }
        } catch (optimizeError) {
          console.error("Route optimization error:", optimizeError)
          // Continue with unoptimized route
        }
      } else {
        console.log("Skipping route optimization (mobile or simple route)")
      }

      setRouteWaypoints(optimizedWaypoints)
      console.log("Route waypoints set:", optimizedWaypoints.length)

      // Set the route addresses in order - using the actual location objects
      setRouteAddresses(routeAddressesInOrder)
      console.log("Route addresses set:", routeAddressesInOrder.length)

      // Get route geometry
      try {
        console.log("Attempting to get route geometry...")
        const routeData = await getRoute(optimizedWaypoints)

        if (routeData && routeData.routes && routeData.routes.length > 0) {
          console.log("Route geometry received successfully")
          setRouteGeometry(routeData.routes[0].geometry)

          // Fit map to route bounds
          if (mapRef.current) {
            const bounds = routeData.routes[0].geometry.coordinates.map((coord: [number, number]) => [
              coord[1],
              coord[0],
            ])
            mapRef.current.fitBounds(bounds)
          }
        } else {
          throw new Error("Invalid route data received")
        }
      } catch (routeError) {
        console.error("Error getting route geometry:", routeError)

        // Create a simple straight-line route as fallback
        console.log("Creating fallback straight-line route")
        const fallbackGeometry = {
          type: "LineString",
          coordinates: optimizedWaypoints.map((point) => [point[1], point[0]]), // Convert to [lon, lat] format
        }

        setRouteGeometry(fallbackGeometry)
        setError("Could not calculate detailed route. Showing direct connections between points.")

        // Still fit the map to the waypoints
        if (mapRef.current) {
          const bounds = optimizedWaypoints.map((point) => [point[0], point[1]])
          mapRef.current.fitBounds(bounds)
        }
      }
    } catch (err) {
      console.error("Error in route calculation:", err)
      setError("Failed to calculate route. Please try again or check your internet connection.")
    } finally {
      setOptimizingRoute(false)
    }
  }

  // Clear the current route
  const clearRoute = () => {
    setRouteWaypoints([])
    setRouteGeometry(null)
    setSelectedLocations([])
    setCarpoolMode(false)
    setStartLocation(null)
    setEndLocation(null)
    setRouteAddresses([]) // Clear route addresses
  }

  // Set a location as start or end for carpool
  const setAsStartOrEnd = (location: LocationData, position: "start" | "end") => {
    if (position === "start") {
      setStartLocation(location)
    } else {
      setEndLocation(location)
    }

    // Make sure this location is selected
    if (!selectedLocations.includes(location.id)) {
      setSelectedLocations((prev) => [...prev, location.id])
    }
  }

  // Get all visible locations
  const visibleLocations = [...locations, ...customLocations]

  // Add a function to clear the geocode cache
  const clearGeocodeCache = () => {
    try {
      localStorage.removeItem(GEOCODE_CACHE_KEY)
      setGeocodingErrors([])
      setError("Geocode cache cleared. Reloading locations to re-geocode addresses...")

      // Force reload of locations after a short delay
      setTimeout(() => {
        // Reload locations
        const loadLocations = async () => {
          try {
            setLoading(true)
            setError(null)
            setGeocodingErrors([])

            // Make sure favorites.items is an array before processing
            const favoriteItems = favorites?.items || []

            // Get locations from favorites - this will trigger geocoding
            const favoriteLocations = await getFavoriteLocations(favoriteItems)

            // Check for geocoding errors
            const storedErrors = localStorage.getItem("geocoding-errors")
            if (storedErrors) {
              try {
                const errors = JSON.parse(storedErrors)
                if (errors.length > 0) {
                  setGeocodingErrors(errors)
                }
              } catch (e) {
                console.error("Error parsing geocoding errors:", e)
              }
              // Clear the errors after reading them
              localStorage.removeItem("geocoding-errors")
            }

            // Combine with schools
            const allLocations = [...favoriteLocations]

            // Add schools as locations
            SCHOOLS.forEach((school) => {
              allLocations.push({
                ...school,
                type: "school",
              })
            })

            setLocations(allLocations)
            setError("Geocoding complete. Check for any warnings about estimated positions.")
          } catch (err) {
            console.error("Failed to reload locations:", err)
            setError("Failed to reload locations. Please try refreshing the page.")
          } finally {
            setLoading(false)
          }
        }

        loadLocations()
      }, 500)
    } catch (err) {
      console.error("Error clearing geocode cache:", err)
      setError("Failed to clear geocode cache.")
    }
  }

  // Add a function to view detailed geocoding logs
  const viewGeocodeDebugInfo = () => {
    try {
      const cache = localStorage.getItem(GEOCODE_CACHE_KEY)
      const errors = localStorage.getItem("geocoding-errors")

      let debugInfo = "=== GEOCODING DEBUG INFO ===\n\n"

      // Add cache info
      if (cache) {
        const cacheData = JSON.parse(cache)
        const cacheEntries = Object.keys(cacheData).length
        debugInfo += `Cache entries: ${cacheEntries}\n\n`

        // List a few sample entries
        const sampleEntries = Object.entries(cacheData).slice(0, 3)
        if (sampleEntries.length > 0) {
          debugInfo += "Sample cache entries:\n"
          sampleEntries.forEach(([address, data]) => {
            const timestamp = new Date((data as any).timestamp).toLocaleString()
            debugInfo += `- "${address}": [${(data as any).position.join(", ")}] (cached on ${timestamp})\n`
          })
          debugInfo += "\n"
        }
      } else {
        debugInfo += "No geocode cache found.\n\n"
      }

      // Add error info
      if (errors) {
        const errorData = JSON.parse(errors)
        debugInfo += `Recent errors: ${errorData.length}\n\n`
        if (errorData.length > 0) {
          debugInfo += "Error details:\n"
          errorData.forEach((error: string, index: number) => {
            debugInfo += `${index + 1}. ${error}\n`
          })
        }
      } else {
        debugInfo += "No recent geocoding errors found.\n"
      }

      // Display in console
      console.log(debugInfo)

      // Also set as error message so user can see it
      setError("Debug info logged to console. Press F12 to view.")

      // Create a downloadable file
      const blob = new Blob([debugInfo], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "geocoding-debug-info.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error generating debug info:", err)
      setError("Failed to generate debug info.")
    }
  }

  return (
    <>
      <LeafletSetup />
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Loading Map</h3>
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: "100%" }}></div>
              </div>
              <p className="text-sm text-gray-600">Geocoding addresses and preparing map... This may take a moment.</p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {/* Map Display - Now at the top */}
        <Card className="w-full h-[500px]">
          <CardContent className="p-0 h-full">
            {typeof window !== "undefined" && (
              <MapContainer
                center={DEFAULT_MAP_CENTER}
                zoom={DEFAULT_ZOOM}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render markers for all visible locations */}
                {visibleLocations.map((location) => (
                  <CustomMarker
                    key={location.id}
                    location={location}
                    selected={selectedLocations.includes(location.id)}
                    isEstimated={location.isEstimated}
                  >
                    <div className="p-1">
                      <div className="font-medium">
                        {location.name}
                        {location.studentNickname && (
                          <span className="text-gray-500 ml-1">({location.studentNickname})</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{location.address}</div>

                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`select-${location.id}`}
                            checked={selectedLocations.includes(location.id)}
                            onCheckedChange={() => toggleLocationSelection(location.id, location)}
                          />
                          <label htmlFor={`select-${location.id}`} className="text-xs cursor-pointer">
                            Include in route
                          </label>
                        </div>

                        {carpoolMode && (
                          <div className="flex gap-1 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 flex-1"
                              onClick={() => setAsStartOrEnd(location, "start")}
                            >
                              Set as Start
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 flex-1"
                              onClick={() => setAsStartOrEnd(location, "end")}
                            >
                              Set as End
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CustomMarker>
                ))}

                {/* Render route if available */}
                {routeGeometry && (
                  <Polyline
                    positions={routeGeometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])}
                    color="blue"
                    weight={5}
                    opacity={0.7}
                  />
                )}
              </MapContainer>
            )}
          </CardContent>
        </Card>

        {/* Geocoding errors warning - keep this after the map */}
        {geocodingErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Some addresses couldn't be geocoded accurately</p>
                <p className="text-xs text-yellow-700 mt-1">
                  {geocodingErrors.length} address(es) are using approximate positions due to geocoding service
                  limitations or network issues.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={clearGeocodeCache}>
                    Clear Geocode Cache
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={viewGeocodeDebugInfo}>
                    Download Debug Info
                  </Button>
                </div>
                <details className="mt-2">
                  <summary className="text-xs text-yellow-700 cursor-pointer">View error details</summary>
                  <div className="mt-2 text-xs text-yellow-700 max-h-24 overflow-y-auto">
                    <ul className="list-disc pl-5 space-y-1">
                      {geocodingErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Route Planning Controls - Now below the map */}
        <Card className="w-full">
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Route Planning</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="carpool-mode"
                    checked={carpoolMode}
                    onCheckedChange={(checked) => setCarpoolMode(!!checked)}
                  />
                  <label htmlFor="carpool-mode" className="text-sm cursor-pointer">
                    Carpool Mode
                  </label>
                </div>

                {carpoolMode && (
                  <div className="space-y-2 pl-6">
                    <div className="text-sm">
                      <div className="font-medium">Start Location:</div>
                      <div className="text-gray-500">{startLocation ? startLocation.name : "Not selected"}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">End Location:</div>
                      <div className="text-gray-500">{endLocation ? endLocation.name : "Not selected"}</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={calculateRoute}
                    disabled={
                      optimizingRoute ||
                      selectedLocations.length < 2 ||
                      (carpoolMode && (!startLocation || !endLocation))
                    }
                    className="flex-1"
                  >
                    <Route className="h-4 w-4 mr-2" />
                    {optimizingRoute ? "Calculating..." : "Calculate Route"}
                  </Button>

                  <Button variant="outline" onClick={clearRoute} disabled={!routeGeometry} className="flex-1">
                    Clear Route
                  </Button>
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
          </CardContent>
        </Card>

        {/* Selected Locations List - Keep this section */}
        {selectedLocations.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Selected Locations</h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {selectedLocations.map((id) => {
                    const location = visibleLocations.find((loc) => loc.id === id)
                    if (!location) return null

                    return (
                      <div key={id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {location.type === "school" ? (
                            <School className="h-4 w-4 mr-2 text-red-500" />
                          ) : location.type === "favorite" ? (
                            location.icon === "user" ? (
                              <User className="h-4 w-4 mr-2 text-blue-500" />
                            ) : (
                              <Users className="h-4 w-4 mr-2 text-green-500" />
                            )
                          ) : (
                            <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                          )}
                          <span className="text-sm">{location.name}</span>

                          {carpoolMode && (
                            <>
                              {startLocation?.id === location.id && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Start
                                </span>
                              )}
                              {endLocation?.id === location.id && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  End
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {carpoolMode && !startLocation?.id && !endLocation?.id && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setAsStartOrEnd(location, "start")}
                              >
                                Set as Start
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setAsStartOrEnd(location, "end")}
                              >
                                Set as End
                              </Button>
                            </>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLocationSelection(location.id, location)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Route Itinerary - Keep this section */}
        {routeAddresses.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Route Itinerary</h3>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {routeAddresses.map((location, index) => (
                    <div key={`${location.id}-${index}`} className="flex p-2 border-b border-gray-100 last:border-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-gray-500 flex items-start">
                          <MapPin className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                          <span>{location.address}</span>
                        </div>
                        {index === 0 && (
                          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Start
                          </span>
                        )}
                        {index === routeAddresses.length - 1 && (
                          <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            End
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Custom Locations - Now at the bottom */}
        {customLocations.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Custom Locations</h3>
              <ScrollArea className="h-24">
                <div className="space-y-2">
                  {customLocations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="text-sm truncate">{location.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveLocation(location.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Add Custom Location - Now at the very bottom */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Add Custom Location</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Location Name"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                />
                <Input placeholder="Address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
                <Button
                  onClick={handleAddLocation}
                  disabled={addingLocation || !newAddress || !newLocationName}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addingLocation ? "Adding..." : "Add Location"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

