import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
    const user = await requireAuth()

    if (user.role === "teacher") {
        redirect("/teacher-dashboard")
    }

    if (user.role === "parent") {
        redirect("/parent/dashboard")
    }

    if (user.role === "accountant") {
        redirect("/cashier-dashboard")
    }

    const supabase = await createClient()

    // 1. Prepare Date Ranges
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    const sixMonthsAgo = new Date(todayStart)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    // 2. Parallel Data Fetching
    const [
        { count: totalStudents },
        { count: totalTeachers },
        { data: guardiansData },
        { data: todayPayments },
        { data: yesterdayPayments },
        { data: invoices },
        { data: activeSession },
        { data: enrollmentHistory },
        { data: sections },
        { data: recentRegistrations },
        { data: upcomingEvents }
    ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("teachers").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("guardians").select("id, first_name, last_name, phone"),
        supabase.from("payments").select("amount").gte("payment_date", todayStart.toISOString()).lte("payment_date", now.toISOString()),
        supabase.from("payments").select("amount").gte("payment_date", yesterdayStart.toISOString()).lt("payment_date", todayStart.toISOString()),
        supabase.from("invoices").select("balance, status").is("deleted_at", null),
        supabase.from("sessions").select("*, terms(*)").eq("is_active", true).maybeSingle(),
        supabase.from("students").select("created_at").gte("created_at", sixMonthsAgo.toISOString()).order("created_at", { ascending: true }),
        supabase.from("sections").select("id, name").eq("is_active", true),
        supabase.from("students").select("id, student_id, first_name, last_name, created_at, status").order("created_at", { ascending: false }).limit(6),
        supabase.from("school_events").select("*").gte("start_date", now.toISOString()).order("start_date", { ascending: true }).limit(5)
    ])

    // 3. Metric Calculations (Local JS)
    const todayRevenue = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const yesterdayRevenue = yesterdayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const revenueTrend = yesterdayRevenue === 0 ? (todayRevenue > 0 ? 100 : 0) : Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)

    const totalOutstanding = invoices?.reduce((sum, i) => sum + Number(i.balance), 0) || 0
    const collectionRate = invoices?.length ? ((invoices.filter((i) => i.status === "Paid").length / invoices.length) * 100).toFixed(1) : "0"

    const activeTerm = activeSession?.terms?.find((t: any) => t.is_active)

    // 4. Enrollment Trend Calculation
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const enrollmentTrend = Array.from({ length: 6 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (5 - i))
        const m = d.getMonth()
        const y = d.getFullYear()
        const count = enrollmentHistory?.filter(s => {
            const sd = new Date(s.created_at)
            return sd.getMonth() === m && sd.getFullYear() === y
        }).length || 0
        return { month: monthNames[m], count }
    })

    // 5. Optimized Section Distribution
    const sectionStats = await Promise.all(
        (sections || []).map(async (section: any) => {
            const { data: classes } = await supabase.from("classes").select("id").eq("section_id", section.id).eq("is_active", true)
            const classIds = classes?.map(c => c.id) || []
            let count = 0
            if (classIds.length > 0) {
                const { count: c } = await supabase
                    .from("student_enrollments")
                    .select("*", { count: "exact", head: true })
                    .in("class_id", classIds)
                    .eq("is_active", true)
                count = c || 0
            }
            return { section: section.name, count }
        })
    )

    return (
        <AdminDashboardClient
            user={user}
            activeSession={activeSession}
            activeTerm={activeTerm}
            stats={{
                totalStudents: totalStudents || 0,
                totalTeachers: totalTeachers || 0,
                totalGuardians: guardiansData?.length || 0,
                todayRevenue,
                revenueTrend,
                totalOutstanding,
                collectionRate
            }}
            sectionStats={sectionStats}
            enrollmentTrend={enrollmentTrend}
            recentRegistrations={recentRegistrations || []}
            guardians={guardiansData || []}
            upcomingEvents={upcomingEvents || []}
        />
    )
}
