"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Key, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
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

export function ActivatePortalAccessButton({
  guardianId,
  guardianEmail,
}: {
  guardianId: string
  guardianEmail?: string | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
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

      toast({
        title: "Portal Access Activated",
        description: `Temporary password: ${data.temporaryPassword}. Please share this with the guardian securely.`,
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!guardianEmail) {
    return (
      <Button variant="outline" disabled>
        <Key className="mr-2 h-4 w-4" />
        No Email Set
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default">
          <Key className="mr-2 h-4 w-4" />
          Activate Portal Access
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Parent Portal Access</AlertDialogTitle>
          <AlertDialogDescription>
            This will create a parent account with a temporary password. The guardian will be able to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>View their children's information</li>
              <li>Check academic results and attendance</li>
              <li>View and pay school fees</li>
              <li>Communicate with teachers</li>
            </ul>
            <p className="mt-2 font-medium">
              A temporary password will be generated. Please share it securely with the guardian.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleActivate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activate Access
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
