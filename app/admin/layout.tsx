import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <AdminTopbar email={profile.email} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-x-auto bg-secondary/20 p-6">{children}</main>
      </div>
    </div>
  );
}
