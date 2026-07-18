"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KycStatus } from "@/lib/types/database";

export function UserRowActions({
  userId,
  isSuspended,
  kycStatus,
  isAdmin,
  isSelf,
}: {
  userId: string;
  isSuspended: boolean;
  kycStatus: KycStatus;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (payload: Parameters<typeof updateUserAction>[0]) => {
    startTransition(async () => {
      await updateUserAction(payload);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        value={kycStatus}
        onValueChange={(value) => run({ userId, kycStatus: value as KycStatus })}
        disabled={isPending}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">KYC: none</SelectItem>
          <SelectItem value="pending">KYC: pending</SelectItem>
          <SelectItem value="verified">KYC: verified</SelectItem>
          <SelectItem value="rejected">KYC: rejected</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant={isSuspended ? "default" : "outline"}
        disabled={isPending || isSelf}
        onClick={() => run({ userId, isSuspended: !isSuspended })}
      >
        {isSuspended ? "Unsuspend" : "Suspend"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending || isSelf}
        onClick={() => run({ userId, isAdmin: !isAdmin })}
      >
        {isAdmin ? "Revoke admin" : "Make admin"}
      </Button>
    </div>
  );
}
