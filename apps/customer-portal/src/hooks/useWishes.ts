import { useEffect, useState, useCallback } from "react";
import { getPublicWish, getWish } from "@/lib/api";
import { useWishesStore } from "@/store/wishesStore";
import type { Wish } from "@/types";

export function useWishes() {
  const { wishes, loading, ensureLoaded, refresh } = useWishesStore();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  return { wishes, loading, refresh };
}

export function useWish(id: string | undefined) {
  const [wish, setWish] = useState<Wish | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getWish(id).then((data) => {
      setWish(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { wish, loading, refresh };
}

/** For the recipient-facing wish page — a recipient never logs in, so this uses the public, unauthenticated endpoint. */
export function usePublicWish(id: string | undefined) {
  const [wish, setWish] = useState<Wish | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getPublicWish(id).then((data) => {
      setWish(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { wish, loading, refresh, setWish };
}
