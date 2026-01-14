/**
 * Attendance system type definitions
 * Provides type-safe structures for all attendance operations
 */

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused"

export interface AttendanceRecord {
  id: string
  student_id: string
  class_id: string
  session_id: string
  term_id: string
  date: string
  status: AttendanceStatus
  remarks: string | null
  recorded_by: string
  created_at: string
  updated_at: string
}

export interface AttendanceInput {
  student_id: string
  status: AttendanceStatus
  remarks?: string
}

export interface BulkMarkAttendanceRequest {
  class_id: string
  session_id: string
  term_id: string
  date: string
  records: AttendanceInput[]
}

export interface AttendanceStats {
  total_present: number
  total_absent: number
  total_late: number
  total_excused: number
  attendance_percentage: number
}

export interface StudentAttendance {
  student_id: string
  first_name: string
  last_name: string
  status: AttendanceStatus
  remarks: string | null
}
