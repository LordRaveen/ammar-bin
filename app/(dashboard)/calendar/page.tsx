import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { SchoolCalendarClient } from "@/components/calendar/school-calendar-client"
import { getEvents } from "./actions"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
    const user = await requireAuth()
    const supabase = await createClient()

    // Parallel fetching for performance
    const [
        events,
        { data: sessions },
        { data: classes },
        { data: activeSession }
    ] = await Promise.all([
        getEvents(),
        supabase.from('sessions').select('*, terms(*)').order('start_date', { ascending: false }),
        supabase.from('classes').select('id, name'),
        supabase.from('sessions').select('*, terms(*)').eq('is_active', true).maybeSingle()
    ])

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <SchoolCalendarClient
                initialEvents={events}
                sessions={sessions || []}
                classes={classes || []}
                activeSession={activeSession}
                user={user}
            />
        </div>
    )
}
