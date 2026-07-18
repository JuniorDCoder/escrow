import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, statusBadgeVariant } from "@/lib/domain/state-machine";
import type { TransactionStatus } from "@/lib/types/database";

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return <Badge variant={statusBadgeVariant(status)}>{STATUS_LABELS[status]}</Badge>;
}
