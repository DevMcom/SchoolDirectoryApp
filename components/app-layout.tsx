"use client"

import { type ReactNode, useState } from "react"
import { TitleBar } from "@/components/title-bar"
import { SideMenu } from "@/components/side-menu"

interface AppLayoutProps {
  children: ReactNode
  title: string
  currentRoute: string
  onNavigate: (route: string) => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function AppLayout({ children, title, currentRoute, onNavigate, activeTab, onTabChange }: AppLayoutProps) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  const handleMenuClick = () => {
    setIsSideMenuOpen(true)
  }

  const handleSideMenuClose = () => {
    setIsSideMenuOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TitleBar title={title} onMenuClick={handleMenuClick} activeTab={activeTab} onTabChange={onTabChange} />

      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={handleSideMenuClose}
        onNavigate={onNavigate}
        currentRoute={currentRoute}
      />

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col gap-2 sm:gap-4">{children}</div>
    </div>
  )
}

