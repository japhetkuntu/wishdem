import { useCallback, useEffect, useState } from "react";
import {
  assignAttentionCase,
  cancelWish,
  deactivateTeamMember,
  decideModerationCase,
  getModerationCase,
  getOverview,
  inviteTeamMember,
  listAttentionCases,
  listAuditEvents,
  listCustomers,
  listDeliveryAttempts,
  listDeliveryStats,
  listMoMoTransactions,
  listTeamMembers,
  listWishes,
  reactivateTeamMember,
  refundPayment,
  resendTeamMemberInvite,
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
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    getOverview().then((d) => {
      setData(d);
      setLoading(false);
      setLastRefreshedAt(new Date());
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh, lastRefreshedAt };
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

  const cancel = useCallback(async (wishId: string) => {
    await cancelWish(wishId);
    setWishes((prev) => prev.filter((w) => w.id !== wishId));
  }, []);

  return { wishes, loading, retry, cancel };
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

  const refund = useCallback(async (paymentId: string, input: { amount: number; reason: string }) => {
    const updated = await refundPayment(paymentId, input);
    setTransactions((prev) => prev.map((tx) => (tx.id === paymentId ? updated : tx)));
    return updated;
  }, []);

  return { transactions, moderationCase, loading, decide, refund };
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

  const assignToMe = useCallback(async (id: string) => {
    const updated = await assignAttentionCase(id);
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
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    listTeamMembers().then((m) => {
      setMembers(m);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const invite = useCallback(async (input: { email: string; fullName: string; role: string }) => {
    setError(null);
    try {
      const member = await inviteTeamMember(input);
      setMembers((prev) => [...prev, member]);
      return member;
    } catch {
      setError("We couldn't send that invite just now. Please try again.");
      return null;
    }
  }, []);

  const resendInvite = useCallback(async (id: string) => {
    const updated = await resendTeamMemberInvite(id);
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const deactivate = useCallback(async (id: string) => {
    const updated = await deactivateTeamMember(id);
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const reactivate = useCallback(async (id: string) => {
    const updated = await reactivateTeamMember(id);
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  return { members, loading, error, invite, resendInvite, deactivate, reactivate };
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
