"use client"

import { useEffect, useState, useCallback } from "react"
import { GradeView } from "@/components/grade-view"
import { TeacherView } from "@/components/teacher-view"
import { SearchView, type ParentInfo } from "@/components/search-view"
import { StudentDetails } from "@/components/student-details"
import { ParentDetails } from "@/components/parent-details"
import { StudentListView } from "@/components/student-list-view"
import { fetchAndProcessData } from "@/lib/data-utils"
import type { Student } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { ChevronLeft, User, Users, Star } from "lucide-react"
import { useFavorites } from "@/contexts/favorites-context"

type DetailViewType = "none" | "student" | "parent" | "studentList" | "searchResults" | "teacherList" | "search"

interface SchoolDirectoryProps {
  onNavigate: (route: string) => void
}

export function SchoolDirectory({ onNavigate }: SchoolDirectoryProps) {
  const [data, setData] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedParent, setSelectedParent] = useState<ParentInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [studentsList, setStudentsList] = useState<Student[]>([])
  const [detailViewType, setDetailViewType] = useState<DetailViewType>("none")
  const [siblings, setSiblings] = useState<Student[]>([])
  const [title, setTitle] = useState("Directory")
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("grade") // Set grade as default tab
  const [searchResults, setSearchResults] = useState<{
    students: Student[]
    parents: ParentInfo[]
  } | null>(null)

  const { addStudent, addParent, removeItem, isStudentInFavorites, isParentInFavorites } = useFavorites()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const processedData = await fetchAndProcessData()
        setData(processedData)
      } catch (err) {
        console.error("Failed to load directory data:", err)
        setError("Failed to load directory data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Find siblings when a student is selected
  useEffect(() => {
    if (selectedStudent && detailViewType === "student") {
      findSiblings(selectedStudent)
    }
  }, [selectedStudent, detailViewType])

  // Update title based on selection
  useEffect(() => {
    if (selectedStudent) {
      // Include nickname in title if available
      if (selectedStudent.nickname) {
        setTitle(`${selectedStudent.firstName} "${selectedStudent.nickname}" ${selectedStudent.lastName}`)
      } else {
        setTitle(`${selectedStudent.firstName} ${selectedStudent.lastName}`)
      }
    } else if (selectedParent) {
      setTitle(`${selectedParent.firstName} ${selectedParent.lastName}`)
    } else if (selectedTeacher) {
      // Find the grade for this teacher if not already selected
      if (selectedGrade) {
        setTitle(`${selectedTeacher} (${selectedGrade === "K" ? "K" : selectedGrade})`)
      } else {
        // Try to find the grade from the students list
        const teacherParts = selectedTeacher.split(" ")
        const firstName = teacherParts[0]
        const lastName = teacherParts[1]

        const teacherStudent = data.find(
          (student) => student.teacherFirstName === firstName && student.teacherLastName === lastName,
        )

        if (teacherStudent) {
          setTitle(`${selectedTeacher} (${teacherStudent.grade === "K" ? "K" : teacherStudent.grade})`)
        } else {
          setTitle(selectedTeacher)
        }
      }
    } else if (selectedGrade) {
      setTitle(selectedGrade === "K" ? "Kindergarten" : `Grade ${selectedGrade}`)
    } else {
      setTitle("Directory")
    }
  }, [selectedStudent, selectedParent, selectedTeacher, selectedGrade, data])

  const findSiblings = (student: Student) => {
    const siblingsList: Student[] = []

    // Helper function to check if two students share a parent
    const shareParent = (s1: Student, s2: Student): boolean => {
      // Check primary address parents
      if (
        (s1.f1g1FirstName &&
          s1.f1g1LastName &&
          s1.f1g1FirstName === s2.f1g1FirstName &&
          s1.f1g1LastName === s2.f1g1LastName) ||
        (s1.f1g1FirstName &&
          s1.f1g1LastName &&
          s1.f1g1FirstName === s2.f1g2FirstName &&
          s1.f1g1LastName === s2.f1g2LastName) ||
        (s1.f1g2FirstName &&
          s1.f1g2LastName &&
          s1.f1g2FirstName === s2.f1g1FirstName &&
          s1.f1g2LastName === s2.f1g1LastName) ||
        (s1.f1g2FirstName &&
          s1.f1g2LastName &&
          s1.f1g2FirstName === s2.f1g2FirstName &&
          s1.f1g2LastName === s2.f1g2LastName) ||
        // Check secondary address parents
        (s1.f2g1FirstName &&
          s1.f2g1LastName &&
          s1.f2g1FirstName === s2.f1g1FirstName &&
          s1.f2g1LastName === s2.f1g1LastName) ||
        (s1.f2g1FirstName &&
          s1.f2g1LastName &&
          s1.f2g1FirstName === s2.f1g2FirstName &&
          s1.f2g1LastName === s2.f1g2LastName) ||
        (s1.f2g2FirstName &&
          s1.f2g2LastName &&
          s1.f2g2FirstName === s2.f1g1FirstName &&
          s1.f2g2LastName === s2.f1g1LastName) ||
        (s1.f2g2FirstName &&
          s1.f2g2LastName &&
          s1.f2g2FirstName === s2.f1g2FirstName &&
          s1.f2g2LastName === s2.f1g2LastName) ||
        // Check cross-address parents
        (s1.f1g1FirstName &&
          s1.f1g1LastName &&
          s1.f1g1FirstName === s2.f2g1FirstName &&
          s1.f1g1LastName === s2.f2g1LastName) ||
        (s1.f1g1FirstName &&
          s1.f1g1LastName &&
          s1.f1g1FirstName === s2.f2g2FirstName &&
          s1.f1g1LastName === s2.f2g2LastName) ||
        (s1.f1g2FirstName &&
          s1.f1g2LastName &&
          s1.f1g2FirstName === s2.f2g1FirstName &&
          s1.f1g2LastName === s2.f2g1LastName) ||
        (s1.f1g2FirstName &&
          s1.f1g2LastName &&
          s1.f1g2FirstName === s2.f2g2FirstName &&
          s1.f1g2LastName === s2.f2g2LastName) ||
        (s1.f2g1FirstName &&
          s1.f2g1LastName &&
          s1.f2g1FirstName === s2.f2g1FirstName &&
          s1.f2g1LastName === s2.f2g1LastName) ||
        (s1.f2g1FirstName &&
          s1.f2g1LastName &&
          s1.f2g1FirstName === s2.f2g2FirstName &&
          s1.f2g1LastName === s2.f2g2LastName) ||
        (s1.f2g2FirstName &&
          s1.f2g2LastName &&
          s1.f2g2FirstName === s2.f2g1FirstName &&
          s1.f2g2LastName === s2.f2g1LastName) ||
        (s1.f2g2FirstName &&
          s1.f2g2LastName &&
          s1.f2g2FirstName === s2.f2g2FirstName &&
          s1.f2g2LastName === s2.f2g2LastName)
      ) {
        return true
      }
      return false
    }

    // Find siblings by checking if they share a parent with the selected student
    data.forEach((potentialSibling) => {
      if (potentialSibling.id !== student.id && shareParent(student, potentialSibling)) {
        siblingsList.push(potentialSibling)
      }
    })

    // Sort siblings by last name, then first name
    siblingsList.sort((a, b) => {
      const lastNameComp = a.lastName.localeCompare(b.lastName)
      if (lastNameComp !== 0) return lastNameComp
      return a.firstName.localeCompare(b.firstName)
    })

    setSiblings(siblingsList)
  }

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    setSelectedParent(null)
    setStudentsList([])
    setDetailViewType("student")
    setSearchResults(null)
  }

  const handleSelectParent = (parent: ParentInfo) => {
    setSelectedParent(parent)
    setSelectedStudent(null)
    setStudentsList([])
    setDetailViewType("parent")
    setSearchResults(null)
  }

  const handleSelectStudents = (students: Student[]) => {
    setStudentsList(students)
    setSelectedStudent(null)
    setSelectedParent(null)
    setDetailViewType("studentList")
    setSearchResults(null)
  }

  const handleSelectGrade = (grade: string) => {
    setSelectedGrade(grade)
    setSelectedTeacher(null)
    setDetailViewType("teacherList")
  }

  const handleSelectTeacher = (teacher: string) => {
    setSelectedTeacher(teacher)

    // Get students for this teacher and send them to parent component
    const [firstName, lastName] = teacher.split(" ")

    const teacherStudents = data
      .filter(
        (student) =>
          student.grade === selectedGrade &&
          student.teacherFirstName === firstName &&
          student.teacherLastName === lastName,
      )
      .sort((a, b) => a.lastName.localeCompare(b.lastName))

    handleSelectStudents(teacherStudents)
  }

  // Use useCallback to prevent recreation of this function on every render
  const handleSearch = useCallback(
    (results: { students: Student[]; parents: ParentInfo[] }) => {
      setSearchResults(results)
      // Only change detailViewType if we're not already in search mode
      if (detailViewType !== "search") {
        setDetailViewType("searchResults")
      }
    },
    [detailViewType],
  )

  const handleBackToGrades = () => {
    setSelectedGrade(null)
    setSelectedTeacher(null)
    setDetailViewType("none")
  }

  const handleBackToTeachers = () => {
    setSelectedTeacher(null)
    setDetailViewType("teacherList")
  }

  const handleBackToSearch = () => {
    setDetailViewType("search")
    setSelectedStudent(null)
    setSelectedParent(null)
  }

  // Handle tab change from title bar
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSelectedGrade(null)
    setSelectedTeacher(null)
    setSelectedStudent(null)
    setSelectedParent(null)

    if (tab === "search") {
      setDetailViewType("search")
    } else {
      setDetailViewType("none")
    }
  }

  const handleTeacherSelectFromStudent = (teacher: string, grade: string) => {
    setSelectedTeacher(teacher)
    setSelectedGrade(grade)
    setActiveTab("grade")

    // Get students for this teacher and send them to parent component
    const [firstName, lastName] = teacher.split(" ")

    const teacherStudents = data
      .filter(
        (student) =>
          student.grade === grade && student.teacherFirstName === firstName && student.teacherLastName === lastName,
      )
      .sort((a, b) => a.lastName.localeCompare(b.lastName))

    handleSelectStudents(teacherStudents)
  }

  const findParentInData = (firstName: string, lastName: string): ParentInfo | null => {
    const parentId = `${firstName}-${lastName}`.toLowerCase()
    const parentMatches = new Map<string, ParentInfo>()

    // Process each student to find the parent
    data.forEach((student) => {
      // Check primary address, first parent
      if (student.f1g1FirstName === firstName && student.f1g1LastName === lastName) {
        if (!parentMatches.has(parentId)) {
          parentMatches.set(parentId, {
            id: parentId,
            firstName,
            lastName,
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

      // Check primary address, second parent
      if (student.f1g2FirstName === firstName && student.f1g2LastName === lastName) {
        if (!parentMatches.has(parentId)) {
          parentMatches.set(parentId, {
            id: parentId,
            firstName,
            lastName,
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

      // Check secondary address, first parent
      if (student.f2g1FirstName === firstName && student.f2g1LastName === lastName) {
        if (!parentMatches.has(parentId)) {
          parentMatches.set(parentId, {
            id: parentId,
            firstName,
            lastName,
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

      // Check secondary address, second parent
      if (student.f2g2FirstName === firstName && student.f2g2LastName === lastName) {
        if (!parentMatches.has(parentId)) {
          parentMatches.set(parentId, {
            id: parentId,
            firstName,
            lastName,
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
    })

    // Return the first match if found
    const parentArray = Array.from(parentMatches.values())
    return parentArray.length > 0 ? parentArray[0] : null
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  // Determine if we should show tabs in the title bar
  const showTitleBarTabs = true

  // Render the appropriate content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "grade":
        return (
          <GradeView
            data={data}
            onSelectStudent={handleSelectStudent}
            onSelectStudents={handleSelectStudents}
            onSelectGrade={handleSelectGrade}
            onSelectTeacher={handleSelectTeacher}
          />
        )
      case "teacher":
        return (
          <TeacherView
            data={data}
            onSelectStudent={handleSelectStudent}
            onSelectStudents={handleSelectStudents}
            onSelectTeacher={(teacher) => {
              setSelectedTeacher(teacher)

              const [firstName, lastName] = teacher.split(" ")
              const teacherStudents = data
                .filter((student) => student.teacherFirstName === firstName && student.teacherLastName === lastName)
                .sort((a, b) => a.lastName.localeCompare(b.lastName))

              handleSelectStudents(teacherStudents)
            }}
          />
        )
      case "search":
        return (
          <SearchView
            data={data}
            onSelectStudent={handleSelectStudent}
            onSelectParent={handleSelectParent}
            onSearch={handleSearch}
          />
        )
      default:
        return null
    }
  }

  return (
    <AppLayout
      title={title}
      currentRoute="directory"
      onNavigate={onNavigate}
      activeTab={showTitleBarTabs ? activeTab : undefined}
      onTabChange={showTitleBarTabs ? handleTabChange : undefined}
    >
      {/* Back button when needed */}
      {(selectedStudent || selectedParent || selectedTeacher) && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start -mt-1 -ml-2"
          onClick={() => {
            if (selectedStudent || selectedParent) {
              if (activeTab === "grade" && selectedTeacher) {
                handleBackToTeachers()
              } else if (activeTab === "search") {
                setSelectedStudent(null)
                setSelectedParent(null)
                setDetailViewType("search")
              } else {
                setSelectedStudent(null)
                setSelectedParent(null)
                setDetailViewType("none")
              }
            } else if (selectedTeacher) {
              handleBackToGrades()
            }
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col gap-2 sm:gap-4">
        {/* Selection tabs - only show if no selection made */}
        {detailViewType === "none" && <Card className="p-4 w-full max-w-md mx-auto">{renderTabContent()}</Card>}

        {/* Search view */}
        {detailViewType === "search" && (
          <Card className="p-4 w-full max-w-md mx-auto">
            <SearchView
              data={data}
              onSelectStudent={handleSelectStudent}
              onSelectParent={handleSelectParent}
              onSearch={handleSearch}
            />
          </Card>
        )}

        {/* Grade selected - show teachers */}
        {selectedGrade && detailViewType === "teacherList" && (
          <Card className="p-4 w-full max-w-md mx-auto">
            <ScrollArea className="h-60">
              <div className="space-y-0.5">
                {data
                  .filter((student) => student.grade === selectedGrade)
                  .reduce(
                    (teachers, student) => {
                      const key = `${student.teacherFirstName} ${student.teacherLastName}`
                      if (!teachers.some((t) => t.name === key)) {
                        teachers.push({
                          name: key,
                          room: student.teacherRoom,
                        })
                      }
                      return teachers
                    },
                    [] as { name: string; room: string }[],
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((teacher) => (
                    <Button
                      key={teacher.name}
                      variant={selectedTeacher === teacher.name ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleSelectTeacher(teacher.name)}
                    >
                      {teacher.name} - Room {teacher.room}
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Details panel */}
        <Card className="p-4 flex-1">
          {detailViewType === "student" && selectedStudent ? (
            <div className="space-y-4">
              <StudentDetails
                student={selectedStudent}
                onSelectStudent={handleSelectStudent}
                onSelectTeacher={handleTeacherSelectFromStudent}
                onSelectParent={(firstName, lastName) => {
                  // Find parent in data
                  const parentInfo = findParentInData(firstName, lastName)
                  if (parentInfo) {
                    handleSelectParent(parentInfo)
                  }
                }}
              />

              {siblings.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Siblings:</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {siblings.map((sibling) => (
                      <Button
                        key={sibling.id}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleSelectStudent(sibling)}
                      >
                        <div className="text-left">
                          <div>
                            {sibling.firstName} {sibling.lastName}
                            {sibling.nickname && <span className="text-gray-500 ml-1">({sibling.nickname})</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            <button
                              className="hover:underline focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTeacherSelectFromStudent(
                                  `${sibling.teacherFirstName} ${sibling.teacherLastName}`,
                                  sibling.grade,
                                )
                              }}
                            >
                              {sibling.grade === "K" ? "K" : sibling.grade} • {sibling.teacherFirstName}{" "}
                              {sibling.teacherLastName}
                            </button>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : detailViewType === "parent" && selectedParent ? (
            <ParentDetails
              parent={selectedParent}
              onSelectStudent={handleSelectStudent}
              onSelectParent={(firstName, lastName) => {
                // Find parent in data
                const parentInfo = findParentInData(firstName, lastName)
                if (parentInfo) {
                  handleSelectParent(parentInfo)
                }
              }}
            />
          ) : detailViewType === "studentList" && studentsList.length > 0 ? (
            <StudentListView
              students={studentsList}
              teacherName={selectedTeacher || ""}
              grade={selectedGrade || ""}
              onSelectStudent={handleSelectStudent}
            />
          ) : (detailViewType === "searchResults" || detailViewType === "search") && searchResults ? (
            <div className="space-y-4">
              {searchResults.students.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Students:</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {searchResults.students.map((student) => {
                      const isFavorited = isStudentInFavorites(student.id)

                      return (
                        <div key={`student-${student.id}`} className="relative">
                          <Button
                            variant="ghost"
                            className="justify-start p-3 h-auto w-full"
                            onClick={() => handleSelectStudent(student)}
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
                                <div className="text-xs text-gray-500 truncate">
                                  {student.grade === "K" ? "K" : student.grade} • {student.teacherFirstName}{" "}
                                  {student.teacherLastName}
                                </div>
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
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isFavorited) {
                                const favoriteId = `student-fav-${student.id}`
                                removeItem(favoriteId)
                              } else {
                                addStudent(student)
                              }
                            }}
                          >
                            <Star className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
                            <span className="sr-only">
                              {isFavorited ? "Remove from favorites" : "Add to favorites"}
                            </span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {searchResults.parents.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Parents:</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {searchResults.parents.map((parent) => {
                      const isFavorited = isParentInFavorites(parent.id)

                      return (
                        <div key={`parent-${parent.id}`} className="relative">
                          <Button
                            variant="ghost"
                            className="justify-start p-3 h-auto w-full"
                            onClick={() => handleSelectParent(parent)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="bg-green-100 text-green-700 rounded-full p-2 flex-shrink-0">
                                <Users className="h-5 w-5" />
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {parent.firstName} {parent.lastName}
                                  <span className="text-blue-500 ml-1">(parent)</span>
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {parent.students.map((student, idx) => (
                                    <span key={student.id}>
                                      {idx > 0 ? ", " : ""}
                                      {student.nickname || student.firstName} (
                                      {student.grade === "K" ? "K" : student.grade})
                                    </span>
                                  ))}
                                </div>
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
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isFavorited) {
                                const favoriteId = `parent-fav-${parent.id}`
                                removeItem(favoriteId)
                              } else {
                                addParent(parent)
                              }
                            }}
                          >
                            <Star className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
                            <span className="sr-only">
                              {isFavorited ? "Remove from favorites" : "Add to favorites"}
                            </span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {searchResults.students.length === 0 && searchResults.parents.length === 0 && (
                <div className="text-center p-4 text-gray-500">No results found</div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              {detailViewType === "teacherList" ? (
                <p>Select a teacher to view their class</p>
              ) : (
                <p>Select a grade, teacher, or search for a student or parent to view details</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-blue-600 p-3">
        <Skeleton className="h-8 w-40 bg-blue-500" />
      </div>
      <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
        <Card className="p-4 w-full max-w-md mx-auto">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
        </Card>
        <Card className="p-4 flex-1">
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    </div>
  )
}

