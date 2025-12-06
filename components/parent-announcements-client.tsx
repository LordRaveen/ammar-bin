"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bell,
  Calendar,
  BookOpen,
  PartyPopper,
  AlertTriangle,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Announcement = {
  id: string
  title: string
  content: string
  category: string
  priority: string
  target_audience: string
  created_at: string
  expires_at?: string
  attachment_url?: string
  teachers?: {
    first_name: string
    last_name: string
  }
}

const categoryIcons = {
  General: Bell,
  Event: PartyPopper,
  Exam: BookOpen,
  Holiday: Calendar,
  Emergency: AlertTriangle,
  PTA: Users,
}

const priorityColors = {
  Normal: "default",
  Important: "secondary",
  Urgent: "destructive",
} as const

interface ParentAnnouncementsClientProps {
  announcements: Announcement[]
}

export function ParentAnnouncementsClient({ announcements }: ParentAnnouncementsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedIds(newSet)
  }

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Group by priority
  const urgentAnnouncements = filteredAnnouncements.filter((a) => a.priority === "Urgent")
  const importantAnnouncements = filteredAnnouncements.filter((a) => a.priority === "Important")
  const normalAnnouncements = filteredAnnouncements.filter((a) => a.priority === "Normal")

  const renderAnnouncement = (announcement: Announcement) => {
    const Icon = categoryIcons[announcement.category as keyof typeof categoryIcons] || Bell
    const isExpanded = expandedIds.has(announcement.id)
    const contentPreview = announcement.content.slice(0, 150)
    const showReadMore = announcement.content.length > 150

    return (
      <Card key={announcement.id} className={cn(announcement.priority === "Urgent" && "border-destructive")}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "rounded-full p-2",
                announcement.priority === "Urgent"
                  ? "bg-destructive/10"
                  : announcement.priority === "Important"
                    ? "bg-secondary/50"
                    : "bg-muted",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{announcement.title}</CardTitle>
                <Badge variant={priorityColors[announcement.priority as keyof typeof priorityColors]}>
                  {announcement.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{announcement.category}</Badge>
                <span>•</span>
                <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                {announcement.teachers && (
                  <>
                    <span>•</span>
                    <span>
                      By {announcement.teachers.first_name} {announcement.teachers.last_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {isExpanded ? announcement.content : contentPreview}
              {!isExpanded && showReadMore && "..."}
            </p>
            {showReadMore && (
              <Button variant="ghost" size="sm" onClick={() => toggleExpanded(announcement.id)} className="h-8 px-2">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Read More
                  </>
                )}
              </Button>
            )}
            {announcement.attachment_url && (
              <a
                href={announcement.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View Attachment →
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Stay updated with school news and events</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Event">Events</SelectItem>
                <SelectItem value="Exam">Exams</SelectItem>
                <SelectItem value="Holiday">Holidays</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="PTA">PTA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Announcements</CardDescription>
            <CardTitle className="text-3xl">{filteredAnnouncements.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Urgent Messages</CardDescription>
            <CardTitle className="text-3xl text-destructive">{urgentAnnouncements.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Important Updates</CardDescription>
            <CardTitle className="text-3xl text-secondary-foreground">{importantAnnouncements.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-6">
        {urgentAnnouncements.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Urgent Announcements
            </h2>
            <div className="space-y-3">{urgentAnnouncements.map(renderAnnouncement)}</div>
          </div>
        )}

        {importantAnnouncements.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Important Updates
            </h2>
            <div className="space-y-3">{importantAnnouncements.map(renderAnnouncement)}</div>
          </div>
        )}

        {normalAnnouncements.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-muted-foreground">General Announcements</h2>
            <div className="space-y-3">{normalAnnouncements.map(renderAnnouncement)}</div>
          </div>
        )}

        {filteredAnnouncements.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No announcements found</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
