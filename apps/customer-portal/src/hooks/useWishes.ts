import { useEffect, useState, useCallback } from "react";
import { getWish, listWishes } from "@/lib/api";
import type { Wish } from "@/types";

export function useWishes() {
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    listWishes().then((data) => {
      setWishes(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
