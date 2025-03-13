"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, MapPin, Info } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import {
  fetchAndParseCalendar,
  getEventsForMonth,
  getEventsForDay,
  getDaysWithEvents,
  formatEventTime,
  type CalendarEvent,
} from "@/lib/calendar-utils"

const CALENDAR_URL =
  "https://calendar.google.com/calendar/ical/glencoeschools.org_s6epcb207dl0k7f4ts98ubc2c4%40group.calendar.google.com/public/basic.ics"

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<"calendar" | "agenda">("calendar")
  const [usingMockData, setUsingMockData] = useState(true) // Always true now since we're using mock data
  const [showInfoBanner, setShowInfoBanner] = useState(true)

  // Add a function to view calendar error logs
  const [showErrorLogs, setShowErrorLogs] = useState(false)
  const [errorLogs, setErrorLogs] = useState<any[]>([])

  const viewErrorLogs = () => {
    try {
      const logs = localStorage.getItem("calendar-error-log")
      if (logs) {
        setErrorLogs(JSON.parse(logs))
        setShowErrorLogs(true)
      } else {
        setErrorLogs([])
        setShowErrorLogs(true)
      }
    } catch (err) {
      console.error("Failed to load error logs:", err)
      setErrorLogs([])
      setShowErrorLogs(true)
    }
  }

  // Fetch calendar data
  useEffect(() => {
    const loadCalendar = async () => {
      try {
        setLoading(true)
        setError(null) // Clear any previous errors
        setUsingMockData(false) // Reset mock data flag

        console.log("Loading calendar data...")
        const calendarEvents = await fetchAndParseCalendar(CALENDAR_URL)

        // Check if we're using mock data by looking at the first event ID
        // Mock events have IDs that start with "mock-"
        const isMockData = calendarEvents.length > 0 && calendarEvents[0].id.startsWith("mock-")
        setUsingMockData(isMockData)

        console.log(`Loaded ${calendarEvents.length} calendar events ${isMockData ? "(sample data)" : "(real data)"}`)
        setEvents(calendarEvents)
      } catch (err) {
        console.error("Failed to load calendar:", err)
        setError("Failed to load calendar. Using sample data instead.")
        setUsingMockData(true)
      } finally {
        setLoading(false)
      }
    }

    loadCalendar()
  }, [])

  // Get days with events for the current month
  const daysWithEvents = getDaysWithEvents(events, currentDate)

  // Get events for the selected date
  const selectedDateEvents = getEventsForDay(events, selectedDate)

  // Get events for the current month (for agenda view)
  const currentMonthEvents = getEventsForMonth(events, currentDate)

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const prevMonth = subMonths(currentDate, 1)
    setCurrentDate(prevMonth)
    setSelectedDate(prevMonth)
  }

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = addMonths(currentDate, 1)
    setCurrentDate(nextMonth)
    setSelectedDate(nextMonth)
  }

  // Select a date
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
  }

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = monthStart
    const endDate = monthEnd

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Group days into weeks
    const weeks: Date[][] = []
    let currentWeek: Date[] = []

    days.forEach((day) => {
      if (currentWeek.length === 0 && day.getDay() !== 0) {
        // Fill in days from previous month if the first day isn't Sunday
        for (let i = 0; i < day.getDay(); i++) {
          currentWeek.push(new Date(0)) // Placeholder for empty cells
        }
      }

      currentWeek.push(day)

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })

    // Add remaining days to the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(0)) // Placeholder for empty cells
      }
      weeks.push(currentWeek)
    }

    return weeks
  }

  // Check if a date has events
  const hasEvents = (date: Date) => {
    return daysWithEvents.some((eventDate) => isSameDay(eventDate, date))
  }

  // Render loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            School Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          School Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showInfoBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-700">
                {usingMockData ? (
                  <>
                    This calendar is currently showing sample school events because we couldn't connect to the real
                    calendar feed.
                    <span className="block mt-1 text-xs">
                      The app attempted to access the calendar using several CORS proxies, but all attempts failed. This
                      is common with public calendar feeds due to CORS restrictions.
                    </span>
                  </>
                ) : (
                  <>This calendar is showing events from the school district's calendar feed.</>
                )}
              </p>
              <Button
                variant="link"
                size="sm"
                className="text-blue-700 p-0 h-auto text-xs underline"
                onClick={() => setShowInfoBanner(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Error logs modal */}
        {showErrorLogs && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader>
                <CardTitle>Calendar Error Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[50vh]">
                  {errorLogs.length > 0 ? (
                    <div className="space-y-4">
                      {errorLogs.map((log, index) => (
                        <div key={index} className="border p-3 rounded text-sm">
                          <div className="font-medium">{log.message}</div>
                          <div className="text-gray-500">{log.timestamp}</div>
                          <div className="mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                            <div>Error: {log.errorMessage}</div>
                            {log.errorName && <div>Type: {log.errorName}</div>}
                            {log.errorStack && (
                              <details>
                                <summary className="cursor-pointer text-blue-500">Stack Trace</summary>
                                <pre className="text-xs mt-2 whitespace-pre-wrap">{log.errorStack}</pre>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-gray-500">No error logs found</div>
                  )}
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t flex justify-end">
                <Button onClick={() => setShowErrorLogs(false)}>Close</Button>
              </div>
            </Card>
          </div>
        )}

        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "calendar" | "agenda")}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold mx-2">{format(currentDate, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="space-y-4">
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium py-1">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {generateCalendarGrid().map((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  const isValidDate = day.getTime() !== 0
                  const isCurrentMonth = isValidDate && isSameMonth(day, currentDate)
                  const isSelected = isValidDate && isSameDay(day, selectedDate)
                  const dayHasEvents = isValidDate && hasEvents(day)
                  const isTodayDate = isValidDate && isToday(day)

                  return (
                    <Button
                      key={`${weekIndex}-${dayIndex}`}
                      variant="ghost"
                      className={`
                        h-12 p-0 relative
                        ${!isValidDate ? "invisible" : ""}
                        ${!isCurrentMonth ? "text-gray-300" : ""}
                        ${isSelected ? "bg-blue-100" : ""}
                        ${isTodayDate ? "font-bold" : ""}
                      `}
                      onClick={() => isValidDate && handleSelectDate(day)}
                      disabled={!isValidDate}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span>{isValidDate ? format(day, "d") : ""}</span>
                        {dayHasEvents && <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                      </div>
                    </Button>
                  )
                }),
              )}
            </div>

            {/* Selected day events */}
            {selectedDateEvents.length > 0 ? (
              <div>
                <h3 className="font-medium mb-2">Events for {format(selectedDate, "MMMM d, yyyy")}</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} className="p-2 border rounded">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatEventTime(event)}
                        </div>
                        {event.location && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.description && <div className="text-sm mt-1">{event.description}</div>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500">No events for {format(selectedDate, "MMMM d, yyyy")}</div>
            )}
          </TabsContent>

          <TabsContent value="agenda">
            <h3 className="font-medium mb-2">Events for {format(currentDate, "MMMM yyyy")}</h3>
            {currentMonthEvents.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {currentMonthEvents
                    .sort((a, b) => a.start.getTime() - b.start.getTime())
                    .map((event) => (
                      <div key={event.id} className="p-3 border rounded">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-gray-500">{format(event.start, "EEEE, MMMM d, yyyy")}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatEventTime(event)}
                        </div>
                        {event.location && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.description && <div className="text-sm mt-1">{event.description}</div>}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center p-8 text-gray-500">No events for this month</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

