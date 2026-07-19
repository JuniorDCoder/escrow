import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Dispute } from "@/lib/types/database";

const STATUS_VARIANT = {
  open: "destructive",
  under_review: "warning",
  resolved_buyer: "success",
  resolved_seller: "success",
  resolved_split: "success",
} as const;

const STATUS_TEXT: Record<Dispute["status"], string> = {
  open: "Open",
  under_review: "Under Review",
  resolved_buyer: "Resolved — in the Buyer's favor",
  resolved_seller: "Resolved — in the Seller's favor",
  resolved_split: "Resolved — split outcome",
};

export function DisputeSummary({ disputes }: { disputes: Dispute[] }) {
  if (disputes.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {disputes.map((d) => (
          <div key={d.id} className="space-y-2 rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <Badge variant={STATUS_VARIANT[d.status]}>{STATUS_TEXT[d.status]}</Badge>
              <span className="text-xs text-muted-foreground">Opened {formatDate(d.created_at)}</span>
            </div>
            <p className="text-sm">{d.reason}</p>
            {d.resolution_note && (
              <div className="rounded-md bg-secondary/60 p-3 text-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resolution</p>
                <p>{d.resolution_note}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
