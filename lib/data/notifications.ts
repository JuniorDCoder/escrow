import { createClient } from "@/lib/supabase/server";

export async function getRecentNotifications(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

export async function getAllNotifications() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return [];
  return data;
}
