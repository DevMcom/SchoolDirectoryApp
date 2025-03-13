"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef } from "react"
import type { Student } from "@/lib/types"
import { Input } from "@/components/ui/input"

interface SearchViewProps {
  data: Student[]
  onSelectStudent: (student: Student) => void
  onSelectParent: (parentInfo: ParentInfo) => void
  onSearch: (results: { students: Student[]; parents: ParentInfo[] }) => void
}

export interface ParentInfo {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  secondPhone: string | null
  students: Student[]
}

export function SearchView({ data, onSelectStudent, onSelectParent, onSearch }: SearchViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [hasSelection, setHasSelection] = useState(false)
  const prevSearchTermRef = useRef("")

  // Filter and deduplicate results based on search term
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { students: [], parents: [] }

    const term = searchTerm.toLowerCase().trim()
    const studentMatches: Student[] = []
    const studentIds = new Set<string>() // Add this to track unique student IDs
    const parentMatches = new Map<string, ParentInfo>()

    // Process each student
    data.forEach((student) => {
      // Check for student name matches
      if (
        student.firstName.toLowerCase().startsWith(term) ||
        student.lastName.toLowerCase().startsWith(term) ||
        (student.nickname && student.nickname.toLowerCase().startsWith(term)) ||
        `${student.firstName.toLowerCase()} ${student.lastName.toLowerCase()}`.startsWith(term)
      ) {
        // Only add if we haven't already added this student
        if (!studentIds.has(student.id)) {
          studentMatches.push(student)
          studentIds.add(student.id) // Mark this student as added
        }
      }

      // Check for partial name matches (first name + partial last name)
      const nameParts = term.split(" ")
      if (nameParts.length > 1) {
        const firstName = nameParts[0]
        const partialLastName = nameParts.slice(1).join(" ")

        if (
          student.firstName.toLowerCase() === firstName &&
          student.lastName.toLowerCase().startsWith(partialLastName)
        ) {
          // Only add if we haven't already added this student
          if (!studentIds.has(student.id)) {
            studentMatches.push(student)
            studentIds.add(student.id) // Mark this student as added
          }
        }
      }

      // Primary address, first parent
      if (student.f1g1FirstName && student.f1g1LastName) {
        const parentFirstName = student.f1g1FirstName
        const parentLastName = student.f1g1LastName

        // Check for exact matches
        if (
          parentFirstName.toLowerCase().startsWith(term) ||
          parentLastName.toLowerCase().startsWith(term) ||
          `${parentFirstName.toLowerCase()} ${parentLastName.toLowerCase()}`.startsWith(term)
        ) {
          const parentId = `${parentFirstName}-${parentLastName}`.toLowerCase()

          if (!parentMatches.has(parentId)) {
            parentMatches.set(parentId, {
              id: parentId,
              firstName: parentFirstName,
              lastName: parentLastName,
              email: student.f1g1Email,
              phone: student.f1g1Phone,
              secondPhone: student.f1g1SecondPhone,
              students: [],
            })
          }

          // Ensure we don't add duplicate students
          if (!parentMatches.get(parentId)!.students.some((s) => s.id === student.id)) {
            parentMatches.get(parentId)!.students.push(student)
          }
        }

        // Check for partial name matches (first name + partial last name)
        const nameParts = term.split(" ")
        if (nameParts.length > 1) {
          const firstName = nameParts[0]
          const partialLastName = nameParts.slice(1).join(" ")

          if (parentFirstName.toLowerCase() === firstName && parentLastName.toLowerCase().startsWith(partialLastName)) {
            const parentId = `${parentFirstName}-${parentLastName}`.toLowerCase()

            if (!parentMatches.has(parentId)) {
              parentMatches.set(parentId, {
                id: parentId,
                firstName: parentFirstName,
                lastName: parentLastName,
                email: student.f1g1Email,
                phone: student.f1g1Phone,
                secondPhone: student.f1g1SecondPhone,
                students: [],
              })
            }

            // Ensure we don't add duplicate students
            if (!parentMatches.get(parentId)!.students.some((s) => s.id === student.id)) {
              parentMatches.get(parentId)!.students.push(student)
            }
          }
        }
      }

      // Primary address, second parent
      if (student.f1g2FirstName && student.f1g2LastName) {
        const parentFirstName = student.f1g2FirstName
        const parentLastName = student.f1g2LastName

        // Check for exact matches
        if (
          parentFirstName.toLowerCase().startsWith(term) ||
          parentLastName.toLowerCase().startsWith(term) ||
          `${parentFirstName.toLowerCase()} ${parentLastName.toLowerCase()}`.startsWith(term)
        ) {
          const parentId = `${parentFirstName}-${parentLastName}`.toLowerCase()

          if (!parentMatches.has(parentId)) {
            parentMatches.set(parentId, {
              id: parentId,
              firstName: parentFirstName,
              lastName: parentLastName,
              email: student.f1g2Email,
              phone: student.f1g2Phone,
              secondPhone: student.f1g2SecondPhone,
              students: [],
            })
          }

          // Ensure we don't add duplicate students
          if (!parentMatches.get(parentId)!.students.some((s) => s.id === student.id)) {
            parentMatches.get(parentId)!.students.push(student)
          }
        }

        // Check for partial name matches (first name + partial last name)
        const nameParts = term.split(" ")
        if (nameParts.length > 1) {
          const firstName = nameParts[0]
          const partialLastName = nameParts.slice(1).join(" ")

          if (parentFirstName.toLowerCase() === firstName && parentLastName.toLowerCase().startsWith(partialLastName)) {
            const parentId = `${parentFirstName}-${parentLastName}`.toLowerCase()

            if (!parentMatches.has(parentId)) {
              parentMatches.set(parentId, {
                id: parentId,
                firstName: parentFirstName,
                lastName: parentLastName,
                email: student.f1g2Email,
                phone: student.f1g2Phone,
                secondPhone: student.f1g2SecondPhone,
                students: [],
              })
            }

            // Ensure we don't add duplicate students
            if (!parentMatches.get(parentId)!.students.some((s) => s.id === student.id)) {
              parentMatches.get(parentId)!.students.push(student)
            }
          }
        }
      }

      // Secondary address, first parent
      if (student.f2g1FirstName && student.f2g1LastName) {
        const parentFirstName = student.f2g1FirstName
        const parentLastName = student.f2g1LastName

        // Check for exact matches
        if (
          parentFirstName.toLowerCase().startsWith(term) ||
          parentLastName.toLowerCase().startsWith(term) ||
          `${parentFirstName.toLowerCase()} ${parentLastName.toLowerCase()}`.startsWith(term)
        ) {
          const parentId = `${parentFirstName}-${parentLastName}`.toLowerCase()

          if (!parentMatches.has(parentId)) {
            parentMatches.set(parentId, {
              id: parentId,
              firstName: parentFirstName,
              lastName: parentLastName,
              email: student.f2g1Email,
              phone: student.f2g1Phone,
              secondPhone: student.f2g1SecondPhone,
              students: [],
            })
          }

          // Ensure we don't add duplicate students
          if (!parentMatches.get(parentId)!.students.some((s) => s.id === student.id)) {
            parentMatches.get(parentId)!.students.push(student)
          }
        }

        // Check for partial name matches (first name + partial last name)
        const nameParts = term.split(" ")
        if (nameParts.length > 1) {
          const firstName = nameParts[0]
          const partialLastName = nameParts.slice(1).join(" ")

          if (parentFirstName.toLowerCase() === firstName && parentLastName.toLowerCase().startsWith(partialLastName)) {
            const parentId = `${parentFirstName}-${parentLastName}`.toLowerCase()

            if (!parentMatches.has(parentId)) {
              parentMatches.set(parentId, {
                id: parentId,
                firstName: parentFirstName,
                lastName: parentLastName,
                email: student.f2g1Email,
                phone: student.f2g1Phone,
                secondPhone: student.f2g1SecondPhone,
                students: [],
              })
            }

            // Ensure we don't add duplicate students
            if (!parentMatches.get(parentId)!.students.some((s) => s.id === student.id)) {
              parentMatches.get(parentId)!.students.push(student)
            }
          }
        }
      }

      // Secondary address, second parent
      if (student.f2g2FirstName && student.f2g2LastName) {
        const parentFirstName = student.f2g2FirstName
        const parentLastName = student.f2g2LastName

        // Check for exact matches
        if (
          parentFirstName.toLowerCase().startsWith(term) ||
          parentLastName.toLowerCase().startsWith(term) ||
          `${parentFirstName.toLowerCase()} ${parentLastName.toLowerCase()}`.startsWith(term)
        ) {
          const parentId = `${parentFirstName}-${parentLastName}`.toLowerCase()

          if (!parentMatches.has(parentId)) {
            parentMatches.set(parentId, {
              id: parentId,
              firstName: parentFirstName,
              lastName: parentLastName,
              email: student.f2g2Email,
              phone: student.f2g2Phone,
              secondPhone: student.f2g2SecondPhone,
              students: [],
            })
          }

          // Ensure we don't add duplicate students
          if (!parentMatches.get(parentId)!.students.some((s) => s.id === student.id)) {
            parentMatches.get(parentId)!.students.push(student)
          }
        }

        // Check for partial name matches (first name + partial last name)
        const nameParts = term.split(" ")
        if (nameParts.length > 1) {
          const firstName = nameParts[0]
          const partialLastName = nameParts.slice(1).join(" ")

          if (parentFirstName.toLowerCase() === firstName && parentLastName.toLowerCase().startsWith(partialLastName)) {
            const parentId = `${parentFirstName}-${parentLastName}`.toLowerCase()

            if (!parentMatches.has(parentId)) {
              parentMatches.set(parentId, {
                id: parentId,
                firstName: parentFirstName,
                lastName: parentLastName,
                email: student.f2g2Email,
                phone: student.f2g2Phone,
                secondPhone: student.f2g2SecondPhone,
                students: [],
              })
            }

            // Ensure we don't add duplicate students
            if (!parentMatches.get(parentId)!.students.some((s) => s.id === student.id)) {
              parentMatches.get(parentId)!.students.push(student)
            }
          }
        }
      }
    })

    // Sort students by name
    studentMatches.sort((a, b) => {
      const lastNameComp = a.lastName.localeCompare(b.lastName)
      if (lastNameComp !== 0) return lastNameComp
      return a.firstName.localeCompare(b.firstName)
    })

    // Convert parent map to array and sort by name
    const parentArray = Array.from(parentMatches.values())
    parentArray.sort((a, b) => {
      const lastNameComp = a.lastName.localeCompare(b.lastName)
      if (lastNameComp !== 0) return lastNameComp
      return a.firstName.localeCompare(b.firstName)
    })

    return {
      students: studentMatches.slice(0, 10), // Limit to 10 results
      parents: parentArray.slice(0, 10), // Limit to 10 results
    }
  }, [data, searchTerm])

  // Only call onSearch when the search term changes, not when searchResults changes
  useEffect(() => {
    // Only update if the search term has changed
    if (prevSearchTermRef.current !== searchTerm) {
      prevSearchTermRef.current = searchTerm

      if (searchTerm.trim() && !hasSelection) {
        onSearch(searchResults)
      } else if (!searchTerm.trim()) {
        onSearch({ students: [], parents: [] })
      }
    }
  }, [searchTerm, hasSelection, onSearch, searchResults])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setHasSelection(false)
  }

  const handleStudentSelect = (student: Student) => {
    onSelectStudent(student)
    setSearchTerm(`${student.firstName} ${student.lastName}`)
    setHasSelection(true)
  }

  const handleParentSelect = (parent: ParentInfo) => {
    onSelectParent(parent)
    setSearchTerm(`${parent.firstName} ${parent.lastName}`)
    setHasSelection(true)
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="relative">
        <Input
          type="text"
          placeholder="Start typing a student or parent name..."
          value={searchTerm}
          onChange={handleInputChange}
          aria-label="Search for students or parents"
        />
        <p className="text-xs text-gray-500 mt-1">
          Type a name to see results. You can search by first name, last name, or partial name.
        </p>
      </div>
    </div>
  )
}

