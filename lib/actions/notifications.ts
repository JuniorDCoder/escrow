"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAndProfile, toActionError } from "./_shared";
import type { ActionResult } from "./transactions";

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUserAndProfile();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/settings/notifications");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUserAndProfile();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) throw error;
    revalidatePath("/settings/notifications");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}
