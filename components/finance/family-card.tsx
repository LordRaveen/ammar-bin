import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InboxIcon } from "lucide-react"

interface FamilyCardProps {
  searchTerm: string
  selectedFamily: any
  onSelectFamily: (family: any) => void
  userRole?: "admin" | "parent" | "accountant"
  parentId?: string
}

export function FamilyCard({
  searchTerm,
  selectedFamily,
  onSelectFamily,
  userRole = "admin",
  parentId,
}: FamilyCardProps) {
  return (
    <Card className="min-h-96">
      <CardContent className="p-6">
        {!selectedFamily ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <InboxIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="font-medium text-muted-foreground">No family selected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Search and select a parent or student to view their family information
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Family details will be rendered here */}
            <p className="text-sm text-muted-foreground">Family details coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
