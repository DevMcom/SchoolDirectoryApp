"use client"

import { Menu, Search, Users, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TitleBarProps {
  title: string
  onMenuClick: () => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function TitleBar({ title, onMenuClick, activeTab, onTabChange }: TitleBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-blue-600 text-white shadow-md">
      <div className="container mx-auto">
        {/* Main title bar */}
        <div className="flex justify-between items-center p-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          <h1 className="text-lg sm:text-xl font-semibold truncate max-w-[200px] sm:max-w-none">{title}</h1>
          <div className="w-5"></div> {/* Spacer to balance the layout */}
        </div>

        {/* Quick access tabs - only show when at root level */}
        {onTabChange && activeTab && (
          <div className="flex text-xs sm:text-sm border-t border-blue-500">
            <button
              className={`flex-1 py-1 sm:py-2 px-1 sm:px-3 flex justify-center items-center gap-1 ${activeTab === "grade" ? "bg-blue-700" : "hover:bg-blue-700"}`}
              onClick={() => onTabChange("grade")}
            >
              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Grades</span>
            </button>
            <button
              className={`flex-1 py-1 sm:py-2 px-1 sm:px-3 flex justify-center items-center gap-1 ${activeTab === "teacher" ? "bg-blue-700" : "hover:bg-blue-700"}`}
              onClick={() => onTabChange("teacher")}
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Teachers</span>
            </button>
            <button
              className={`flex-1 py-1 sm:py-2 px-1 sm:px-3 flex justify-center items-center gap-1 ${activeTab === "search" ? "bg-blue-700" : "hover:bg-blue-700"}`}
              onClick={() => onTabChange("search")}
            >
              <Search className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Search</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

