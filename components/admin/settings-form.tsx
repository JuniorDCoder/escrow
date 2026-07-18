"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { updatePlatformSettingsAction } from "@/lib/actions/admin";
import { platformSettingsSchema } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Settings } from "@/lib/types/database";
import type { z } from "zod";

type FormInput = z.input<typeof platformSettingsSchema>;
type FormOutput = z.output<typeof platformSettingsSchema>;

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      platformName: settings.platform_name,
      feePercentage: settings.fee_percentage,
      feeMinimum: settings.fee_minimum,
      whatsappNumber: settings.whatsapp_number ?? "",
      supportEmail: settings.support_email ?? "",
      defaultInspectionDays: settings.default_inspection_days,
    },
  });

  const onSubmit = (values: FormOutput) => {
    setFormError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updatePlatformSettingsAction(values);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform name</Label>
            <Input id="platformName" {...register("platformName")} />
            {errors.platformName && <p className="text-sm text-destructive">{errors.platformName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="feePercentage">Fee percentage (%)</Label>
              <Input id="feePercentage" type="number" step="0.1" {...register("feePercentage")} />
              {errors.feePercentage && <p className="text-sm text-destructive">{errors.feePercentage.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeMinimum">Minimum fee</Label>
              <Input id="feeMinimum" type="number" step="0.01" {...register("feeMinimum")} />
              {errors.feeMinimum && <p className="text-sm text-destructive">{errors.feeMinimum.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp number (digits only, e.g. 15550001234)</Label>
            <Input id="whatsappNumber" {...register("whatsappNumber")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input id="supportEmail" type="email" {...register("supportEmail")} />
            {errors.supportEmail && <p className="text-sm text-destructive">{errors.supportEmail.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultInspectionDays">Default inspection period (days)</Label>
            <Input id="defaultInspectionDays" type="number" {...register("defaultInspectionDays")} />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          {success && <p className="text-sm text-success">Settings saved.</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
