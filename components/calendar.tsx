"use client"

import { useState, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Calendar({
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
