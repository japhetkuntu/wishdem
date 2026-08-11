import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Attachment, DeliveryChannel, Recipient, ThemeId, Wish } from "@/types";

/**
 * Shared state for the 3-step creation wizard (/create/message -> /create/who ->
 * /create/theme, which also handles delivery + sealing).
 * Persisted to sessionStorage so navigating back and forth between steps,
 * or refreshing mid-flow, never loses what's been entered.
 */
interface WizardState {
  wishId: string | null;
  /** Set while a signed-out visitor is filling out /create/who — a cache-backed stand-in
   * for wishId until they sign in and the draft is claimed into a real wish. Mutually
   * exclusive with wishId in practice: claiming clears this and sets wishId instead. */
  draftId: string | null;
  recipient: Recipient | null;
  fromName: string;
  message: string;
  attachment: Attachment | null;
  themeId: ThemeId | null;
  channel: DeliveryChannel | null;
  lastSavedAt: number | null;

  setWishId: (id: string) => void;
  setDraftId: (id: string) => void;
  clearDraftId: () => void;
  setRecipient: (recipient: Recipient) => void;
  setFromName: (fromName: string) => void;
  setMessage: (message: string) => void;
  setAttachment: (attachment: Attachment | null) => void;
  setTheme: (themeId: ThemeId) => void;
  setChannel: (channel: DeliveryChannel) => void;
  markSaved: () => void;
  hydrateFromWish: (wish: Wish) => void;
  reset: () => void;
}

const initialState = {
  wishId: null,
  draftId: null,
  recipient: null,
  fromName: "You",
  message: "",
  attachment: null,
  themeId: null,
  channel: null,
  lastSavedAt: null,
} satisfies Omit<
  WizardState,
  | "setWishId"
  | "setDraftId"
  | "clearDraftId"
  | "setRecipient"
  | "setFromName"
  | "setMessage"
  | "setAttachment"
  | "setTheme"
  | "setChannel"
  | "markSaved"
  | "hydrateFromWish"
  | "reset"
>;

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,
      setWishId: (id) => set({ wishId: id }),
      setDraftId: (id) => set({ draftId: id }),
      clearDraftId: () => set({ draftId: null }),
      setRecipient: (recipient) => set({ recipient, lastSavedAt: Date.now() }),
      setFromName: (fromName) => set({ fromName, lastSavedAt: Date.now() }),
      setMessage: (message) => set({ message, lastSavedAt: Date.now() }),
      setAttachment: (attachment) => set({ attachment, lastSavedAt: Date.now() }),
      setTheme: (themeId) => set({ themeId, lastSavedAt: Date.now() }),
      setChannel: (channel) => set({ channel, lastSavedAt: Date.now() }),
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
