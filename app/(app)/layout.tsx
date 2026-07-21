import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import { AppHeader } from "@/components/layout/app-header";
import { getRecentNotifications, getUnreadNotificationCount } from "@/lib/data/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    // The handle_new_user() trigger should always create this row on
    // signup — but if it didn't (or hasn't committed yet), don't just
    // redirect to /auth/login: that page treats "has a session" as "go to
    // /dashboard," which bounces straight back here and loops forever.
    // Self-heal instead.
    const { data: healed } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email ?? "", full_name: (user.user_metadata?.full_name as string) ?? null })
      .select()
      .single();
    profile = healed ?? null;
  }

  if (!profile) redirect("/auth/login");

  const [notifications, unreadCount] = await Promise.all([getRecentNotifications(), getUnreadNotificationCount()]);

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <AppHeader
        appName={APP_NAME}
        fullName={profile.full_name}
        email={profile.email}
        isAdmin={profile.is_admin}
        notifications={notifications}
        unreadCount={unreadCount}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
