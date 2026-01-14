import type { AttendanceStatus, AttendanceStats } from "@/lib/types/attendance"

/**
 * Calculate attendance statistics from attendance records
 */
export function calculateAttendanceStats(records: { status: AttendanceStatus }[]): AttendanceStats {
  const stats: AttendanceStats = {
    total_present: 0,
    total_absent: 0,
    total_late: 0,
    total_excused: 0,
    attendance_percentage: 0,
  }

  records.forEach((record) => {
    switch (record.status) {
      case "Present":
        stats.total_present++
        break
      case "Absent":
        stats.total_absent++
        break
      case "Late":
        stats.total_late++
        break
      case "Excused":
        stats.total_excused++
        break
    }
  })

  const total = records.length
  if (total > 0) {
    stats.attendance_percentage = Math.round(((stats.total_present + stats.total_late) / total) * 100)
  }

  return stats
}

/**
 * Check if a date is valid for marking attendance (not in future)
 */
export function isValidAttendanceDate(date: string): boolean {
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return selectedDate <= today
}

/**
 * Format date for display
 */
export function formatAttendanceDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Get status badge color
 */
export function getStatusColor(status: AttendanceStatus): string {
  switch (status) {
    case "Present":
      return "bg-green-100 text-green-800"
    case "Absent":
      return "bg-red-100 text-red-800"
    case "Late":
      return "bg-yellow-100 text-yellow-800"
    case "Excused":
      return "bg-gray-100 text-gray-800"
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: AttendanceStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
