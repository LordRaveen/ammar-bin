"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createEvent, updateEvent, deleteEvent } from "@/app/(dashboard)/calendar/actions"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"

interface EventDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    event?: any
    selectedDate?: Date
    sessions: any[]
    classes: any[]
}

export function EventDialog({
    open,
    onOpenChange,
    event,
    selectedDate,
    sessions,
    classes
}: EventDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "academic",
        start_date: "",
        end_date: "",
        all_day: false,
        visibility: "public",
        session_id: "",
        term_id: "",
    })

    const [selectedClasses, setSelectedClasses] = useState<string[]>([])

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title || "",
                description: event.description || "",
                category: event.category || "academic",
                start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "",
                end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "",
                all_day: event.all_day || false,
                visibility: event.visibility || "public",
                session_id: event.session_id || "",
                term_id: event.term_id || "",
            })
            setSelectedClasses(event.event_classes?.map((ec: any) => ec.class_id) || [])
        } else if (selectedDate) {
            const start = new Date(selectedDate)
            start.setHours(9, 0, 0, 0)
            const end = new Date(selectedDate)
            end.setHours(10, 0, 0, 0)

            setFormData({
                ...formData,
                start_date: start.toISOString().slice(0, 16),
                end_date: end.toISOString().slice(0, 16),
            })
            setSelectedClasses([])
        }
    }, [event, selectedDate, open])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        try {
            if (event) {
                await updateEvent(event.id, formData, selectedClasses)
                toast.success("Event updated successfully")
            } else {
                await createEvent(formData, selectedClasses)
                toast.success("Event created successfully")
            }
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        if (!event) return
        setIsDeleting(true)
        try {
            await deleteEvent(event.id)
            toast.success("Event deleted successfully")
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to delete event")
        } finally {
            setIsDeleting(false)
        }
    }

    const currentSession = sessions.find(s => s.id === formData.session_id)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
                        {event && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. PTA Meeting, Term Start..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={v => setFormData({ ...formData, category: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="academic">Academic</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="admin">Administrative</SelectItem>
                                    <SelectItem value="holiday">Holiday</SelectItem>
                                    <SelectItem value="class">Class-specific</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Visibility</Label>
                            <Select
                                value={formData.visibility}
                                onValueChange={v => setFormData({ ...formData, visibility: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Who can see this?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public (Everyone)</SelectItem>
                                    <SelectItem value="staff">Staff Only</SelectItem>
                                    <SelectItem value="admin">Admin Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date & Time</Label>
                            <Input
                                id="start_date"
                                type="datetime-local"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date & Time</Label>
                            <Input
                                id="end_date"
                                type="datetime-local"
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="all_day"
                            checked={formData.all_day}
                            onCheckedChange={v => setFormData({ ...formData, all_day: !!v })}
                        />
                        <Label htmlFor="all_day" className="text-sm font-medium leading-none">All day event</Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Add more details about this event..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Session (Optional)</Label>
                            <Select
                                value={formData.session_id}
                                onValueChange={v => setFormData({ ...formData, session_id: v, term_id: "" })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Term (Optional)</Label>
                            <Select
                                value={formData.term_id}
                                onValueChange={v => setFormData({ ...formData, term_id: v })}
                                disabled={!formData.session_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currentSession?.terms?.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label>Apply to Specific Classes (Optional)</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border rounded-md bg-slate-50 dark:bg-slate-900/50">
                            {classes.map(cls => (
                                <div key={cls.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`class-${cls.id}`}
                                        checked={selectedClasses.includes(cls.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedClasses([...selectedClasses, cls.id])
                                            else setSelectedClasses(selectedClasses.filter(id => id !== cls.id))
                                        }}
                                    />
                                    <Label htmlFor={`class-${cls.id}`} className="text-xs">{cls.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {event ? "Update Event" : "Create Event"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
