import { requireAuth } from '@/lib/auth/get-user'
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GuardianProfilePage({
  params,
}: {
  params: { id: string }
}) {
  await requireAuth(['super_admin', 'admin', 'teacher', 'accountant'])
  const supabase = await createServerClient()

  // Fetch guardian details
  const { data: guardian, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !guardian) {
    notFound()
  }

  // Fetch linked students
  const { data: linkedStudents } = await supabase
    .from('student_guardians')
    .select(
      `
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name,
        gender,
        status,
        photo_url
      )
    `
    )
    .eq('guardian_id', params.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/guardians">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {guardian.first_name} {guardian.middle_name} {guardian.last_name}
          </h1>
          <p className="text-muted-foreground">{guardian.relationship_type}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Guardian contact and personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {guardian.first_name} {guardian.middle_name}{' '}
                  {guardian.last_name}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Relationship</p>
                <Badge variant="secondary">{guardian.relationship_type}</Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              {guardian.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{guardian.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{guardian.phone}</p>
                </div>
              </div>

              {guardian.whatsapp_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">{guardian.whatsapp_number}</p>
                  </div>
                </div>
              )}

              {guardian.alternate_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Alternate Phone
                    </p>
                    <p className="font-medium">{guardian.alternate_phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{guardian.address}</p>
                </div>
              </div>

              {guardian.occupation && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Occupation</p>
                    <p className="font-medium">{guardian.occupation}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Linked Students
              </CardTitle>
              <CardDescription>
                {linkedStudents?.length || 0} student(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedStudents && linkedStudents.length > 0 ? (
                <div className="space-y-3">
                  {linkedStudents.map((link: any) => (
                    <Link
                      key={link.id}
                      href={`/students/${link.students.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {link.students.first_name[0]}
                            {link.students.last_name[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {link.students.first_name}{' '}
                            {link.students.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {link.students.student_id}
                          </p>
                        </div>
                        {link.is_primary && (
                          <Badge variant="secondary" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No students linked yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
