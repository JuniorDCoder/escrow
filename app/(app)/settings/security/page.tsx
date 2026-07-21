import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { DeleteAccountDialog } from "@/components/auth/delete-account-dialog";

export const metadata: Metadata = { title: "Security Settings" };

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <UpdatePasswordForm />
      <DeleteAccountDialog />
    </div>
  );
}
