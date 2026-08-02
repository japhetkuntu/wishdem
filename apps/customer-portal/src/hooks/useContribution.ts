import { useCallback, useEffect, useState } from "react";
import {
  getContributionContext,
  getMemoryDraft,
  saveMemoryDraft,
  sealMemoryDraft,
  type SaveMemoryDraftInput,
} from "@/lib/api";
import type { ContributionContext, GroupWishMemory } from "@/types";

export function useContributionContext(id: string | undefined) {
  const [context, setContext] = useState<ContributionContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getContributionContext(id).then((ctx) => {
      setContext(ctx);
      setLoading(false);
    });
  }, [id]);

  return { context, loading };
}

export function useMemoryDraft(contributionId: string | undefined) {
  const [memory, setMemory] = useState<GroupWishMemory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contributionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMemoryDraft(contributionId).then((draft) => {
      setMemory(draft);
      setLoading(false);
    });
  }, [contributionId]);

  const save = useCallback(
    async (input: SaveMemoryDraftInput) => {
      if (!contributionId) throw new Error("Missing contribution id");
      const draft = await saveMemoryDraft(contributionId, input);
      setMemory(draft);
      return draft;
    },
    [contributionId],
  );

  const seal = useCallback(async () => {
    if (!contributionId) throw new Error("Missing contribution id");
    const sealed = await sealMemoryDraft(contributionId);
    setMemory(sealed);
    return sealed;
  }, [contributionId]);

  return { memory, loading, save, seal };
}
