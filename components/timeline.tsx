"use client"

import { useState, useEffect } from "react"
import { format, isSameDay } from "date-fns"
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Edit,
  LogOut,
  AlertTriangle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useEntries } from "@/lib/use-entries"
import { useAuth } from "@/lib/auth-context"
import { Calendar } from "@/components/calendar"
import { departments, getDivisionsByDepartmentId, getDefaultDivisionForDepartment } from "@/lib/auth-types"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export function Timeline() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const {
    entries,
    addEntry,
    deleteEntry,
    updateEntry,
    newEntry,
    setNewEntry,
    hmifPriorities,
    departmentPriorities,
    isLoading,
    error,
  } = useEntries()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({})
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
  }, [newEntry, newEntry.departmentId])

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
  }, [editingEntry, editingEntry?.departmentId])

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

  const handleDeleteEntry = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete)
      setEntryToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const toggleExpand = (id: string) => {
    setIsExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getHMIFPriorityColor = (priorityName: string) => {
    const priority = hmifPriorities.find((p) => p.name === priorityName)
    return priority?.color || "bg-gray-100 text-gray-800"
  }

  // Check if user can edit an entry
  const canEditEntry = (entry: any) => {
    if (user?.role === "admin") return true
    if (user?.role === "head_department" && user.departmentId === entry.departmentId) return true
    return false
  }

  // Group entries by month and year
  const groupedEntries: Record<string, typeof entries> = {}
  entries.forEach((entry) => {
    // Ensure entry.startDate is a valid Date object
    const entryDate = entry.startDate instanceof Date ? entry.startDate : new Date(entry.startDate)
    if (!isNaN(entryDate.getTime())) {
      const key = format(entryDate, "MMMM yyyy")
      if (!groupedEntries[key]) {
        groupedEntries[key] = []
      }
      groupedEntries[key].push(entry)
    }
  })

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
        <h3 className="text-xl font-semibold">Error Loading Timeline</h3>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Timeline Entry</DialogTitle>
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
                <Button onClick={handleAddEntry}>Add to Timeline</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {Object.keys(groupedEntries).length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No timeline entries yet</p>
          <Button variant="outline" className="mt-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first entry
          </Button>
        </div>
      ) : (
        Object.entries(groupedEntries)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([month, monthEntries]) => (
            <div key={month} className="space-y-4">
              <h2 className="text-xl font-semibold">{month}</h2>
              <div className="space-y-4">
                {monthEntries
                  .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                  .map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between border-b p-4">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`h-3 w-3 rounded-full ${departmentPriorities[entry.departmentPriority as keyof typeof departmentPriorities]}`}
                            />
                            <div>
                              <div className="flex items-center">
                                <h3 className="font-medium">{entry.title}</h3>
                                {entry.visibility === "Private" && (
                                  <EyeOff className="ml-2 h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">PIC:</span> {entry.pic}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(entry.startDate, "EEEE, MMMM d, yyyy")}
                                {!isSameDay(entry.startDate, entry.endDate) && (
                                  <> - {format(entry.endDate, "EEEE, MMMM d, yyyy")}</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${getHMIFPriorityColor(entry.hmifPriority)}`}
                            >
                              {entry.hmifPriority}
                            </span>
                            <Link href={`/project-tracker/${entry.id}`}>
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => toggleExpand(entry.id)}>
                              {isExpanded[entry.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            {canEditEntry(entry) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingEntry({ ...entry })
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEntryToDelete(entry.id)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {isExpanded[entry.id] && (
                          <div className="p-4">
                            <p className="text-sm">{entry.description}</p>
                            <div className="mt-4 flex justify-end">
                              <Link href={`/project-tracker/${entry.id}`}>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  View Projects ({entry.projects.length})
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))
      )}

      {/* Edit Entry Dialog */}
      {editingEntry && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Timeline Entry</DialogTitle>
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

              {/* Department field for Admin */}
              {user?.role === "admin" && (
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        {editingEntry.departmentId
                          ? departments.find((dept) => dept.id === editingEntry.departmentId)?.name
                          : "Select department"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {departments.map((dept) => (
                        <DropdownMenuItem
                          key={dept.id}
                          onClick={() =>
                            setEditingEntry({
                              ...editingEntry,
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
              {editingEntry.departmentId && getDivisionsByDepartmentId(editingEntry.departmentId).length > 0 && (
                <div className="grid gap-2">
                  <Label>Division</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        {editingEntry.divisionId
                          ? getDivisionsByDepartmentId(editingEntry.departmentId).find(
                              (div) => div.id === editingEntry.divisionId,
                            )?.name
                          : "Select division"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditingEntry({ ...editingEntry, divisionId: "" })}>
                        None
                      </DropdownMenuItem>
                      {getDivisionsByDepartmentId(editingEntry.departmentId).map((div) => (
                        <DropdownMenuItem
                          key={div.id}
                          onClick={() => setEditingEntry({ ...editingEntry, divisionId: div.id })}
                        >
                          {div.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleEditEntry}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Entry Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entry and all associated projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
