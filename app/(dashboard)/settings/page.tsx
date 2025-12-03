import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettingsTab } from "@/components/settings/general-settings-tab"
import { AcademicSessionTab } from "@/components/settings/academic-session-tab"
import { FeeManagementTab } from "@/components/settings/fee-management-tab"
import { GradingSystemTab } from "@/components/settings/grading-system-tab"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Fetch all necessary data
  const [
    { data: schoolSettings },
    { data: sessions },
    { data: activeSessions },
    { data: activeTerms },
    { data: feeCategories },
    { data: classes },
    { data: gradingSchemes },
    { data: feeStructures },
  ] = await Promise.all([
    supabase.from("school_settings").select("*").single(),
    supabase.from("sessions").select("*, terms:terms(*)").order("start_date", { ascending: false }),
    supabase.from("sessions").select("*").eq("is_active", true).single(),
    supabase.from("terms").select("*").eq("is_active", true).single(),
    supabase.from("fee_categories").select("*").order("name"),
    supabase.from("classes").select("*, section:sections(name)").eq("is_active", true).order("name"),
    supabase.from("grading_schemes").select("*").order("min_score", { ascending: false }),
    supabase
      .from("fee_structures")
      .select("*")
      .eq("session_id", activeSessions?.id || "")
      .eq("term_id", activeTerms?.id || ""),
  ])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage school configuration, fees, and academic settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="session">Academic Session</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
          <TabsTrigger value="grading">Grading System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsTab settings={schoolSettings} />
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <AcademicSessionTab sessions={sessions || []} activeSession={activeSessions} activeTerm={activeTerms} />
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <FeeManagementTab
            feeCategories={feeCategories || []}
            classes={classes || []}
            activeSession={activeSessions}
            activeTerm={activeTerms}
            existingFeeStructures={feeStructures || []}
          />
        </TabsContent>

        <TabsContent value="grading" className="space-y-4">
          <GradingSystemTab gradingSchemes={gradingSchemes || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
