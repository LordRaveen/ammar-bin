"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AssignTeacherModal } from "@/components/assign-teacher-modal"

interface AssignTeacherClientWrapperProps {
  classId: string
  sessionId: string
  teachers: Array<{ id: string; first_name: string; middle_name: string | null; last_name: string; email: string }>
}

export function AssignTeacherClientWrapper({ classId, sessionId, teachers }: AssignTeacherClientWrapperProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={(e) => {
          e.preventDefault()
          setModalOpen(true)
        }}
        size="sm"
        className="w-full"
      >
        Assign Teacher
      </Button>
      <AssignTeacherModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        classId={classId}
        sessionId={sessionId}
        teachers={teachers}
        type="class"
      />
    </>
  )
}
