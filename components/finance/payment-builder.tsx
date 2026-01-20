import { Card, CardContent } from "@/components/ui/card"
import { InboxIcon } from "lucide-react"

interface PaymentBuilderProps {
  selectedFamily: any
  userRole?: "admin" | "parent" | "accountant"
}

export function PaymentBuilder({ selectedFamily, userRole = "admin" }: PaymentBuilderProps) {
  return (
    <Card className="min-h-96">
      <CardContent className="p-6">
        {!selectedFamily ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <InboxIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="font-medium text-muted-foreground">No payment to build</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select a family from the left to start building a payment
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment builder form will be rendered here */}
            <p className="text-sm text-muted-foreground">Payment builder coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
