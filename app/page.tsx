"use client"

import { useAuth } from "@/lib/auth-context"
import CalendarView from "@/components/calendar-view"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClipboardList, LogIn } from "lucide-react"

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">View and manage your schedule</p>
          </div>
          {isAuthenticated ? (
            <Link href="/timeline">
              <Button variant="outline" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Timeline View
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
        <CalendarView />
      </div>
    </div>
  )
}
