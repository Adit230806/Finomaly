import { supabase } from "@/integrations/supabase/client";
import { mapAlertRow } from "@/lib/alert-mapper";
import type { Alert } from "@/types/alert";

export async function insertAlert(params: {
  transaction_id: string;
  user_id: string;
  risk_score: number;
  reason: string;
  email?: string;
}): Promise<void> {
  await supabase.from("alerts").insert({
    transaction_id: params.transaction_id,
    user_id:        params.user_id,
    email:          params.email ?? "",
    risk_score:     params.risk_score,
    reason:         params.reason,
    status:         "New",
  });
}

export async function fetchAlerts(): Promise<Alert[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("alerts")
    .select("*, transactions(merchant, amount, location)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapAlertRow(r as Record<string, unknown>));
}

export async function updateAlertStatus(
  id: string,
  status: Alert["status"],
): Promise<void> {
  const { error } = await supabase
    .from("alerts")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
