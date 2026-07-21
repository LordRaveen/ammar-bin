import { redirect } from "next/navigation"

export default function AccountLockoutsPage() {
  redirect("/settings?tab=security")
}
