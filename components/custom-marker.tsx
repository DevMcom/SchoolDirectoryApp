"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Marker, Popup } from "react-leaflet"
import type { LocationData } from "@/lib/map-utils"

// Update the CustomMarkerProps interface to include isEstimated flag
interface CustomMarkerProps {
  location: LocationData
  children?: React.ReactNode
  selected?: boolean
  studentNickname?: string
  isEstimated?: boolean
}

export function CustomMarker({ location, children, selected, studentNickname, isEstimated }: CustomMarkerProps) {
  const [icon, setIcon] = useState<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !window.L) return

    // Create icon based on the type
    let html = ""
    let className = ""

    if (location.icon === "school") {
      html = `<div class="flex items-center justify-center w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-school"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg></div>`

      // Use the specific color for each school
      if (location.color === "blue") {
        className = "bg-blue-500 text-white"
      } else if (location.color === "green") {
        className = "bg-green-500 text-white"
      } else if (location.color === "red") {
        className = "bg-red-500 text-white"
      } else {
        className = "bg-red-500 text-white" // Default fallback
      }
    } else if (location.icon === "user") {
      html = `<div class="flex items-center justify-center w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-user"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg></div>`
      className = isEstimated ? "bg-pink-500 text-white" : "bg-yellow-500 text-white" // Pink for estimated positions, yellow for properly geocoded
    } else if (location.icon === "users") {
      html = `<div class="flex items-center justify-center w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>`
      className = isEstimated ? "bg-yellow-500 text-white" : "bg-green-500 text-white" // Yellow for estimated positions
    } else if (location.icon === "custom") {
      html = `<div class="flex items-center justify-center w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`
      className = isEstimated ? "bg-yellow-500 text-white" : "bg-purple-500 text-white" // Yellow for estimated positions
    }

    // Add dashed border for estimated positions
    if (isEstimated) {
      className += " border-2 border-dashed border-red-300"
    }

    if (selected) {
      className += " ring-2 ring-yellow-400"
    }

    const newIcon = window.L.divIcon({
      html,
      className: `w-8 h-8 rounded-full flex items-center justify-center ${className}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })

    setIcon(newIcon)
  }, [location.icon, location.color, selected, isEstimated])

  if (!icon) return null

  return (
    <Marker position={location.position} icon={icon}>
      {children && (
        <Popup>
          {isEstimated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-1 mb-2 text-xs text-yellow-700">
              ⚠️ Approximate location - geocoding failed
            </div>
          )}
          {children}
        </Popup>
      )}
    </Marker>
  )
}

