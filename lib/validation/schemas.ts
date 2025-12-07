/**
 * Validation schemas for data integrity
 * Prevents invalid data from entering the database
 */

// Nigerian phone number validation
export function validateNigerianPhone(phone: string): boolean {
  if (!phone) return true // Allow empty

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, "")

  // Check formats:
  // 080xxxxxxxx (11 digits starting with 0)
  // +234xxxxxxxxxx (14 chars starting with +234)
  // 234xxxxxxxxxx (13 digits starting with 234)
  const patterns = [
    /^0[789][01]\d{8}$/, // 080, 081, 070, 090, 091
    /^\+2340?[789][01]\d{8}$/, // +234080...
    /^2340?[789][01]\d{8}$/, // 234080...
  ]

  return patterns.some((pattern) => pattern.test(cleaned))
}

// Email validation
export function validateEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Date validation - no future dates for birthdates
export function validateBirthdate(date: string | Date): boolean {
  const birthDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Must be in the past
  if (birthDate >= today) return false

  // Must be reasonable (not more than 100 years ago)
  const hundredYearsAgo = new Date()
  hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100)

  return birthDate >= hundredYearsAgo
}

// Student ID validation - alphanumeric, 4-20 chars
export function validateStudentId(studentId: string): boolean {
  if (!studentId) return false
  return /^[A-Z0-9]{4,20}$/i.test(studentId)
}

// Staff ID validation
export function validateStaffId(staffId: string): boolean {
  if (!staffId) return false
  return /^[A-Z0-9]{4,20}$/i.test(staffId)
}

// Amount validation - must be positive number
export function validateAmount(amount: number | string): boolean {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return !isNaN(num) && num > 0
}

// Name validation - letters, spaces, hyphens, apostrophes only
export function validateName(name: string): boolean {
  if (!name || name.trim().length < 2) return false
  return /^[a-zA-Z\s\-']+$/.test(name)
}

// Validate all student fields
export interface StudentValidation {
  student_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  email?: string
  phone?: string
  gender: string
}

export function validateStudentData(data: StudentValidation): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!validateStudentId(data.student_id)) {
    errors.push("Invalid student ID format (use 4-20 alphanumeric characters)")
  }

  if (!validateName(data.first_name)) {
    errors.push("Invalid first name (minimum 2 letters)")
  }

  if (!validateName(data.last_name)) {
    errors.push("Invalid last name (minimum 2 letters)")
  }

  if (!validateBirthdate(data.date_of_birth)) {
    errors.push("Invalid date of birth (must be in the past)")
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push("Invalid email format")
  }

  if (data.phone && !validateNigerianPhone(data.phone)) {
    errors.push("Invalid phone number format")
  }

  if (!["Male", "Female"].includes(data.gender)) {
    errors.push("Gender must be Male or Female")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Validate teacher data
export interface TeacherValidation {
  staff_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
}

export function validateTeacherData(data: TeacherValidation): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!validateStaffId(data.staff_id)) {
    errors.push("Invalid staff ID format (use 4-20 alphanumeric characters)")
  }

  if (!validateName(data.first_name)) {
    errors.push("Invalid first name (minimum 2 letters)")
  }

  if (!validateName(data.last_name)) {
    errors.push("Invalid last name (minimum 2 letters)")
  }

  if (!validateEmail(data.email)) {
    errors.push("Invalid email format")
  }

  if (data.phone && !validateNigerianPhone(data.phone)) {
    errors.push("Invalid phone number format")
  }

  if (data.date_of_birth && !validateBirthdate(data.date_of_birth)) {
    errors.push("Invalid date of birth (must be in the past)")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Validate guardian data
export interface GuardianValidation {
  first_name: string
  last_name: string
  email?: string
  phone_primary?: string
  relationship: string
}

export function validateGuardianData(data: GuardianValidation): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!validateName(data.first_name)) {
    errors.push("Invalid first name (minimum 2 letters)")
  }

  if (!validateName(data.last_name)) {
    errors.push("Invalid last name (minimum 2 letters)")
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push("Invalid email format")
  }

  if (data.phone_primary && !validateNigerianPhone(data.phone_primary)) {
    errors.push("Invalid phone number format")
  }

  const validRelationships = ["Father", "Mother", "Guardian", "Uncle", "Aunt", "Grandparent", "Sibling", "Other"]
  if (!validRelationships.includes(data.relationship)) {
    errors.push("Invalid relationship type")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
