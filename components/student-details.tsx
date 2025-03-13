"use client"

import type { Student } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { UserPlus, Mail, Phone, Smartphone, MapPin, School, Star } from "lucide-react"
import { useFavorites } from "@/contexts/favorites-context"

// Update the StudentDetailsProps interface
interface StudentDetailsProps {
  student: Student
  onSelectStudent?: (student: Student) => void
  onSelectTeacher?: (teacher: string, grade: string) => void
  onSelectParent?: (firstName: string, lastName: string) => void
}

// Add the favorite button to the component
export function StudentDetails({ student, onSelectStudent, onSelectTeacher, onSelectParent }: StudentDetailsProps) {
  const { addStudent, isStudentInFavorites, removeItem } = useFavorites()
  const hasSecondAddress = Boolean(student.f2AddressLine1)
  const isFavorited = isStudentInFavorites(student.id)

  // Add the toggleFavorite function
  const toggleFavorite = () => {
    if (isFavorited) {
      // Find the favorite ID to remove
      const favoriteId = `student-fav-${student.id}`
      removeItem(favoriteId)
    } else {
      addStudent(student)
    }
  }

  // Contact link functions
  const createEmailLink = (email: string | null) => {
    if (!email) return null
    return `mailto:${email}`
  }

  const createPhoneLink = (phone: string | null) => {
    if (!phone) return null
    return `sms:${phone.replace(/\D/g, "")}`
  }

  const createCallLink = (phone: string | null) => {
    if (!phone) return null
    return `tel:${phone.replace(/\D/g, "")}`
  }

  // Function to create a map link for an address
  const createMapLink = (address: string, city: string, state: string, zip: string) => {
    const formattedAddress = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    return `https://maps.google.com?q=${formattedAddress}`
  }

  // Function to create a vCard for adding to contacts
  const createContactVCard = (
    firstName: string | null,
    lastName: string | null,
    email: string | null,
    phone: string | null,
    secondPhone: string | null,
  ) => {
    if (!firstName || !lastName) return ""

    let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${lastName};${firstName};;;\nFN:${firstName} ${lastName}\n`

    if (email) vcard += `EMAIL;TYPE=INTERNET:${email}\n`
    if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`
    if (secondPhone) vcard += `TEL;TYPE=WORK:${secondPhone}\n`

    vcard += "END:VCARD"

    return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`
  }

  // Handle teacher click
  const handleTeacherClick = () => {
    if (onSelectTeacher) {
      onSelectTeacher(`${student.teacherFirstName} ${student.teacherLastName}`, student.grade)
    }
  }

  const handleParentClick = (firstName: string | null, lastName: string | null) => {
    if (onSelectParent && firstName && lastName) {
      onSelectParent(firstName, lastName)
    }
  }

  return (
    <div className="space-y-3 max-w-full overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center">
            {student.firstName} {student.lastName}
            {student.nickname && <span className="text-lg font-normal ml-2">({student.nickname})</span>}
          </h2>
          <div className="text-gray-500 flex items-center gap-1">
            <School className="h-3.5 w-3.5 flex-shrink-0" />
            <span
              onClick={handleTeacherClick}
              className="hover:underline focus:outline-none truncate cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleTeacherClick()}
            >
              {student.grade === "K" ? "K" : student.grade} • {student.teacherFirstName} {student.teacherLastName} •
              Room {student.teacherRoom}
            </span>
          </div>
        </div>

        {/* Add favorite button */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFavorite}
          className={isFavorited ? "text-yellow-500" : "text-gray-400"}
        >
          <Star className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
          <span className="sr-only">{isFavorited ? "Remove from favorites" : "Add to favorites"}</span>
        </Button>
      </div>

      <Separator />

      {/* Display both addresses without tabs */}
      <div className="space-y-4">
        {/* Primary Address */}
        <div className="space-y-1">
          <div className="flex items-start">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
            <div className="w-full overflow-hidden">
              <a
                href={createMapLink(student.f1AddressLine1, student.f1City, student.f1State, student.f1Zip)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 hover:underline"
              >
                <div className="break-words">{student.f1AddressLine1}</div>
                <div>
                  {student.f1City}, {student.f1State} {student.f1Zip}
                </div>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-2">
            {student.f1g1FirstName && (
              <Card className="overflow-hidden border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-0">
                  <div className="bg-gray-50 p-2 flex justify-between items-center border-b">
                    <h3 className="font-medium text-sm truncate max-w-[70%]">
                      <button
                        onClick={() => handleParentClick(student.f1g1FirstName, student.f1g1LastName)}
                        className="hover:underline focus:outline-none text-left"
                      >
                        {student.f1g1FirstName} {student.f1g1LastName}
                      </button>
                    </h3>
                    <a
                      href={createContactVCard(
                        student.f1g1FirstName,
                        student.f1g1LastName,
                        student.f1g1Email,
                        student.f1g1Phone,
                        student.f1g1SecondPhone,
                      )}
                      download={`${student.f1g1FirstName}-${student.f1g1LastName}.vcf`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="sr-only">Add to contacts</span>
                    </a>
                  </div>
                  <div className="p-2 space-y-1">
                    {student.f1g1Phone && (
                      <div className="flex gap-2">
                        <a
                          href={createCallLink(student.f1g1Phone)}
                          className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                        >
                          <span className="flex items-center">
                            <Smartphone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                            <span className="text-sm truncate">{student.f1g1Phone}</span>
                          </span>
                        </a>
                        <a
                          href={createPhoneLink(student.f1g1Phone)}
                          className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                        >
                          <span className="sr-only">Text</span>
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                    {student.f1g1SecondPhone && (
                      <div className="flex gap-2">
                        <a
                          href={createCallLink(student.f1g1SecondPhone)}
                          className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                        >
                          <span className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                            <span className="text-sm truncate">{student.f1g1SecondPhone}</span>
                          </span>
                        </a>
                        <a
                          href={createPhoneLink(student.f1g1SecondPhone)}
                          className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                        >
                          <span className="sr-only">Text</span>
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                    {student.f1g1Email && (
                      <div className="text-sm break-words">
                        <a href={createEmailLink(student.f1g1Email)} className="text-blue-500 hover:underline">
                          <span className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                            <span className="truncate">{student.f1g1Email}</span>
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {student.f1g2FirstName && (
              <Card className="overflow-hidden border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-0">
                  <div className="bg-gray-50 p-2 flex justify-between items-center border-b">
                    <h3 className="font-medium text-sm truncate max-w-[70%]">
                      <button
                        onClick={() => handleParentClick(student.f1g2FirstName, student.f1g2LastName)}
                        className="hover:underline focus:outline-none text-left"
                      >
                        {student.f1g2FirstName} {student.f1g2LastName}
                      </button>
                    </h3>
                    <a
                      href={createContactVCard(
                        student.f1g2FirstName,
                        student.f1g2LastName,
                        student.f1g2Email,
                        student.f1g2Phone,
                        student.f1g2SecondPhone,
                      )}
                      download={`${student.f1g2FirstName}-${student.f1g2LastName}.vcf`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="sr-only">Add to contacts</span>
                    </a>
                  </div>
                  <div className="p-2 space-y-1">
                    {student.f1g2Phone && (
                      <div className="flex gap-2">
                        <a
                          href={createCallLink(student.f1g2Phone)}
                          className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                        >
                          <span className="flex items-center">
                            <Smartphone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                            <span className="text-sm truncate">{student.f1g2Phone}</span>
                          </span>
                        </a>
                        <a
                          href={createPhoneLink(student.f1g2Phone)}
                          className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                        >
                          <span className="sr-only">Text</span>
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                    {student.f1g2SecondPhone && (
                      <div className="flex gap-2">
                        <a
                          href={createCallLink(student.f1g2SecondPhone)}
                          className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                        >
                          <span className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                            <span className="text-sm truncate">{student.f1g2SecondPhone}</span>
                          </span>
                        </a>
                        <a
                          href={createPhoneLink(student.f1g2SecondPhone)}
                          className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                        >
                          <span className="sr-only">Text</span>
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                    {student.f1g2Email && (
                      <div className="text-sm break-words">
                        <a href={createEmailLink(student.f1g2Email)} className="text-blue-500 hover:underline">
                          <span className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                            <span className="truncate">{student.f1g2Email}</span>
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Secondary Address (if exists) */}
        {hasSecondAddress && (
          <div className="space-y-1 mt-2">
            <h3 className="font-medium text-sm text-gray-500">Secondary Address:</h3>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
              <div className="w-full overflow-hidden">
                <a
                  href={createMapLink(
                    student.f2AddressLine1 || "",
                    student.f2City || "",
                    student.f2State || "",
                    student.f2Zip || "",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-500 hover:underline"
                >
                  <div className="break-words">{student.f2AddressLine1}</div>
                  <div>
                    {student.f2City}, {student.f2State} {student.f2Zip}
                  </div>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-2">
              {student.f2g1FirstName && (
                <Card className="overflow-hidden border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-0">
                    <div className="bg-gray-50 p-2 flex justify-between items-center border-b">
                      <h3 className="font-medium text-sm truncate max-w-[70%]">
                        <button
                          onClick={() => handleParentClick(student.f2g1FirstName, student.f2g1LastName)}
                          className="hover:underline focus:outline-none text-left"
                        >
                          {student.f2g1FirstName} {student.f2g1LastName}
                        </button>
                      </h3>
                      <a
                        href={createContactVCard(
                          student.f2g1FirstName,
                          student.f2g1LastName,
                          student.f2g1Email,
                          student.f2g1Phone,
                          student.f2g1SecondPhone,
                        )}
                        download={`${student.f2g1FirstName}-${student.f2g1LastName}.vcf`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="sr-only">Add to contacts</span>
                      </a>
                    </div>
                    <div className="p-2 space-y-1">
                      {student.f2g1Phone && (
                        <div className="flex gap-2">
                          <a
                            href={createCallLink(student.f2g1Phone)}
                            className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                          >
                            <span className="flex items-center">
                              <Smartphone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="text-sm truncate">{student.f2g1Phone}</span>
                            </span>
                          </a>
                          <a
                            href={createPhoneLink(student.f2g1Phone)}
                            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                          >
                            <span className="sr-only">Text</span>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                      {student.f2g1SecondPhone && (
                        <div className="flex gap-2">
                          <a
                            href={createCallLink(student.f2g1SecondPhone)}
                            className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                          >
                            <span className="flex items-center">
                              <Phone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="text-sm truncate">{student.f2g1SecondPhone}</span>
                            </span>
                          </a>
                          <a
                            href={createPhoneLink(student.f2g1SecondPhone)}
                            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                          >
                            <span className="sr-only">Text</span>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                      {student.f2g1Email && (
                        <div className="text-sm break-words">
                          <a href={createEmailLink(student.f2g1Email)} className="text-blue-500 hover:underline">
                            <span className="flex items-center">
                              <Mail className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="truncate">{student.f2g1Email}</span>
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {student.f2g2FirstName && (
                <Card className="overflow-hidden border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-0">
                    <div className="bg-gray-50 p-2 flex justify-between items-center border-b">
                      <h3 className="font-medium text-sm truncate max-w-[70%]">
                        <button
                          onClick={() => handleParentClick(student.f2g2FirstName, student.f2g2LastName)}
                          className="hover:underline focus:outline-none text-left"
                        >
                          {student.f2g2FirstName} {student.f2g2LastName}
                        </button>
                      </h3>
                      <a
                        href={createContactVCard(
                          student.f2g2FirstName,
                          student.f2g2LastName,
                          student.f2g2Email,
                          student.f2g2Phone,
                          student.f2g2SecondPhone,
                        )}
                        download={`${student.f2g2FirstName}-${student.f2g2LastName}.vcf`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="sr-only">Add to contacts</span>
                      </a>
                    </div>
                    <div className="p-2 space-y-1">
                      {student.f2g2Phone && (
                        <div className="flex gap-2">
                          <a
                            href={createCallLink(student.f2g2Phone)}
                            className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                          >
                            <span className="flex items-center">
                              <Smartphone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="text-sm truncate">{student.f2g2Phone}</span>
                            </span>
                          </a>
                          <a
                            href={createPhoneLink(student.f2g2Phone)}
                            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                          >
                            <span className="sr-only">Text</span>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                      {student.f2g2SecondPhone && (
                        <div className="flex gap-2">
                          <a
                            href={createCallLink(student.f2g2SecondPhone)}
                            className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                          >
                            <span className="flex items-center">
                              <Phone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="text-sm truncate">{student.f2g2SecondPhone}</span>
                            </span>
                          </a>
                          <a
                            href={createPhoneLink(student.f2g2SecondPhone)}
                            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                          >
                            <span className="sr-only">Text</span>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                      {student.f2g2Email && (
                        <div className="text-sm break-words">
                          <a href={createEmailLink(student.f2g2Email)} className="text-blue-500 hover:underline">
                            <span className="flex items-center">
                              <Mail className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="truncate">{student.f2g2Email}</span>
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

