export interface Student {
  id: string
  firstName: string
  lastName: string
  nickname: string | null
  grade: string
  gender: string
  studentEmail: string | null
  phone: string | null

  teacherFirstName: string
  teacherLastName: string
  teacherRoom: string

  // Primary address and guardians
  f1AddressLine1: string
  f1City: string
  f1State: string
  f1Zip: string

  f1g1FirstName: string | null
  f1g1LastName: string | null
  f1g1Phone: string | null
  f1g1SecondPhone: string | null
  f1g1Email: string | null

  f1g2FirstName: string | null
  f1g2LastName: string | null
  f1g2Phone: string | null
  f1g2SecondPhone: string | null
  f1g2Email: string | null

  // Secondary address and guardians (optional)
  f2AddressLine1: string | null
  f2City: string | null
  f2State: string | null
  f2Zip: string | null

  f2g1FirstName: string | null
  f2g1LastName: string | null
  f2g1Phone: string | null
  f2g1SecondPhone: string | null
  f2g1Email: string | null

  f2g2FirstName: string | null
  f2g2LastName: string | null
  f2g2Phone: string | null
  f2g2SecondPhone: string | null
  f2g2Email: string | null
}

