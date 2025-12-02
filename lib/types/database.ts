/**
 * Database types for type-safe queries
 * These match the database schema
 */

export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'accountant' | 'parent';

export type StudentStatus = 'Active' | 'Inactive' | 'Graduated' | 'Withdrawn';

export type Gender = 'Male' | 'Female';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'POS';

export type InvoiceStatus = 'Pending' | 'Partial' | 'Paid' | 'Overdue';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  permissions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolSettings {
  id: string;
  school_name: string;
  school_name_arabic: string;
  address: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  logo_url: string | null;
  student_id_prefix: string;
  staff_id_prefix: string;
  number_of_terms: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Term {
  id: string;
  session_id: string;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  section_id: string;
  name: string;
  capacity: number;
  class_teacher_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
