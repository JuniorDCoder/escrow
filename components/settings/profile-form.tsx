"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileAction } from "@/lib/actions/profile";
import { updateProfileSchema } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { z } from "zod";
import type { Profile } from "@/lib/types/database";

type FormValues = z.infer<typeof updateProfileSchema>;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      phone: profile.phone ?? "",
      whatsappNumber: profile.whatsapp_number ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setFormError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setSuccess(true);
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={profile.email} disabled />
          <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp number (optional)</Label>
            <Input id="whatsappNumber" {...register("whatsappNumber")} placeholder="e.g. 15550001234" />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          {success && <p className="text-sm text-success">Profile updated.</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
