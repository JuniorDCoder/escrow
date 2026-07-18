import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, ShieldAlert, Users, ArrowLeftRight } from "lucide-react";
import { getAdminOverview } from "@/lib/data/admin";
import { STATUS_LABELS } from "@/lib/domain/state-machine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  const stats = [
    { label: "Pending payment reviews", value: overview.pendingPayments, href: "/admin/payments", icon: Landmark, urgent: overview.pendingPayments > 0 },
    { label: "Open disputes", value: overview.openDisputes, href: "/admin/disputes", icon: ShieldAlert, urgent: overview.openDisputes > 0 },
    { label: "Total transactions", value: overview.totalTransactions, href: "/admin/transactions", icon: ArrowLeftRight },
    { label: "Total users", value: overview.totalUsers, href: "/admin/users", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">The operational pulse of the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className={s.urgent ? "border-warning/50 bg-warning-soft" : undefined}>
              <CardContent className="flex items-center justify-between py-6">
                <div>
                  <p className="text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.urgent ? "text-warning" : "text-muted-foreground"}`} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions by status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(overview.counts).map(([status, count]) => (
              <div key={status} className="rounded-md border border-border px-4 py-3">
                <p className="text-lg font-semibold">{count}</p>
                <p className="text-xs text-muted-foreground">{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</p>
              </div>
            ))}
            {Object.keys(overview.counts).length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">No transactions yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
