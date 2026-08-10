import { useCallback, useEffect, useState } from "react";
import {
  createGroupWish,
  deleteGroupWish,
  getGroupWish,
  getGroupWishInvitationContext,
  inviteGuestToGroupWish,
  listGroupWishes,
  listGroupWishInvitations,
  listGroupWishOrganizerInvitations,
  respondToInvitationToken,
  sealGroupWish,
  type CreateGroupWishInput,
} from "@/lib/api";
import type {
  GroupWish,
  GroupWishFormat,
  GroupWishInvitation,
  GroupWishInvitationStatus,
  OrganizerGroupWishInvitation,
} from "@/types";

export function useGroupWishes() {
  const [groupWishes, setGroupWishes] = useState<GroupWish[]>([]);
  // Always empty — group-wish guests are invite-token based and never tied
  // to a logged-in CustomerUser, so there's no backend concept of
  // "invitations the current account received." See listGroupWishInvitations.
  const [invitations] = useState<GroupWishInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([listGroupWishes(), listGroupWishInvitations()]).then(([wishes]) => {
      setGroupWishes(wishes);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (input: CreateGroupWishInput) => {
    const wish = await createGroupWish(input);
    setGroupWishes((prev) => [wish, ...prev]);
    return wish;
  }, []);

  return { groupWishes, invitations, loading, create, refresh };
}

export function useGroupWish(id: string | undefined) {
  const [groupWish, setGroupWish] = useState<GroupWish | null>(null);
  const [invitations, setInvitations] = useState<OrganizerGroupWishInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getGroupWish(id), listGroupWishOrganizerInvitations(id)]).then(
      ([wish, invited]) => {
        setGroupWish(wish);
        setInvitations(invited);
        setLoading(false);
      },
    );
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const invite = useCallback(
    async (input: { guestName: string; guestEmail?: string }) => {
      if (!id) return;
      const invitation = await inviteGuestToGroupWish(id, input);
      setInvitations((prev) => [invitation, ...prev]);
      setGroupWish((prev) => (prev ? { ...prev, invitedCount: prev.invitedCount + 1 } : prev));
      return invitation;
    },
    [id],
  );

  const seal = useCallback(async () => {
    if (!id) return;
    const sealed = await sealGroupWish(id);
    setGroupWish(sealed);
    return sealed;
  }, [id]);

  const remove = useCallback(async () => {
    if (!id) return;
    await deleteGroupWish(id);
  }, [id]);

  return { groupWish, invitations, loading, invite, seal, remove, refresh };
}

/**
 * Guest invite view — `id` here is the opaque invite token from the URL
 * (route `/group-wishes/invitations/:id`), resolved via the no-auth
 * `GET /api/group-wishes/invitations/{token}` endpoint. This shape is
 * distinct from the organizer-facing `GroupWish` type, so pages consuming
 * this hook read the raw context fields directly.
 */
export interface GuestInvitationContext {
  inviteToken: string;
  title: string;
  inviterName: string;
  recipientName: string;
  occasion: string | null;
  deliveryDate: string | null;
  collectByDate: string | null;
  formats: GroupWishFormat[];
  guestName: string;
  status: GroupWishInvitationStatus;
  organizerNote: string | null;
}

function mapInvitationStatus(status: "invited" | "joined" | "declined" | "notNow"): GroupWishInvitationStatus {
  return status === "notNow" ? "not-now" : status;
}

function mapFormat(format: string): GroupWishFormat {
  return format === "photo" ? "photos" : (format as GroupWishFormat);
}

export function useGroupWishInvitation(id: string | undefined) {
  const [invitation, setInvitation] = useState<GuestInvitationContext | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getGroupWishInvitationContext(id)
      .then((ctx) =>
        setInvitation({
          inviteToken: ctx.inviteToken,
          title: ctx.title,
          inviterName: ctx.inviterName,
          recipientName: ctx.recipientName,
          occasion: ctx.occasion,
          deliveryDate: ctx.deliveryDate,
          collectByDate: ctx.collectByDate,
          formats: ctx.formats.map(mapFormat),
          guestName: ctx.guestName,
          status: mapInvitationStatus(ctx.status),
          organizerNote: ctx.organizerNote,
        }),
      )
      .catch(() => setInvitation(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const respond = useCallback(
    async (status: "joined" | "declined" | "not-now") => {
      if (!id) return;
      const backendStatus = status === "not-now" ? "notNow" : status;
      const updated = await respondToInvitationToken(id, backendStatus);
      setInvitation({
        inviteToken: updated.inviteToken,
        title: updated.title,
        inviterName: updated.inviterName,
        recipientName: updated.recipientName,
        occasion: updated.occasion,
        deliveryDate: updated.deliveryDate,
        collectByDate: updated.collectByDate,
        formats: updated.formats.map(mapFormat),
        guestName: updated.guestName,
        status: mapInvitationStatus(updated.status),
        organizerNote: updated.organizerNote,
      });
      return updated;
    },
    [id],
  );

  return { invitation, loading, respond };
}
