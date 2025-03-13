"use client"

import type React from "react"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { User, Star } from "lucide-react"
import type { Student } from "@/lib/types"
import { useFavorites } from "@/contexts/favorites-context"

interface StudentListViewProps {
  students: Student[]
  teacherName: string
  grade: string
  onSelectStudent: (student: Student) => void
}

export function StudentListView({ students, teacherName, grade, onSelectStudent }: StudentListViewProps) {
  const { addStudent, removeItem, isStudentInFavorites } = useFavorites()
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null)

  const handleFavoriteToggle = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()

    if (isStudentInFavorites(student.id)) {
      const favoriteId = `student-fav-${student.id}`
      removeItem(favoriteId)
    } else {
      addStudent(student)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        {teacherName} <span className="text-gray-500">({grade === "K" ? "K" : grade})</span>
      </h2>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="grid grid-cols-1 gap-2">
          {students.map((student) => {
            // Get parent names
            const parents = []
            if (student.f1g1FirstName && student.f1g1LastName) {
              parents.push(`${student.f1g1FirstName} ${student.f1g1LastName}`)
            }
            if (student.f1g2FirstName && student.f1g2LastName) {
              parents.push(`${student.f1g2FirstName} ${student.f1g2LastName}`)
            }
            if (student.f2g1FirstName && student.f2g1LastName) {
              parents.push(`${student.f2g1FirstName} ${student.f2g1LastName}`)
            }
            if (student.f2g2FirstName && student.f2g2LastName) {
              parents.push(`${student.f2g2FirstName} ${student.f2g2LastName}`)
            }

            const isFavorited = isStudentInFavorites(student.id)
            const isHovered = hoveredStudentId === student.id

            return (
              <div
                key={`${student.firstName}-${student.lastName}-${student.id}`}
                className="relative"
                onMouseEnter={() => setHoveredStudentId(student.id)}
                onMouseLeave={() => setHoveredStudentId(null)}
              >
                <Button
                  variant="ghost"
                  className="justify-start p-3 h-auto w-full"
                  onClick={() => onSelectStudent(student)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="bg-blue-100 text-blue-700 rounded-full p-2 flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {student.firstName} {student.lastName}
                        {student.nickname && <span className="text-gray-500 ml-1">({student.nickname})</span>}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{parents.join(", ")}</div>
                    </div>
                  </div>
                </Button>

                {/* Favorite button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                    isFavorited ? "text-yellow-500" : "text-gray-400"
                  } opacity-100 transition-opacity`}
                  onClick={(e) => handleFavoriteToggle(student, e)}
                >
                  <Star className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
                  <span className="sr-only">{isFavorited ? "Remove from favorites" : "Add to favorites"}</span>
                </Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

