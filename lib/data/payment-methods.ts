import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getActivePaymentMethods = cache(async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) return [];
    return data;
  } catch {
    return [];
  }
});
