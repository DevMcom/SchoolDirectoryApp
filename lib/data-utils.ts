import type { Student } from "./types"

// Replace the remote URL with a local path
const CSV_PATH = "/data/school-directory-data.csv"

export async function fetchAndProcessData(): Promise<Student[]> {
  try {
    // Fetch from local path instead of remote URL
    const response = await fetch(CSV_PATH)
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`) throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
    }    }

    const csvText = await response.text()sponse.text()
    return parseCSV(csvText)(csvText)
  } catch (error) {
    console.error("Error fetching or processing data:", error)or("Error fetching or processing data:", error)
    throw error throw error
  } }
}}

function parseCSV(csvText: string): Student[] {on so it can be used by server-data.ts
  // Split the CSV into linestring): Student[] {
  const lines = csvText.split("\n")  // Split the CSV into lines
")
  // Extract headers (first line)
  const headers = lines[0].split(",").map((header) => header.trim().replace(/^"|"$/g, ""))  // Extract headers (first line)
er) => header.trim().replace(/^"|"$/g, ""))
  // Map CSV column names to our property names
  const columnMap: Record<string, keyof Student> = {ur property names
    "First Name": "firstName",ring, keyof Student> = {
    "Last Name": "lastName",ame",
    Nickname: "nickname", "lastName",
    Gr: "grade",me",
    Gender: "gender",
    "Student School Email": "studentEmail",",
    Phone: "phone",
    "Teacher First Name": "teacherFirstName",
    "Teacher Last Name": "teacherLastName",FirstName",
    "Teacher Room": "teacherRoom",,
    "F1 Address Line 1": "f1AddressLine1",cherRoom",
    "F1 City": "f1City",f1AddressLine1",
    "F1 State": "f1State",",
    "F1 Zip": "f1Zip",
    "F1/G1 First Name": "f1g1FirstName",
    "F1/G1 Last Name": "f1g1LastName",rstName",
    "F1/G1 Phone": "f1g1Phone",
    "F1/G1 2nd Phone": "f1g1SecondPhone",
    "F1/G1 E-Mail": "f1g1Email",,
    "F1/G2 First Name": "f1g2FirstName",
    "F1/G2 Last Name": "f1g2LastName",rstName",
    "F1/G2 Phone": "f1g2Phone",
    "F1/G2 2nd Phone": "f1g2SecondPhone",
    "F1/G2 E-Mail": "f1g2Email",
    "F2 Address Line 1": "f2AddressLine1",2Email",
    "F2 City": "f2City",f2AddressLine1",
    "F2 State": "f2State",",
    "F2 Zip": "f2Zip",
    "F2/G1 First Name": "f2g1FirstName",
    "F2/G1 Last Name": "f2g1LastName",rstName",
    "F2/G1 Phone": "f2g1Phone",
    "F2/G1 2nd Phone": "f2g1SecondPhone",
    "F2/G1 E-Mail": "f2g1Email",,
    "F2/G2 First Name": "f2g2FirstName",
    "F2/G2 Last Name": "f2g2LastName",rstName",
    "F2/G2 Phone": "f2g2Phone",
    "F2/G2 2nd Phone": "f2g2SecondPhone",
    "F2/G2 E-Mail": "f2g2Email", "F2/G2 2nd Phone": "f2g2SecondPhone",
  }    "F2/G2 E-Mail": "f2g2Email",

  // Process each line (skip header)
  const students: Student[] = []  // Process each line (skip header)

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue // Skip empty lines  for (let i = 1; i < lines.length; i++) {

    // Split the line into values, handling quoted values
    const values = parseCSVLine(lines[i])    // Split the line into values, handling quoted values

    if (values.length !== headers.length) {
      console.warn(`Line ${i} has ${values.length} values, expected ${headers.length}`).length !== headers.length) {
      continue console.warn(`Line ${i} has ${values.length} values, expected ${headers.length}`)
    }      continue

    // Create a student object
    const student: Partial<Student> = {
      id: `student-${i}`, // Generate a unique IDonst student: Partial<Student> = {
    }      id: `student-${i}`, // Generate a unique ID

    // Map each value to the corresponding property
    headers.forEach((header, index) => {ng property
      const propName = columnMap[header]header, index) => {
      if (propName) {
        const value = values[index].trim().replace(/^"|"$/g, "")
        student[propName] = value === "" ? null : value const value = values[index].trim().replace(/^"|"$/g, "")
      }  student[propName] = value === "" ? null : value
    })      }

    students.push(student as Student)
  }    students.push(student as Student)

  return students
}  return students

// Helper function to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {SV line handling quoted values
  const values: string[] = []ine: string): string[] {
  let currentValue = ""[] = []
  let inQuotes = false  let currentValue = ""

  for (let i = 0; i < line.length; i++) {
    const char = line[i]  for (let i = 0; i < line.length; i++) {
]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(currentValue) "," && !inQuotes) {
      currentValue = "".push(currentValue)
    } else {
      currentValue += char else {
    }   currentValue += char
  }    }

  // Add the last value
  values.push(currentValue)  // Add the last value
urrentValue)
  return values
}  return values
}


