import type { Student } from "./types"

const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PTO%20Directory%20Updated%202.10.2025%20-%20Base-HiBXMHBax9pSnzR964nBHbxijBVjDi.csv"

export async function fetchAndProcessData(): Promise<Student[]> {
  try {
    const response = await fetch(CSV_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    return parseCSV(csvText)
  } catch (error) {
    console.error("Error fetching or processing data:", error)
    throw error
  }
}

function parseCSV(csvText: string): Student[] {
  // Split the CSV into lines
  const lines = csvText.split("\n")

  // Extract headers (first line)
  const headers = lines[0].split(",").map((header) => header.trim().replace(/^"|"$/g, ""))

  // Map CSV column names to our property names
  const columnMap: Record<string, keyof Student> = {
    "First Name": "firstName",
    "Last Name": "lastName",
    Nickname: "nickname",
    Gr: "grade",
    Gender: "gender",
    "Student School Email": "studentEmail",
    Phone: "phone",
    "Teacher First Name": "teacherFirstName",
    "Teacher Last Name": "teacherLastName",
    "Teacher Room": "teacherRoom",
    "F1 Address Line 1": "f1AddressLine1",
    "F1 City": "f1City",
    "F1 State": "f1State",
    "F1 Zip": "f1Zip",
    "F1/G1 First Name": "f1g1FirstName",
    "F1/G1 Last Name": "f1g1LastName",
    "F1/G1 Phone": "f1g1Phone",
    "F1/G1 2nd Phone": "f1g1SecondPhone",
    "F1/G1 E-Mail": "f1g1Email",
    "F1/G2 First Name": "f1g2FirstName",
    "F1/G2 Last Name": "f1g2LastName",
    "F1/G2 Phone": "f1g2Phone",
    "F1/G2 2nd Phone": "f1g2SecondPhone",
    "F1/G2 E-Mail": "f1g2Email",
    "F2 Address Line 1": "f2AddressLine1",
    "F2 City": "f2City",
    "F2 State": "f2State",
    "F2 Zip": "f2Zip",
    "F2/G1 First Name": "f2g1FirstName",
    "F2/G1 Last Name": "f2g1LastName",
    "F2/G1 Phone": "f2g1Phone",
    "F2/G1 2nd Phone": "f2g1SecondPhone",
    "F2/G1 E-Mail": "f2g1Email",
    "F2/G2 First Name": "f2g2FirstName",
    "F2/G2 Last Name": "f2g2LastName",
    "F2/G2 Phone": "f2g2Phone",
    "F2/G2 2nd Phone": "f2g2SecondPhone",
    "F2/G2 E-Mail": "f2g2Email",
  }

  // Process each line (skip header)
  const students: Student[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue // Skip empty lines

    // Split the line into values, handling quoted values
    const values = parseCSVLine(lines[i])

    if (values.length !== headers.length) {
      console.warn(`Line ${i} has ${values.length} values, expected ${headers.length}`)
      continue
    }

    // Create a student object
    const student: Partial<Student> = {
      id: `student-${i}`, // Generate a unique ID
    }

    // Map each value to the corresponding property
    headers.forEach((header, index) => {
      const propName = columnMap[header]
      if (propName) {
        const value = values[index].trim().replace(/^"|"$/g, "")
        student[propName] = value === "" ? null : value
      }
    })

    students.push(student as Student)
  }

  return students
}

// Helper function to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(currentValue)
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  // Add the last value
  values.push(currentValue)

  return values
}

