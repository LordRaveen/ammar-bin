"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateSchoolSettings } from "@/app/(dashboard)/settings/school/actions"
import { useFormStatus } from "react-dom"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  )
}

export function GeneralSettingsTab({ settings }: { settings: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>School Information</CardTitle>
        <CardDescription>Update school details and contact information</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateSchoolSettings} className="space-y-4">
          <input type="hidden" name="id" value={settings?.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="school_name">School Name (English)</Label>
              <Input id="school_name" name="school_name" defaultValue={settings?.school_name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_name_arabic">School Name (Arabic)</Label>
              <Input
                id="school_name_arabic"
                name="school_name_arabic"
                defaultValue={settings?.school_name_arabic}
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={settings?.address} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone_primary">Primary Phone</Label>
              <Input id="phone_primary" name="phone_primary" defaultValue={settings?.phone_primary} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_secondary">Secondary Phone</Label>
              <Input id="phone_secondary" name="phone_secondary" defaultValue={settings?.phone_secondary} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={settings?.email} />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="student_id_prefix">Student ID Prefix</Label>
              <Input
                id="student_id_prefix"
                name="student_id_prefix"
                defaultValue={settings?.student_id_prefix}
                placeholder="ISM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_id_prefix">Staff ID Prefix</Label>
              <Input
                id="staff_id_prefix"
                name="staff_id_prefix"
                defaultValue={settings?.staff_id_prefix}
                placeholder="STAFF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_terms">Number of Terms</Label>
              <Input
                id="number_of_terms"
                name="number_of_terms"
                type="number"
                min="1"
                max="3"
                defaultValue={settings?.number_of_terms}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
