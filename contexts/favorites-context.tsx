"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type FavoritesState,
  loadFavorites,
  addStudentToFavorites,
  addParentToFavorites,
  removeFromFavorites,
  isStudentFavorited,
  isParentFavorited,
} from "@/lib/favorites-utils"
import type { Student } from "@/lib/types"
import type { ParentInfo } from "@/components/search-view"

interface FavoritesContextType {
  favorites: FavoritesState
  addStudent: (student: Student) => void
  addParent: (parent: ParentInfo) => void
  removeItem: (favoriteId: string) => void
  isStudentInFavorites: (studentId: string) => boolean
  isParentInFavorites: (parentId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritesState>({ items: [] })

  // Load favorites from localStorage on initial render
  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  const addStudent = (student: Student) => {
    const updatedFavorites = addStudentToFavorites(student)
    setFavorites(updatedFavorites)
  }

  const addParent = (parent: ParentInfo) => {
    const updatedFavorites = addParentToFavorites(parent)
    setFavorites(updatedFavorites)
  }

  const removeItem = (favoriteId: string) => {
    const updatedFavorites = removeFromFavorites(favoriteId)
    setFavorites(updatedFavorites)
  }

  const isStudentInFavorites = (studentId: string) => {
    return isStudentFavorited(studentId)
  }

  const isParentInFavorites = (parentId: string) => {
    return isParentFavorited(parentId)
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addStudent,
        addParent,
        removeItem,
        isStudentInFavorites,
        isParentInFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}

