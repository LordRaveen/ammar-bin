export interface Student {
  id: string
  first_name: string
  last_name: string
  student_id: string
  email?: string
  phone?: string
  class?: string
  section?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface StudentData {
  id: string
  name: string
  class: string
  invoiceNumber: string
  invoices: StudentInvoiceItem[]
  isPaid?: boolean
}

export interface StudentInvoiceItem {
  id: string
  description: string
  dueDate: string
  balance: number
  status: "Paid" | "Unpaid" | "Partial"
}
