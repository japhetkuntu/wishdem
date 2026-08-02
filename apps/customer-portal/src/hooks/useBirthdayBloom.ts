import { useCallback, useEffect, useState } from "react";
import { getBirthdayBloom, markBloomWishOpened, toggleBloomWishFavorite } from "@/lib/api";
import type { BirthdayBloom } from "@/types";

export function useBirthdayBloom(id: string | undefined) {
  const [bloom, setBloom] = useState<BirthdayBloom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getBirthdayBloom(id).then((data) => {
      setBloom(data);
      setLoading(false);
    });
  }, [id]);

  const markOpened = useCallback(
    async (wishId: string) => {
      if (!id) return;
      const updated = await markBloomWishOpened(id, wishId);
      setBloom((prev) =>
        prev ? { ...prev, wishes: prev.wishes.map((w) => (w.id === wishId ? updated : w)) } : prev,
      );
    },
    [id],
  );

  const toggleFavorite = useCallback(
    async (wishId: string) => {
      if (!id) return;
      const updated = await toggleBloomWishFavorite(id, wishId);
      setBloom((prev) =>
        prev ? { ...prev, wishes: prev.wishes.map((w) => (w.id === wishId ? updated : w)) } : prev,
      );
    },
    [id],
  );

  return { bloom, loading, markOpened, toggleFavorite };
}
