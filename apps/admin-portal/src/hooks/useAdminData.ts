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
import type { AttentionCaseFilters, AuditLogFilters, WishListFilters } from "@/lib/api";
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

/** Delays a fast-changing value (keystrokes) so a search box doesn't fire a request per
 * character — the backend does the actual filtering, so this only paces how often it's asked. */
function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

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
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFiltersState] = useState<WishListFilters>({});
  const debouncedSearch = useDebouncedValue(filters.search);

  const refresh = useCallback(() => {
    setLoading(true);
    listWishes(pageIndex, undefined, { ...filters, search: debouncedSearch }).then((page) => {
      setWishes(page.items);
      setTotalPages(page.totalPages);
      setTotalCount(page.totalCount);
      setLoading(false);
    });
    // filters.search is intentionally excluded — debouncedSearch is the paced version of it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, filters.status, filters.struggling, debouncedSearch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Any filter change re-queries from page one — staying on, say, page 4 of a newly
  // narrowed result set would usually just show an empty page.
  const setFilters = useCallback((next: WishListFilters) => {
    setFiltersState(next);
    setPageIndex(0);
  }, []);

  const retry = useCallback(async (wishId: string) => {
    const updated = await retryWishDelivery(wishId);
    if (updated) setWishes((prev) => prev.map((w) => (w.id === wishId ? updated : w)));
    return updated;
  }, []);

  const cancel = useCallback(async (wishId: string) => {
    await cancelWish(wishId);
    setWishes((prev) => prev.filter((w) => w.id !== wishId));
  }, []);

  return { wishes, loading, retry, cancel, pageIndex, setPageIndex, totalPages, totalCount, filters, setFilters };
}

export function usePaymentsModeration() {
  const [transactions, setTransactions] = useState<MoMoTransaction[]>([]);
  const [moderationCase, setModerationCase] = useState<ModerationCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearchState] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setLoading(true);
    Promise.all([listMoMoTransactions(pageIndex, undefined, debouncedSearch), getModerationCase()]).then(([tx, mod]) => {
      setTransactions(tx.items);
      setTotalPages(tx.totalPages);
      setTotalCount(tx.totalCount);
      setModerationCase(mod);
      setLoading(false);
    });
  }, [pageIndex, debouncedSearch]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageIndex(0);
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

  return {
    transactions, moderationCase, loading, decide, refund,
    pageIndex, setPageIndex, totalPages, totalCount, search, setSearch,
  };
}

export function useDeliveryHealth() {
  const [stats, setStats] = useState<DeliveryStat[]>([]);
  const [attempts, setAttempts] = useState<DeliveryAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearchState] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setLoading(true);
    Promise.all([listDeliveryStats(), listDeliveryAttempts(pageIndex, undefined, debouncedSearch)]).then(([s, a]) => {
      setStats(s);
      setAttempts(a.items);
      setTotalPages(a.totalPages);
      setTotalCount(a.totalCount);
      setLoading(false);
    });
  }, [pageIndex, debouncedSearch]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageIndex(0);
  }, []);

  const retry = useCallback(async (id: string) => {
    const updated = await retryDeliveryAttempt(id);
    if (updated) setAttempts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  return { stats, attempts, loading, retry, pageIndex, setPageIndex, totalPages, totalCount, search, setSearch };
}

export function useAttentionQueue() {
  const [cases, setCases] = useState<AttentionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFiltersState] = useState<AttentionCaseFilters>({});
  const debouncedSearch = useDebouncedValue(filters.search);

  useEffect(() => {
    setLoading(true);
    listAttentionCases(pageIndex, undefined, { ...filters, search: debouncedSearch }).then((page) => {
      setCases(page.items);
      setTotalPages(page.totalPages);
      setTotalCount(page.totalCount);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, filters.severity, filters.assignedAdminUserId, debouncedSearch]);

  const setFilters = useCallback((next: AttentionCaseFilters) => {
    setFiltersState(next);
    setPageIndex(0);
  }, []);

  const assignToMe = useCallback(async (id: string) => {
    const updated = await assignAttentionCase(id);
    if (updated) setCases((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  return { cases, loading, assignToMe, pageIndex, setPageIndex, totalPages, totalCount, filters, setFilters };
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
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFiltersState] = useState<AuditLogFilters>({});
  const debouncedSearch = useDebouncedValue(filters.search);

  useEffect(() => {
    setLoading(true);
    listAuditEvents(pageIndex, undefined, { ...filters, search: debouncedSearch }).then((page) => {
      setEvents(page.items);
      setTotalPages(page.totalPages);
      setTotalCount(page.totalCount);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, filters.adminUserId, filters.tags, debouncedSearch]);

  const setFilters = useCallback((next: AuditLogFilters) => {
    setFiltersState(next);
    setPageIndex(0);
  }, []);

  return { events, loading, pageIndex, setPageIndex, totalPages, totalCount, filters, setFilters };
}
