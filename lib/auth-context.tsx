"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, initialUsers } from "./auth-types"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  users: User[]
  addUser: (user: Omit<User, "id">) => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for saved user on mount and fetch users from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      // Check for saved user
      const savedUser = localStorage.getItem("user")
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } catch (error) {
          console.error("Failed to parse saved user:", error)
          localStorage.removeItem("user")
        }
      }

      // Fetch users from Supabase
      try {
        const { data, error } = await supabase.from("users").select("*")
        if (error) throw error
        if (data && data.length > 0) {
          // Convert snake_case back to camelCase for our app
          const processedUsers = data.map((user) => ({
            ...user,
            departmentId: user.department_id,
          }))
          setUsers(processedUsers)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        // Fallback to initial users if Supabase fetch fails
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // In a real app, you would use Supabase auth
      // For now, we'll simulate it with a query
      const { data, error } = await supabase.from("users").select("*").eq("username", username).single()

      if (error) throw error

      if (data && data.password === password) {
        // Convert snake_case back to camelCase for our app
        const user = {
          ...data,
          departmentId: data.department_id,
        }
        // In real app, use proper password comparison
        setUser(user)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(user))
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)

      // Fallback to local users if Supabase is not connected
      const foundUser = users.find((u) => u.username === username && u.password === password)
      if (foundUser) {
        setUser(foundUser)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(foundUser))
        return true
      }

      return false
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user")
  }

  const addUser = async (newUser: Omit<User, "id">) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            username: newUser.username,
            password: newUser.password,
            role: newUser.role,
            department_id: newUser.departmentId,
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        // Convert snake_case back to camelCase for our app
        const user = {
          ...data[0],
          departmentId: data[0].department_id,
        }
        setUsers([...users, user])
      }
    } catch (error) {
      console.error("Error adding user:", error)

      // Fallback if Supabase is not connected
      const user: User = {
        ...newUser,
        id: Date.now().toString(),
      }
      setUsers([...users, user])
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        users,
        addUser,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
