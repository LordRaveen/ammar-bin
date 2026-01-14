/**
 * Attendance calculation utilities
 * Provides functions for attendance statistics and validation
 */

import type { AttendanceRecord, AttendanceStats, AttendanceStatus } from "@/lib/types/attendance"

export function calculateAttendancePercentage(records: AttendanceRecord[], workingDays: number): number {
  if (workingDays === 0) return 0
  const presentDays = records.filter((r) => r.status === "Present" || r.status === "Late").length
  return (presentDays / workingDays) * 100
}

export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  return {
    total_present: records.filter((r) => r.status === "Present").length,
    total_absent: records.filter((r) => r.status === "Absent").length,
    total_late: records.filter((r) => r.status === "Late").length,
    total_excused: records.filter((r) => r.status === "Excused").length,
    attendance_percentage: 0, // To be calculated with working days
  }
}

export function isValidAttendanceDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  // Allow marking attendance for today and past dates, not future dates
  return date <= today
}

export function canMarkAttendance(userRole: string): boolean {
  return userRole === "teacher" || userRole === "admin"
}

export function getStatusColor(status: AttendanceStatus): string {
  switch (status) {
    case "Present":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
    case "Absent":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
    case "Late":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
    case "Excused":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
  }
}
