"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { departments } from "@/lib/auth-types"

export default function UserManagementPage() {
  const { user, users, addUser } = useAuth()
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "head_department",
    departmentId: "",
  })
  const [error, setError] = useState("")

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/")
    }
  }, [user, router])

  const handleAddUser = async () => {
    setError("")

    if (!newUser.username || !newUser.password) {
      setError("Please enter both username and password")
      return
    }

    if (newUser.role === "head_department" && !newUser.departmentId) {
      setError("Please select a department")
      return
    }

    try {
      await addUser(newUser)
      setIsAddDialogOpen(false)
      setNewUser({
        username: "",
        password: "",
        role: "head_department",
        departmentId: "",
      })
    } catch (error) {
      setError("Failed to add user")
      console.error(error)
    }
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Create and manage user accounts</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add User</DialogTitle>
                <DialogDescription>Create a new user account.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        {newUser.role === "admin" ? "Admin" : "Head Department"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setNewUser({ ...newUser, role: "admin" })}>
                        Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setNewUser({ ...newUser, role: "head_department" })}>
                        Head Department
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {newUser.role === "head_department" && (
                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          {newUser.departmentId
                            ? departments.find((dept) => dept.id === newUser.departmentId)?.name
                            : "Select department"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {departments.map((dept) => (
                          <DropdownMenuItem
                            key={dept.id}
                            onClick={() => setNewUser({ ...newUser, departmentId: dept.id })}
                          >
                            {dept.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddUser}>Add User</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      Role: {user.role === "admin" ? "Admin" : "Head Department"}
                    </p>
                    {user.departmentId && (
                      <p className="text-sm text-muted-foreground">
                        Department: {departments.find((dept) => dept.id === user.departmentId)?.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
