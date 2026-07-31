import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Attachment, DeliveryChannel, Recipient, ThemeId, Wish } from "@/types";

/**
 * Shared state for the 4-step creation wizard (/create/who -> /create/seal).
 * Persisted to sessionStorage so navigating back and forth between steps,
 * or refreshing mid-flow, never loses what's been entered.
 */
interface WizardState {
  wishId: string | null;
  recipient: Recipient | null;
  fromName: string;
  message: string;
  attachment: Attachment | null;
  themeId: ThemeId | null;
  channel: DeliveryChannel | null;
  paymentPhone: string;
  lastSavedAt: number | null;

  setWishId: (id: string) => void;
  setRecipient: (recipient: Recipient) => void;
  setMessage: (message: string) => void;
  setAttachment: (attachment: Attachment | null) => void;
  setTheme: (themeId: ThemeId) => void;
  setChannel: (channel: DeliveryChannel) => void;
  setPaymentPhone: (phone: string) => void;
  markSaved: () => void;
  hydrateFromWish: (wish: Wish) => void;
  reset: () => void;
}

const initialState = {
  wishId: null,
  recipient: null,
  fromName: "You",
  message: "",
  attachment: null,
  themeId: null,
  channel: null,
  paymentPhone: "",
  lastSavedAt: null,
} satisfies Omit<
  WizardState,
  | "setWishId"
  | "setRecipient"
  | "setMessage"
  | "setAttachment"
  | "setTheme"
  | "setChannel"
  | "setPaymentPhone"
  | "markSaved"
  | "hydrateFromWish"
  | "reset"
>;

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,
      setWishId: (id) => set({ wishId: id }),
      setRecipient: (recipient) => set({ recipient, lastSavedAt: Date.now() }),
      setMessage: (message) => set({ message, lastSavedAt: Date.now() }),
      setAttachment: (attachment) => set({ attachment, lastSavedAt: Date.now() }),
      setTheme: (themeId) => set({ themeId, lastSavedAt: Date.now() }),
      setChannel: (channel) => set({ channel, lastSavedAt: Date.now() }),
      setPaymentPhone: (paymentPhone) => set({ paymentPhone }),
      markSaved: () => set({ lastSavedAt: Date.now() }),
      hydrateFromWish: (wish) =>
        set({
          wishId: wish.id,
          recipient: wish.recipient,
          fromName: wish.fromName,
          message: wish.message,
          attachment: wish.attachment,
          themeId: wish.themeId,
          channel: wish.channel,
        }),
      reset: () => set(initialState),
    }),
    {
      name: "wishdem-create-wizard",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
