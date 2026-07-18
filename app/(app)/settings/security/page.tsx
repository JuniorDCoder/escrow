import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = { title: "Security Settings" };

export default function SecuritySettingsPage() {
  return <UpdatePasswordForm />;
}
