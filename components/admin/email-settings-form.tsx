"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { sendTestEmailAction, updateEmailSettingsAction } from "@/lib/actions/admin";
import { emailSettingsSchema } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EmailSettingsView } from "@/lib/data/email-settings";
import type { z } from "zod";

type FormInput = z.input<typeof emailSettingsSchema>;
type FormOutput = z.output<typeof emailSettingsSchema>;

export function EmailSettingsForm({ settings }: { settings: EmailSettingsView | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTest] = useTransition();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [clearPassword, setClearPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      mailHost: settings?.mail_host ?? "",
      mailPort: settings?.mail_port ?? 465,
      mailUsername: settings?.mail_username ?? "",
      mailPassword: "",
      mailEncryption: settings?.mail_encryption ?? "ssl",
      mailFromAddress: settings?.mail_from_address ?? "",
      mailFromName: settings?.mail_from_name ?? "",
    },
  });

  const mailEncryption = watch("mailEncryption");

  const onSubmit = (values: FormOutput) => {
    setFormError(null);
    setSuccess(false);
    setTestResult(null);
    startTransition(async () => {
      const result = await updateEmailSettingsAction({ ...values, clearPassword });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setClearPassword(false);
      setValue("mailPassword", "");
      setSuccess(true);
      router.refresh();
    });
  };

  const onSendTest = () => {
    setTestResult(null);
    startTest(async () => {
      const result = await sendTestEmailAction();
      setTestResult(
        result.error ? { ok: false, message: result.error } : { ok: true, message: "Test email sent — check your inbox." }
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email (SMTP)</CardTitle>
        <CardDescription>
          Used for transaction invites and notifications. Overrides the MAIL_* environment variables when set —
          leave blank to fall back to those instead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mailHost">SMTP host</Label>
            <Input id="mailHost" placeholder="smtp.hostinger.com" {...register("mailHost")} />
            {errors.mailHost && <p className="text-sm text-destructive">{errors.mailHost.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mailPort">Port</Label>
              <Input id="mailPort" type="number" placeholder="465" {...register("mailPort")} />
              {errors.mailPort && <p className="text-sm text-destructive">{errors.mailPort.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Encryption</Label>
              <Select value={mailEncryption} onValueChange={(v) => setValue("mailEncryption", v as FormInput["mailEncryption"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssl">SSL (implicit TLS — usually port 465)</SelectItem>
                  <SelectItem value="tls">TLS (STARTTLS — usually port 587)</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mailUsername">Username</Label>
            <Input id="mailUsername" placeholder="notify@yourdomain.com" {...register("mailUsername")} />
            {errors.mailUsername && <p className="text-sm text-destructive">{errors.mailUsername.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mailPassword">Password</Label>
            <Input
              id="mailPassword"
              type="password"
              placeholder={settings?.hasPassword ? "Leave blank to keep the current password" : "Password"}
              disabled={clearPassword}
              {...register("mailPassword")}
            />
            {settings?.hasPassword && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={clearPassword}
                  onChange={(e) => setClearPassword(e.target.checked)}
                />
                Clear the stored password
              </label>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mailFromAddress">From address</Label>
              <Input id="mailFromAddress" placeholder="notify@yourdomain.com" {...register("mailFromAddress")} />
              {errors.mailFromAddress && <p className="text-sm text-destructive">{errors.mailFromAddress.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailFromName">From name</Label>
              <Input id="mailFromName" placeholder="Amana Escrow" {...register("mailFromName")} />
            </div>
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          {success && <p className="text-sm text-success">Email settings saved.</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save email settings"}
            </Button>
            <Button type="button" variant="outline" disabled={isTesting} onClick={onSendTest}>
              {isTesting ? "Sending…" : "Send test email"}
            </Button>
          </div>
          {testResult && (
            <p className={`text-sm ${testResult.ok ? "text-success" : "text-destructive"}`}>{testResult.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
