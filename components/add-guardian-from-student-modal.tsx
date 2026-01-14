"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createGuardian } from "@/app/(dashboard)/guardians/actions"
import { useToast } from "@/hooks/use-toast"

interface AddGuardianFromStudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardianCreated: (guardian: { id: string; first_name: string; last_name: string; phone: string }) => void
}

export function AddGuardianFromStudentModal({
  open,
  onOpenChange,
  onGuardianCreated,
}: AddGuardianFromStudentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const newGuardian = await createGuardian(formData)

      toast({
        title: "Success",
        description: "Guardian created successfully",
      })

      // Pass the new guardian back to parent
      onGuardianCreated({
        id: newGuardian.id,
        first_name: newGuardian.first_name,
        last_name: newGuardian.last_name,
        phone: newGuardian.phone,
      })

      // Close modal
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating guardian:", error)
      toast({
        title: "Error",
        description: "Failed to create guardian. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Guardian</DialogTitle>
          <DialogDescription>Create a guardian account to link with this student</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input id="first_name" name="first_name" placeholder="Ahmad" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input id="middle_name" name="middle_name" placeholder="Muhammad" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input id="last_name" name="last_name" placeholder="Ibrahim" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="ahmad@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input id="phone" name="phone" type="tel" placeholder="08012345678" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
              <Input id="whatsapp_number" name="whatsapp_number" type="tel" placeholder="08012345678" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternate_phone">Alternate Phone</Label>
              <Input id="alternate_phone" name="alternate_phone" type="tel" placeholder="08098765432" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input id="address" name="address" placeholder="No 1, Gwamna Awan Road, Kaduna" required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input id="occupation" name="occupation" placeholder="Business Owner" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship_type">
                Relationship Type <span className="text-destructive">*</span>
              </Label>
              <Select name="relationship_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Guardian"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
