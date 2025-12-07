"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
  fee_reminders: boolean
  new_results: boolean
  new_announcements: boolean
  attendance_alerts: boolean
  new_messages: boolean
}

interface Props {
  userId: string
  initialPreferences: NotificationPreferences
}

export default function NotificationsPageClient({ userId, initialPreferences }: Props) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) throw new Error("Failed to save preferences")

      toast.success("Notification preferences saved successfully")
    } catch (error) {
      toast.error("Failed to save preferences")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-muted-foreground">Manage how you receive notifications from the school</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_enabled">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={() => handleToggle("email_enabled")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms_enabled">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
            </div>
            <Switch
              id="sms_enabled"
              checked={preferences.sms_enabled}
              onCheckedChange={() => handleToggle("sms_enabled")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in_app_enabled">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">Show notifications in the application</p>
            </div>
            <Switch
              id="in_app_enabled"
              checked={preferences.in_app_enabled}
              onCheckedChange={() => handleToggle("in_app_enabled")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Choose which types of notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="fee_reminders">Fee Reminders</Label>
              <p className="text-sm text-muted-foreground">Alerts about outstanding fees and payment deadlines</p>
            </div>
            <Switch
              id="fee_reminders"
              checked={preferences.fee_reminders}
              onCheckedChange={() => handleToggle("fee_reminders")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new_results">New Results</Label>
              <p className="text-sm text-muted-foreground">Notifications when exam results are published</p>
            </div>
            <Switch
              id="new_results"
              checked={preferences.new_results}
              onCheckedChange={() => handleToggle("new_results")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new_announcements">New Announcements</Label>
              <p className="text-sm text-muted-foreground">School-wide announcements and updates</p>
            </div>
            <Switch
              id="new_announcements"
              checked={preferences.new_announcements}
              onCheckedChange={() => handleToggle("new_announcements")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="attendance_alerts">Attendance Alerts</Label>
              <p className="text-sm text-muted-foreground">Notifications about student absences or late arrivals</p>
            </div>
            <Switch
              id="attendance_alerts"
              checked={preferences.attendance_alerts}
              onCheckedChange={() => handleToggle("attendance_alerts")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new_messages">New Messages</Label>
              <p className="text-sm text-muted-foreground">Notifications for new messages from teachers</p>
            </div>
            <Switch
              id="new_messages"
              checked={preferences.new_messages}
              onCheckedChange={() => handleToggle("new_messages")}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  )
}
