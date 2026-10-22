import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearHouseholdCache, getHouseholdId } from "@/lib/household";
import { toast } from "@/hooks/use-toast";

export interface HouseholdMember {
  user_id: string;
  role: "owner" | "member";
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  householdId: string | null;
  members: HouseholdMember[];
  isOwner: boolean;
  refreshHousehold: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const refreshHousehold = useCallback(async () => {
    if (!user) {
      setHouseholdId(null);
      setMembers([]);
      return;
    }
    clearHouseholdCache();
    try {
      const hid = await getHouseholdId();
      setHouseholdId(hid);
      const { data: rows, error } = await supabase
        .from("household_members")
        .select("user_id, role")
        .eq("household_id", hid);
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      if (pErr) throw pErr;
      setMembers(
        (rows ?? []).map((r) => ({
          user_id: r.user_id,
          role: r.role as "owner" | "member",
          full_name: profiles?.find((p) => p.user_id === r.user_id)?.full_name ?? null,
        }))
      );
    } catch (e) {
      toast({ title: "Erro ao carregar conta compartilhada", description: (e as Error).message, variant: "destructive" });
    }
  }, [user?.id]);

  useEffect(() => {
    // defer to avoid calling Supabase inside the auth callback
    setTimeout(() => { refreshHousehold(); }, 0);
  }, [refreshHousehold]);

  const signOut = async () => {
    clearHouseholdCache();
    await supabase.auth.signOut();
  };

  const isOwner = !!user && members.some((m) => m.user_id === user.id && m.role === "owner");

  return (
    <AuthContext.Provider value={{ user, session, loading, householdId, members, isOwner, refreshHousehold, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
