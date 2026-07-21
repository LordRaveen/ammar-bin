import { redirect } from "next/navigation"

export default function AuditTrailPage() {
  redirect("/settings?tab=security")
}
