"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { UserPlus, Mail, Phone, Smartphone, MapPin, User, Star } from "lucide-react"
import type { ParentInfo } from "./search-view"
import type { Student } from "@/lib/types"
import { useFavorites } from "@/contexts/favorites-context"

interface ParentDetailsProps {
  parent: ParentInfo
  onSelectStudent: (student: Student) => void
  onSelectParent?: (firstName: string, lastName: string) => void
}

interface ParentData {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  secondPhone: string | null
  isSelectedParent: boolean
}

interface AddressData {
  addressLine: string
  city: string
  state: string
  zip: string
  parents: ParentData[]
  students: Student[]
}

export function ParentDetails({ parent, onSelectStudent, onSelectParent }: ParentDetailsProps) {
  const { addParent, isParentInFavorites, removeItem } = useFavorites()
  const isFavorited = isParentInFavorites(parent.id)

  const toggleFavorite = () => {
    if (isFavorited) {
      const favoriteId = `parent-fav-${parent.id}`
      removeItem(favoriteId)
    } else {
      addParent(parent)
    }
  }

  // Group by address
  const addresses = new Map<string, AddressData>()
  const processedAddresses = new Set<string>()

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
    firstName: string,
    lastName: string,
    email: string | null,
    phone: string | null,
    secondPhone: string | null,
  ) => {
    let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${lastName};${firstName};;;\nFN:${firstName} ${lastName}\n`

    if (email) vcard += `EMAIL;TYPE=INTERNET:${email}\n`
    if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`
    if (secondPhone) vcard += `TEL;TYPE=WORK:${secondPhone}\n`

    vcard += "END:VCARD"

    return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`
  }

  const handleParentClick = (firstName: string, lastName: string) => {
    if (onSelectParent) {
      onSelectParent(firstName, lastName)
    }
  }

  // First pass: Find all addresses associated with this parent's students
  parent.students.forEach((student) => {
    // Process primary address
    const primaryAddressKey = `${student.f1AddressLine1}-${student.f1City}-${student.f1State}`

    if (!addresses.has(primaryAddressKey)) {
      addresses.set(primaryAddressKey, {
        addressLine: student.f1AddressLine1,
        city: student.f1City,
        state: student.f1State,
        zip: student.f1Zip,
        parents: [],
        students: [],
      })
    }

    // Add student to this address if not already added
    const primaryAddress = addresses.get(primaryAddressKey)!
    if (!primaryAddress.students.some((s) => s.id === student.id)) {
      primaryAddress.students.push(student)
    }

    // Add parents at this address if not already added
    if (student.f1g1FirstName && student.f1g1LastName) {
      const parentKey = `${student.f1g1FirstName}-${student.f1g1LastName}`
      if (!primaryAddress.parents.some((p) => `${p.firstName}-${p.lastName}` === parentKey)) {
        primaryAddress.parents.push({
          firstName: student.f1g1FirstName,
          lastName: student.f1g1LastName,
          email: student.f1g1Email,
          phone: student.f1g1Phone,
          secondPhone: student.f1g1SecondPhone,
          isSelectedParent: student.f1g1FirstName === parent.firstName && student.f1g1LastName === parent.lastName,
        })
      }
    }

    if (student.f1g2FirstName && student.f1g2LastName) {
      const parentKey = `${student.f1g2FirstName}-${student.f1g2LastName}`
      if (!primaryAddress.parents.some((p) => `${p.firstName}-${p.lastName}` === parentKey)) {
        primaryAddress.parents.push({
          firstName: student.f1g2FirstName,
          lastName: student.f1g2LastName,
          email: student.f1g2Email,
          phone: student.f1g2Phone,
          secondPhone: student.f1g2SecondPhone,
          isSelectedParent: student.f1g2FirstName === parent.firstName && student.f1g2LastName === parent.lastName,
        })
      }
    }

    // Process secondary address if it exists
    if (student.f2AddressLine1) {
      const secondaryAddressKey = `${student.f2AddressLine1}-${student.f2City}-${student.f2State}`

      if (!addresses.has(secondaryAddressKey)) {
        addresses.set(secondaryAddressKey, {
          addressLine: student.f2AddressLine1,
          city: student.f2City || "",
          state: student.f2State || "",
          zip: student.f2Zip || "",
          parents: [],
          students: [],
        })
      }

      // Add student to this address if not already added
      const secondaryAddress = addresses.get(secondaryAddressKey)!
      if (!secondaryAddress.students.some((s) => s.id === student.id)) {
        secondaryAddress.students.push(student)
      }

      // Add parents at this address if not already added
      if (student.f2g1FirstName && student.f2g1LastName) {
        const parentKey = `${student.f2g1FirstName}-${student.f2g1LastName}`
        if (!secondaryAddress.parents.some((p) => `${p.firstName}-${p.lastName}` === parentKey)) {
          secondaryAddress.parents.push({
            firstName: student.f2g1FirstName,
            lastName: student.f2g1LastName,
            email: student.f2g1Email,
            phone: student.f2g1Phone,
            secondPhone: student.f2g1SecondPhone,
            isSelectedParent: student.f2g1FirstName === parent.firstName && student.f2g1LastName === parent.lastName,
          })
        }
      }

      if (student.f2g2FirstName && student.f2g2LastName) {
        const parentKey = `${student.f2g2FirstName}-${student.f2g2LastName}`
        if (!secondaryAddress.parents.some((p) => `${p.firstName}-${p.lastName}` === parentKey)) {
          secondaryAddress.parents.push({
            firstName: student.f2g2FirstName,
            lastName: student.f2g2LastName,
            email: student.f2g2Email,
            phone: student.f2g2Phone,
            secondPhone: student.f2g2SecondPhone,
            isSelectedParent: student.f2g2FirstName === parent.firstName && student.f2g2LastName === parent.lastName,
          })
        }
      }
    }
  })

  // Find the address where the selected parent is located
  let selectedParentAddress: AddressData | null = null
  const otherAddresses: AddressData[] = []

  addresses.forEach((address) => {
    if (address.parents.some((p) => p.isSelectedParent)) {
      selectedParentAddress = address
    } else {
      otherAddresses.push(address)
    }
  })

  // Sort addresses: selected parent's address first, then others
  const sortedAddresses: AddressData[] = []
  if (selectedParentAddress) {
    sortedAddresses.push(selectedParentAddress)
  }
  sortedAddresses.push(...otherAddresses)

  // Sort students in each address
  sortedAddresses.forEach((address) => {
    address.students.sort((a, b) => {
      const lastNameComp = a.lastName.localeCompare(b.lastName)
      if (lastNameComp !== 0) return lastNameComp
      return a.firstName.localeCompare(b.firstName)
    })
  })

  // Get all students
  const allStudents = [...parent.students]
  allStudents.sort((a, b) => {
    const lastNameComp = a.lastName.localeCompare(b.lastName)
    if (lastNameComp !== 0) return lastNameComp
    return a.firstName.localeCompare(b.firstName)
  })

  return (
    <div className="space-y-3 max-w-full overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center truncate">
            {parent.firstName} {parent.lastName}
          </h2>
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

      {/* Display all addresses with their parents */}
      <div className="space-y-4">
        {sortedAddresses.map((address, addressIndex) => (
          <div key={addressIndex} className="space-y-1">
            <div className="flex items-start">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
              <div className="w-full overflow-hidden">
                <a
                  href={createMapLink(address.addressLine, address.city, address.state, address.zip)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-500 hover:underline"
                >
                  <div className="break-words">{address.addressLine}</div>
                  <div>
                    {address.city}, {address.state} {address.zip}
                  </div>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-2">
              {address.parents.map((addressParent, parentIndex) => (
                <Card
                  key={parentIndex}
                  className={`overflow-hidden border-gray-200 hover:border-blue-300 transition-colors ${
                    addressParent.isSelectedParent ? "border-blue-500" : ""
                  }`}
                >
                  <CardContent className="p-0">
                    <div className="bg-gray-50 p-2 flex justify-between items-center border-b">
                      <h3 className="font-medium text-sm truncate max-w-[70%]">
                        <button
                          onClick={() => handleParentClick(addressParent.firstName, addressParent.lastName)}
                          className="hover:underline focus:outline-none text-left"
                        >
                          {addressParent.firstName} {addressParent.lastName}
                          {addressParent.isSelectedParent && <span className="text-blue-500 ml-1">(selected)</span>}
                        </button>
                      </h3>
                      <a
                        href={createContactVCard(
                          addressParent.firstName,
                          addressParent.lastName,
                          addressParent.email,
                          addressParent.phone,
                          addressParent.secondPhone,
                        )}
                        download={`${addressParent.firstName}-${addressParent.lastName}.vcf`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="sr-only">Add to contacts</span>
                      </a>
                    </div>
                    <div className="p-2 space-y-1">
                      {addressParent.phone && (
                        <div className="flex gap-2">
                          <a
                            href={createCallLink(addressParent.phone)}
                            className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                          >
                            <span className="flex items-center">
                              <Smartphone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="text-sm truncate">{addressParent.phone}</span>
                            </span>
                          </a>
                          <a
                            href={createPhoneLink(addressParent.phone)}
                            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                          >
                            <span className="sr-only">Text</span>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                      {addressParent.secondPhone && (
                        <div className="flex gap-2">
                          <a
                            href={createCallLink(addressParent.secondPhone)}
                            className="text-blue-500 hover:text-blue-700 flex-1 min-w-0"
                          >
                            <span className="flex items-center">
                              <Phone className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="text-sm truncate">{addressParent.secondPhone}</span>
                            </span>
                          </a>
                          <a
                            href={createPhoneLink(addressParent.secondPhone)}
                            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                          >
                            <span className="sr-only">Text</span>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                      {addressParent.email && (
                        <div className="text-sm break-words">
                          <a href={createEmailLink(addressParent.email)} className="text-blue-500 hover:underline">
                            <span className="flex items-center">
                              <Mail className="h-3.5 w-3.5 mr-1 inline flex-shrink-0" />
                              <span className="truncate">{addressParent.email}</span>
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {addressIndex < sortedAddresses.length - 1 && <Separator className="my-3" />}
          </div>
        ))}
      </div>

      {/* All Students */}
      <div className="mt-4">
        <h3 className="font-medium mb-2">Students:</h3>
        <div className="grid grid-cols-1 gap-2">
          {allStudents.map((student) => (
            <Button
              key={student.id}
              variant="ghost"
              className="justify-start p-3 h-auto"
              onClick={() => onSelectStudent(student)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="bg-blue-100 text-blue-700 rounded-full p-2 flex-shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium truncate">
                    {student.firstName} {student.lastName}
                    {student.nickname && <span className="text-gray-500 ml-1">({student.nickname})</span>}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {student.grade === "K" ? "K" : student.grade} • {student.teacherFirstName} {student.teacherLastName}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

