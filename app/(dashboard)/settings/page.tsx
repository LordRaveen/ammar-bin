import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettingsTab } from "@/components/settings/general-settings-tab"
import { AcademicSessionTab } from "@/components/settings/academic-session-tab"
import { FeeManagementTab } from "@/components/settings/fee-management-tab"
import { GradingSystemTab } from "@/components/settings/grading-system-tab"
import { FeeTemplatesTab } from "@/components/settings/fee-templates-tab"
import { SubjectManagement } from "@/components/subject-management"
import { SecurityTab } from "@/components/settings/security-tab"

export const dynamic = "force-dynamic"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = searchParams ? await searchParams : {}
  const activeTab = params?.tab || "general"

  const [
    { data: schoolSettings },
    { data: sessions },
    { data: activeSessions },
    { data: activeTerms },
    { data: feeCategories },
    { data: classes },
    { data: gradingSchemes },
    { data: subjects },
    { data: rawAuditLogs },
    { data: lockouts },
    { data: loginAttempts },
    { data: teachers },
  ] = await Promise.all([
    supabase.from("school_settings").select("*").maybeSingle(),
    supabase.from("sessions").select("*, terms:terms(*)").order("start_date", { ascending: false }),
    supabase.from("sessions").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("terms").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("fee_categories").select("*").order("name"),
    supabase.from("classes").select("*, section:sections(name)").eq("is_active", true).order("name"),
    supabase.from("grading_schemes").select("*").order("min_score", { ascending: false }),
    supabase.from("subjects").select("*").order("name"),
    supabase.from("audit_logs").select("*").order("performed_at", { ascending: false }).limit(100),
    supabase.from("account_lockouts").select("*").order("locked_until", { ascending: false }),
    supabase.from("login_attempts").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("user_profiles").select("id, first_name, last_name, email"),
  ])

  const teacherMap = new Map((teachers || []).map((t: any) => [t.id, `${t.first_name} ${t.last_name}`]))
  const auditLogs = (rawAuditLogs || []).map((log: any) => ({
    ...log,
    performed_by_name: teacherMap.get(log.performed_by) || "System",
  }))

  let feeStructures = null
  if (activeSessions?.id && activeTerms?.id) {
    const { data } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("session_id", activeSessions.id)
      .eq("term_id", activeTerms.id)
    feeStructures = data
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 max-w-full overflow-hidden">
      <Tabs defaultValue={activeTab} className="space-y-4 max-w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="session">Academic Session</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="security">Security & Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 max-w-full">
          <GeneralSettingsTab settings={schoolSettings} />
        </TabsContent>

        <TabsContent value="session" className="space-y-4 max-w-full">
          <AcademicSessionTab sessions={sessions || []} activeSession={activeSessions} activeTerm={activeTerms} />
        </TabsContent>

        <TabsContent value="fees" className="space-y-4 max-w-full">
          <FeeManagementTab
            feeCategories={feeCategories || []}
            classes={classes || []}
            activeSession={activeSessions}
            activeTerm={activeTerms}
            existingFeeStructures={feeStructures || []}
          />
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4 max-w-full">
          <SubjectManagement />
        </TabsContent>

        <TabsContent value="security" className="space-y-4 max-w-full">
          <SecurityTab auditLogs={auditLogs} lockouts={lockouts || []} loginAttempts={loginAttempts || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
