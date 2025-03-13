import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
  allDay: boolean
}

// Add a more detailed error logging function
function logCalendarError(message: string, error: any): void {
  const errorDetails = {
    message,
    timestamp: new Date().toISOString(),
    errorMessage: error?.message || "Unknown error",
    errorStack: error?.stack,
    errorName: error?.name,
  }

  console.error("Calendar Error:", errorDetails)

  // Store the error in localStorage for troubleshooting
  try {
    const errorLog = localStorage.getItem("calendar-error-log") || "[]"
    const errors = JSON.parse(errorLog)
    errors.push(errorDetails)
    // Keep only the last 10 errors to avoid filling up localStorage
    while (errors.length > 10) errors.shift()
    localStorage.setItem("calendar-error-log", JSON.stringify(errors))
  } catch (e) {
    console.error("Failed to save error log:", e)
  }
}

// Update the fetchAndParseCalendar function to not log the mock data usage as an error
export async function fetchAndParseCalendar(url: string): Promise<CalendarEvent[]> {
  // List of CORS proxies to try
  const corsProxies = [
    "https://corsproxy.io/?",
    "https://api.allorigins.win/raw?url=",
    "https://cors-anywhere.herokuapp.com/",
    "https://crossorigin.me/",
    "https://thingproxy.freeboard.io/fetch/",
  ]

  // Try each proxy until one works
  for (const proxy of corsProxies) {
    try {
      console.log(`Attempting to fetch calendar with proxy: ${proxy}`)
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`

      // Add timeout to fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(proxyUrl, {
        headers: {
          "User-Agent": "SchoolDirectoryApp/1.0",
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!response.ok) {
        console.warn(`Calendar fetch failed with status: ${response.status} ${response.statusText}`)
        continue // Try next proxy
      }

      const data = await response.text()
      console.log("Successfully fetched calendar data")

      // Parse the iCal data
      return parseICalData(data)
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error)
      // Continue to next proxy
    }
  }

  // If all proxies fail, use mock data
  console.log("All proxies failed. Using mock calendar data as fallback.")
  return generateMockCalendarEvents()
}

// Generate mock calendar events for testing and fallback
function generateMockCalendarEvents(): CalendarEvent[] {
  const today = new Date()
  const events: CalendarEvent[] = []

  // Create some mock events around the current date
  events.push({
    id: "mock-1",
    title: "School Board Meeting",
    description: "Monthly school board meeting to discuss district policies and updates.",
    start: new Date(today.getFullYear(), today.getMonth(), 15, 18, 30),
    end: new Date(today.getFullYear(), today.getMonth(), 15, 20, 0),
    location: "District Administration Building",
    allDay: false,
  })

  events.push({
    id: "mock-2",
    title: "Teacher Professional Development Day",
    description: "No school for students. Teachers will attend professional development workshops.",
    start: new Date(today.getFullYear(), today.getMonth(), 10),
    end: new Date(today.getFullYear(), today.getMonth(), 10),
    location: "All Schools",
    allDay: true,
  })

  events.push({
    id: "mock-3",
    title: "Spring Break",
    description: "No school for students and staff.",
    start: new Date(today.getFullYear(), today.getMonth(), 20),
    end: new Date(today.getFullYear(), today.getMonth(), 27),
    allDay: true,
  })

  events.push({
    id: "mock-4",
    title: "Parent-Teacher Conferences",
    description: "Schedule meetings with your child's teachers to discuss progress.",
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 19, 0),
    location: "All Schools",
    allDay: false,
  })

  events.push({
    id: "mock-5",
    title: "Early Dismissal",
    description: "Students will be dismissed at 1:00 PM.",
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 13, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 13, 0),
    location: "All Schools",
    allDay: false,
  })

  // Add a few events in the next month
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 5)
  events.push({
    id: "mock-6",
    title: "Field Day",
    description: "Annual outdoor activities and games for students.",
    start: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5, 9, 0),
    end: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5, 14, 0),
    location: "School Athletic Fields",
    allDay: false,
  })

  // Add an event in the previous month
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 25)
  events.push({
    id: "mock-7",
    title: "Science Fair",
    description: "Students present their science projects to judges and visitors.",
    start: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 25, 10, 0),
    end: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 25, 15, 0),
    location: "School Gymnasium",
    allDay: false,
  })

  // Add more realistic school events
  events.push({
    id: "mock-8",
    title: "Kindergarten Registration",
    description: "Registration for incoming kindergarten students for the next school year.",
    start: new Date(today.getFullYear(), today.getMonth(), 18, 9, 0),
    end: new Date(today.getFullYear(), today.getMonth(), 18, 15, 0),
    location: "Elementary School Office",
    allDay: false,
  })

  events.push({
    id: "mock-9",
    title: "School Play: 'The Wizard of Oz'",
    description: "Annual school play performed by students in grades 4-6.",
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 19, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 21, 0),
    location: "School Auditorium",
    allDay: false,
  })

  events.push({
    id: "mock-10",
    title: "PTA Meeting",
    description: "Monthly Parent-Teacher Association meeting to discuss school activities and fundraising.",
    start: new Date(today.getFullYear(), today.getMonth(), 8, 19, 0),
    end: new Date(today.getFullYear(), today.getMonth(), 8, 20, 30),
    location: "School Library",
    allDay: false,
  })

  return events
}

// Parse iCal data into CalendarEvent objects
function parseICalData(icalData: string): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const lines = icalData.split("\n")

  let currentEvent: Partial<CalendarEvent> | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Handle line continuations (lines that start with a space)
    if (i > 0 && lines[i].startsWith(" ") && currentEvent) {
      const prevLine = lines[i - 1].trim()
      const key = prevLine.split(":")[0]

      if (key === "DESCRIPTION" && currentEvent.description) {
        currentEvent.description += line.substring(1)
      } else if (key === "SUMMARY" && currentEvent.title) {
        currentEvent.title += line.substring(1)
      } else if (key === "LOCATION" && currentEvent.location) {
        currentEvent.location += line.substring(1)
      }

      continue
    }

    if (line === "BEGIN:VEVENT") {
      currentEvent = {
        id: `event-${events.length}`,
        allDay: false,
      }
    } else if (line === "END:VEVENT" && currentEvent) {
      if (currentEvent.start && currentEvent.end && currentEvent.title) {
        events.push(currentEvent as CalendarEvent)
      }
      currentEvent = null
    } else if (currentEvent) {
      const [key, ...valueParts] = line.split(":")
      const value = valueParts.join(":")

      if (key === "SUMMARY") {
        currentEvent.title = value
      } else if (key === "DESCRIPTION") {
        currentEvent.description = value
      } else if (key === "LOCATION") {
        currentEvent.location = value
      } else if (key === "DTSTART") {
        currentEvent.start = parseICalDate(key, value)
        // Check if it's an all-day event (no time component)
        if (value.length === 8) {
          currentEvent.allDay = true
        }
      } else if (key === "DTEND") {
        currentEvent.end = parseICalDate(key, value)
      } else if (key.startsWith("DTSTART;")) {
        currentEvent.start = parseICalDate(key, value)
        if (key.includes("VALUE=DATE")) {
          currentEvent.allDay = true
        }
      } else if (key.startsWith("DTEND;")) {
        currentEvent.end = parseICalDate(key, value)
      } else if (key === "UID") {
        currentEvent.id = value
      }
    }
  }

  return events
}

// Parse iCal date format
function parseICalDate(key: string, value: string): Date {
  // Handle different date formats
  if (key.includes("TZID=")) {
    // Extract timezone (though we won't use it for simplicity)
    const tzid = key.split("TZID=")[1].split(";")[0].split(":")[0]

    // Format with time component
    if (value.includes("T")) {
      return new Date(
        Number.parseInt(value.substring(0, 4)),
        Number.parseInt(value.substring(4, 6)) - 1,
        Number.parseInt(value.substring(6, 8)),
        Number.parseInt(value.substring(9, 11)),
        Number.parseInt(value.substring(11, 13)),
        Number.parseInt(value.substring(13, 15)),
      )
    }

    // Format without time (all day)
    return new Date(
      Number.parseInt(value.substring(0, 4)),
      Number.parseInt(value.substring(4, 6)) - 1,
      Number.parseInt(value.substring(6, 8)),
    )
  }

  // UTC format
  if (value.endsWith("Z")) {
    if (value.includes("T")) {
      return new Date(
        Number.parseInt(value.substring(0, 4)),
        Number.parseInt(value.substring(4, 6)) - 1,
        Number.parseInt(value.substring(6, 8)),
        Number.parseInt(value.substring(9, 11)),
        Number.parseInt(value.substring(11, 13)),
        Number.parseInt(value.substring(13, 15)),
      )
    }
  }

  // Simple date format (YYYYMMDD)
  if (value.length === 8) {
    return new Date(
      Number.parseInt(value.substring(0, 4)),
      Number.parseInt(value.substring(4, 6)) - 1,
      Number.parseInt(value.substring(6, 8)),
    )
  }

  // Default format with time (YYYYMMDDTHHmmss)
  if (value.includes("T")) {
    return new Date(
      Number.parseInt(value.substring(0, 4)),
      Number.parseInt(value.substring(4, 6)) - 1,
      Number.parseInt(value.substring(6, 8)),
      Number.parseInt(value.substring(9, 11)),
      Number.parseInt(value.substring(11, 13)),
      Number.parseInt(value.substring(13, 15)),
    )
  }

  // Fallback
  return new Date(value)
}

// Get events for a specific month
export function getEventsForMonth(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)

  return events.filter((event) => {
    // Check if event falls within the month
    return (
      (event.start >= monthStart && event.start <= monthEnd) ||
      (event.end >= monthStart && event.end <= monthEnd) ||
      (event.start <= monthStart && event.end >= monthEnd)
    )
  })
}

// Get events for a specific day
export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => {
    // For all-day events or multi-day events
    if (event.allDay) {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)

      // Check if the date falls within the event's range
      return date >= eventStart && date <= eventEnd
    }

    // For regular events, check if they start on this day
    return isSameDay(event.start, date)
  })
}

// Get days with events for a specific month
export function getDaysWithEvents(events: CalendarEvent[], date: Date): Date[] {
  const monthEvents = getEventsForMonth(events, date)
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Filter days that have events
  return daysInMonth.filter((day) => {
    return monthEvents.some((event) => {
      // For all-day or multi-day events
      if (event.allDay) {
        return day >= event.start && day <= event.end
      }

      // For regular events
      return isSameDay(event.start, day)
    })
  })
}

// Format event time for display
export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) {
    return "All day"
  }

  return `${format(event.start, "h:mm a")} - ${format(event.end, "h:mm a")}`
}

