"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Loader2, Copy, CheckCircle2, RotateCcw, Eye, EyeOff, Shield, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface PortalAccessManagerProps {
  guardianId: string
  guardianEmail?: string | null
  guardianPhone?: string | null
  hasAccess: boolean
  onSuccess?: () => void
}

export function PortalAccessManager({
  guardianId,
  guardianEmail,
  guardianPhone,
  hasAccess,
  onSuccess,
}: PortalAccessManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleActivate = async () => {
    if (!guardianEmail) {
      toast({
        title: "Email Required",
        description: "Guardian must have an email address to activate portal access.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/guardians/activate-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate portal access")
      }

      setGeneratedPassword(data.temporaryPassword)

      toast({
        title: "Portal Access Activated Successfully",
        description: "The login credentials are displayed below. Please share them securely with the guardian.",
        duration: 5000,
      })

      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setIsResetting(true)

    try {
      const response = await fetch("/api/guardians/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setGeneratedPassword(data.temporaryPassword)
      setShowPassword(false)

      toast({
        title: "Password Reset Successfully",
        description: "A new temporary password has been generated. Please share it securely with the guardian.",
        duration: 5000,
      })

      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied to Clipboard",
        description: `${label} has been copied successfully.`,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please copy manually.",
        variant: "destructive",
      })
    }
  }

  const copyAllCredentials = async () => {
    if (!guardianEmail || !generatedPassword) return

    const credentials = `Parent Portal Login Credentials\n\nEmail: ${guardianEmail}\nPassword: ${generatedPassword}\n\nLogin at: [Your School Portal URL]/auth/parent-login`

    try {
      await navigator.clipboard.writeText(credentials)
      toast({
        title: "Credentials Copied",
        description: "Full login credentials have been copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy credentials. Please copy manually.",
        variant: "destructive",
      })
    }
  }

  if (!hasAccess && !generatedPassword) {
    if (!guardianEmail) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Guardian must have an email address to activate portal access. Please add an email first.
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Card className="border-dashed">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Parent Portal Access</CardTitle>
          </div>
          <CardDescription>Grant this guardian access to the parent portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Activating portal access will allow the guardian to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View their children's information and academic performance</li>
              <li>Check attendance records and results</li>
              <li>View and pay school fees online</li>
              <li>Receive announcements and communicate with teachers</li>
            </ul>
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" size="lg">
                <Key className="mr-2 h-4 w-4" />
                Activate Portal Access
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Activate Parent Portal Access</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a parent account with a temporary password. The guardian will be able to log in and
                  access the parent portal.
                  <p className="mt-3 font-medium">
                    Login credentials will be generated and displayed securely. Please share them with the guardian via
                    a secure channel.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleActivate} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Activating..." : "Activate Access"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    )
  }

  if (generatedPassword) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
            <CardTitle className="text-lg">Portal Access Credentials</CardTitle>
          </div>
          <CardDescription>
            {hasAccess ? "New password generated successfully" : "Account activated successfully"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Please share these credentials with the guardian securely. They can log in at the parent portal.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {/* Email Display */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Login Email</label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-background border rounded-md font-mono text-sm">
                  {guardianEmail}
                </div>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(guardianEmail!, "Email")}>
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Password Display */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Temporary Password</label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-background border rounded-md font-mono text-sm">
                  {showPassword ? generatedPassword : "••••••••••••"}
                </div>
                <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedPassword, "Password")}>
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={copyAllCredentials} variant="secondary" className="w-full">
            <Copy className="mr-2 h-4 w-4" />
            Copy All Credentials
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Guardian should change this password after first login for security.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Portal Access Active</CardTitle>
          </div>
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        </div>
        <CardDescription>This guardian has access to the parent portal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Login Email:</span>
            <span className="font-medium">{guardianEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Status:</span>
            <Badge variant="outline" className="text-green-600">
              Active
            </Badge>
          </div>
        </div>

        <Separator />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent" disabled={isResetting}>
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Parent Portal Password</AlertDialogTitle>
              <AlertDialogDescription>
                This will generate a new temporary password for the guardian. The current password will no longer work.
                <p className="mt-3 font-medium">
                  The new password will be displayed after reset. Please share it securely with the guardian.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPassword}>Reset Password</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-muted-foreground text-center">
          Guardian can also change their password from their profile settings.
        </p>
      </CardContent>
    </Card>
  )
}
