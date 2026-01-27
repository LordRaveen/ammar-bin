"use server"

import { createClient } from "@/lib/supabase/server"

export async function globalSearch(query: string) {
    const supabase = await createClient()
    const trimmedQuery = query.trim()

    if (!trimmedQuery || trimmedQuery.length < 2) return { students: [], guardians: [] }

    const [studentsResult, guardiansResult] = await Promise.all([
        supabase
            .from("students")
            .select("id, first_name, last_name, student_id")
            .or(`first_name.ilike.%${trimmedQuery}%,last_name.ilike.%${trimmedQuery}%,student_id.ilike.%${trimmedQuery}%`)
            .limit(5),
        supabase
            .from("guardians")
            .select("id, first_name, last_name, phone")
            .or(`first_name.ilike.%${trimmedQuery}%,last_name.ilike.%${trimmedQuery}%,phone.ilike.%${trimmedQuery}%`)
            .limit(5)
    ])

    return {
        students: studentsResult.data || [],
        guardians: guardiansResult.data || []
    }
}
