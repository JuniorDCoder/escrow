"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { submitRatingAction } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function RatingForm({ transactionId, ratedUser, ratedUserLabel }: { transactionId: string; ratedUser: string; ratedUserLabel: string }) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (score === 0) {
      setError("Choose a star rating.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitRatingAction({ transactionId, ratedUser, score, comment });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate the {ratedUserLabel}</CardTitle>
        <CardDescription>Help other users know who to trust.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              onMouseEnter={() => setHoverScore(n)}
              onMouseLeave={() => setHoverScore(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  (hoverScore || score) >= n ? "fill-secured text-secured" : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        <Textarea placeholder="Optional comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={isPending} size="sm">
          {isPending ? "Submitting…" : "Submit rating"}
        </Button>
      </CardContent>
    </Card>
  );
}
