"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@supabase/supabase-js"

export function SupabaseSetup() {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const testConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setStatus("error")
      setMessage("Please enter both Supabase URL and API key")
      return
    }

    setStatus("loading")
    setMessage("Testing connection...")

    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase.from("users").select("count")

      if (error) throw error

      // Save to localStorage for future use
      localStorage.setItem("supabaseUrl", supabaseUrl)
      localStorage.setItem("supabaseKey", supabaseKey)

      setStatus("success")
      setMessage("Connection successful! Supabase credentials saved.")
    } catch (error) {
      console.error("Supabase connection error:", error)
      setStatus("error")
      setMessage("Failed to connect to Supabase. Please check your credentials.")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Setup</CardTitle>
        <CardDescription>Connect your Notion Timeline Tracker to Supabase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supabase-url">Supabase URL</Label>
          <Input
            id="supabase-url"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://your-project.supabase.co"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-key">Supabase Anon Key</Label>
          <Input
            id="supabase-key"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="your-anon-key"
            type="password"
          />
        </div>
        {status !== "idle" && (
          <div
            className={`p-3 rounded-md text-sm ${
              status === "error"
                ? "bg-red-50 text-red-700"
                : status === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-blue-50 text-blue-700"
            }`}
          >
            {message}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testConnection} disabled={status === "loading"} className="w-full">
          {status === "loading" ? "Connecting..." : "Connect to Supabase"}
        </Button>
      </CardFooter>
    </Card>
  )
}
