"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "@/components/ui/use-toast"

// Replace the hardcoded Supabase URL and key with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export type ProjectStatus = "ongoing" | "on_hold" | "canceled" | "completed"

// Update the Project type to include status and onHoldReason
export type Project = {
  id: string
  title: string
  pic: string
  description: string
  startDate: Date
  deadline: Date
  hmifPriority: string
  departmentPriority: string
  departmentId?: string
  divisionId?: string
  status: ProjectStatus
  onHoldReason?: string
}

// Update the TimelineEntry type
export type TimelineEntry = {
  id: string
  title: string
  pic: string
  description: string
  startDate: Date
  endDate: Date
  hmifPriority: string
  departmentPriority: string
  visibility: "Public" | "Private"
  projects: Project[]
  departmentId?: string
  divisionId?: string
}

// HMIF priorities remain the same
export const hmifPriorities = [
  { name: "High", color: "bg-red-100 text-red-800" },
  { name: "Mid", color: "bg-yellow-100 text-yellow-800" },
  { name: "Low", color: "bg-green-100 text-green-800" },
]

// Department priorities
export const departmentPriorities = {
  High: "bg-red-500",
  Mid: "bg-yellow-500",
  Low: "bg-green-500",
}

// Project status colors
export const projectStatusColors = {
  ongoing: "bg-blue-500",
  on_hold: "bg-yellow-500",
  canceled: "bg-red-500",
  completed: "bg-green-500",
}

// Update the initial entries to include project status
const initialEntries: TimelineEntry[] = [
  {
    id: "1",
    title: "Project Kickoff",
    pic: "John Doe",
    description: "Initial meeting with the team to discuss project goals and timeline",
    startDate: new Date(2024, 4, 1),
    endDate: new Date(2024, 4, 1),
    hmifPriority: "High",
    departmentPriority: "High",
    visibility: "Public",
    departmentId: "kesekjenan",
    divisionId: "sekretaris",
    projects: [
      {
        id: "p1",
        title: "Requirements Gathering",
        pic: "Sarah Lee",
        description: "Collect and document all project requirements",
        startDate: new Date(2024, 4, 1),
        deadline: new Date(2024, 4, 5),
        hmifPriority: "High",
        departmentPriority: "High",
        departmentId: "kesekjenan",
        divisionId: "sekretaris",
        status: "ongoing",
      },
      {
        id: "p2",
        title: "Team Assignment",
        pic: "John Doe",
        description: "Assign team members to specific tasks",
        startDate: new Date(2024, 4, 1),
        deadline: new Date(2024, 4, 3),
        hmifPriority: "Mid",
        departmentPriority: "High",
        departmentId: "kesekjenan",
        divisionId: "sekretaris",
        status: "completed",
      },
    ],
  },
  {
    id: "2",
    title: "Research Phase",
    pic: "Jane Smith",
    description: "Conduct market research and competitor analysis",
    startDate: new Date(2024, 4, 10),
    endDate: new Date(2024, 4, 15),
    hmifPriority: "Mid",
    departmentPriority: "Mid",
    visibility: "Public",
    departmentId: "ekonomi_kreatif",
    divisionId: "kewirausahaan",
    projects: [
      {
        id: "p3",
        title: "Market Analysis",
        pic: "Jane Smith",
        description: "Analyze current market trends",
        startDate: new Date(2024, 4, 10),
        deadline: new Date(2024, 4, 12),
        hmifPriority: "Mid",
        departmentPriority: "Mid",
        departmentId: "ekonomi_kreatif",
        divisionId: "kewirausahaan",
        status: "on_hold",
        onHoldReason: "Waiting for additional market data",
      },
    ],
  },
  {
    id: "3",
    title: "Vacation Planning",
    pic: "Alex Johnson",
    description: "Research destinations and book flights",
    startDate: new Date(2024, 5, 15),
    endDate: new Date(2024, 5, 20),
    hmifPriority: "Low",
    departmentPriority: "Low",
    visibility: "Private",
    departmentId: "sdm",
    divisionId: "manajemen_sdm",
    projects: [],
  },
]

// Ensure we're consistently using Date objects
export function useEntries() {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch entries from Supabase on mount
  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Check if Supabase URL and key are available
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase credentials are not configured")
        }

        // Fetch entries
        const { data: entriesData, error: entriesError } = await supabase.from("entries").select("*")

        if (entriesError) throw entriesError

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase.from("projects").select("*")

        if (projectsError) throw projectsError

        // Process and combine the data
        const processedEntries = entriesData.map((entry: any) => ({
          ...entry,
          startDate: new Date(entry.start_date),
          endDate: new Date(entry.end_date),
          hmifPriority: entry.hmif_priority,
          departmentPriority: entry.department_priority,
          departmentId: entry.department_id,
          divisionId: entry.division_id,
          projects: projectsData
            .filter((project: any) => project.entry_id === entry.id)
            .map((project: any) => ({
              ...project,
              startDate: new Date(project.start_date),
              deadline: new Date(project.deadline),
              hmifPriority: project.hmif_priority,
              departmentPriority: project.department_priority,
              departmentId: project.department_id,
              divisionId: project.division_id,
              onHoldReason: project.on_hold_reason,
            })),
        }))

        setEntries(processedEntries)
      } catch (error: any) {
        console.error("Error fetching entries:", error)
        setError(error.message || "Failed to fetch entries")

        // Show error toast
        toast({
          title: "Error fetching entries",
          description: error.message || "Failed to fetch entries. Please try again later.",
          variant: "destructive",
        })

        // Fallback to initial entries if Supabase fetch fails
        setEntries(
          initialEntries.map((entry) => ({
            ...entry,
            startDate: entry.startDate instanceof Date ? entry.startDate : new Date(entry.startDate),
            endDate: entry.endDate instanceof Date ? entry.endDate : new Date(entry.endDate),
            projects: entry.projects.map((project) => ({
              ...project,
              startDate: project.startDate instanceof Date ? project.startDate : new Date(project.startDate),
              deadline: project.deadline instanceof Date ? project.deadline : new Date(project.deadline),
            })),
          })),
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [])

  // Update the newEntry state to include department and division
  const [newEntry, setNewEntry] = useState<Partial<TimelineEntry>>({
    title: "",
    pic: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    hmifPriority: "Mid",
    departmentPriority: "Mid",
    visibility: "Public",
    projects: [],
    departmentId: "",
    divisionId: "",
  })

  // New state for project being added
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: "",
    pic: "",
    description: "",
    startDate: new Date(),
    deadline: new Date(),
    hmifPriority: "Mid",
    departmentPriority: "Mid",
    departmentId: "",
    divisionId: "",
    status: "ongoing", // Default status
  })

  // Update the addEntry function to use Supabase
  const addEntry = async () => {
    if (!newEntry.title) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    const entry: TimelineEntry = {
      id: Date.now().toString(),
      title: newEntry.title || "",
      pic: newEntry.pic || "",
      description: newEntry.description || "",
      startDate: newEntry.startDate instanceof Date ? newEntry.startDate : new Date(),
      endDate: newEntry.endDate instanceof Date ? newEntry.endDate : new Date(),
      hmifPriority: newEntry.hmifPriority || "Mid",
      departmentPriority: newEntry.departmentPriority || "Mid",
      visibility: newEntry.visibility || "Public",
      projects: newEntry.projects || [],
      departmentId: newEntry.departmentId,
      divisionId: newEntry.divisionId,
    }

    try {
      // Prepare the data for insertion
      const insertData: any = {
        title: entry.title,
        pic: entry.pic,
        description: entry.description,
        start_date: entry.startDate.toISOString(),
        end_date: entry.endDate.toISOString(),
        hmif_priority: entry.hmifPriority,
        department_priority: entry.departmentPriority,
        visibility: entry.visibility,
      }

      // Only include department_id if it has a value
      if (entry.departmentId) {
        insertData.department_id = entry.departmentId
      }

      // Only include division_id if it has a value and the department has divisions
      if (entry.divisionId && entry.divisionId.trim() !== "") {
        insertData.division_id = entry.divisionId
      }

      // Insert into Supabase
      const { data, error } = await supabase.from("entries").insert([insertData]).select()

      if (error) throw error

      if (data && data.length > 0) {
        const newEntry = {
          ...data[0],
          startDate: new Date(data[0].start_date),
          endDate: new Date(data[0].end_date),
          hmifPriority: data[0].hmif_priority,
          departmentPriority: data[0].department_priority,
          departmentId: data[0].department_id,
          divisionId: data[0].division_id,
          projects: [],
        }

        setEntries([...entries, newEntry].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()))

        // Show success toast
        toast({
          title: "Entry Added",
          description: "The entry has been successfully added.",
        })
      }
    } catch (error: any) {
      console.error("Error adding entry:", error)

      // Show error toast
      toast({
        title: "Error Adding Entry",
        description: error.message || "Failed to add entry. Please try again.",
        variant: "destructive",
      })

      // Fallback if Supabase is not connected
      setEntries([...entries, entry].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()))
    }

    setNewEntry({
      title: "",
      pic: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      hmifPriority: "Mid",
      departmentPriority: "Mid",
      visibility: "Public",
      projects: [],
      departmentId: "",
      divisionId: "",
    })
  }

  // Add a project to an entry with Supabase
  const addProject = async (entryId: string) => {
    if (!newProject.title) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title || "",
      pic: newProject.pic || "",
      description: newProject.description || "",
      startDate: newProject.startDate instanceof Date ? newProject.startDate : new Date(),
      deadline: newProject.deadline instanceof Date ? newProject.deadline : new Date(),
      hmifPriority: newProject.hmifPriority || "Mid",
      departmentPriority: newProject.departmentPriority || "Mid",
      departmentId: newProject.departmentId,
      divisionId: newProject.divisionId,
      status: newProject.status || "ongoing",
      onHoldReason: newProject.onHoldReason,
    }

    try {
      // Prepare the data for insertion
      const insertData: any = {
        entry_id: entryId,
        title: project.title,
        pic: project.pic,
        description: project.description,
        start_date: project.startDate.toISOString(),
        deadline: project.deadline.toISOString(),
        hmif_priority: project.hmifPriority,
        department_priority: project.departmentPriority,
        status: project.status,
      }

      // Only include department_id if it has a value
      if (project.departmentId) {
        insertData.department_id = project.departmentId
      }

      // Only include division_id if it has a value
      if (project.divisionId && project.divisionId.trim() !== "") {
        insertData.division_id = project.divisionId
      }

      // Only include on_hold_reason if status is "on_hold" and reason exists
      if (project.status === "on_hold" && project.onHoldReason) {
        insertData.on_hold_reason = project.onHoldReason
      }

      // Insert into Supabase
      const { data, error } = await supabase.from("projects").insert([insertData]).select()

      if (error) throw error

      if (data && data.length > 0) {
        const newProject = {
          ...data[0],
          startDate: new Date(data[0].start_date),
          deadline: new Date(data[0].deadline),
          hmifPriority: data[0].hmif_priority,
          departmentPriority: data[0].department_priority,
          departmentId: data[0].department_id,
          divisionId: data[0].division_id,
          onHoldReason: data[0].on_hold_reason,
        }

        setEntries(
          entries.map((entry) => {
            if (entry.id === entryId) {
              return {
                ...entry,
                projects: [...entry.projects, newProject],
              }
            }
            return entry
          }),
        )

        // Show success toast
        toast({
          title: "Project Added",
          description: "The project has been successfully added.",
        })
      }
    } catch (error: any) {
      console.error("Error adding project:", error)

      // Show error toast
      toast({
        title: "Error Adding Project",
        description: error.message || "Failed to add project. Please try again.",
        variant: "destructive",
      })

      // Fallback if Supabase is not connected
      setEntries(
        entries.map((entry) => {
          if (entry.id === entryId) {
            return {
              ...entry,
              projects: [...entry.projects, project],
            }
          }
          return entry
        }),
      )
    }

    setNewProject({
      title: "",
      pic: "",
      description: "",
      startDate: new Date(),
      deadline: new Date(),
      hmifPriority: "Mid",
      departmentPriority: "Mid",
      departmentId: "",
      divisionId: "",
      status: "ongoing",
    })
  }

  // Update an entry with Supabase
  const updateEntry = async (id: string, updatedEntry: Partial<TimelineEntry>) => {
    try {
      // Prepare the data for update
      const updateData: any = {}

      if (updatedEntry.title !== undefined) updateData.title = updatedEntry.title
      if (updatedEntry.pic !== undefined) updateData.pic = updatedEntry.pic
      if (updatedEntry.description !== undefined) updateData.description = updatedEntry.description
      if (updatedEntry.startDate !== undefined) updateData.start_date = updatedEntry.startDate.toISOString()
      if (updatedEntry.endDate !== undefined) updateData.end_date = updatedEntry.endDate.toISOString()
      if (updatedEntry.hmifPriority !== undefined) updateData.hmif_priority = updatedEntry.hmifPriority
      if (updatedEntry.departmentPriority !== undefined)
        updateData.department_priority = updatedEntry.departmentPriority
      if (updatedEntry.visibility !== undefined) updateData.visibility = updatedEntry.visibility
      if (updatedEntry.departmentId !== undefined) updateData.department_id = updatedEntry.departmentId

      // Only include division_id if it has a value
      if (updatedEntry.divisionId !== undefined) {
        if (updatedEntry.divisionId && updatedEntry.divisionId.trim() !== "") {
          updateData.division_id = updatedEntry.divisionId
        } else {
          // If divisionId is empty, set it to null in the database
          updateData.division_id = null
        }
      }

      const { error } = await supabase.from("entries").update(updateData).eq("id", id)

      if (error) throw error

      // Update local state
      setEntries(
        entries.map((entry) => {
          if (entry.id === id) {
            return {
              ...entry,
              ...updatedEntry,
              startDate: updatedEntry.startDate instanceof Date ? updatedEntry.startDate : entry.startDate,
              endDate: updatedEntry.endDate instanceof Date ? updatedEntry.endDate : entry.endDate,
            }
          }
          return entry
        }),
      )

      // Show success toast
      toast({
        title: "Entry Updated",
        description: "The entry has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Error updating entry:", error)

      // Show error toast
      toast({
        title: "Error Updating Entry",
        description: error.message || "Failed to update entry. Please try again.",
        variant: "destructive",
      })

      // Fallback if Supabase is not connected
      setEntries(
        entries.map((entry) => {
          if (entry.id === id) {
            return {
              ...entry,
              ...updatedEntry,
              startDate: updatedEntry.startDate instanceof Date ? updatedEntry.startDate : entry.startDate,
              endDate: updatedEntry.endDate instanceof Date ? updatedEntry.endDate : entry.endDate,
            }
          }
          return entry
        }),
      )
    }
  }

  // Update a project with Supabase
  const updateProject = async (entryId: string, projectId: string, updatedProject: Partial<Project>) => {
    try {
      // Prepare the data for update
      const updateData: any = {}

      if (updatedProject.title !== undefined) updateData.title = updatedProject.title
      if (updatedProject.pic !== undefined) updateData.pic = updatedProject.pic
      if (updatedProject.description !== undefined) updateData.description = updatedProject.description
      if (updatedProject.startDate !== undefined) updateData.start_date = updatedProject.startDate.toISOString()
      if (updatedProject.deadline !== undefined) updateData.deadline = updatedProject.deadline.toISOString()
      if (updatedProject.hmifPriority !== undefined) updateData.hmif_priority = updatedProject.hmifPriority
      if (updatedProject.departmentPriority !== undefined)
        updateData.department_priority = updatedProject.departmentPriority
      if (updatedProject.departmentId !== undefined) updateData.department_id = updatedProject.departmentId
      if (updatedProject.status !== undefined) updateData.status = updatedProject.status

      // Only include division_id if it has a value
      if (updatedProject.divisionId !== undefined) {
        if (updatedProject.divisionId && updatedProject.divisionId.trim() !== "") {
          updateData.division_id = updatedProject.divisionId
        } else {
          // If divisionId is empty, set it to null in the database
          updateData.division_id = null
        }
      }

      // Only include on_hold_reason if status is "on_hold" and reason exists
      if (updatedProject.status === "on_hold" && updatedProject.onHoldReason !== undefined) {
        updateData.on_hold_reason = updatedProject.onHoldReason
      } else if (updatedProject.status !== "on_hold") {
        // Clear on_hold_reason if status is not "on_hold"
        updateData.on_hold_reason = null
      }

      const { error } = await supabase.from("projects").update(updateData).eq("id", projectId)

      if (error) throw error

      // Update local state
      setEntries(
        entries.map((entry) => {
          if (entry.id === entryId) {
            return {
              ...entry,
              projects: entry.projects.map((project) => {
                if (project.id === projectId) {
                  return {
                    ...project,
                    ...updatedProject,
                    startDate: updatedProject.startDate instanceof Date ? updatedProject.startDate : project.startDate,
                    deadline: updatedProject.deadline instanceof Date ? updatedProject.deadline : project.deadline,
                  }
                }
                return project
              }),
            }
          }
          return entry
        }),
      )

      // Show success toast
      toast({
        title: "Project Updated",
        description: "The project has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Error updating project:", error)

      // Show error toast
      toast({
        title: "Error Updating Project",
        description: error.message || "Failed to update project. Please try again.",
        variant: "destructive",
      })

      // Fallback if Supabase is not connected
      setEntries(
        entries.map((entry) => {
          if (entry.id === entryId) {
            return {
              ...entry,
              projects: entry.projects.map((project) => {
                if (project.id === projectId) {
                  return {
                    ...project,
                    ...updatedProject,
                    startDate: updatedProject.startDate instanceof Date ? updatedProject.startDate : project.startDate,
                    deadline: updatedProject.deadline instanceof Date ? updatedProject.deadline : project.deadline,
                  }
                }
                return project
              }),
            }
          }
          return entry
        }),
      )
    }
  }

  // Delete a project from an entry with Supabase
  const deleteProject = async (entryId: string, projectId: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId)

      if (error) throw error

      // Update local state
      setEntries(
        entries.map((entry) => {
          if (entry.id === entryId) {
            return {
              ...entry,
              projects: entry.projects.filter((project) => project.id !== projectId),
            }
          }
          return entry
        }),
      )

      // Show success toast
      toast({
        title: "Project Deleted",
        description: "The project has been successfully deleted.",
      })
    } catch (error: any) {
      console.error("Error deleting project:", error)

      // Show error toast
      toast({
        title: "Error Deleting Project",
        description: error.message || "Failed to delete project. Please try again.",
        variant: "destructive",
      })

      // Fallback if Supabase is not connected
      setEntries(
        entries.map((entry) => {
          if (entry.id === entryId) {
            return {
              ...entry,
              projects: entry.projects.filter((project) => project.id !== projectId),
            }
          }
          return entry
        }),
      )
    }
  }

  // Delete an entry with Supabase
  const deleteEntry = async (id: string) => {
    try {
      // First delete all projects associated with this entry
      const { error: projectsError } = await supabase.from("projects").delete().eq("entry_id", id)

      if (projectsError) throw projectsError

      // Then delete the entry
      const { error } = await supabase.from("entries").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setEntries(entries.filter((entry) => entry.id !== id))

      // Show success toast
      toast({
        title: "Entry Deleted",
        description: "The entry has been successfully deleted.",
      })
    } catch (error: any) {
      console.error("Error deleting entry:", error)

      // Show error toast
      toast({
        title: "Error Deleting Entry",
        description: error.message || "Failed to delete entry. Please try again.",
        variant: "destructive",
      })

      // Fallback if Supabase is not connected
      setEntries(entries.filter((entry) => entry.id !== id))
    }
  }

  // Update the return statement to include the new properties
  return {
    entries,
    setEntries,
    newEntry,
    setNewEntry,
    newProject,
    setNewProject,
    addEntry,
    addProject,
    updateEntry,
    updateProject,
    deleteEntry,
    deleteProject,
    hmifPriorities,
    departmentPriorities,
    projectStatusColors,
    isLoading,
    error,
  }
}
