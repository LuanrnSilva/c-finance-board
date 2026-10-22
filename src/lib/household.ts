import { supabase } from "@/integrations/supabase/client";

let cached: { userId: string; householdId: string } | null = null;

/** Returns the signed-in user's household id (creates one if the user has none). */
export async function getHouseholdId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  if (cached && cached.userId === user.id) return cached.householdId;
  const { data, error } = await supabase.rpc("ensure_household");
  if (error) throw error;
  cached = { userId: user.id, householdId: data as string };
  return cached.householdId;
}

export function clearHouseholdCache() {
  cached = null;
}
