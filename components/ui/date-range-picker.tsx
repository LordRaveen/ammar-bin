"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronDownIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    processed?: boolean
    fromYear?: number
    toYear?: number
}

export function DateRangePicker({
    date,
    setDate,
    processed,
    fromYear = 2010,
    toYear = 2035,
}: DateRangePickerProps) {
    return (
        <div className={cn("grid gap-2", processed && "opacity-50")}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-between text-left font-normal bg-transparent",
                            !date && "text-muted-foreground"
                        )}
                        disabled={processed}
                    >
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </div>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        captionLayout="dropdown"
                        fromYear={fromYear}
                        toYear={toYear}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
