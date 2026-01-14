"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCopy, IconAdjustments } from "@tabler/icons-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { duplicateFeeTemplate, applyBulkTemplate, deleteFeeTemplate } from "@/app/(dashboard)/settings/fees/actions"

export function FeeTemplatesTab({
  classes,
  sessions,
  activeSession,
}: {
  classes: any[]
  sessions: any[]
  activeSession: any
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [showBulkApply, setShowBulkApply] = useState(false)
  const [duplicateSourceClass, setDuplicateSourceClass] = useState("")
  const [duplicateTargetClass, setDuplicateTargetClass] = useState("")
  const [sourceSession, setSourceSession] = useState("")
  const [targetSession, setTargetSession] = useState("")
  const [percentageAdjustment, setPercentageAdjustment] = useState("0")
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleDuplicate = async () => {
    if (!duplicateSourceClass || !duplicateTargetClass || !sourceSession || !targetSession) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    try {
      await duplicateFeeTemplate({
        sourceClassId: duplicateSourceClass,
        targetClassId: duplicateTargetClass,
        sourceSessionId: sourceSession,
        targetSessionId: targetSession,
      })

      toast({ title: "Success", description: "Fee template duplicated successfully" })
      setShowDuplicate(false)
      setDuplicateSourceClass("")
      setDuplicateTargetClass("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to duplicate template",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkApply = async () => {
    if (!duplicateSourceClass || selectedClasses.length === 0 || !sourceSession || !targetSession) {
      toast({ title: "Error", description: "Please select source template and target classes", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    try {
      const adjustment = Number.parseFloat(percentageAdjustment) || 0
      await applyBulkTemplate({
        sourceClassId: duplicateSourceClass,
        targetClassIds: selectedClasses,
        sourceSessionId: sourceSession,
        targetSessionId: targetSession,
        percentageAdjustment: adjustment,
      })

      toast({ title: "Success", description: "Template applied to all selected classes" })
      setShowBulkApply(false)
      setSelectedClasses([])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply template",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteTemplate = async (classId: string, sessionId: string) => {
    if (!confirm("Are you sure you want to delete this fee template?")) return

    setIsProcessing(true)
    try {
      await deleteFeeTemplate(classId, sessionId)
      toast({ title: "Success", description: "Fee template deleted successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAdjustments className="h-5 w-5" />
            Fee Templates Management
          </CardTitle>
          <CardDescription>Manage and apply fee templates across classes and sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowDuplicate(true)}>
              <IconCopy className="h-4 w-4 mr-2" />
              Duplicate Template
            </Button>
            <Button onClick={() => setShowBulkApply(true)} variant="outline">
              <IconAdjustments className="h-4 w-4 mr-2" />
              Bulk Apply
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Use these tools to efficiently manage fee templates across multiple classes and sessions.
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDuplicate} onOpenChange={setShowDuplicate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Fee Template</DialogTitle>
            <DialogDescription>Copy fee structure from one class to another</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="source-session">Source Session</Label>
              <Select value={sourceSession} onValueChange={setSourceSession}>
                <SelectTrigger id="source-session">
                  <SelectValue placeholder="Select source session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions?.map((session: any) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source-class">Source Class</Label>
              <Select value={duplicateSourceClass} onValueChange={setDuplicateSourceClass}>
                <SelectTrigger id="source-class">
                  <SelectValue placeholder="Select source class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.section?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target-session">Target Session</Label>
              <Select value={targetSession} onValueChange={setTargetSession}>
                <SelectTrigger id="target-session">
                  <SelectValue placeholder="Select target session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions?.map((session: any) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target-class">Target Class</Label>
              <Select value={duplicateTargetClass} onValueChange={setDuplicateTargetClass}>
                <SelectTrigger id="target-class">
                  <SelectValue placeholder="Select target class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.section?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleDuplicate} disabled={isProcessing} className="w-full">
              {isProcessing ? "Duplicating..." : "Duplicate Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkApply} onOpenChange={setShowBulkApply}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Apply Template</DialogTitle>
            <DialogDescription>
              Apply a template to multiple classes with optional percentage adjustment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-source-session">Source Session</Label>
              <Select value={sourceSession} onValueChange={setSourceSession}>
                <SelectTrigger id="bulk-source-session">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions?.map((session: any) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-source-class">Source Class Template</Label>
              <Select value={duplicateSourceClass} onValueChange={setDuplicateSourceClass}>
                <SelectTrigger id="bulk-source-class">
                  <SelectValue placeholder="Select template class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.section?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-target-session">Target Session</Label>
              <Select value={targetSession} onValueChange={setTargetSession}>
                <SelectTrigger id="bulk-target-session">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions?.map((session: any) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adjustment">Percentage Adjustment (%)</Label>
              <Input
                id="adjustment"
                type="number"
                placeholder="0"
                value={percentageAdjustment}
                onChange={(e) => setPercentageAdjustment(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Use positive for increase, negative for decrease</p>
            </div>

            <div>
              <Label>Target Classes</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {classes?.map((cls: any) => (
                  <div key={cls.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={cls.id}
                      checked={selectedClasses.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses([...selectedClasses, cls.id])
                        } else {
                          setSelectedClasses(selectedClasses.filter((id) => id !== cls.id))
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={cls.id} className="text-sm cursor-pointer flex-1">
                      {cls.name} ({cls.section?.name})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleBulkApply} disabled={isProcessing} className="w-full">
              {isProcessing ? "Applying..." : `Apply to ${selectedClasses.length} Classes`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
