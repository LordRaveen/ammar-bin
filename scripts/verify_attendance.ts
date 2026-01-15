import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyAttendance() {
  console.log("🔍 Verifying Attendance Records in Database\n")

  try {
    // Get all attendance records
    const { data: allRecords, error: allError } = await supabase
      .from("attendance")
      .select("id, student_id, class_id, date, status, remarks, recorded_by, created_at")
      .limit(20)
      .order("created_at", { ascending: false })

    if (allError) {
      console.error("❌ Error fetching attendance:", allError.message)
      return
    }

    console.log(`📊 Total attendance records found: ${allRecords?.length || 0}\n`)

    if (!allRecords || allRecords.length === 0) {
      console.log("⚠️  No attendance records found in database")
      return
    }

    // Group by date
    const byDate: Record<string, number> = {}
    allRecords.forEach((record: any) => {
      byDate[record.date] = (byDate[record.date] || 0) + 1
    })

    console.log("📅 Records by Date:")
    Object.entries(byDate).forEach(([date, count]) => {
      console.log(`   ${date}: ${count} records`)
    })

    console.log("\n📝 Latest 5 Records:")
    allRecords.slice(0, 5).forEach((record: any, i: number) => {
      console.log(`\n${i + 1}. Student: ${record.student_id}`)
      console.log(`   Class: ${record.class_id}`)
      console.log(`   Date: ${record.date}`)
      console.log(`   Status: ${record.status}`)
      console.log(`   Recorded By: ${record.recorded_by}`)
      console.log(`   Created: ${record.created_at}`)
    })

    // Check for today's records
    const today = new Date().toISOString().split("T")[0]
    const todayRecords = allRecords.filter((r: any) => r.date === today)
    console.log(`\n📆 Records for today (${today}): ${todayRecords.length}`)
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

verifyAttendance()
