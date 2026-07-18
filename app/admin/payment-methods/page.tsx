import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getAllPaymentMethods } from "@/lib/data/admin";
import { PaymentMethodDialog } from "@/components/admin/payment-method-dialog";
import { PaymentMethodToggle } from "@/components/admin/payment-method-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Payment Methods" };

export default async function AdminPaymentMethodsPage() {
  const methods = await getAllPaymentMethods();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment methods</h1>
          <p className="text-sm text-muted-foreground">What Buyers see at the payment step.</p>
        </div>
        <PaymentMethodDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Add method
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {methods.map((m) => (
          <Card key={m.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{m.label}</CardTitle>
              <Badge variant={m.is_active ? "success" : "outline"}>{m.is_active ? "Active" : "Inactive"}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{m.network}</p>
              <div className="space-y-1 text-sm">
                {m.account_details &&
                  Object.entries(m.account_details).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{key.replace(/_/g, " ")}</span>
                      <span className="break-all text-right font-mono text-xs">{value}</span>
                    </div>
                  ))}
              </div>
              <div className="flex gap-2 pt-2">
                <PaymentMethodDialog method={m} trigger={<Button size="sm" variant="outline">Edit</Button>} />
                <PaymentMethodToggle id={m.id} isActive={m.is_active} />
              </div>
            </CardContent>
          </Card>
        ))}
        {methods.length === 0 && <p className="text-sm text-muted-foreground">No payment methods configured yet.</p>}
      </div>
    </div>
  );
}
