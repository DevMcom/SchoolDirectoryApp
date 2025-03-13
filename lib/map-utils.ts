import type { Student } from "./types"
import type { ParentInfo } from "@/components/search-view"
import type { FavoriteItem } from "./favorites-utils"

// Update the SCHOOLS constant to fix the West School color
export const SCHOOLS = [
  {
    id: "glencoe-south",
    name: "Glencoe South School",
    address: "266 Linden Ave, Glencoe, IL",
    position: [42.1242, -87.7515] as [number, number], // Updated coordinates
    icon: "school",
    color: "blue",
  },
  {
    id: "glencoe-west",
    name: "Glencoe West School",
    address: "1010 Forestway Dr, Glencoe, IL",
    position: [42.1371, -87.7758] as [number, number], // Updated coordinates
    icon: "school",
    color: "red", // Changed from green to red to make it distinct
  },
  {
    id: "glencoe-central",
    name: "Glencoe Central School",
    address: "620 Greenwood Ave, Glencoe, IL",
    position: [42.1311, -87.7602] as [number, number], // Updated coordinates
    icon: "school",
    color: "green",
  },
]

// Update the default map center to be centered between the schools
export const DEFAULT_MAP_CENTER: [number, number] = [42.1308, -87.7625]
export const DEFAULT_ZOOM = 13

// Update the LocationData interface to include studentNickname
export interface LocationData {
  id: string
  name: string
  address: string
  position: [number, number]
  icon: string
  type: "favorite" | "school" | "custom"
  studentId?: string
  parentId?: string
  studentNickname?: string
  color?: string
  isEstimated?: boolean
}

// Cache for geocoded addresses
const GEOCODE_CACHE_KEY = "school-directory-geocode-cache"

interface GeocodeCache {
  [address: string]: {
    position: [number, number]
    timestamp: number
    isEstimated?: boolean
  }
}

// Rate limiter for geocoding requests
let lastGeocodingRequest = 0
const MIN_REQUEST_INTERVAL = 1100 // 1.1 seconds between requests to avoid rate limiting

// Load geocode cache from localStorage
export function loadGeocodeCache(): GeocodeCache {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const cache = localStorage.getItem(GEOCODE_CACHE_KEY)
    if (cache) {
      return JSON.parse(cache)
    }
  } catch (error) {
    console.error("Error loading geocode cache:", error)
  }

  return {}
}

// Check for pre-geocoded data
function checkPreGeocodedData(address: string): [number, number] | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const preGeocodedData = localStorage.getItem("pre-geocoded-data")
    if (preGeocodedData) {
      const data = JSON.parse(preGeocodedData)
      if (data[address]) {
        console.log("Using pre-geocoded data for:", address)
        return data[address].position
      }
    }
  } catch (error) {
    console.error("Error checking pre-geocoded data:", error)
  }

  return null
}

// Save geocode cache to localStorage
export function saveGeocodeCache(cache: GeocodeCache): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error("Error saving geocode cache:", error)
  }
}

// Helper function to generate a position near the map center
function generateRandomPosition(): [number, number] {
  return [
    DEFAULT_MAP_CENTER[0] + (Math.random() * 0.01 - 0.005),
    DEFAULT_MAP_CENTER[1] + (Math.random() * 0.01 - 0.005),
  ]
}

// Helper function to delay execution (for rate limiting)
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Update the geocodeAddress function to handle fetch errors more gracefully and provide better fallbacks

// Replace the geocodeAddress function with this improved version:

export async function geocodeAddress(address: string): Promise<[number, number]> {
  // Check pre-geocoded data first
  const preGeocodedPosition = checkPreGeocodedData(address)
  if (preGeocodedPosition) {
    return preGeocodedPosition
  }

  // Check cache next
  const cache = loadGeocodeCache()
  const cacheEntry = cache[address]

  // Use cache if entry exists and is less than 30 days old
  if (cacheEntry && Date.now() - cacheEntry.timestamp < 30 * 24 * 60 * 60 * 1000) {
    console.log("Using cached coordinates for:", address)
    return cacheEntry.position
  }

  // Rate limiting - ensure we don't make requests too quickly
  const now = Date.now()
  const timeToWait = Math.max(0, MIN_REQUEST_INTERVAL - (now - lastGeocodingRequest))
  if (timeToWait > 0) {
    await delay(timeToWait)
  }
  lastGeocodingRequest = Date.now()

  // List of CORS proxies to try
  const corsProxies = [
    "", // Try direct request first
    "https://corsproxy.io/?",
    "https://api.allorigins.win/raw?url=",
    "https://cors-anywhere.herokuapp.com/",
  ]

  let lastError: Error | null = null

  // Try each proxy until one works
  for (const proxy of corsProxies) {
    try {
      const url = proxy
        ? `${proxy}${encodeURIComponent(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)}`
        : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`

      console.log(`Trying geocoding with ${proxy ? "proxy: " + proxy : "direct request"}`)

      // Add timeout to fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(url, {
        headers: {
          "User-Agent": "SchoolDirectoryApp/1.0",
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!response.ok) {
        console.warn(`Geocoding failed with status: ${response.status} ${response.statusText}`)
        continue // Try next proxy
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const position: [number, number] = [Number.parseFloat(data[0].lat), Number.parseFloat(data[0].lon)]

        // Update cache
        cache[address] = {
          position,
          timestamp: Date.now(),
          isEstimated: false,
        }
        saveGeocodeCache(cache)

        return position
      } else {
        console.warn("No geocoding results found for address:", address)
      }
    } catch (error) {
      lastError = error as Error
      console.error(`Geocoding error with ${proxy ? "proxy: " + proxy : "direct request"}: ${error}`)
      // Continue to next proxy
    }
  }

  // If we reach here, all geocoding attempts failed
  console.warn(`All geocoding attempts failed for address: ${address}. Using fallback.`)

  // Check for similar addresses in cache (exact match for zip code)
  const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/)
  if (zipMatch) {
    const zipCode = zipMatch[0]
    const similarAddresses = Object.entries(cache).filter(([addr, _]) => addr.includes(zipCode))

    if (similarAddresses.length > 0) {
      // Use the coordinates from a similar address with small random offset
      const [_, cachedData] = similarAddresses[0]
      const position: [number, number] = [
        cachedData.position[0] + (Math.random() * 0.002 - 0.001),
        cachedData.position[1] + (Math.random() * 0.002 - 0.001),
      ]

      // Save to cache
      cache[address] = {
        position,
        timestamp: Date.now(),
        isEstimated: true,
      }
      saveGeocodeCache(cache)

      console.log("Using coordinates from similar address with same zip code")
      return position
    }
  }

  // If we have a previous cache entry, use it even if it's old
  if (cacheEntry) {
    console.log("Using expired cached coordinates for:", address)
    return cacheEntry.position
  }

  // If all attempts fail, use a hardcoded position based on the address
  const fallbackPosition = generatePositionFromAddress(address)

  // Save to cache
  cache[address] = {
    position: fallbackPosition,
    timestamp: Date.now(),
    isEstimated: true,
  }
  saveGeocodeCache(cache)

  console.log("Using fallback position based on address patterns")
  return fallbackPosition
}

// Generate a position based on address patterns
// This is a very simple approach that tries to place addresses in somewhat reasonable locations
function generatePositionFromAddress(address: string): [number, number] {
  // Default position (center of map with small random offset)
  let lat = DEFAULT_MAP_CENTER[0] + (Math.random() * 0.01 - 0.005)
  let lng = DEFAULT_MAP_CENTER[1] + (Math.random() * 0.01 - 0.005)

  // Try to extract street number for a bit more determinism
  const streetNumberMatch = address.match(/^(\d+)/)
  if (streetNumberMatch) {
    const streetNumber = Number.parseInt(streetNumberMatch[1])
    // Use the street number to create a small offset
    const offset = (streetNumber % 100) / 10000
    lat += offset
    lng += offset
  }

  // Check for common street names in Glencoe and adjust position
  const lowerAddress = address.toLowerCase()

  // More specific street name checks
  if (lowerAddress.includes("linden")) {
    // Near South School
    return [42.1242 + (Math.random() * 0.004 - 0.002), -87.7515 + (Math.random() * 0.004 - 0.002)]
  } else if (lowerAddress.includes("forestway")) {
    // Near West School
    return [42.1371 + (Math.random() * 0.004 - 0.002), -87.7758 + (Math.random() * 0.004 - 0.002)]
  } else if (lowerAddress.includes("greenwood")) {
    // Near Central School
    return [42.1311 + (Math.random() * 0.004 - 0.002), -87.7602 + (Math.random() * 0.004 - 0.002)]
  }

  // Check for zip codes in Glencoe area
  if (lowerAddress.includes("60022")) {
    // Glencoe zip code - use a position within Glencoe
    return [42.135 + (Math.random() * 0.01 - 0.005), -87.765 + (Math.random() * 0.01 - 0.005)]
  }

  // If we have "Glencoe" in the address, use a position within Glencoe
  if (lowerAddress.includes("glencoe")) {
    return [42.135 + (Math.random() * 0.01 - 0.005), -87.765 + (Math.random() * 0.01 - 0.005)]
  }

  // Return the position with some randomness
  return [lat, lng]
}

// Get full address string from student data
export function getStudentAddress(student: Student): string {
  return `${student.f1AddressLine1}, ${student.f1City}, ${student.f1State} ${student.f1Zip}`
}

// Get full address string from parent data
export function getParentAddress(parent: ParentInfo): string {
  // Use the address of the first student associated with this parent
  if (parent.students && parent.students.length > 0) {
    return getStudentAddress(parent.students[0])
  }
  return ""
}

// Update the getFavoriteLocations function to better handle geocoding attempts
// Replace the current getFavoriteLocations function with this improved version:

export async function getFavoriteLocations(favorites: FavoriteItem[]): Promise<LocationData[]> {
  const locations: LocationData[] = []
  const geocodingErrors: string[] = []

  // Make sure favorites is an array before processing
  const favoritesArray = Array.isArray(favorites) ? favorites : []

  // Process favorites in batches of 3 to avoid rate limiting
  const BATCH_SIZE = 3
  const batches = []

  for (let i = 0; i < favoritesArray.length; i += BATCH_SIZE) {
    batches.push(favoritesArray.slice(i, i + BATCH_SIZE))
  }

  // Process each batch sequentially
  for (const batch of batches) {
    const batchPromises = batch.map(async (favorite) => {
      let address = ""
      let name = ""
      const id = favorite.id
      let isEstimated = false

      if (favorite.type === "student" && favorite.student) {
        address = getStudentAddress(favorite.student)
        name = `${favorite.student.firstName} ${favorite.student.lastName}`
        const studentNickname = favorite.student.nickname || undefined

        try {
          // This will attempt to geocode if not in cache
          const position = await geocodeAddress(address)

          // Check if this is from cache and if it's estimated
          const cache = loadGeocodeCache()
          const cacheEntry = cache[address]
          isEstimated = cacheEntry ? !!cacheEntry.isEstimated : true

          return {
            id,
            name,
            address,
            position,
            icon: "user",
            type: "favorite",
            studentId: favorite.student.id,
            studentNickname,
            isEstimated,
          }
        } catch (error) {
          console.error(`Error geocoding address for ${name}:`, error)
          geocodingErrors.push(`Error geocoding address for ${name}: ${error.message || "Unknown error"}`)

          // Use a default position near the map center
          const defaultPosition = generateRandomPosition()

          return {
            id,
            name,
            address,
            position: defaultPosition,
            icon: "user",
            type: "favorite",
            studentId: favorite.student.id,
            studentNickname,
            isEstimated: true,
          }
        }
      } else if (favorite.type === "parent" && favorite.parent) {
        address = getParentAddress(favorite.parent)
        name = `${favorite.parent.firstName} ${favorite.parent.lastName}`

        try {
          // This will attempt to geocode if not in cache
          const position = await geocodeAddress(address)

          // Check if this is from cache and if it's estimated
          const cache = loadGeocodeCache()
          const cacheEntry = cache[address]
          isEstimated = cacheEntry ? !!cacheEntry.isEstimated : true

          return {
            id,
            name,
            address,
            position,
            icon: "users",
            type: "favorite",
            parentId: favorite.parent.id,
            isEstimated,
          }
        } catch (error) {
          console.error(`Error geocoding address for ${name}:`, error)
          geocodingErrors.push(`Error geocoding address for ${name}: ${error.message || "Unknown error"}`)

          // Use a default position near the map center
          const defaultPosition = generateRandomPosition()

          return {
            id,
            name,
            address,
            position: defaultPosition,
            icon: "users",
            type: "favorite",
            parentId: favorite.parent.id,
            isEstimated: true,
          }
        }
      }

      return null
    })

    // Wait for the current batch to complete before moving to the next
    const batchResults = await Promise.all(batchPromises)
    locations.push(...(batchResults.filter(Boolean) as LocationData[]))

    // Add a delay between batches to avoid rate limiting
    if (batches.indexOf(batch) < batches.length - 1) {
      await delay(1500) // 1.5 second delay between batches
    }
  }

  // Log geocoding errors if any
  if (geocodingErrors.length > 0) {
    console.error("Geocoding errors:", geocodingErrors)

    // Store errors in localStorage for troubleshooting
    try {
      localStorage.setItem("geocoding-errors", JSON.stringify(geocodingErrors))
    } catch (e) {
      console.error("Failed to save geocoding errors:", e)
    }
  }

  return locations
}

// Get route between multiple points using OSRM
export async function getRoute(waypoints: [number, number][]): Promise<any> {
  if (waypoints.length < 2) {
    return null
  }

  console.log("getRoute called with waypoints:", waypoints)
  console.log("User agent:", typeof window !== "undefined" ? navigator.userAgent : "SSR")
  console.log("Is mobile:", /Mobi|Android/i.test(typeof window !== "undefined" ? navigator.userAgent : ""))

  // Format waypoints for logging
  const waypointStrings = waypoints.map((point) => `[${point[0]}, ${point[1]}]`).join(", ")
  console.log(`Formatted waypoints: ${waypointStrings}`)

  // List of CORS proxies to try - prioritize more reliable ones for mobile
  const corsProxies = [
    "https://corsproxy.io/?",
    "https://api.allorigins.win/raw?url=",
    "https://cors.sh/?",
    "https://proxy.cors.sh/",
    "https://cors-anywhere.herokuapp.com/",
  ]

  // Detect if we're on mobile
  const isMobile = typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent)

  // On mobile, try the most reliable proxies first
  if (isMobile) {
    console.log("Mobile device detected, prioritizing reliable proxies")
  }

  // Create a simplified route geometry as fallback
  const createFallbackRoute = () => {
    console.log("Creating fallback route geometry")
    return {
      type: "LineString",
      coordinates: waypoints.map((point) => [point[1], point[0]]), // Convert to [lon, lat] format
    }
  }

  // Try Google Maps Directions API fallback (via proxy)
  const tryGoogleMapsDirections = async () => {
    try {
      console.log("Attempting Google Maps Directions API via proxy")

      // Format origin, destination and waypoints
      const origin = `${waypoints[0][0]},${waypoints[0][1]}`
      const destination = `${waypoints[waypoints.length - 1][0]},${waypoints[waypoints.length - 1][1]}`

      let waypointsParam = ""
      if (waypoints.length > 2) {
        waypointsParam =
          "&waypoints=" +
          waypoints
            .slice(1, -1)
            .map((point) => `${point[0]},${point[1]}`)
            .join("|")
      }

      // Use a proxy to access Google Maps
      const proxyUrl = `https://corsproxy.io/?https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsParam}&mode=driving`

      const response = await fetch(proxyUrl, {
        headers: {
          "User-Agent": "SchoolDirectoryApp/1.0 (Mobile Compatible)",
        },
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`Google Maps API failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.routes && data.routes.length > 0 && data.routes[0].overview_polyline) {
        // We'd need to decode Google's polyline format, but for now just return fallback
        console.log("Google Maps returned data but we'll use fallback for simplicity")
        return { routes: [{ geometry: createFallbackRoute() }] }
      } else {
        throw new Error("No routes found in Google Maps response")
      }
    } catch (error) {
      console.error("Google Maps fallback failed:", error)
      return null
    }
  }

  // Try each proxy with OSRM
  for (const proxy of corsProxies) {
    try {
      console.log(`Trying routing with proxy: ${proxy}`)

      const waypointString = waypoints
        .map((point) => `${point[1]},${point[0]}`) // OSRM expects lon,lat format
        .join(";")

      // Build the URL with the proxy
      const url = `${proxy}https://router.project-osrm.org/route/v1/driving/${waypointString}?overview=full&geometries=geojson`
      console.log(`Requesting URL: ${url}`)

      // Add a timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("Request timeout reached, aborting")
        controller.abort()
      }, 15000) // 15 second timeout for mobile

      // Make the request with detailed options
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "SchoolDirectoryApp/1.0 (Mobile Compatible)",
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        mode: "cors",
        signal: controller.signal,
        credentials: "omit",
      }).finally(() => clearTimeout(timeoutId))

      if (!response.ok) {
        console.warn(`Routing failed with status: ${response.status} ${response.statusText}`)
        throw new Error(`HTTP error: ${response.status}`)
      }

      // Try to parse the response
      const text = await response.text()
      console.log(`Response received, length: ${text.length} characters`)

      let data
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        console.log("Response text (first 100 chars):", text.substring(0, 100))
        throw new Error("Invalid JSON response")
      }

      // Validate the response data
      if (!data || !data.routes || data.routes.length === 0) {
        console.error("Invalid routing data received:", data)
        throw new Error("Invalid routing data received")
      }

      console.log("Routing successful with proxy:", proxy)
      return data
    } catch (error) {
      console.error(`Routing error with proxy ${proxy}:`, error)
      // Continue to next proxy
    }
  }

  // If all OSRM attempts fail, try Google Maps
  const googleResult = await tryGoogleMapsDirections()
  if (googleResult) {
    return googleResult
  }

  // If all attempts fail, return a fallback route
  console.log("All routing attempts failed, returning fallback route")
  return {
    routes: [
      {
        geometry: createFallbackRoute(),
      },
    ],
  }
}

// Optimize route order for multiple stops
export async function optimizeRoute(waypoints: [number, number][]): Promise<[number, number][] | null> {
  if (waypoints.length < 3) {
    return waypoints // No need to optimize for 2 or fewer points
  }

  console.log("optimizeRoute called with waypoints:", waypoints)

  // For mobile, just return the original waypoints to avoid additional API calls
  if (typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent)) {
    console.log("Mobile device detected, skipping route optimization")
    return waypoints
  }

  // The first and last points are fixed (start and end)
  const start = waypoints[0]
  const end = waypoints[waypoints.length - 1]

  try {
    console.log("Creating simple optimized route")

    // Create a simple optimization by keeping start and end fixed
    // and sorting middle points by distance from start
    const middlePoints = waypoints.slice(1, -1)

    // Sort middle points by distance from start
    middlePoints.sort((a, b) => {
      const distA = Math.pow(a[0] - start[0], 2) + Math.pow(a[1] - start[1], 2)
      const distB = Math.pow(b[0] - start[0], 2) + Math.pow(b[1] - start[1], 2)
      return distA - distB
    })

    // Combine start, sorted middle points, and end
    const optimizedWaypoints = [start, ...middlePoints, end]
    console.log("Simple optimization complete")

    return optimizedWaypoints
  } catch (error) {
    console.error("Route optimization error:", error)
    return waypoints // Return original waypoints if optimization fails
  }
}

