import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Number of other members' expenses waiting for my confirmation. */
export function usePendingReviewCount() {
  const { user, members } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user || members.length < 2) {
      setCount(0);
      return;
    }
    const load = async () => {
      const { count, error } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .neq("user_id", user.id);
      if (!error) setCount(count ?? 0);
    };
    load();
    window.addEventListener("transactions-reviewed", load);
    return () => window.removeEventListener("transactions-reviewed", load);
  }, [user?.id, members.length]);

  return count;
}
