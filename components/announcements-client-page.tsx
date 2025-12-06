"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Megaphone } from "lucide-react"
import { AddAnnouncementDialog } from "@/components/add-announcement-dialog"
import { EditAnnouncementDialog } from "@/components/edit-announcement-dialog"
import { DeleteAnnouncementDialog } from "@/components/delete-announcement-dialog"
import type { UserRole } from "@/lib/types/database"

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  priority: string
  target_audience: string
  created_at: string
  expires_at: string | null
  teacher?: {
    first_name: string
    last_name: string
  }
}

interface AnnouncementsClientPageProps {
  initialAnnouncements: Announcement[]
  userRole: UserRole
}

export function AnnouncementsClientPage({ initialAnnouncements, userRole }: AnnouncementsClientPageProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [audienceFilter, setAudienceFilter] = useState<string>("all")
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const canManage = userRole === "admin" || userRole === "super_admin"

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter
    const matchesAudience = audienceFilter === "all" || announcement.target_audience === audienceFilter

    return matchesSearch && matchesCategory && matchesAudience
  })

  const handleAnnouncementAdded = (newAnnouncement: Announcement) => {
    setAnnouncements([newAnnouncement, ...announcements])
    setIsAddDialogOpen(false)
  }

  const handleAnnouncementUpdated = (updatedAnnouncement: Announcement) => {
    setAnnouncements(announcements.map((a) => (a.id === updatedAnnouncement.id ? updatedAnnouncement : a)))
    setIsEditDialogOpen(false)
    setSelectedAnnouncement(null)
  }

  const handleAnnouncementDeleted = (deletedId: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== deletedId))
    setIsDeleteDialogOpen(false)
    setSelectedAnnouncement(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "destructive"
      case "Important":
        return "default"
      default:
        return "secondary"
    }
  }

  const getAudienceBadgeColor = (audience: string) => {
    switch (audience) {
      case "Parents":
        return "bg-blue-100 text-blue-800"
      case "Teachers":
        return "bg-green-100 text-green-800"
      case "Students":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            {canManage ? "Manage and create announcements" : "View school announcements"}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            All Announcements
          </CardTitle>
          <CardDescription>
            {canManage
              ? "Create, edit, and manage announcements for parents, teachers, and students"
              : "View all announcements from the school"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search announcements..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
                <SelectItem value="Exam">Exam</SelectItem>
                <SelectItem value="Holiday">Holiday</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="PTA">PTA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="All">Everyone</SelectItem>
                <SelectItem value="Parents">Parents</SelectItem>
                <SelectItem value="Teachers">Teachers</SelectItem>
                <SelectItem value="Students">Students</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || categoryFilter !== "all" || audienceFilter !== "all"
                ? "No announcements found matching your filters."
                : "No announcements yet. Create your first announcement to get started."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{announcement.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{announcement.content}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{announcement.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAudienceBadgeColor(announcement.target_audience)}>
                          {announcement.target_audience}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(announcement.priority)}>{announcement.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAnnouncement(announcement)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAnnouncement(announcement)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <>
          <AddAnnouncementDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAnnouncementAdded={handleAnnouncementAdded}
          />
          {selectedAnnouncement && (
            <>
              <EditAnnouncementDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                announcement={selectedAnnouncement}
                onAnnouncementUpdated={handleAnnouncementUpdated}
              />
              <DeleteAnnouncementDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                announcementId={selectedAnnouncement.id}
                announcementTitle={selectedAnnouncement.title}
                onAnnouncementDeleted={handleAnnouncementDeleted}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
