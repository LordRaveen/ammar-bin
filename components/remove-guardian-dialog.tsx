"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { removeGuardianRelation } from "@/app/(dashboard)/students/actions"
import { Loader2 } from "lucide-react"

interface RemoveGuardianDialogProps {
  relationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemoveGuardianDialog({ relationId, open, onOpenChange }: RemoveGuardianDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleRemove() {
    setIsRemoving(true)
    try {
      const result = await removeGuardianRelation(relationId)

      if (result.success) {
        toast({
          title: "Guardian Removed",
          description: "Guardian has been removed from this student.",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove guardian",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Guardian?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the guardian's link to this student. The guardian account will remain in the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Guardian"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
