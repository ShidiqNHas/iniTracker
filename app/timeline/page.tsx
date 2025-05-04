import { Timeline } from "@/components/timeline"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timeline Tracker</h1>
            <p className="text-muted-foreground">Track and organize your events chronologically</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </Button>
          </Link>
        </div>
        <Timeline />
      </div>
    </div>
  )
}
