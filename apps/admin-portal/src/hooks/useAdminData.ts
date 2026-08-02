import { useCallback, useEffect, useState } from "react";
import {
  assignAttentionCase,
  decideModerationCase,
  getModerationCase,
  getOverview,
  listAttentionCases,
  listAuditEvents,
  listCustomers,
  listDeliveryAttempts,
  listDeliveryStats,
  listMoMoTransactions,
  listTeamMembers,
  listWishes,
  retryDeliveryAttempt,
  retryWishDelivery,
} from "@/lib/api";
import type {
  AdminWish,
  AttentionCase,
  AuditEvent,
  AdminCustomer,
  DeliveryAttempt,
  DeliveryStat,
  ModerationCase,
  MoMoTransaction,
  OverviewData,
  TeamMember,
} from "@/types";

export function useOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

export function useAdminWishes() {
  const [wishes, setWishes] = useState<AdminWish[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    listWishes().then((w) => {
      setWishes(w);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const retry = useCallback(async (wishId: string) => {
    const updated = await retryWishDelivery(wishId);
    if (updated) setWishes((prev) => prev.map((w) => (w.id === wishId ? updated : w)));
    return updated;
  }, []);

  return { wishes, loading, retry };
}

export function usePaymentsModeration() {
  const [transactions, setTransactions] = useState<MoMoTransaction[]>([]);
  const [moderationCase, setModerationCase] = useState<ModerationCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listMoMoTransactions(), getModerationCase()]).then(([tx, mod]) => {
      setTransactions(tx);
      setModerationCase(mod);
      setLoading(false);
    });
  }, []);

  const decide = useCallback(async (decision: "approved" | "removed") => {
    const updated = await decideModerationCase(decision);
    setModerationCase(updated);
    return updated;
  }, []);

  return { transactions, moderationCase, loading, decide };
}

export function useDeliveryHealth() {
  const [stats, setStats] = useState<DeliveryStat[]>([]);
  const [attempts, setAttempts] = useState<DeliveryAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listDeliveryStats(), listDeliveryAttempts()]).then(([s, a]) => {
      setStats(s);
      setAttempts(a);
      setLoading(false);
    });
  }, []);

  const retry = useCallback(async (id: string) => {
    const updated = await retryDeliveryAttempt(id);
    if (updated) setAttempts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  return { stats, attempts, loading, retry };
}

export function useAttentionQueue() {
  const [cases, setCases] = useState<AttentionCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAttentionCases().then((c) => {
      setCases(c);
      setLoading(false);
    });
  }, []);

  const assignToMe = useCallback(async (id: string, owner: string) => {
    const updated = await assignAttentionCase(id, owner);
    if (updated) setCases((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  return { cases, loading, assignToMe };
}

export function useAdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCustomers().then((c) => {
      setCustomers(c);
      setLoading(false);
    });
  }, []);

  return { customers, loading };
}

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTeamMembers().then((m) => {
      setMembers(m);
      setLoading(false);
    });
  }, []);

  return { members, loading };
}

export function useAuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAuditEvents().then((e) => {
      setEvents(e);
      setLoading(false);
    });
  }, []);

  return { events, loading };
}
