"use client"

import { useState, useEffect } from "react"
import { useFavorites } from "@/contexts/favorites-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Star, Trash2, Mail, MessageSquare, User, Users, MapPin } from "lucide-react"
import { generateSmsUri, generateEmailUri } from "@/lib/favorites-utils"
import { getStudentAddress, getParentAddress } from "@/lib/map-utils"

interface ContactOption {
  id: string
  name: string
  type: "phone" | "email" | "address"
  phoneType?: "primary" | "secondary"
  value: string
  selected: boolean
  address?: string
  parentId?: string
  studentId?: string
}

interface AddressGroup {
  address: string
  contacts: ContactOption[]
}

export function FavoritesView() {
  const { favorites, removeItem } = useFavorites()
  const [contactOptions, setContactOptions] = useState<ContactOption[]>([])
  const [showPrimaryPhones, setShowPrimaryPhones] = useState(true)
  const [showSecondaryPhones, setShowSecondaryPhones] = useState(true)
  const [showEmails, setShowEmails] = useState(true)
  const [showAddresses, setShowAddresses] = useState(true)
  const [addressGroups, setAddressGroups] = useState<Record<string, AddressGroup>>({})

  // Generate contact options from favorites
  const generateContactOptions = () => {
    const options: ContactOption[] = []
    const addressMap: Record<string, AddressGroup> = {}

    favorites.items.forEach((item) => {
      if (item.type === "student") {
        const student = item.student
        if (!student) return

        const studentAddress = getStudentAddress(student)

        // Add the address as a contact option
        if (showAddresses) {
          // Create a unique ID for this address
          const addressId = `${item.id}-address-primary`

          // Check if we've already added this address
          if (!addressMap[studentAddress]) {
            addressMap[studentAddress] = {
              address: studentAddress,
              contacts: [],
            }

            // Add the address as a contact option
            options.push({
              id: addressId,
              name: `${student.firstName} ${student.lastName}'s Address`,
              type: "address",
              value: studentAddress,
              selected: true, // Auto-select the first address
              studentId: student.id,
            })
          }

          // Add this contact to the address group
          if (addressMap[studentAddress]) {
            addressMap[studentAddress].contacts.push({
              id: addressId,
              name: `${student.firstName} ${student.lastName}'s Address`,
              type: "address",
              value: studentAddress,
              selected: true,
              studentId: student.id,
            })
          }
        }

        // Add secondary address if it exists
        if (student.f2AddressLine1 && showAddresses) {
          const secondaryAddress = `${student.f2AddressLine1}, ${student.f2City}, ${student.f2State} ${student.f2Zip}`

          // Only add if it's different from the primary address
          if (secondaryAddress !== studentAddress) {
            // Create a unique ID for this address
            const addressId = `${item.id}-address-secondary`

            // Check if we've already added this address
            if (!addressMap[secondaryAddress]) {
              addressMap[secondaryAddress] = {
                address: secondaryAddress,
                contacts: [],
              }

              // Add the address as a contact option
              options.push({
                id: addressId,
                name: `${student.firstName} ${student.lastName}'s Secondary Address`,
                type: "address",
                value: secondaryAddress,
                selected: false, // Don't auto-select secondary addresses
                studentId: student.id,
              })
            }

            // Add this contact to the address group
            if (addressMap[secondaryAddress]) {
              addressMap[secondaryAddress].contacts.push({
                id: addressId,
                name: `${student.firstName} ${student.lastName}'s Secondary Address`,
                type: "address",
                value: secondaryAddress,
                selected: false,
                studentId: student.id,
              })
            }
          }
        }

        // Add primary guardian contacts
        if (student.f1g1FirstName && student.f1g1LastName) {
          if (student.f1g1Phone && showPrimaryPhones) {
            options.push({
              id: `${item.id}-f1g1-phone`,
              name: `${student.f1g1FirstName} ${student.f1g1LastName} (${student.firstName}'s parent)`,
              type: "phone",
              phoneType: "primary",
              value: student.f1g1Phone,
              selected: false,
              address: studentAddress,
            })
          }

          if (student.f1g1SecondPhone && showSecondaryPhones) {
            options.push({
              id: `${item.id}-f1g1-second-phone`,
              name: `${student.f1g1FirstName} ${student.f1g1LastName} (2nd phone)`,
              type: "phone",
              phoneType: "secondary",
              value: student.f1g1SecondPhone,
              selected: false,
              address: studentAddress,
            })
          }

          if (student.f1g1Email && showEmails) {
            options.push({
              id: `${item.id}-f1g1-email`,
              name: `${student.f1g1FirstName} ${student.f1g1LastName} (email)`,
              type: "email",
              value: student.f1g1Email,
              selected: false,
              address: studentAddress,
            })
          }
        }

        // Add second guardian contacts
        if (student.f1g2FirstName && student.f1g2LastName) {
          if (student.f1g2Phone && showPrimaryPhones) {
            options.push({
              id: `${item.id}-f1g2-phone`,
              name: `${student.f1g2FirstName} ${student.f1g2LastName} (${student.firstName}'s parent)`,
              type: "phone",
              phoneType: "primary",
              value: student.f1g2Phone,
              selected: false,
              address: studentAddress,
            })
          }

          if (student.f1g2SecondPhone && showSecondaryPhones) {
            options.push({
              id: `${item.id}-f1g2-second-phone`,
              name: `${student.f1g2FirstName} ${student.f1g2LastName} (2nd phone)`,
              type: "phone",
              phoneType: "secondary",
              value: student.f1g2SecondPhone,
              selected: false,
              address: studentAddress,
            })
          }

          if (student.f1g2Email && showEmails) {
            options.push({
              id: `${item.id}-f1g2-email`,
              name: `${student.f1g2FirstName} ${student.f1g2LastName} (email)`,
              type: "email",
              value: student.f1g2Email,
              selected: false,
              address: studentAddress,
            })
          }
        }

        // Add secondary address contacts if they exist
        if (student.f2g1FirstName && student.f2g1LastName) {
          const secondaryAddress = student.f2AddressLine1
            ? `${student.f2AddressLine1}, ${student.f2City}, ${student.f2State} ${student.f2Zip}`
            : studentAddress

          if (student.f2g1Phone && showPrimaryPhones) {
            options.push({
              id: `${item.id}-f2g1-phone`,
              name: `${student.f2g1FirstName} ${student.f2g1LastName} (${student.firstName}'s parent)`,
              type: "phone",
              phoneType: "primary",
              value: student.f2g1Phone,
              selected: false,
              address: secondaryAddress,
            })
          }

          if (student.f2g1SecondPhone && showSecondaryPhones) {
            options.push({
              id: `${item.id}-f2g1-second-phone`,
              name: `${student.f2g1FirstName} ${student.f2g1LastName} (2nd phone)`,
              type: "phone",
              phoneType: "secondary",
              value: student.f2g1SecondPhone,
              selected: false,
              address: secondaryAddress,
            })
          }

          if (student.f2g1Email && showEmails) {
            options.push({
              id: `${item.id}-f2g1-email`,
              name: `${student.f2g1FirstName} ${student.f2g1LastName} (email)`,
              type: "email",
              value: student.f2g1Email,
              selected: false,
              address: secondaryAddress,
            })
          }
        }

        if (student.f2g2FirstName && student.f2g2LastName) {
          const secondaryAddress = student.f2AddressLine1
            ? `${student.f2AddressLine1}, ${student.f2City}, ${student.f2State} ${student.f2Zip}`
            : studentAddress

          if (student.f2g2Phone && showPrimaryPhones) {
            options.push({
              id: `${item.id}-f2g2-phone`,
              name: `${student.f2g2FirstName} ${student.f2g2LastName} (${student.firstName}'s parent)`,
              type: "phone",
              phoneType: "primary",
              value: student.f2g2Phone,
              selected: false,
              address: secondaryAddress,
            })
          }

          if (student.f2g2SecondPhone && showSecondaryPhones) {
            options.push({
              id: `${item.id}-f2g2-second-phone`,
              name: `${student.f2g2FirstName} ${student.f2g2LastName} (2nd phone)`,
              type: "phone",
              phoneType: "secondary",
              value: student.f2g2SecondPhone,
              selected: false,
              address: secondaryAddress,
            })
          }

          if (student.f2g2Email && showEmails) {
            options.push({
              id: `${item.id}-f2g2-email`,
              name: `${student.f2g2FirstName} ${student.f2g2LastName} (email)`,
              type: "email",
              value: student.f2g2Email,
              selected: false,
              address: secondaryAddress,
            })
          }
        }
      } else if (item.type === "parent") {
        const parent = item.parent
        if (!parent) return

        const parentAddress = getParentAddress(parent)

        // Add the address as a contact option
        if (showAddresses && parentAddress) {
          // Create a unique ID for this address
          const addressId = `${item.id}-address`

          // Check if we've already added this address
          if (!addressMap[parentAddress]) {
            addressMap[parentAddress] = {
              address: parentAddress,
              contacts: [],
            }

            // Add the address as a contact option
            options.push({
              id: addressId,
              name: `${parent.firstName} ${parent.lastName}'s Address`,
              type: "address",
              value: parentAddress,
              selected: true, // Auto-select the first address
              parentId: parent.id,
            })
          }

          // Add this contact to the address group
          if (addressMap[parentAddress]) {
            addressMap[parentAddress].contacts.push({
              id: addressId,
              name: `${parent.firstName} ${parent.lastName}'s Address`,
              type: "address",
              value: parentAddress,
              selected: true,
              parentId: parent.id,
            })
          }
        }

        if (parent.phone && showPrimaryPhones) {
          options.push({
            id: `${item.id}-phone`,
            name: `${parent.firstName} ${parent.lastName}`,
            type: "phone",
            phoneType: "primary",
            value: parent.phone,
            selected: false,
            address: parentAddress,
          })
        }

        if (parent.secondPhone && showSecondaryPhones) {
          options.push({
            id: `${item.id}-second-phone`,
            name: `${parent.firstName} ${parent.lastName} (2nd phone)`,
            type: "phone",
            phoneType: "secondary",
            value: parent.secondPhone,
            selected: false,
            address: parentAddress,
          })
        }

        if (parent.email && showEmails) {
          options.push({
            id: `${item.id}-email`,
            name: `${parent.firstName} ${parent.lastName} (email)`,
            type: "email",
            value: parent.email,
            selected: false,
            address: parentAddress,
          })
        }
      }
    })

    setContactOptions(options)
    setAddressGroups(addressMap)
  }

  // Toggle contact selection
  const toggleContactSelection = (id: string) => {
    setContactOptions((prev) =>
      prev.map((option) => (option.id === id ? { ...option, selected: !option.selected } : option)),
    )
  }

  // Select all contacts
  const selectAllContacts = () => {
    setContactOptions((prev) => prev.map((option) => ({ ...option, selected: true })))
  }

  // Deselect all contacts
  const deselectAllContacts = () => {
    setContactOptions((prev) => prev.map((option) => ({ ...option, selected: false })))
  }

  // Send group text
  const sendGroupText = () => {
    const selectedPhones = contactOptions.filter((option) => option.selected && option.type === "phone")
    if (selectedPhones.length === 0) return

    const smsUri = generateSmsUri(selectedPhones.map((option) => ({ id: option.id, phone: option.value })))
    window.location.href = smsUri
  }

  // Send group email
  const sendGroupEmail = () => {
    const selectedEmails = contactOptions.filter((option) => option.selected && option.type === "email")
    if (selectedEmails.length === 0) return

    const emailUri = generateEmailUri(selectedEmails.map((option) => ({ id: option.id, email: option.value })))
    window.location.href = emailUri
  }

  // Initialize contact options if empty or when filters change
  useEffect(() => {
    if (favorites.items.length > 0) {
      generateContactOptions()
    }
  }, [favorites.items, showPrimaryPhones, showSecondaryPhones, showEmails, showAddresses])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Favorites</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllContacts} disabled={contactOptions.length === 0}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAllContacts} disabled={contactOptions.length === 0}>
            Deselect All
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <h3 className="text-sm font-medium">Filter Options:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-primary-phones"
              checked={showPrimaryPhones}
              onCheckedChange={(checked) => setShowPrimaryPhones(!!checked)}
            />
            <label htmlFor="show-primary-phones" className="text-sm cursor-pointer">
              Primary Phones
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-secondary-phones"
              checked={showSecondaryPhones}
              onCheckedChange={(checked) => setShowSecondaryPhones(!!checked)}
            />
            <label htmlFor="show-secondary-phones" className="text-sm cursor-pointer">
              Secondary Phones
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show-emails" checked={showEmails} onCheckedChange={(checked) => setShowEmails(!!checked)} />
            <label htmlFor="show-emails" className="text-sm cursor-pointer">
              Emails
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-addresses"
              checked={showAddresses}
              onCheckedChange={(checked) => setShowAddresses(!!checked)}
            />
            <label htmlFor="show-addresses" className="text-sm cursor-pointer">
              Addresses
            </label>
          </div>
        </div>
      </div>

      {favorites.items.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No favorites yet. Add students or parents to your favorites.</p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-3">
              {favorites.items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
                      <div className="flex items-center">
                        {item.type === "student" ? (
                          <div className="bg-blue-100 text-blue-700 rounded-full p-2 mr-3 flex-shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="bg-green-100 text-green-700 rounded-full p-2 mr-3 flex-shrink-0">
                            <Users className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">
                            {item.type === "student"
                              ? item.student?.firstName + " " + item.student?.lastName
                              : item.parent?.firstName + " " + item.parent?.lastName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {item.type === "student"
                              ? `Grade ${item.student?.grade === "K" ? "K" : item.student?.grade}`
                              : `Parent of ${item.parent?.students.map((s) => s.firstName).join(", ")}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Remove from favorites</span>
                      </Button>
                    </div>

                    <div className="p-3 space-y-2">
                      {/* Display addresses first if enabled */}
                      {showAddresses && (
                        <div className="mb-2">
                          <div className="text-sm font-medium mb-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                            Addresses:
                          </div>
                          <div className="space-y-1 pl-5">
                            {contactOptions
                              .filter((option) => option.type === "address" && option.id.startsWith(item.id))
                              .map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={option.id}
                                    checked={option.selected}
                                    onCheckedChange={() => toggleContactSelection(option.id)}
                                  />
                                  <label htmlFor={option.id} className="text-xs text-gray-600 cursor-pointer">
                                    {option.value}
                                  </label>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Display other contact options */}
                      {contactOptions
                        .filter((option) => option.id.startsWith(item.id) && option.type !== "address")
                        .map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={option.selected}
                              onCheckedChange={() => toggleContactSelection(option.id)}
                            />
                            <label htmlFor={option.id} className="text-sm flex-1 cursor-pointer">
                              {option.name}
                              <span className="text-xs text-gray-500 block">
                                {option.type === "phone" ? "Phone: " : "Email: "}
                                {option.value}
                              </span>
                            </label>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="flex gap-2 justify-center">
            <Button
              onClick={sendGroupText}
              disabled={!contactOptions.some((option) => option.selected && option.type === "phone")}
              className="flex-1"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Group Text
              <span className="ml-1 text-xs">
                ({contactOptions.filter((option) => option.selected && option.type === "phone").length})
              </span>
            </Button>

            <Button
              onClick={sendGroupEmail}
              disabled={!contactOptions.some((option) => option.selected && option.type === "email")}
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              Group Email
              <span className="ml-1 text-xs">
                ({contactOptions.filter((option) => option.selected && option.type === "email").length})
              </span>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

