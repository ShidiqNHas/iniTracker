"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, isBefore, isAfter } from "date-fns"
import { CalendarIcon, ChevronLeft, Plus, Trash2, EyeOff, Edit, Clock, AlertTriangle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { getDivisionsByDepartmentId, getDefaultDivisionForDepartment } from "@/lib/auth-types"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export default function ProjectTrackerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const {
    entries,
    newProject,
    setNewProject,
    addProject,
    updateProject,
    deleteProject,
    deleteEntry,
    updateEntry,
    hmifPriorities,
    departmentPriorities,
    projectStatusColors,
    isLoading,
    error,
  } = useEntries()
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false)
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [isEditEntryDialogOpen, setIsEditEntryDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [isDeleteEntryDialogOpen, setIsDeleteEntryDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false)

  // Find the entry that matches the ID
  const entry = entries.find((e) => e.id === params.id)

  // Effect to set default division when department changes
  useEffect(() => {
    if (newProject.departmentId) {
      const defaultDivision = getDefaultDivisionForDepartment(newProject.departmentId)
      if (defaultDivision) {
        setNewProject({
          ...newProject,
          divisionId: defaultDivision,
        })
      }
    }
  }, [newProject, newProject.departmentId, setNewProject])

  // Effect to set default division when editing project and department changes
  useEffect(() => {
    if (editingProject?.departmentId) {
      const defaultDivision = getDefaultDivisionForDepartment(editingProject.departmentId)
      if (defaultDivision && !editingProject.divisionId) {
        setEditingProject({
          ...editingProject,
          divisionId: defaultDivision,
        })
      }
    }
  }, [editingProject, editingProject?.departmentId])

  // Check if user has permission to edit this entry
  const canEdit =
    user?.role === "admin" || (user?.role === "head_department" && user.departmentId === entry?.departmentId)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

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
        <h3 className="text-xl font-semibold">Error Loading Project</h3>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8 flex items-center">
            <Link href="/timeline">
              <Button variant="ghost" className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Entry not found</h1>
          </div>
          <p>The requested entry could not be found.</p>
        </div>
      </div>
    )
  }

  // Group projects by deadline
  const today = new Date()
  const oneWeekFromNow = addDays(today, 7)

  const upcomingProjects = entry.projects.filter(
    (project) =>
      isAfter(project.deadline, today) && isBefore(project.deadline, oneWeekFromNow) && project.status !== "completed",
  )

  const pastDeadlineProjects = entry.projects.filter(
    (project) => isBefore(project.deadline, today) && project.status !== "completed",
  )

  const otherProjects = entry.projects.filter(
    (project) => !upcomingProjects.includes(project) && !pastDeadlineProjects.includes(project),
  )

  const handleAddProject = () => {
    if (!newProject.title) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    // Set department and division based on entry
    setNewProject({
      ...newProject,
      departmentId: entry.departmentId,
      divisionId: entry.divisionId,
    })

    addProject(entry.id)
    setIsAddProjectDialogOpen(false)
  }

  const handleEditProject = () => {
    if (!editingProject || !editingProject.title) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    updateProject(entry.id, editingProject.id, editingProject)
    setIsEditProjectDialogOpen(false)
    setEditingProject(null)
  }

  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProject(entry.id, projectToDelete)
      setProjectToDelete(null)
      setIsDeleteProjectDialogOpen(false)
    }
  }

  const handleDeleteEntry = () => {
    if (entry) {
      deleteEntry(entry.id)
      router.push("/timeline")
    }
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

    // Update the entry
    updateEntry(editingEntry.id, editingEntry)
    setIsEditEntryDialogOpen(false)
    setEditingEntry(null)
  }

  const getHMIFPriorityColor = (priorityName: string) => {
    const priority = hmifPriorities.find((p) => p.name === priorityName)
    return priority?.color || "bg-gray-100 text-gray-800"
  }

  const renderProjectCard = (project: any) => (
    <Card key={project.id} className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <span
              className={`rounded-full px-2 py-0.5 text-xs text-white ${projectStatusColors[project.status as keyof typeof projectStatusColors]}`}
            >
              {project.status.replace("_", " ")}
            </span>
          </div>
          {canEdit && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingProject({ ...project })
                  setIsEditProjectDialogOpen(true)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setProjectToDelete(project.id)
                  setIsDeleteProjectDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">PIC:</span> {project.pic}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Timeline:</span> {format(project.startDate, "MMM d, yyyy")} -{" "}
            {format(project.deadline, "MMM d, yyyy")}
          </p>
        </div>
        {project.description && <p className="text-sm mb-3">{project.description}</p>}
        {project.status === "on_hold" && project.onHoldReason && (
          <div className="mb-3 p-2 bg-yellow-50 rounded-md">
            <p className="text-xs text-yellow-800">
              <span className="font-medium">On Hold Reason:</span> {project.onHoldReason}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${getHMIFPriorityColor(project.hmifPriority)}`}>
            HMIF: {project.hmifPriority}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs bg-opacity-20 ${departmentPriorities[project.departmentPriority as keyof typeof departmentPriorities]}`}
          >
            Dept: {project.departmentPriority}
          </span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/timeline">
              <Button variant="ghost" className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>
                {entry.visibility === "Private" && <EyeOff className="ml-2 h-5 w-5 text-muted-foreground" />}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => {
                      setEditingEntry({ ...entry })
                      setIsEditEntryDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground">
                <span className="font-medium">PIC:</span> {entry.pic} | {format(entry.startDate, "MMM d, yyyy")} -{" "}
                {format(entry.endDate, "MMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs ${getHMIFPriorityColor(entry.hmifPriority)}`}>
              HMIF: {entry.hmifPriority}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs bg-opacity-20 ${departmentPriorities[entry.departmentPriority as keyof typeof departmentPriorities]}`}
            >
              Dept: {entry.departmentPriority}
            </span>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => setIsDeleteEntryDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {entry.description && (
          <Card className="mb-8">
            <CardContent className="p-4">
              <p>{entry.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Projects</h2>
          {canEdit && (
            <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Project</DialogTitle>
                  <DialogDescription>Create a new project for this agenda item.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newProject.title || ""}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      placeholder="Enter title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pic">PIC (Person In Charge)</Label>
                    <Input
                      id="pic"
                      value={newProject.pic || ""}
                      onChange={(e) => setNewProject({ ...newProject, pic: e.target.value })}
                      placeholder="Enter person in charge"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProject.description || ""}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
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
                            !newProject.startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newProject.startDate ? format(newProject.startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newProject.startDate}
                          onSelect={(date) => {
                            if (date) {
                              setNewProject({
                                ...newProject,
                                startDate: date,
                                // If deadline is before start date, set deadline to start date
                                deadline:
                                  newProject.deadline && newProject.deadline < date ? date : newProject.deadline,
                              })
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label>Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !newProject.deadline && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newProject.deadline ? format(newProject.deadline, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newProject.deadline}
                          onSelect={(date) => {
                            if (date) {
                              setNewProject({
                                ...newProject,
                                deadline: date,
                                // If start date is after deadline, set start date to deadline
                                startDate:
                                  newProject.startDate && newProject.startDate > date ? date : newProject.startDate,
                              })
                            }
                          }}
                          initialFocus
                          disabled={(date) => {
                            // Disable dates before start date
                            return newProject.startDate ? date < newProject.startDate : false
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
                              getHMIFPriorityColor(newProject.hmifPriority || "Mid").split(" ")[0]
                            }`}
                          />
                          {newProject.hmifPriority || "Select priority"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {hmifPriorities.map((priority) => (
                          <DropdownMenuItem
                            key={priority.name}
                            onClick={() => setNewProject({ ...newProject, hmifPriority: priority.name })}
                          >
                            <span
                              className={`mr-2 inline-block h-2 w-2 rounded-full ${priority.color.split(" ")[0]}`}
                            />
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
                              departmentPriorities[
                                newProject.departmentPriority as keyof typeof departmentPriorities
                              ] || "bg-slate-300"
                            }`}
                          />
                          {newProject.departmentPriority || "Select priority"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setNewProject({ ...newProject, departmentPriority: "High" })}>
                          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                          High
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setNewProject({ ...newProject, departmentPriority: "Mid" })}>
                          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-500" />
                          Mid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setNewProject({ ...newProject, departmentPriority: "Low" })}>
                          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                          Low
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {entry.departmentId && getDivisionsByDepartmentId(entry.departmentId).length > 0 && (
                    <div className="grid gap-2">
                      <Label>Division</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="justify-start">
                            {newProject.divisionId
                              ? getDivisionsByDepartmentId(entry.departmentId).find(
                                  (div) => div.id === newProject.divisionId,
                                )?.name
                              : "Select division"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setNewProject({ ...newProject, divisionId: "" })}>
                            None
                          </DropdownMenuItem>
                          {getDivisionsByDepartmentId(entry.departmentId).map((div) => (
                            <DropdownMenuItem
                              key={div.id}
                              onClick={() => setNewProject({ ...newProject, divisionId: div.id })}
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
                  <Button onClick={handleAddProject}>Add Project</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {entry.projects.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No projects yet</p>
            {canEdit && (
              <Button variant="outline" className="mt-2" onClick={() => setIsAddProjectDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first project
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Past Deadline Projects */}
            {pastDeadlineProjects.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center text-red-600">
                  <Clock className="h-5 w-5 mr-2" />
                  Past Deadline ({pastDeadlineProjects.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {pastDeadlineProjects.map((project) => renderProjectCard(project))}
                </div>
              </div>
            )}

            {/* Upcoming Projects */}
            {upcomingProjects.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center text-amber-600">
                  <Clock className="h-5 w-5 mr-2" />
                  Upcoming Deadline ({upcomingProjects.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingProjects.map((project) => renderProjectCard(project))}
                </div>
              </div>
            )}

            {/* Other Projects */}
            {otherProjects.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Other Projects ({otherProjects.length})</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {otherProjects.map((project) => renderProjectCard(project))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingProject.title || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-pic">PIC (Person In Charge)</Label>
                <Input
                  id="edit-pic"
                  value={editingProject.pic || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, pic: e.target.value })}
                  placeholder="Enter person in charge"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProject.description || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
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
                        !editingProject.startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingProject.startDate ? format(editingProject.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingProject.startDate}
                      onSelect={(date) => {
                        if (date) {
                          setEditingProject({
                            ...editingProject,
                            startDate: date,
                            deadline:
                              editingProject.deadline && editingProject.deadline < date
                                ? date
                                : editingProject.deadline,
                          })
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !editingProject.deadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingProject.deadline ? format(editingProject.deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingProject.deadline}
                      onSelect={(date) => {
                        if (date) {
                          setEditingProject({
                            ...editingProject,
                            deadline: date,
                            startDate:
                              editingProject.startDate && editingProject.startDate > date
                                ? date
                                : editingProject.startDate,
                          })
                        }
                      }}
                      initialFocus
                      disabled={(date) => {
                        return editingProject.startDate ? date < editingProject.startDate : false
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${
                          projectStatusColors[editingProject.status as keyof typeof projectStatusColors]
                        }`}
                      />
                      {editingProject.status.replace("_", " ")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setEditingProject({ ...editingProject, status: "ongoing" })}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                      Ongoing
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setEditingProject({
                          ...editingProject,
                          status: "on_hold",
                          onHoldReason: editingProject.onHoldReason || "",
                        })
                      }
                    >
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-500" />
                      On Hold
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingProject({ ...editingProject, status: "canceled" })}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                      Canceled
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingProject({ ...editingProject, status: "completed" })}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                      Completed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {editingProject.status === "on_hold" && (
                <div className="grid gap-2">
                  <Label htmlFor="on-hold-reason">On Hold Reason</Label>
                  <Textarea
                    id="on-hold-reason"
                    value={editingProject.onHoldReason || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, onHoldReason: e.target.value })}
                    placeholder="Enter reason for on hold status"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>HMIF Priority</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${
                          getHMIFPriorityColor(editingProject.hmifPriority || "Mid").split(" ")[0]
                        }`}
                      />
                      {editingProject.hmifPriority || "Select priority"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {hmifPriorities.map((priority) => (
                      <DropdownMenuItem
                        key={priority.name}
                        onClick={() => setEditingProject({ ...editingProject, hmifPriority: priority.name })}
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
                          departmentPriorities[
                            editingProject.departmentPriority as keyof typeof departmentPriorities
                          ] || "bg-slate-300"
                        }`}
                      />
                      {editingProject.departmentPriority || "Select priority"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => setEditingProject({ ...editingProject, departmentPriority: "High" })}
                    >
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                      High
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setEditingProject({ ...editingProject, departmentPriority: "Mid" })}
                    >
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-500" />
                      Mid
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setEditingProject({ ...editingProject, departmentPriority: "Low" })}
                    >
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                      Low
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditProject}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Entry Dialog */}
      {editingEntry && (
        <Dialog open={isEditEntryDialogOpen} onOpenChange={setIsEditEntryDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Entry</DialogTitle>
              <DialogDescription>Update entry details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-entry-title">Title</Label>
                <Input
                  id="edit-entry-title"
                  value={editingEntry.title || ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-entry-pic">PIC (Person In Charge)</Label>
                <Input
                  id="edit-entry-pic"
                  value={editingEntry.pic || ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, pic: e.target.value })}
                  placeholder="Enter person in charge"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-entry-description">Description</Label>
                <Textarea
                  id="edit-entry-description"
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

      {/* Delete Entry Dialog */}
      <AlertDialog open={isDeleteEntryDialogOpen} onOpenChange={setIsDeleteEntryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone and will also delete all
              associated projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={isDeleteProjectDialogOpen} onOpenChange={setIsDeleteProjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
