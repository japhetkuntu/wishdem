import { useCallback, useEffect, useState } from "react";
import {
  createGroupWish,
  getGroupWish,
  getGroupWishInvitation,
  listGroupWishes,
  listGroupWishInvitations,
  respondToGroupWishInvitation,
  type CreateGroupWishInput,
} from "@/lib/api";
import type { GroupWish, GroupWishInvitation } from "@/types";

export function useGroupWishes() {
  const [groupWishes, setGroupWishes] = useState<GroupWish[]>([]);
  const [invitations, setInvitations] = useState<GroupWishInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([listGroupWishes(), listGroupWishInvitations()]).then(([wishes, invites]) => {
      setGroupWishes(wishes);
      setInvitations(invites);
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

  const respond = useCallback(async (id: string, status: "joined" | "declined" | "not-now") => {
    const updated = await respondToGroupWishInvitation(id, status);
    setInvitations((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  return { groupWishes, invitations, loading, create, respond, refresh };
}

export function useGroupWish(id: string | undefined) {
  const [groupWish, setGroupWish] = useState<GroupWish | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getGroupWish(id).then((wish) => {
      setGroupWish(wish);
      setLoading(false);
    });
  }, [id]);

  return { groupWish, loading };
}

export function useGroupWishInvitation(id: string | undefined) {
  const [invitation, setInvitation] = useState<GroupWishInvitation | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getGroupWishInvitation(id).then((invite) => {
      setInvitation(invite);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const respond = useCallback(
    async (status: "joined" | "declined" | "not-now") => {
      if (!id) return;
      const updated = await respondToGroupWishInvitation(id, status);
      setInvitation(updated);
      return updated;
    },
    [id],
  );

  return { invitation, loading, respond };
}
