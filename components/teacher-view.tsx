"use client"

import { useState, useMemo } from "react"
import type { Student } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TeacherViewProps {
  data: Student[]
  onSelectStudent: (student: Student) => void
  onSelectStudents: (students: Student[]) => void
  onSelectTeacher: (teacher: string) => void
}

export function TeacherView({ data, onSelectStudent, onSelectStudents, onSelectTeacher }: TeacherViewProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)

  // Get unique teachers
  const teachers = useMemo(() => {
    const teachersMap = new Map()

    data.forEach((student) => {
      const key = `${student.teacherFirstName} ${student.teacherLastName}`
      if (!teachersMap.has(key)) {
        teachersMap.set(key, {
          id: key,
          name: `${student.teacherFirstName} ${student.teacherLastName}`,
          grade: student.grade,
          room: student.teacherRoom,
        })
      }
    })

    return Array.from(teachersMap.values()).sort((a, b) => {
      // Sort by grade first (K, then 1, 2, 3, etc.)
      if (a.grade === "K" && b.grade !== "K") return -1
      if (a.grade !== "K" && b.grade === "K") return 1
      if (a.grade !== b.grade) return Number.parseInt(a.grade) - Number.parseInt(b.grade)
      // Then by last name
      return a.name.split(" ")[1].localeCompare(b.name.split(" ")[1])
    })
  }, [data])

  return (
    <div className="space-y-4 pt-2">
      <div>
        <Select
          onValueChange={(value) => {
            setSelectedTeacher(value)
            onSelectTeacher(value)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.name}>
                {teacher.name} - {teacher.grade === "K" ? "K" : teacher.grade} (Room {teacher.room})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

