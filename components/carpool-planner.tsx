"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Car, MapPin, Plus, Trash2, Route, School } from "lucide-react"
import { geocodeAddress, SCHOOLS } from "@/lib/map-utils"
import { LeafletSetup } from "@/components/leaflet-setup"

interface CarpoolStop {
  id: string
  name: string
  address: string
  type: "pickup" | "dropoff" | "school"
  position?: [number, number]
}

export function CarpoolPlanner() {
  const [stops, setStops] = useState<CarpoolStop[]>([])
  const [newStopName, setNewStopName] = useState("")
  const [newStopAddress, setNewStopAddress] = useState("")
  const [addingStop, setAddingStop] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)

  // Initialize with schools
  useEffect(() => {
    const schoolStops = SCHOOLS.map((school) => ({
      id: school.id,
      name: school.name,
      address: school.address,
      type: "school" as const,
      position: school.position,
    }))

    setStops(schoolStops)

    // Select the first school by default
    if (schoolStops.length > 0) {
      setSelectedSchool(schoolStops[0].id)
    }
  }, [])

  // Add a new stop
  const handleAddStop = async () => {
    if (!newStopName || !newStopAddress) {
      setError("Please enter both a name and address for the new stop.")
      return
    }

    setAddingStop(true)
    setError(null)

    try {
      const position = await geocodeAddress(newStopAddress)

      if (!position) {
        setError("Could not find coordinates for this address. Please try a different address.")
        setAddingStop(false)
        return
      }

      const newStop: CarpoolStop = {
        id: `stop-${Date.now()}`,
        name: newStopName,
        address: newStopAddress,
        type: "pickup",
        position,
      }

      setStops((prev) => [...prev, newStop])
      setNewStopName("")
      setNewStopAddress("")
    } catch (err) {
      console.error("Error adding stop:", err)
      setError("Failed to add stop. Please try again.")
    } finally {
      setAddingStop(false)
    }
  }

  // Remove a stop
  const handleRemoveStop = (id: string) => {
    // Don't allow removing schools
    if (stops.find((stop) => stop.id === id)?.type === "school") {
      return
    }

    setStops((prev) => prev.filter((stop) => stop.id !== id))
  }

  // Generate a link to open in Google Maps
  const generateGoogleMapsLink = () => {
    if (stops.length < 2 || !selectedSchool) {
      setError("Please add at least one pickup location and select a school.")
      return null
    }

    // Find the selected school
    const school = stops.find((stop) => stop.id === selectedSchool)
    if (!school) return null

    // Get all pickup stops
    const pickupStops = stops.filter((stop) => stop.type === "pickup")

    if (pickupStops.length === 0) {
      setError("Please add at least one pickup location.")
      return null
    }

    // Format for Google Maps
    // origin=first pickup, destination=school, waypoints=other pickups
    const origin = encodeURIComponent(pickupStops[0].address)
    const destination = encodeURIComponent(school.address)

    let waypointsParam = ""
    if (pickupStops.length > 1) {
      const waypoints = pickupStops
        .slice(1)
        .map((stop) => encodeURIComponent(stop.address))
        .join("|")
      waypointsParam = `&waypoints=${waypoints}`
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`
  }

  // Open route in Google Maps
  const openInGoogleMaps = () => {
    const url = generateGoogleMapsLink()
    if (url) {
      window.open(url, "_blank")
    }
  }

  return (
    <>
      <LeafletSetup />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="h-5 w-5 mr-2" />
            Carpool Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Destination School</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {stops
                .filter((stop) => stop.type === "school")
                .map((school) => (
                  <Button
                    key={school.id}
                    variant={selectedSchool === school.id ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedSchool(school.id)}
                  >
                    <School className="h-4 w-4 mr-2" />
                    {school.name}
                  </Button>
                ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Add Pickup Location</h3>
            <div className="space-y-2">
              <Input
                placeholder="Location Name (e.g., John's House)"
                value={newStopName}
                onChange={(e) => setNewStopName(e.target.value)}
              />
              <Input placeholder="Address" value={newStopAddress} onChange={(e) => setNewStopAddress(e.target.value)} />
              <Button
                onClick={handleAddStop}
                disabled={addingStop || !newStopName || !newStopAddress}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addingStop ? "Adding..." : "Add Pickup Location"}
              </Button>
            </div>
          </div>

          {stops.filter((stop) => stop.type === "pickup").length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Pickup Locations</h3>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {stops
                      .filter((stop) => stop.type === "pickup")
                      .map((stop) => (
                        <div key={stop.id} className="flex items-center justify-between border p-2 rounded">
                          <div>
                            <div className="font-medium flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                              {stop.name}
                            </div>
                            <div className="text-xs text-gray-500">{stop.address}</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveStop(stop.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Separator />

          <div>
            <Button
              onClick={openInGoogleMaps}
              disabled={stops.filter((stop) => stop.type === "pickup").length === 0 || !selectedSchool}
              className="w-full"
            >
              <Route className="h-4 w-4 mr-2" />
              Open Route in Google Maps
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              This will open Google Maps with all pickup locations and the selected school.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

