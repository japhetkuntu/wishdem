import { useCallback, useEffect, useState } from "react";
import { getCurrentAdmin, signInAdmin, signOutAdmin } from "@/lib/api";
import type { AdminUser } from "@/types";

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentAdmin().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string) => {
    const u = await signInAdmin(email);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await signOutAdmin();
    setUser(null);
  }, []);

  return { user, loading, signIn, signOut };
}
