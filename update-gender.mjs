import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://tshvtbgnfvdodytborbe.supabase.co"
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaHZ0YmduZnZkb2R5dGJvcmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA4OTA1MiwiZXhwIjoyMDc4NjY1MDUyfQ.DfSQOxrIrmviG1cxSaLxxAsj8M-B6DzvRbQV_IwPOWM"

const CSV_PATH = "./combined - combined-fixed (1).csv"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const raw = readFileSync(CSV_PATH, "utf-8")
const lines = raw.split(/\r?\n/).filter((l) => l.trim())

// Parse headers
const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
const admIdx = headers.findIndex((h) => h.includes("admission"))
const genderIdx = headers.findIndex((h) => h.includes("gender"))

console.log(`Headers: ${headers.join(" | ")}`)
console.log(`Admission No column index: ${admIdx}, Gender column index: ${genderIdx}`)
console.log("---")

const rows = lines.slice(1).map((line) => {
  const cols = line.split(",").map((c) => c.trim())
  const admNo = cols[admIdx]?.toUpperCase()
  const genderRaw = cols[genderIdx]?.trim()
  let gender = "Male"
  if (genderRaw) {
    const g = genderRaw.toUpperCase()
    if (g === "F" || g === "FEMALE") gender = "Female"
    else if (g === "M" || g === "MALE") gender = "Male"
  }
  return { admNo, gender }
}).filter(r => r.admNo)

console.log(`Total rows to update: ${rows.length}\n`)

let updated = 0
let errors = 0

for (const { admNo, gender } of rows) {
  const { error } = await supabase
    .from("students")
    .update({ gender })
    .eq("student_id", admNo)

  if (error) {
    console.error(`  ✗ ${admNo} -> ERROR: ${error.message}`)
    errors++
  } else {
    console.log(`  ✓ ${admNo} -> ${gender}`)
    updated++
  }
}

console.log("\n--- DONE ---")
console.log(`Updated: ${updated} | Errors: ${errors}`)
