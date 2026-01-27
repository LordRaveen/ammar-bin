"use client"

import { useState, useMemo } from "react"
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    startOfDay,
    endOfDay,
    parseISO,
    isWithinInterval
} from "date-fns"
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Filter,
    Search,
    List,
    LayoutGrid,
    CalendarDays,
    Clock,
    Users,
    MapPin,
    MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { EventDialog } from "./event-dialog"
import { cn } from "@/lib/utils"

interface SchoolCalendarClientProps {
    initialEvents: any[]
    sessions: any[]
    classes: any[]
    activeSession: any
    user: any
}

type ViewMode = 'month' | 'week' | 'agenda'

export function SchoolCalendarClient({
    initialEvents,
    sessions,
    classes,
    activeSession,
    user
}: SchoolCalendarClientProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    // Filters
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [classFilter, setClassFilter] = useState<string>("all")
    const [sessionFilter, setSessionFilter] = useState<string>(activeSession?.id || "all")

    const filteredEvents = useMemo(() => {
        return initialEvents.filter(event => {
            const matchesCategory = categoryFilter === "all" || event.category === categoryFilter
            const matchesClass = classFilter === "all" || event.event_classes?.some((ec: any) => ec.class_id === classFilter)
            const matchesSession = sessionFilter === "all" || event.session_id === sessionFilter
            return matchesCategory && matchesClass && matchesSession
        })
    }, [initialEvents, categoryFilter, classFilter, sessionFilter])

    const next = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
        else setCurrentDate(addWeeks(currentDate, 1))
    }

    const prev = () => {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
        else setCurrentDate(subWeeks(currentDate, 1))
    }

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setSelectedEvent(null)
        setIsDialogOpen(true)
    }

    const handleEventClick = (event: any, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedEvent(event)
        setIsDialogOpen(true)
    }

    const categoryColors: Record<string, string> = {
        academic: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        finance: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        admin: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        holiday: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
        class: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    }

    // --- Month View Logic ---
    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate))
        const end = endOfWeek(endOfMonth(currentDate))
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    // --- Week View Logic ---
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate)
        const end = endOfWeek(currentDate)
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">School Calendar</h1>
                    <p className="text-muted-foreground">Manage and track all academic and administrative events.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => { setSelectedEvent(null); setSelectedDate(new Date()); setIsDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                    </Button>
                </div>
            </div>

            <Card className="border shadow-none overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Navigation & Title */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border rounded-lg bg-background p-1 shadow-sm">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="px-3 font-semibold" onClick={() => setCurrentDate(new Date())}>
                                    Today
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <h2 className="text-xl font-bold min-w-[180px]">
                                {format(currentDate, 'MMMM yyyy')}
                            </h2>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Select value={sessionFilter} onValueChange={setSessionFilter}>
                                <SelectTrigger className="w-[140px] h-9 bg-background">
                                    <SelectValue placeholder="Session" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sessions</SelectItem>
                                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[140px] h-9 bg-background">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="academic">Academic</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="admin">Administrative</SelectItem>
                                    <SelectItem value="holiday">Holiday</SelectItem>
                                    <SelectItem value="class">Class-specific</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={classFilter} onValueChange={setClassFilter}>
                                <SelectTrigger className="w-[140px] h-9 bg-background">
                                    <SelectValue placeholder="Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border rounded-lg bg-background p-1 shadow-sm h-9">
                                <Button
                                    variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="px-2 h-7"
                                    onClick={() => setViewMode('month')}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                                    Month
                                </Button>
                                <Button
                                    variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="px-2 h-7"
                                    onClick={() => setViewMode('week')}
                                >
                                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                    Week
                                </Button>
                                <Button
                                    variant={viewMode === 'agenda' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="px-2 h-7"
                                    onClick={() => setViewMode('agenda')}
                                >
                                    <List className="h-3.5 w-3.5 mr-1.5" />
                                    Agenda
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {viewMode === 'month' && (
                        <div className="grid grid-cols-7 border-b">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/10 border-r last:border-0">
                                    {day}
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'month' && (
                        <div className="grid grid-cols-7 grid-rows-5 auto-rows-fr">
                            {monthDays.map((day, i) => {
                                const dayEvents = filteredEvents.filter(e => isSameDay(parseISO(e.start_date), day))
                                const isSelected = isSameDay(day, new Date())
                                const isCurrentMonth = isSameMonth(day, currentDate)

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={cn(
                                            "min-h-[120px] p-2 border-r border-b group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/20 cursor-pointer relative",
                                            !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/10 opacity-50",
                                            (i + 1) % 7 === 0 && "border-r-0"
                                        )}
                                        onClick={() => handleDateClick(day)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={cn(
                                                "h-7 w-7 flex items-center justify-center text-sm font-bold rounded-full",
                                                isSelected ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 3).map(event => (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => handleEventClick(event, e)}
                                                    className={cn(
                                                        "px-2 py-1 text-[10px] font-bold rounded border shadow-sm truncate transition-transform hover:scale-[1.02]",
                                                        categoryColors[event.category] || categoryColors.academic
                                                    )}
                                                >
                                                    {event.all_day ? null : <span className="mr-1 opacity-60 font-medium">{format(parseISO(event.start_date), 'HH:mm')}</span>}
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-muted-foreground font-bold px-1 py-0.5">
                                                    + {dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {viewMode === 'week' && (
                        <div className="grid grid-cols-7 min-h-[600px]">
                            {weekDays.map((day, i) => {
                                const dayEvents = filteredEvents.filter(e => isSameDay(parseISO(e.start_date), day))
                                const isSelected = isSameDay(day, new Date())

                                return (
                                    <div key={day.toISOString()} className={cn("border-r last:border-0", i % 7 === 6 && "border-r-0")}>
                                        <div className="p-4 border-b bg-slate-50/30 dark:bg-slate-900/10 text-center space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{format(day, 'EEE')}</p>
                                            <p className={cn(
                                                "text-2xl font-black h-10 w-10 mx-auto flex items-center justify-center rounded-full",
                                                isSelected ? "bg-primary text-primary-foreground shadow-lg" : ""
                                            )}>
                                                {format(day, 'd')}
                                            </p>
                                        </div>
                                        <div className="p-2 space-y-2 min-h-[400px] cursor-pointer" onClick={() => handleDateClick(day)}>
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => handleEventClick(event, e)}
                                                    className={cn(
                                                        "p-3 text-[11px] font-bold rounded-xl border-2 shadow-sm transition-all hover:shadow-md",
                                                        categoryColors[event.category] || categoryColors.academic
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                                        <Clock className="h-3 w-3" />
                                                        {format(parseISO(event.start_date), 'HH:mm')}
                                                    </div>
                                                    <div className="line-clamp-2 leading-tight">
                                                        {event.title}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {viewMode === 'agenda' && (
                        <div className="divide-y max-h-[700px] overflow-y-auto">
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className="flex items-start gap-6 p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer"
                                        onClick={(e) => handleEventClick(event, e)}
                                    >
                                        <div className="flex flex-col items-center min-w-[60px] text-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-3 border shadow-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(parseISO(event.start_date), 'MMM')}</span>
                                            <span className="text-2xl font-black">{format(parseISO(event.start_date), 'dd')}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground">{format(parseISO(event.start_date), 'EEE')}</span>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{event.title}</h3>
                                                <Badge variant="outline" className={cn("uppercase text-[10px] font-bold px-2 py-0.5", categoryColors[event.category] || categoryColors.academic)}>
                                                    {event.category}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 font-medium">{event.description || "No description provided."}</p>
                                            <div className="flex flex-wrap items-center gap-4 pt-1">
                                                <div className="flex items-center text-xs font-semibold text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                                    <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                                                    {format(parseISO(event.start_date), 'h:mm a')} - {format(parseISO(event.end_date), 'h:mm a')}
                                                </div>
                                                {event.event_classes?.length > 0 && (
                                                    <div className="flex items-center text-xs font-semibold text-muted-foreground bg-blue-50/50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                                        <Users className="h-3.5 w-3.5 mr-1.5 text-blue-500/60" />
                                                        {event.event_classes.length} Classes
                                                    </div>
                                                )}
                                                <div className="flex items-center text-xs font-semibold text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full mr-2", event.visibility === 'public' ? 'bg-emerald-500' : 'bg-red-500')} />
                                                    {event.visibility.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center">
                                    <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CalendarIcon className="h-10 w-10 text-muted/30" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No events found</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">There are no events scheduled for the selected filters or month.</p>
                                    <Button variant="outline" onClick={() => { setCategoryFilter("all"); setClassFilter("all"); setSessionFilter("all"); }}>
                                        Clear All Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <EventDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                event={selectedEvent}
                selectedDate={selectedDate}
                sessions={sessions}
                classes={classes}
            />
        </div>
    )
}
