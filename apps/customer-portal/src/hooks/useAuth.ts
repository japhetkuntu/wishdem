import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, signInWithEmail, signInWithGoogle, signOut } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const continueWithGoogle = useCallback(async () => {
    const u = await signInWithGoogle();
    setUser(u);
    return u;
  }, []);

  const continueWithEmail = useCallback(async (email: string) => {
    const u = await signInWithEmail(email);
    setUser(u);
    return u;
  }, []);

  const logOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return { user, loading, continueWithGoogle, continueWithEmail, logOut };
}
