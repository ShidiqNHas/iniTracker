"use client"

import { useState, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  ExternalLink,
  Edit,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { useEntries } from "@/lib/use-entries"
import { useAuth } from "@/lib/auth-context"
import { departments, getDivisionsByDepartmentId, getDefaultDivisionForDepartment } from "@/lib/auth-types"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const {
    entries,
    addEntry,
    updateEntry,
    newEntry,
    setNewEntry,
    hmifPriorities,
    departmentPriorities,
    isLoading,
    error,
  } = useEntries()
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const { isAuthenticated, user } = useAuth()

  // Effect to set default division when department changes
  useEffect(() => {
    if (newEntry.departmentId) {
      const defaultDivision = getDefaultDivisionForDepartment(newEntry.departmentId)
      if (defaultDivision) {
        setNewEntry({
          ...newEntry,
          divisionId: defaultDivision,
        })
      }
    }
  }, [newEntry, newEntry.departmentId, setNewEntry])

  // Effect to set default division when editing entry and department changes
  useEffect(() => {
    if (editingEntry?.departmentId) {
      const defaultDivision = getDefaultDivisionForDepartment(editingEntry.departmentId)
      if (defaultDivision && !editingEntry.divisionId) {
        setEditingEntry({
          ...editingEntry,
          divisionId: defaultDivision,
        })
      }
    }
  }, [editingEntry, editingEntry?.departmentId, setEditingEntry])

  // Generate calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(endOfMonth(monthEnd))

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    setCalendarDays(days)
  }, [currentMonth])

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleAddEntry = () => {
    if (!newEntry.title) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    // Ensure endDate is not before startDate
    if (newEntry.startDate && newEntry.endDate && newEntry.endDate < newEntry.startDate) {
      setNewEntry({
        ...newEntry,
        endDate: newEntry.startDate,
      })
    }

    // Set department based on user role
    if (user?.role === "head_department" && user.departmentId) {
      setNewEntry({
        ...newEntry,
        departmentId: user.departmentId,
      })
    }

    addEntry()
    setIsAddDialogOpen(false)
  }

  const handleEditEntry = () => {
    if (!editingEntry || !editingEntry.title) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    updateEntry(editingEntry.id, editingEntry)
    setIsEditDialogOpen(false)
    setEditingEntry(null)
  }

  // Check if user can edit an entry
  const canEditEntry = (entry: any) => {
    if (user?.role === "admin") return true
    if (user?.role === "head_department" && user.departmentId === entry.departmentId) return true
    return false
  }

  // Filter entries based on authentication status
  const filteredEntries = entries.filter((entry) => {
    // If not authenticated, only show public entries
    if (!isAuthenticated) {
      return entry.visibility === "Public"
    }

    // If authenticated, show all entries
    return true
  })

  // Get entries for the selected date
  const selectedDateEntries = selectedDate
    ? filteredEntries.filter((entry) => {
        // Check if selected date falls within the entry's date range
        if (!entry.startDate || !entry.endDate) return false
        const start = entry.startDate instanceof Date ? entry.startDate : new Date(entry.startDate)
        const end = entry.endDate instanceof Date ? entry.endDate : new Date(entry.endDate)

        try {
          return isWithinInterval(selectedDate, { start, end })
        } catch (e) {
          return isSameDay(start, selectedDate)
        }
      })
    : []

  // Function to check if a date has entries
  const hasEntries = (date: Date) => {
    if (!date) return false
    return filteredEntries.some((entry) => {
      // Ensure we're working with valid Date objects
      const startDate = entry.startDate instanceof Date ? entry.startDate : new Date(entry.startDate)
      const endDate = entry.endDate instanceof Date ? entry.endDate : new Date(entry.endDate)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false

      try {
        return isWithinInterval(date, { start: startDate, end: endDate })
      } catch (e) {
        return isSameDay(startDate, date)
      }
    })
  }

  const getHMIFPriorityColor = (priorityName: string) => {
    const priority = hmifPriorities.find((p) => p.name === priorityName)
    return priority?.color || "bg-gray-100 text-gray-800"
  }

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h3 className="text-xl font-semibold">Error Loading Calendar</h3>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {isAuthenticated && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Calendar Entry</DialogTitle>
                <DialogDescription>Create a new event for your timeline. Fill in the details below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEntry.title || ""}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    placeholder="Enter title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pic">PIC (Person In Charge)</Label>
                  <Input
                    id="pic"
                    value={newEntry.pic || ""}
                    onChange={(e) => setNewEntry({ ...newEntry, pic: e.target.value })}
                    placeholder="Enter person in charge"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEntry.description || ""}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !newEntry.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEntry.startDate ? format(newEntry.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newEntry.startDate}
                        onSelect={(date) => {
                          if (date) {
                            setNewEntry({
                              ...newEntry,
                              startDate: date,
                              // If end date is before start date, set end date to start date
                              endDate: newEntry.endDate && newEntry.endDate < date ? date : newEntry.endDate,
                            })
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !newEntry.endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEntry.endDate ? format(newEntry.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newEntry.endDate}
                        onSelect={(date) => {
                          if (date) {
                            setNewEntry({
                              ...newEntry,
                              endDate: date,
                              // If start date is after end date, set start date to end date
                              startDate: newEntry.startDate && newEntry.startDate > date ? date : newEntry.startDate,
                            })
                          }
                        }}
                        initialFocus
                        disabled={(date) => {
                          // Disable dates before start date
                          return newEntry.startDate ? date < newEntry.startDate : false
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>HMIF Priority</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <span
                          className={`mr-2 inline-block h-2 w-2 rounded-full ${
                            getHMIFPriorityColor(newEntry.hmifPriority || "Mid").split(" ")[0]
                          }`}
                        />
                        {newEntry.hmifPriority || "Select priority"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {hmifPriorities.map((priority) => (
                        <DropdownMenuItem
                          key={priority.name}
                          onClick={() => setNewEntry({ ...newEntry, hmifPriority: priority.name })}
                        >
                          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${priority.color.split(" ")[0]}`} />
                          {priority.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid gap-2">
                  <Label>Department Priority</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <span
                          className={`mr-2 inline-block h-2 w-2 rounded-full ${
                            departmentPriorities[newEntry.departmentPriority as keyof typeof departmentPriorities] ||
                            "bg-slate-300"
                          }`}
                        />
                        {newEntry.departmentPriority || "Select priority"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setNewEntry({ ...newEntry, departmentPriority: "High" })}>
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                        High
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setNewEntry({ ...newEntry, departmentPriority: "Mid" })}>
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-500" />
                        Mid
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setNewEntry({ ...newEntry, departmentPriority: "Low" })}>
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                        Low
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid gap-2">
                  <Label>Visibility</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        {newEntry.visibility === "Public" ? (
                          <Eye className="mr-2 h-4 w-4" />
                        ) : (
                          <EyeOff className="mr-2 h-4 w-4" />
                        )}
                        {newEntry.visibility || "Public"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setNewEntry({ ...newEntry, visibility: "Public" })}>
                        <Eye className="mr-2 h-4 w-4" />
                        Public
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setNewEntry({ ...newEntry, visibility: "Private" })}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Private
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Department field for Admin */}
                {user?.role === "admin" && (
                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          {newEntry.departmentId
                            ? departments.find((dept) => dept.id === newEntry.departmentId)?.name
                            : "Select department"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {departments.map((dept) => (
                          <DropdownMenuItem
                            key={dept.id}
                            onClick={() =>
                              setNewEntry({
                                ...newEntry,
                                departmentId: dept.id,
                                divisionId: getDefaultDivisionForDepartment(dept.id) || "", // Auto-select default division
                              })
                            }
                          >
                            {dept.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Division field for both Admin and Head Department */}
                {newEntry.departmentId && getDivisionsByDepartmentId(newEntry.departmentId).length > 0 && (
                  <div className="grid gap-2">
                    <Label>Division</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          {newEntry.divisionId
                            ? getDivisionsByDepartmentId(newEntry.departmentId).find(
                                (div) => div.id === newEntry.divisionId,
                              )?.name
                            : "Select division"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setNewEntry({ ...newEntry, divisionId: "" })}>
                          None
                        </DropdownMenuItem>
                        {getDivisionsByDepartmentId(newEntry.departmentId).map((div) => (
                          <DropdownMenuItem
                            key={div.id}
                            onClick={() => setNewEntry({ ...newEntry, divisionId: div.id })}
                          >
                            {div.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddEntry}>Add to Calendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="mb-4 grid grid-cols-7 text-center">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-2 text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                const hasEventsOnDay = hasEntries(day)

                return (
                  <button
                    key={i}
                    className={cn(
                      "aspect-square rounded-md p-2 text-center relative",
                      !isCurrentMonth && "text-muted-foreground opacity-50",
                      isToday && "bg-muted/50",
                      isSelected && "bg-primary text-primary-foreground",
                      hasEventsOnDay && !isSelected && "font-medium",
                      "hover:bg-muted",
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <time dateTime={format(day, "yyyy-MM-dd")} className="text-sm">
                      {format(day, "d")}
                    </time>
                    {hasEventsOnDay && (
                      <div
                        className={cn(
                          "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                          isSelected ? "bg-primary-foreground" : "bg-primary",
                        )}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}</h3>
              </div>
              {selectedDateEntries.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">No entries for this date</p>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setNewEntry({
                          ...newEntry,
                          startDate: selectedDate,
                          endDate: selectedDate,
                        })
                        setIsAddDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add entry
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateEntries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border p-3 hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${departmentPriorities[entry.departmentPriority as keyof typeof departmentPriorities]}`}
                          />
                          <span className="font-medium">{entry.title}</span>
                          {entry.visibility === "Private" && <EyeOff className="ml-1 h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${getHMIFPriorityColor(entry.hmifPriority)}`}
                          >
                            {entry.hmifPriority}
                          </span>
                          {isAuthenticated && canEditEntry(entry) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingEntry({ ...entry })
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium">PIC:</span> {entry.pic}
                      </div>
                      {entry.description && <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {format(entry.startDate, "MMM d, yyyy")}
                          {!isSameDay(entry.startDate, entry.endDate) && <> - {format(entry.endDate, "MMM d, yyyy")}</>}
                        </div>
                        {isAuthenticated && (
                          <Link href={`/project-tracker/${entry.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Projects
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Entry Dialog */}
      {editingEntry && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Calendar Entry</DialogTitle>
              <DialogDescription>Update the entry details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingEntry.title || ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-pic">PIC (Person In Charge)</Label>
                <Input
                  id="edit-pic"
                  value={editingEntry.pic || ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, pic: e.target.value })}
                  placeholder="Enter person in charge"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingEntry.description || ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !editingEntry.startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingEntry.startDate ? format(editingEntry.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingEntry.startDate}
                      onSelect={(date) => {
                        if (date) {
                          setEditingEntry({
                            ...editingEntry,
                            startDate: date,
                            endDate: editingEntry.endDate && editingEntry.endDate < date ? date : editingEntry.endDate,
                          })
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !editingEntry.endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingEntry.endDate ? format(editingEntry.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingEntry.endDate}
                      onSelect={(date) => {
                        if (date) {
                          setEditingEntry({
                            ...editingEntry,
                            endDate: date,
                            startDate:
                              editingEntry.startDate && editingEntry.startDate > date ? date : editingEntry.startDate,
                          })
                        }
                      }}
                      initialFocus
                      disabled={(date) => {
                        return editingEntry.startDate ? date < editingEntry.startDate : false
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>HMIF Priority</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${
                          getHMIFPriorityColor(editingEntry.hmifPriority || "Mid").split(" ")[0]
                        }`}
                      />
                      {editingEntry.hmifPriority || "Select priority"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {hmifPriorities.map((priority) => (
                      <DropdownMenuItem
                        key={priority.name}
                        onClick={() => setEditingEntry({ ...editingEntry, hmifPriority: priority.name })}
                      >
                        <span className={`mr-2 inline-block h-2 w-2 rounded-full ${priority.color.split(" ")[0]}`} />
                        {priority.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid gap-2">
                <Label>Department Priority</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${
                          departmentPriorities[editingEntry.departmentPriority as keyof typeof departmentPriorities] ||
                          "bg-slate-300"
                        }`}
                      />
                      {editingEntry.departmentPriority || "Select priority"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setEditingEntry({ ...editingEntry, departmentPriority: "High" })}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                      High
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingEntry({ ...editingEntry, departmentPriority: "Mid" })}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-500" />
                      Mid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingEntry({ ...editingEntry, departmentPriority: "Low" })}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                      Low
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid gap-2">
                <Label>Visibility</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      {editingEntry.visibility === "Public" ? (
                        <Eye className="mr-2 h-4 w-4" />
                      ) : (
                        <EyeOff className="mr-2 h-4 w-4" />
                      )}
                      {editingEntry.visibility || "Public"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setEditingEntry({ ...editingEntry, visibility: "Public" })}>
                      <Eye className="mr-2 h-4 w-4" />
                      Public
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingEntry({ ...editingEntry, visibility: "Private" })}>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Private
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditEntry}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Simple Calendar component for date selection in forms
function Calendar({
  mode,
  selected,
  onSelect,
  disabled,
  initialFocus,
}: {
  mode: "single"
  selected?: Date
  onSelect: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
}) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selected || new Date())
  const [calendarDays, setCalendarDays] = useState<Date[]>([])

  // Generate calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    setCalendarDays(days)
  }, [currentMonth])

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="ghost" size="sm" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isToday = isSameDay(day, new Date())
          const isSelected = selected ? isSameDay(day, selected) : false
          const isDisabled = disabled ? disabled(day) : false

          return (
            <button
              key={i}
              type="button"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm font-normal",
                !isCurrentMonth && "text-muted-foreground opacity-50",
                isToday && "bg-muted",
                isSelected && "bg-primary text-primary-foreground",
                isDisabled && "pointer-events-none opacity-50",
                !isSelected && !isDisabled && "hover:bg-muted",
              )}
              disabled={isDisabled}
              onClick={() => onSelect(day)}
              tabIndex={initialFocus && i === 0 ? 0 : -1}
            >
              <time dateTime={format(day, "yyyy-MM-dd")}>{format(day, "d")}</time>
            </button>
          )
        })}
      </div>
    </div>
  )
}
