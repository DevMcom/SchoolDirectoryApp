"use client"

import { useState, useEffect } from "react"
import { Calendar, Bell, Star, Map, X, Home, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useFavorites } from "@/contexts/favorites-context"

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (route: string) => void
  currentRoute: string
}

export function SideMenu({ isOpen, onClose, onNavigate, currentRoute }: SideMenuProps) {
  const { favorites } = useFavorites()
  const [mounted, setMounted] = useState(false)

  // Handle escape key to close menu
  useEffect(() => {
    setMounted(true)

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [isOpen, onClose])

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} aria-hidden="true" />
      )}

      {/* Side Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="py-2">
          <Button
            variant={currentRoute === "directory" ? "default" : "ghost"}
            className="w-full justify-start px-4"
            onClick={() => {
              onNavigate("directory")
              onClose()
            }}
          >
            <Home className="mr-2 h-5 w-5" />
            Directory
          </Button>

          <Button
            variant={currentRoute === "calendar" ? "default" : "ghost"}
            className="w-full justify-start px-4"
            onClick={() => {
              onNavigate("calendar")
              onClose()
            }}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Calendar
          </Button>

          <Button
            variant={currentRoute === "notifications" ? "default" : "ghost"}
            className="w-full justify-start px-4"
            onClick={() => {
              onNavigate("notifications")
              onClose()
            }}
          >
            <Bell className="mr-2 h-5 w-5" />
            Notifications
          </Button>
        </div>

        <Separator className="my-2" />

        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Favorites ({favorites.items.length})</h3>

          <Button
            variant={currentRoute === "favorites" ? "default" : "ghost"}
            className="w-full justify-start px-4 mb-1"
            onClick={() => {
              onNavigate("favorites")
              onClose()
            }}
          >
            <Star className="mr-2 h-5 w-5" />
            View Favorites
          </Button>

          <Button
            variant={currentRoute === "map-view" ? "default" : "ghost"}
            className="w-full justify-start px-4 mb-1"
            onClick={() => {
              onNavigate("map-view")
              onClose()
            }}
          >
            <Map className="mr-2 h-5 w-5" />
            Map View
          </Button>

          <Button
            variant={currentRoute === "carpool" ? "default" : "ghost"}
            className="w-full justify-start px-4"
            onClick={() => {
              onNavigate("carpool")
              onClose()
            }}
          >
            <Car className="mr-2 h-5 w-5" />
            Carpool Planner
          </Button>
        </div>
      </div>
    </>
  )
}

