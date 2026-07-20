import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettingsTab } from "@/components/settings/general-settings-tab"
import { AcademicSessionTab } from "@/components/settings/academic-session-tab"
import { FeeManagementTab } from "@/components/settings/fee-management-tab"
import { GradingSystemTab } from "@/components/settings/grading-system-tab"
import { FeeTemplatesTab } from "@/components/settings/fee-templates-tab"
import { SubjectManagementTab } from "@/components/settings/subject-management-tab"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [
    { data: schoolSettings },
    { data: sessions },
    { data: activeSessions },
    { data: activeTerms },
    { data: feeCategories },
    { data: classes },
    { data: gradingSchemes },
    { data: subjects },
  ] = await Promise.all([
    supabase.from("school_settings").select("*").maybeSingle(),
    supabase.from("sessions").select("*, terms:terms(*)").order("start_date", { ascending: false }),
    supabase.from("sessions").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("terms").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("fee_categories").select("*").order("name"),
    supabase.from("classes").select("*, section:sections(name)").eq("is_active", true).order("name"),
    supabase.from("grading_schemes").select("*").order("min_score", { ascending: false }),
    supabase.from("subjects").select("*").order("name"),
  ])

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
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage school configuration, fees, and academic settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4 max-w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="session">Academic Session</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
          <TabsTrigger value="templates">Fee Templates</TabsTrigger>
          <TabsTrigger value="grading">Grading System</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
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

        <TabsContent value="templates" className="space-y-4 max-w-full">
          <FeeTemplatesTab sessions={sessions || []} classes={classes || []} activeSession={activeSessions} />
        </TabsContent>

        <TabsContent value="grading" className="space-y-4 max-w-full">
          <GradingSystemTab gradingSchemes={gradingSchemes || []} />
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4 max-w-full">
          <SubjectManagementTab subjects={subjects || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
