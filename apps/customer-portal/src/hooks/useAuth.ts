import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  requestOtp,
  signInWithGoogle,
  signOut,
  updateProfile,
  type UpdateProfileInput,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useWishesStore } from "@/store/wishesStore";

export function useAuth() {
  const { user, loading, setUser, ensureLoaded } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const continueWithGoogle = useCallback(async () => {
    const u = await signInWithGoogle();
    setUser(u);
    return u;
  }, [setUser]);

  /**
   * There's no synchronous email sign-in on the real backend — it's always
   * request-a-code then verify. This kicks off the OTP request and hands off
   * to the verify page, mirroring what LoginPage does, so embedded
   * AuthPrompt instances (wizard steps, profile page) get the real flow too.
   */
  const continueWithEmail = useCallback(
    async (email: string) => {
      const result = await requestOtp(email);
      navigate("/login/verify", {
        state: {
          email: email.trim().toLowerCase(),
          isNewCustomer: result.isNewCustomer,
          maskedEmail: result.maskedEmail,
        },
      });
    },
    [navigate],
  );

  const logOut = useCallback(async () => {
    await signOut();
    setUser(null);
    useWishesStore.getState().reset();
  }, [setUser]);

  const saveProfile = useCallback(async (input: UpdateProfileInput) => {
    const u = await updateProfile(input);
    setUser(u);
    return u;
  }, [setUser]);

  return { user, loading, continueWithGoogle, continueWithEmail, logOut, saveProfile };
}
