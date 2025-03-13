"use client"

import { useState, useEffect } from "react"
import { SchoolDirectory } from "@/components/school-directory"
import { LoginScreen } from "@/components/login-screen"
import { VerificationScreen } from "@/components/verification-screen"
import { FavoritesProvider } from "@/contexts/favorites-context"
import { FavoritesView } from "@/components/favorites-view"
import { MapView } from "@/components/map-view"
import { CarpoolPlanner } from "@/components/carpool-planner"
import { CalendarView } from "@/components/calendar-view"
import { AppLayout } from "@/components/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function Home() {
  const [authState, setAuthState] = useState<"login" | "verify" | "authenticated">("login")
  const [email, setEmail] = useState("")
  const [currentView, setCurrentView] = useState<string>("directory")

  // Check if user is already authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("directory-authenticated")
    if (isAuthenticated === "true") {
      setAuthState("authenticated")
    }
  }, [])

  const handleLogin = (email: string) => {
    setEmail(email)
    setAuthState("verify")
  }

  const handleVerify = () => {
    localStorage.setItem("directory-authenticated", "true")
    setAuthState("authenticated")
  }

  const handleBack = () => {
    setAuthState("login")
  }

  const handleNavigate = (route: string) => {
    setCurrentView(route)
  }

  if (authState === "login") {
    return <LoginScreen onSubmit={handleLogin} />
  }

  if (authState === "verify") {
    return <VerificationScreen email={email} onVerify={handleVerify} onBack={handleBack} />
  }

  // Get the title for the current view
  const getViewTitle = () => {
    switch (currentView) {
      case "directory":
        return "Directory"
      case "favorites":
        return "Favorites"
      case "calendar":
        return "Calendar"
      case "notifications":
        return "Notifications"
      case "map-view":
        return "Map View"
      case "carpool":
        return "Carpool Planner"
      default:
        return "School Directory"
    }
  }

  return (
    <FavoritesProvider>
      {currentView === "directory" ? (
        <SchoolDirectory onNavigate={handleNavigate} />
      ) : (
        <AppLayout title={getViewTitle()} currentRoute={currentView} onNavigate={handleNavigate}>
          {currentView === "favorites" && (
            <Card className="p-4">
              <FavoritesView />
            </Card>
          )}

          {currentView === "map-view" && <MapView />}

          {currentView === "carpool" && <CarpoolPlanner />}

          {currentView === "calendar" && <CalendarView />}

          {currentView === "notifications" && (
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Notifications</h2>
              <p className="text-gray-500 mb-6">This feature is coming soon!</p>
              <Button onClick={() => setCurrentView("directory")} className="mx-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Directory
              </Button>
            </Card>
          )}
        </AppLayout>
      )}
    </FavoritesProvider>
  )
}

