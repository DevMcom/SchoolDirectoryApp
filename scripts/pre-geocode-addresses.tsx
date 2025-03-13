import fs from "fs"
import path from "path"
import { geocodeAddress } from "../lib/map-utils"
import { STUDENTS } from "../data/students" // Adjust import path as needed
import { PARENTS } from "../data/parents" // Adjust import path as needed

// Function to extract all unique addresses from students and parents
async function getAllUniqueAddresses() {
  const addresses = new Set()

  // Extract student addresses
  STUDENTS.forEach((student) => {
    if (student.address) {
      addresses.add(student.address)
    }
  })

  // Extract parent addresses
  PARENTS.forEach((parent) => {
    if (parent.address) {
      addresses.add(parent.address)
    }
  })

  return Array.from(addresses)
}

// Function to geocode all addresses and create a mapping
async function geocodeAllAddresses() {
  const addresses = await getAllUniqueAddresses()
  console.log(`Found ${addresses.length} unique addresses to geocode`)

  const geocodedData = {}
  let successCount = 0
  let failureCount = 0

  // Process addresses in batches to avoid rate limiting
  const BATCH_SIZE = 5
  const batches = []

  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    batches.push(addresses.slice(i, i + BATCH_SIZE))
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} addresses)`)

    // Process each address in the batch
    const batchPromises = batch.map(async (address) => {
      try {
        const position = await geocodeAddress(address)
        geocodedData[address] = {
          position,
          isEstimated: false,
        }
        successCount++
        console.log(`✅ Successfully geocoded: ${address}`)
        return true
      } catch (error) {
        console.error(`❌ Failed to geocode: ${address}`, error)
        // Store a fallback position with isEstimated flag
        geocodedData[address] = {
          position: {
            lat: 40.7128, // Default position (NYC)
            lng: -74.006,
          },
          isEstimated: true,
        }
        failureCount++
        return false
      }
    })

    await Promise.all(batchPromises)

    // Add a delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      console.log("Waiting 2 seconds before next batch...")
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  console.log(`Geocoding complete: ${successCount} successful, ${failureCount} failed`)
  return geocodedData
}

// Main function to run the script
async function main() {
  try {
    console.log("Starting pre-geocoding process...")
    const geocodedData = await geocodeAllAddresses()

    // Save to a JSON file
    const outputPath = path.join(process.cwd(), "data", "geocoded-addresses.json")
    fs.writeFileSync(outputPath, JSON.stringify(geocodedData, null, 2))

    console.log(`Geocoded data saved to ${outputPath}`)
  } catch (error) {
    console.error("Error in pre-geocoding process:", error)
    process.exit(1)
  }
}

main()

