"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Edit, Key, Mail, Phone, MapPin, User, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ParentProfileClientProps {
  guardian: any
  children: any[]
  userEmail: string
}

export default function ParentProfileClient({ guardian, children, userEmail }: ParentProfileClientProps) {
  const { toast } = useToast()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Profile form state
  const [firstName, setFirstName] = useState(guardian.first_name || "")
  const [middleName, setMiddleName] = useState(guardian.middle_name || "")
  const [lastName, setLastName] = useState(guardian.last_name || "")
  const [phone, setPhone] = useState(guardian.phone || "")
  const [alternatePhone, setAlternatePhone] = useState(guardian.alternate_phone || "")
  const [whatsappNumber, setWhatsappNumber] = useState(guardian.whatsapp_number || "")
  const [email, setEmail] = useState(guardian.email || "")
  const [address, setAddress] = useState(guardian.address || "")
  const [occupation, setOccupation] = useState(guardian.occupation || "")

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Notification preferences
  const [smsNotifications, setSmsNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)

  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/guardians/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardianId: guardian.id,
          firstName,
          middleName,
          lastName,
          phone,
          alternatePhone,
          whatsappNumber,
          email,
          address,
          occupation,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        setIsEditingProfile(false)
        // Reload page to show updated data
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/guardians/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        })
        setIsChangingPassword(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to change password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while changing password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic profile details</CardDescription>
            </div>
            {!isEditingProfile && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Middle Name (Optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Your occupation"
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Primary Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="Alternate phone (Optional)"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="WhatsApp number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Home Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full home address"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditingProfile(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {guardian.first_name?.[0]}
                    {guardian.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold">
                    {guardian.first_name} {guardian.middle_name} {guardian.last_name}
                  </h3>
                  <p className="text-muted-foreground">{guardian.occupation || "N/A"}</p>
                  <Badge variant="outline" className="mt-1">
                    {guardian.relationship_type || "Parent"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Phone</p>
                    <p className="font-medium">{guardian.phone || "N/A"}</p>
                  </div>
                </div>
                {guardian.alternate_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Alternate Phone</p>
                      <p className="font-medium">{guardian.alternate_phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{guardian.email || userEmail}</p>
                  </div>
                </div>
                {guardian.whatsapp_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{guardian.whatsapp_number}</p>
                    </div>
                  </div>
                )}
              </div>

              {guardian.address && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Home Address</p>
                      <p className="font-medium">{guardian.address}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Children */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Children</CardTitle>
          <CardDescription>Students associated with your account</CardDescription>
        </CardHeader>
        <CardContent>
          {children.length > 0 ? (
            <div className="space-y-3">
              {children.map((child: any) => (
                <div key={child.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={child.photo_url || "/placeholder.svg"} alt={child.first_name} />
                    <AvatarFallback>
                      {child.first_name?.[0]}
                      {child.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {child.first_name} {child.middle_name} {child.last_name}
                      </p>
                      {child.is_primary && <Badge variant="secondary">Primary Guardian</Badge>}
                      <Badge variant={child.status === "Active" ? "default" : "secondary"}>{child.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {child.student_id} • {child.relationship || "Child"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No children linked to your account</p>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Change your account password</p>
              </div>
              <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Enter your current password and choose a new password</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsChangingPassword(false)} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword} disabled={isLoading}>
                        {isLoading ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive SMS for important updates</p>
                </div>
              </div>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates and announcements</p>
                </div>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">In-App Notifications</p>
                  <p className="text-sm text-muted-foreground">Show notifications within the portal</p>
                </div>
              </div>
              <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
