import { useState } from "react";
import clsx from "clsx";
import { AdminLayout } from "@/components/AdminLayout";
import { useAdminCustomers, useTeamMembers } from "@/hooks/useAdminData";
import type { CustomerStatus, TeamStatus } from "@/types";

type Tab = "customers" | "team" | "invitations" | "offboarding";

const CUSTOMER_BADGE: Record<CustomerStatus, string> = {
  ACTION_NEEDED: "bg-champagne/50 text-plum",
  ACTIVE: "bg-moss/20 text-moss",
  RESTRICTED: "bg-rose/30 text-mulberry",
  DELETION_REQUESTED: "bg-periwinkle/[0.17] text-mulberry",
};

const TEAM_BADGE: Record<TeamStatus, string> = {
  ACTIVE: "bg-moss/20 text-moss",
  INVITED: "bg-champagne/50 text-plum",
  OFFBOARDING: "bg-rose/30 text-mulberry",
};

export default function UsersPage() {
  const { customers, loading: customersLoading } = useAdminCustomers();
  const { members, loading: membersLoading } = useTeamMembers();
  const [tab, setTab] = useState<Tab>("customers");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [reason, setReason] = useState("Recipient cannot access delivery confirmation.");

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? customers[0];

  const invitationsCount = members.filter((m) => m.status === "INVITED").length;
  const offboardingCount = members.filter((m) => m.status === "OFFBOARDING").length;

  return (
    <AdminLayout active="users">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[10px] font-extrabold tracking-[0.11em] text-mulberry">
          ACCOUNT CARE · GMT / ACCRA
        </span>
        <input
          placeholder="Search name, email, phone or user ID"
          className="min-w-[240px] flex-1 rounded-pill border border-plum/[0.16] px-[13px] py-[10px] text-[11px] outline-none sm:flex-none sm:w-[380px]"
        />
      </div>

      <h1 className="mt-4 font-display text-[34px]">Users</h1>
      <p className="mb-4 text-[11px] text-ink/55">
        Help people manage their promises with the smallest relevant amount of context.
      </p>

      <div className="mb-4 flex flex-wrap gap-[7px]">
        {(
          [
            { key: "customers", label: `Customers · ${customers.length}` },
            { key: "team", label: `Team members · ${members.length}` },
            { key: "invitations", label: `Invitations · ${invitationsCount}` },
            { key: "offboarding", label: `Offboarding · ${offboardingCount}` },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={clsx(
              "rounded-pill border px-[10px] py-[7px] text-[9px] font-extrabold",
              tab === t.key ? "border-champagne bg-champagne text-plum" : "border-plum/[0.15] bg-white text-mulberry",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "customers" && (
        <section className="grid gap-[15px] lg:grid-cols-[.9fr_1.1fr]">
          <article className="overflow-hidden rounded-md border border-plum/[0.11] bg-white">
            <header className="flex items-center justify-between border-b border-plum/[0.09] p-4">
              <h2 className="font-display text-[20px]">Directory</h2>
              <span className="rounded-pill bg-champagne/50 px-[7px] py-[6px] text-[9px] font-extrabold">Payment action</span>
            </header>
            {customersLoading ? (
              <p className="py-10 text-center text-[12px] text-ink/50">Loading…</p>
            ) : (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className={clsx(
                    "grid w-full grid-cols-[1.3fr_.7fr_auto] items-center gap-[10px] border-t border-plum/[0.08] p-[14px] text-left text-[11px] first:border-0",
                    customer.id === (selectedCustomerId ?? customers[0]?.id) && "border-l-[3px] border-l-champagne bg-mulberry/[0.04] pl-[11px]",
                  )}
                >
                  <div>
                    <b className="block">{customer.name}</b>
                    <small className="mt-[2px] block text-ink/50">
                      {customer.email} · {customer.verified ? "Verified" : "Unverified"}
                    </small>
                  </div>
                  <span className={clsx("w-max rounded-pill px-[6px] py-1 text-[8px] font-extrabold", CUSTOMER_BADGE[customer.status])}>
                    {customer.status.replace(/_/g, " ")}
                  </span>
                  <small className="whitespace-nowrap text-ink/50">{customer.meta}</small>
                </button>
              ))
            )}
          </article>

          {selectedCustomer && (
            <article className="rounded-md border border-plum/[0.11] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={clsx("w-max rounded-pill px-[6px] py-1 text-[8px] font-extrabold", CUSTOMER_BADGE[selectedCustomer.status])}>
                    {selectedCustomer.status.replace(/_/g, " ")}
                  </span>
                  <h2 className="mt-[5px] font-display text-[28px]">{selectedCustomer.name}</h2>
                  <p className="text-[11px] leading-[1.55] text-ink/55">
                    {selectedCustomer.email} · {selectedCustomer.id}
                    <br />
                    {selectedCustomer.profile.timezoneNote}
                  </p>
                </div>
                <button type="button" className="rounded-pill bg-plum px-[11px] py-[9px] text-[10px] font-extrabold text-porcelain">
                  Contact {selectedCustomer.name.split(" ")[0]}
                </button>
              </div>

              <div className="my-3 grid grid-cols-3 gap-[7px]">
                <div className="rounded-sm bg-porcelain p-[9px] text-[9px] text-ink/55">
                  MEMBER SINCE
                  <b className="mt-[3px] block text-[11px] text-ink">{selectedCustomer.profile.memberSince}</b>
                </div>
                <div className="rounded-sm bg-porcelain p-[9px] text-[9px] text-ink/55">
                  ACTIVE WISHES
                  <b className="mt-[3px] block text-[11px] text-ink">{selectedCustomer.profile.activeWishes}</b>
                </div>
                <div className="rounded-sm bg-porcelain p-[9px] text-[9px] text-ink/55">
                  NEXT DELIVERY
                  <b className="mt-[3px] block text-[11px] text-ink">{selectedCustomer.profile.nextDelivery}</b>
                </div>
              </div>

              <p className="text-[11px] leading-[1.55] text-ink/70">
                <b>{selectedCustomer.profile.summary}</b>
              </p>

              <div className="mt-4 text-[10px] font-extrabold tracking-[0.1em] text-mulberry">
                SCHEDULED WISHES · CONTENT MASKED
              </div>
              {selectedCustomer.profile.scheduledWishes.map((wish, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-[9px] border-t border-plum/[0.08] py-[9px] text-[10px]">
                  <div>
                    <b>{wish.recipient}</b>
                    <span className="text-ink/55"> · {wish.meta}</span>
                    <small className="mt-[2px] block text-ink/50">{wish.note}</small>
                  </div>
                  <button type="button" className="rounded-pill border border-plum/[0.15] bg-white px-[10px] py-[8px] text-[9px] font-extrabold text-plum">
                    Open
                  </button>
                </div>
              ))}

              <div className="mt-4 text-[10px] font-extrabold tracking-[0.1em] text-mulberry">
                PAYMENTS &amp; CARE NOTES
              </div>
              <p className="mt-[6px] text-[10px] leading-[1.5] text-ink/70">{selectedCustomer.profile.paymentNote}</p>
              {selectedCustomer.profile.careNotes.map((note, i) => (
                <div key={i} className="mt-3 rounded-r-sm border-l-[3px] border-champagne bg-champagne/10 p-[10px] text-[10px] leading-[1.45]">
                  <b>
                    {note.author} · {note.time}
                  </b>
                  <br />
                  {note.note}
                </div>
              ))}

              <div className="mt-3 flex flex-wrap gap-[7px]">
                <button type="button" className="rounded-pill border border-plum/[0.15] bg-white px-[11px] py-[9px] text-[10px] font-extrabold text-plum">
                  Request protected content access
                </button>
                <button type="button" className="rounded-pill border border-plum/[0.15] bg-white px-[11px] py-[9px] text-[10px] font-extrabold text-plum">
                  View full activity
                </button>
              </div>
            </article>
          )}
        </section>
      )}

      {tab === "team" && (
        <section className="grid gap-[15px] lg:grid-cols-[minmax(0,1fr)_310px]">
          <article className="overflow-hidden rounded-md border border-plum/[0.11] bg-white">
            <div className="hidden grid-cols-[1.45fr_1fr_.8fr_.7fr_.9fr_.55fr] gap-[8px] bg-porcelain px-[13px] py-[11px] text-[8px] font-extrabold tracking-[0.07em] text-ink/50 lg:grid">
              <span>PERSON</span>
              <span>ROLE &amp; TEAM</span>
              <span>STATUS</span>
              <span>MFA</span>
              <span>LAST ACTIVE</span>
              <span />
            </div>
            {membersLoading ? (
              <p className="py-10 text-center text-[12px] text-ink/50">Loading…</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-2 gap-[8px] border-t border-plum/[0.08] px-[13px] py-3 text-[10px] first:border-0 lg:grid-cols-[1.45fr_1fr_.8fr_.7fr_.9fr_.55fr] lg:items-center"
                >
                  <div>
                    <b className="block">{member.name}</b>
                    <span className="mt-[2px] block text-ink/50">{member.email}</span>
                  </div>
                  <div>
                    <b className="block">{member.role}</b>
                    <small className="text-ink/50">{member.team}</small>
                  </div>
                  <div>
                    <span className={clsx("w-max rounded-pill px-[6px] py-1 text-[8px] font-extrabold", TEAM_BADGE[member.status])}>
                      {member.status}
                    </span>
                  </div>
                  <div className="font-extrabold text-moss">{member.mfa}</div>
                  <div>
                    {member.lastActive}
                    <small className="block text-ink/50">{member.locationNote}</small>
                  </div>
                  <div className="font-extrabold text-mulberry">{member.actionLabel} →</div>
                </div>
              ))
            )}
          </article>

          <aside className="h-max rounded-md border border-plum/[0.11] bg-white p-4">
            <h2 className="font-display text-[22px]">Support session</h2>
            <p className="text-[10px] text-ink/55">Impersonation is always scoped, time-limited, and recorded.</p>
            <div className="my-3 rounded-md bg-porcelain p-[10px] text-[10px] leading-[1.45]">
              <b>View as Nina Park</b>
              <br />
              Read-only customer account and delivery metadata.
              <br />
              <br />
              <b>Blocked:</b> wish content, payment changes, account closure, and security changes.
            </div>
            <label className="mb-1 mt-[10px] block text-[9px] font-extrabold text-plum">SUPPORT CASE REASON</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-sm border border-plum/[0.15] bg-background p-2 text-[10px] outline-none"
            />
            <div className="mt-[9px] border-l-2 border-champagne pl-2 text-[9px] leading-[1.45] text-ink/60">
              This session will be visible in Nina's account timeline and the audit log. It ends
              after 15 minutes.
            </div>
            <button
              type="button"
              onClick={() => setSessionStarted(true)}
              disabled={sessionStarted}
              className="mt-3 w-full rounded-pill bg-plum px-[11px] py-[10px] text-[10px] font-extrabold text-porcelain disabled:opacity-60"
            >
              {sessionStarted ? "Session started ✓" : "Start protected session"}
            </button>
          </aside>
        </section>
      )}

      {tab === "invitations" && (
        <section className="rounded-md border border-plum/[0.11] bg-white p-4">
          {members
            .filter((m) => m.status === "INVITED")
            .map((member) => (
              <div key={member.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-plum/[0.08] py-3 text-[11px] first:border-0">
                <div>
                  <b>{member.name}</b>
                  <span className="text-ink/55"> · {member.email}</span>
                  <small className="mt-[2px] block text-ink/50">{member.role} · {member.locationNote}</small>
                </div>
                <button type="button" className="rounded-pill bg-plum px-[11px] py-[9px] text-[10px] font-extrabold text-porcelain">
                  Resend invite
                </button>
              </div>
            ))}
          {members.filter((m) => m.status === "INVITED").length === 0 && (
            <p className="py-8 text-center text-[12px] text-ink/50">No pending invitations.</p>
          )}
        </section>
      )}

      {tab === "offboarding" && (
        <section className="rounded-md border border-plum/[0.11] bg-white p-4">
          {members
            .filter((m) => m.status === "OFFBOARDING")
            .map((member) => (
              <div key={member.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-plum/[0.08] py-3 text-[11px] first:border-0">
                <div>
                  <b>{member.name}</b>
                  <span className="text-ink/55"> · {member.role}</span>
                  <small className="mt-[2px] block text-ink/50">{member.lastActive} · {member.locationNote}</small>
                </div>
                <button type="button" className="rounded-pill border border-plum/[0.16] bg-white px-[11px] py-[9px] text-[10px] font-extrabold text-plum">
                  Review reassignment
                </button>
              </div>
            ))}
          {members.filter((m) => m.status === "OFFBOARDING").length === 0 && (
            <p className="py-8 text-center text-[12px] text-ink/50">No one is offboarding.</p>
          )}
        </section>
      )}
    </AdminLayout>
  );
}
