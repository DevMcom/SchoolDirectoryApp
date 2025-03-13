"use client"

import { useState, useMemo } from "react"
import type { Student } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface GradeViewProps {
  data: Student[]
  onSelectStudent: (student: Student) => void
  onSelectStudents: (students: Student[]) => void
  onSelectGrade: (grade: string) => void
  onSelectTeacher: (teacher: string) => void
}

export function GradeView({ data, onSelectStudent, onSelectStudents, onSelectGrade, onSelectTeacher }: GradeViewProps) {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)

  // Get unique grades
  const grades = useMemo(() => {
    const gradeSet = new Set(data.map((student) => student.grade))
    return Array.from(gradeSet).sort((a, b) => {
      // Sort grades in logical order (K, 1, 2, 3, etc.)
      if (a === "K") return -1
      if (b === "K") return 1
      return Number.parseInt(a) - Number.parseInt(b)
    })
  }, [data])

  // Get teachers for selected grade
  const teachers = useMemo(() => {
    if (!selectedGrade) return []

    const teachersMap = new Map()

    data
      .filter((student) => student.grade === selectedGrade)
      .forEach((student) => {
        const key = `${student.teacherFirstName} ${student.teacherLastName}`
        teachersMap.set(key, {
          firstName: student.teacherFirstName,
          lastName: student.teacherLastName,
          room: student.teacherRoom,
        })
      })

    return Array.from(teachersMap.values()).sort((a, b) => a.lastName.localeCompare(b.lastName))
  }, [data, selectedGrade])

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade)
    setSelectedTeacher(null)
    onSelectGrade(grade)
  }

  const handleTeacherSelect = (teacher: string) => {
    setSelectedTeacher(teacher)
    onSelectTeacher(teacher)
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <div className="flex flex-wrap gap-2">
          {grades.map((grade) => (
            <Button
              key={grade}
              variant={selectedGrade === grade ? "default" : "outline"}
              size="sm"
              onClick={() => handleGradeSelect(grade)}
            >
              {grade === "K" ? "Kindergarten" : `Grade ${grade}`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

