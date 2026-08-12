import { useState } from "react";
import clsx from "clsx";
import { Pagination } from "@wishdem/design-system";
import { AdminLayout } from "@/components/AdminLayout";
import { usePaymentsModeration } from "@/hooks/useAdminData";
import { DEFAULT_PAGE_SIZE } from "@/lib/api";
import type { MoMoTransaction } from "@/types";

const MOMO_BADGE: Record<MoMoTransaction["status"], string> = {
  PENDING: "bg-champagne/45 text-plum",
  FAILED: "bg-rose/30 text-mulberry",
  SUCCESSFUL: "bg-moss/20 text-moss",
  REFUND_PENDING: "bg-periwinkle/[0.17] text-mulberry",
};

export default function PaymentsModerationPage() {
  const { transactions, moderationCase, loading, decide, refund, pageIndex, setPageIndex, totalPages, totalCount, search, setSearch } =
    usePaymentsModeration();
  const [deciding, setDeciding] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  async function handleDecision(decision: "approved" | "removed") {
    setDeciding(true);
    try {
      await decide(decision);
    } finally {
      setDeciding(false);
    }
  }

  async function handleRefund(tx: MoMoTransaction) {
    const reason = window.prompt(`Reason for refunding ${tx.amount} to ${tx.senderName}?`);
    if (!reason || !reason.trim()) return;
    setRefundingId(tx.id);
    try {
      await refund(tx.id, { amount: tx.rawAmount, reason: reason.trim() });
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <AdminLayout active="payments">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum/[0.1] pb-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.1em] text-mulberry">
            OPERATIONS / FINANCE &amp; SAFETY
          </span>
          <br />
          <b className="text-[12px]">
            GMT / Accra · Last refresh{" "}
            {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </b>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by wish ID or phone number"
          className="min-w-[240px] flex-1 rounded-sm border border-plum/[0.14] px-[11px] py-[9px] text-[11px] outline-none sm:flex-none sm:w-[280px]"
        />
      </div>

      <section className="my-5">
        <h1 className="font-display text-[34px]">Payments &amp; moderation</h1>
        <p className="mt-1 text-[12px] text-porcelain/60">
          Reconcile payment risk and decide content reports with a reasoned, auditable action.
        </p>
      </section>

      <section className="grid gap-[16px] lg:grid-cols-[1.1fr_.9fr]">
        <article className="overflow-hidden rounded-md border border-plum/[0.11] bg-white text-ink">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-plum/[0.09] p-4">
            <h2 className="font-display text-[20px]">Mobile Money transactions</h2>
            <div className="flex flex-wrap gap-[6px]">
              <span className="rounded-pill bg-champagne/45 px-[7px] py-[5px] text-[9px] font-extrabold">All {totalCount}</span>
              <span className="rounded-pill bg-plum/[0.05] px-[7px] py-[5px] text-[9px] font-extrabold">
                Pending {transactions.filter((t) => t.status === "PENDING").length}
              </span>
              <span className="rounded-pill bg-plum/[0.05] px-[7px] py-[5px] text-[9px] font-extrabold">
                Failed {transactions.filter((t) => t.status === "FAILED").length}
              </span>
            </div>
          </header>
          <div className="px-4">
            {loading ? (
              <p className="py-10 text-center text-[12px] text-ink/50">Loading…</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-2 gap-[8px] border-t border-plum/[0.07] py-3 text-[11px] first:border-0 sm:grid-cols-4 sm:items-center">
                  <div>
                    <b className="block">{tx.id}</b>
                    <span className="mt-[2px] block text-[10px] text-ink/50">
                      {tx.wishId} · {tx.senderName} · {tx.provider}
                    </span>
                  </div>
                  <div>
                    <b className="block">{tx.amount}</b>
                    <span className="mt-[2px] block text-[10px] text-ink/50">{tx.statusNote}</span>
                  </div>
                  <div>
                    <span className={clsx("rounded-pill px-[6px] py-1 text-[8px] font-extrabold", MOMO_BADGE[tx.status])}>
                      {tx.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <b className="block">{tx.reconciliationLabel}</b>
                    {tx.status === "SUCCESSFUL" ? (
                      <button
                        type="button"
                        disabled={refundingId === tx.id}
                        onClick={() => handleRefund(tx)}
                        className="mt-[2px] block text-[10px] font-extrabold text-mulberry disabled:opacity-50"
                      >
                        {refundingId === tx.id ? "Refunding…" : "Refund →"}
                      </button>
                    ) : (
                      <span className="mt-[2px] block text-[10px] font-extrabold text-mulberry">{tx.actionLabel} →</span>
                    )}
                  </div>
                </div>
              ))
            )}
            <Pagination
              pageIndex={pageIndex}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={DEFAULT_PAGE_SIZE}
              onPageChange={setPageIndex}
            />
          </div>
          <div className="m-4 rounded-r-sm border-l-[3px] border-champagne bg-champagne/10 p-[10px] text-[10px] leading-[1.45]">
            <b>Refund safeguard:</b> issuing a refund requires an amount, reason, destination
            context, and confirmation that delivery reconciliation is understood.
          </div>
        </article>

        <article className="overflow-hidden rounded-md border border-plum/[0.11] bg-white text-ink">
          <header className="flex items-center justify-between gap-2 border-b border-plum/[0.09] p-4">
            <h2 className="font-display text-[20px]">Moderation case {moderationCase?.id}</h2>
            <span className="rounded-pill bg-rose/30 px-[6px] py-1 text-[8px] font-extrabold text-mulberry">
              HIGH SEVERITY
            </span>
          </header>
          {moderationCase && (
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={clsx(
                      "rounded-pill px-[6px] py-1 text-[8px] font-extrabold",
                      moderationCase.status === "resolved" ? "bg-moss/20 text-moss" : "bg-periwinkle/[0.17] text-mulberry",
                    )}
                  >
                    {moderationCase.status === "resolved" ? "RESOLVED" : "UNDER REVIEW"}
                  </span>
                  <h3 className="mt-[5px] font-display text-[21px]">{moderationCase.title}</h3>
                </div>
                <span className="whitespace-nowrap text-[10px] text-ink/50">{moderationCase.flaggedAgo}</span>
              </div>
              <p className="mt-2 text-[11px] leading-[1.55] text-ink/70">{moderationCase.description}</p>
              <div className="my-3 rounded-sm border-l-[3px] border-rose bg-paper p-3 font-display text-[14px] leading-[1.45]">
                "{moderationCase.evidenceQuote}"
              </div>
              <div className="grid grid-cols-2 gap-[8px]">
                <div className="rounded-sm bg-plum/[0.03] p-[8px] text-[9px] text-ink/55">
                  CONTENT TYPE
                  <b className="mt-[3px] block text-[10px] text-ink">{moderationCase.contentType}</b>
                </div>
                <div className="rounded-sm bg-plum/[0.03] p-[8px] text-[9px] text-ink/55">
                  REVIEWER
                  <b className="mt-[3px] block text-[10px] text-ink">{moderationCase.reviewer}</b>
                </div>
                <div className="rounded-sm bg-plum/[0.03] p-[8px] text-[9px] text-ink/55">
                  SENDER
                  <b className="mt-[3px] block text-[10px] text-ink">{moderationCase.sender}</b>
                </div>
                <div className="rounded-sm bg-plum/[0.03] p-[8px] text-[9px] text-ink/55">
                  PRIOR CASES
                  <b className="mt-[3px] block text-[10px] text-ink">{moderationCase.priorCases}</b>
                </div>
              </div>

              {moderationCase.status === "under-review" ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-[8px]">
                    <button
                      type="button"
                      disabled={deciding}
                      onClick={() => handleDecision("approved")}
                      className="rounded-pill bg-plum px-[12px] py-[10px] text-[10px] font-extrabold text-[#F6F0E8] disabled:opacity-50"
                    >
                      Approve content
                    </button>
                    <button
                      type="button"
                      disabled={deciding}
                      onClick={() => handleDecision("removed")}
                      className="rounded-pill bg-rose px-[12px] py-[10px] text-[10px] font-extrabold text-plum disabled:opacity-50"
                    >
                      Remove content
                    </button>
                  </div>
                  <div className="mt-3 rounded-r-sm border-l-[3px] border-champagne bg-champagne/10 p-[10px] text-[10px] leading-[1.45]">
                    <b>Decision reason required.</b>
                    <br />
                    Removal makes this media unavailable to both recipient and sender. Your
                    decision, evidence context, and reason will enter the audit log.
                  </div>
                </>
              ) : (
                <p className="mt-3 rounded-r-sm border-l-[3px] border-moss bg-moss/10 p-[10px] text-[10px] font-bold leading-[1.45] text-moss">
                  Case resolved. This decision is recorded in the audit log.
                </p>
              )}
            </div>
          )}
        </article>
      </section>

      <article className="mt-4 rounded-md border border-plum/[0.11] bg-white p-4 text-ink">
        <h2 className="font-display text-[20px]">Recent consequential actions</h2>
        <div className="mt-2 text-[10px] leading-[1.6]">
          <p className="border-t border-plum/[0.08] py-2">
            <time className="font-extrabold text-mulberry">09:31</time> · A. Boateng issued a
            ₵15.00 refund for MM-2784891 · Reason: duplicate charge
          </p>
          <p className="border-t border-plum/[0.08] py-2">
            <time className="font-extrabold text-mulberry">09:05</time> · M. Owusu removed video
            content from WD-10398 · Reason: explicit sexual content
          </p>
          <p className="border-t border-plum/[0.08] py-2">
            <time className="font-extrabold text-mulberry">08:44</time> · System reconciled
            MM-2784710 to delivery DLV-90377
          </p>
        </div>
      </article>
    </AdminLayout>
  );
}
