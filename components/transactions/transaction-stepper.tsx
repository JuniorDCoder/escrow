import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPPER_STAGES, getStepperStage, isDisputeStatus } from "@/lib/domain/state-machine";
import type { TransactionStatus } from "@/lib/types/database";

export function TransactionStepper({ status }: { status: TransactionStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <X className="h-4 w-4" /> This transaction was cancelled before any funds moved.
      </div>
    );
  }

  const currentStage = getStepperStage(status);
  const currentIndex = STEPPER_STAGES.findIndex((s) => s.key === currentStage);
  const disputed = isDisputeStatus(status);

  return (
    <div className="flex items-center">
      {STEPPER_STAGES.map((stage, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={stage.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  isComplete && "border-success bg-success text-success-foreground",
                  isCurrent && !disputed && "border-primary text-primary",
                  isCurrent && disputed && "border-destructive text-destructive",
                  !isComplete && !isCurrent && "border-border text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent && disputed ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "hidden text-center text-xs font-medium sm:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>
            {index < STEPPER_STAGES.length - 1 && (
              <div className={cn("mx-2 h-0.5 flex-1", isComplete ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
