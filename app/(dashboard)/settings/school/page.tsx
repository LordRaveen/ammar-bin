import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSchoolSettings } from "./actions";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic'

export default async function SchoolSettingsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("school_settings")
    .select("*")
    .single();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">School Settings</h1>
        <p className="text-muted-foreground">
          Manage basic school information and configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>
            Update school details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSchoolSettings} className="space-y-4">
            <input type="hidden" name="id" value={settings?.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="school_name">School Name (English)</Label>
                <Input
                  id="school_name"
                  name="school_name"
                  defaultValue={settings?.school_name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_name_arabic">School Name (Arabic)</Label>
                <Input
                  id="school_name_arabic"
                  name="school_name_arabic"
                  defaultValue={settings?.school_name_arabic}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={settings?.address}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone_primary">Primary Phone</Label>
                <Input
                  id="phone_primary"
                  name="phone_primary"
                  defaultValue={settings?.phone_primary}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_secondary">Secondary Phone</Label>
                <Input
                  id="phone_secondary"
                  name="phone_secondary"
                  defaultValue={settings?.phone_secondary}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={settings?.email}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="student_id_prefix">Student ID Prefix</Label>
                <Input
                  id="student_id_prefix"
                  name="student_id_prefix"
                  defaultValue={settings?.student_id_prefix}
                  placeholder="ISM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff_id_prefix">Staff ID Prefix</Label>
                <Input
                  id="staff_id_prefix"
                  name="staff_id_prefix"
                  defaultValue={settings?.staff_id_prefix}
                  placeholder="STAFF"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_terms">Number of Terms</Label>
                <Input
                  id="number_of_terms"
                  name="number_of_terms"
                  type="number"
                  min="1"
                  max="3"
                  defaultValue={settings?.number_of_terms}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Payment Configuration</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="payment_mode" className="text-sm font-bold flex items-center gap-2">
                    System Environment
                    <Badge variant="outline" className="text-[9px] uppercase font-black px-2 py-0">Global</Badge>
                  </Label>
                  <select
                    id="payment_mode"
                    name="payment_mode"
                    defaultValue={settings?.payment_mode || "test"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="test">Test Mode (Sandboxed)</option>
                    <option value="live">Live Mode (Production)</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground italic font-medium">
                    Test mode uses sandbox credentials. Live mode processes real money transactions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
