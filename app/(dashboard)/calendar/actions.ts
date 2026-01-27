"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getEvents() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('school_events')
        .select(`
            *,
            event_classes(class_id),
            event_students(student_id)
        `)
        .order('start_date', { ascending: true })

    if (error) throw error
    return data
}

export async function createEvent(formData: any, targetClasses?: string[], targetStudents?: string[]) {
    const supabase = await createClient()

    const { data: event, error: eventError } = await supabase
        .from('school_events')
        .insert([{
            title: formData.title,
            description: formData.description,
            category: formData.category,
            start_date: formData.start_date,
            end_date: formData.end_date,
            all_day: formData.all_day,
            visibility: formData.visibility,
            session_id: formData.session_id,
            term_id: formData.term_id,
            created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

    if (eventError) throw eventError

    // Handle targeting
    if (targetClasses && targetClasses.length > 0) {
        await supabase.from('event_classes').insert(
            targetClasses.map(classId => ({ event_id: event.id, class_id: classId }))
        )
    }

    if (targetStudents && targetStudents.length > 0) {
        await supabase.from('event_students').insert(
            targetStudents.map(studentId => ({ event_id: event.id, student_id: studentId }))
        )
    }

    revalidatePath('/calendar')
    return { success: true }
}

export async function updateEvent(eventId: string, formData: any, targetClasses?: string[], targetStudents?: string[]) {
    const supabase = await createClient()

    const { error: eventError } = await supabase
        .from('school_events')
        .update({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            start_date: formData.start_date,
            end_date: formData.end_date,
            all_day: formData.all_day,
            visibility: formData.visibility,
            session_id: formData.session_id,
            term_id: formData.term_id
        })
        .eq('id', eventId)

    if (eventError) throw eventError

    // Update targeting (simple clear and re-insert)
    await supabase.from('event_classes').delete().eq('event_id', eventId)
    if (targetClasses && targetClasses.length > 0) {
        await supabase.from('event_classes').insert(
            targetClasses.map(classId => ({ event_id: eventId, class_id: classId }))
        )
    }

    await supabase.from('event_students').delete().eq('event_id', eventId)
    if (targetStudents && targetStudents.length > 0) {
        await supabase.from('event_students').insert(
            targetStudents.map(studentId => ({ event_id: eventId, student_id: studentId }))
        )
    }

    revalidatePath('/calendar')
    return { success: true }
}

export async function deleteEvent(eventId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('school_events').delete().eq('id', eventId)
    if (error) throw error
    revalidatePath('/calendar')
    return { success: true }
}
