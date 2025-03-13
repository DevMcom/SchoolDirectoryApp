import type { Student } from "./types"
import type { ParentInfo } from "@/components/search-view"

export interface FavoriteItem {
  id: string
  type: "student" | "parent"
  studentId?: string
  studentName?: string
  student?: Student
  parent?: ParentInfo
  dateAdded: string
}

export interface FavoritesState {
  items: FavoriteItem[]
}

const FAVORITES_STORAGE_KEY = "school-directory-favorites"

// Load favorites from localStorage
export function loadFavorites(): FavoritesState {
  if (typeof window === "undefined") {
    return { items: [] }
  }

  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (storedFavorites) {
      return JSON.parse(storedFavorites)
    }
  } catch (error) {
    console.error("Error loading favorites:", error)
  }

  return { items: [] }
}

// Save favorites to localStorage
export function saveFavorites(favorites: FavoritesState): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  } catch (error) {
    console.error("Error saving favorites:", error)
  }
}

// Add a student to favorites
export function addStudentToFavorites(student: Student): FavoritesState {
  const favorites = loadFavorites()

  // Check if already favorited
  if (favorites.items.some((item) => item.type === "student" && item.studentId === student.id)) {
    return favorites
  }

  const newFavorite: FavoriteItem = {
    id: `student-fav-${student.id}`,
    type: "student",
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    student: student,
    dateAdded: new Date().toISOString(),
  }

  const updatedFavorites = {
    items: [...favorites.items, newFavorite],
  }

  saveFavorites(updatedFavorites)
  return updatedFavorites
}

// Add a parent to favorites
export function addParentToFavorites(parent: ParentInfo): FavoritesState {
  const favorites = loadFavorites()

  // Check if already favorited
  if (favorites.items.some((item) => item.type === "parent" && item.id === parent.id)) {
    return favorites
  }

  const newFavorite: FavoriteItem = {
    id: `parent-fav-${parent.id}`,
    type: "parent",
    parent: parent,
    dateAdded: new Date().toISOString(),
  }

  const updatedFavorites = {
    items: [...favorites.items, newFavorite],
  }

  saveFavorites(updatedFavorites)
  return updatedFavorites
}

// Remove an item from favorites
export function removeFromFavorites(favoriteId: string): FavoritesState {
  const favorites = loadFavorites()

  const updatedFavorites = {
    items: favorites.items.filter((item) => item.id !== favoriteId),
  }

  saveFavorites(updatedFavorites)
  return updatedFavorites
}

// Check if a student is favorited
export function isStudentFavorited(studentId: string): boolean {
  const favorites = loadFavorites()
  return favorites.items.some((item) => item.type === "student" && item.studentId === studentId)
}

// Check if a parent is favorited
export function isParentFavorited(parentId: string): boolean {
  const favorites = loadFavorites()
  return favorites.items.some((item) => item.type === "parent" && item.parent?.id === parentId)
}

// Generate SMS URI for selected contacts
export function generateSmsUri(selectedContacts: { id: string; phone: string }[]): string {
  const phoneNumbers = selectedContacts.map((contact) => contact.phone.replace(/\D/g, ""))
  return `sms:${phoneNumbers.join(",")}`
}

// Generate Email URI for selected contacts
export function generateEmailUri(selectedContacts: { id: string; email: string }[]): string {
  const emails = selectedContacts.map((contact) => contact.email)
  return `mailto:${emails.join(",")}`
}

