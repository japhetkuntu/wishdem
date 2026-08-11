import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Loading } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { AuthPrompt } from "@/components/AuthPrompt";
import { useAuth } from "@/hooks/useAuth";

// Ghana leads the list since it's WishDem's primary market today (delivery SMS and
// phone-number parsing are currently tuned for it) — everyone else can still pick their
// own country here, it just means delivery details may need a little more care for now.
const COUNTRIES = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "Egypt",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Ivory Coast",
  "Senegal",
  "Cameroon",
  "Morocco",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Ireland",
  "Germany",
  "France",
  "Spain",
  "Portugal",
  "Netherlands",
  "Italy",
  "Sweden",
  "United Arab Emirates",
  "Saudi Arabia",
  "India",
  "Pakistan",
  "China",
  "Japan",
  "Singapore",
  "Brazil",
  "Mexico",
  "Other",
];

interface ProfileForm {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  dateOfBirth: string;
  country: string;
  region: string;
}

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, continueWithGoogle, continueWithEmail, logOut, saveProfile } = useAuth();

  const buildForm = (): ProfileForm => {
    const [first, ...rest] = (user?.name ?? "").split(" ");
    return {
      firstName: user?.firstName ?? first ?? "",
      lastName: user?.lastName ?? rest.join(" ") ?? "",
      avatarUrl: user?.avatarUrl ?? null,
      dateOfBirth: user?.dateOfBirth ?? "",
      country: user?.country ?? "Ghana",
      region: user?.region ?? "",
    };
  };

  const [saved, setSaved] = useState<ProfileForm>(buildForm);
  const [form, setForm] = useState<ProfileForm>(buildForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = buildForm();
    setSaved(next);
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, avatarUrl: URL.createObjectURL(file) }));
  }

  async function handleSave() {
    if (!form.firstName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        avatarUrl: form.avatarUrl,
        dateOfBirth: form.dateOfBirth || undefined,
        country: form.country || undefined,
        region: form.region.trim() || undefined,
      });
      setSaved(form);
    } catch {
      setError("We couldn't save that just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await logOut();
    navigate("/");
  }

  return (
    <main className="mx-auto w-full max-w-[1040px] px-4 pb-10 sm:px-7">
      <Seo
        title="Account Settings — WishDem"
        description="Manage your personal WishDem profile, sender details, and account settings."
        path="/account"
        noindex
      />
      <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.15]">
        <Link to="/" className="text-[21px] font-extrabold tracking-[-1.4px]">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <Link to="/dashboard" className="ml-7 text-[10px] font-extrabold text-champagne">
          ← Back to your wishes
        </Link>
      </nav>

      <section className="mx-auto my-9 max-w-[800px]">
        <header className="mb-6">
          <h1 className="font-display text-[38px]">Profile &amp; settings</h1>
          <p className="mt-[7px] max-w-[490px] text-[11px] leading-[1.55] text-porcelain/68">
            Keep your WishDem details personal, accurate, and ready for every future delivery.
          </p>
        </header>

        {loading ? (
          <Loading />
        ) : !user ? (
          <AuthPrompt
            title="Sign in to manage your profile."
            description="Your settings stay private to your account."
            onGoogle={continueWithGoogle}
            onEmail={continueWithEmail}
          />
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="rounded-[22px] border border-plum/[0.1] bg-white p-6 text-plum shadow-[0_8px_24px_rgba(13,6,14,0.07)]"
            >
              <section className="mb-[22px] border-b border-plum/[0.09] pb-[23px]">
                <h2 className="font-display text-[25px]">Your profile</h2>
                <p className="mb-[17px] mt-1 text-[10px] text-plum/60">
                  This is how you'll appear as the sender of a wish.
                </p>

                <div className="grid gap-[23px] sm:grid-cols-[150px_1fr]">
                  <div className="flex items-center gap-3 sm:block sm:text-center">
                    <div className="grid h-[96px] w-[96px] flex-none place-items-center rounded-full border-4 border-background bg-champagne font-display text-[38px] text-plum shadow-[0_6px_15px_rgba(13,6,14,0.13)] sm:mx-auto sm:mb-[10px]">
                      {form.avatarUrl ? (
                        <img src={form.avatarUrl} alt="Your profile" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        initials(form.firstName, form.lastName)
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhoto}
                      />
                      <div className="flex flex-wrap justify-start gap-[10px] sm:justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[9px] font-extrabold text-mulberry"
                        >
                          {form.avatarUrl ? "Change photo" : "Upload photo"}
                        </button>
                        {form.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, avatarUrl: null }))}
                            className="text-[9px] font-extrabold text-rose"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <small className="mt-2 block text-[8px] leading-[1.4] text-plum/50 sm:text-center">
                        JPG, PNG, or WEBP · up to 10 MB
                      </small>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-1 gap-[13px] sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-[6px] block text-[9px] font-extrabold text-plum">First name</span>
                        <input
                          required
                          value={form.firstName}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                          className="h-[42px] w-full rounded-[8px] border border-plum/[0.15] bg-[#F9F9FB] px-[11px] text-[11px] font-medium text-plum outline-none focus:border-mulberry"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-[6px] block text-[9px] font-extrabold text-plum">
                          Last name <em className="font-medium text-plum/45">optional</em>
                        </span>
                        <input
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                          className="h-[42px] w-full rounded-[8px] border border-plum/[0.15] bg-[#F9F9FB] px-[11px] text-[11px] font-medium text-plum outline-none focus:border-mulberry"
                        />
                      </label>
                    </div>

                    <div className="mt-[17px] flex items-center gap-[10px] rounded-[14px] bg-background p-[13px]">
                      <div className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-champagne font-display text-[15px] text-plum">
                        {form.avatarUrl ? (
                          <img src={form.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          initials(form.firstName, form.lastName)
                        )}
                      </div>
                      <div>
                        <small className="block text-[8px] font-extrabold tracking-[0.08em] text-mulberry">
                          YOUR SENDER SIGNATURE
                        </small>
                        <b className="mt-[2px] block font-display text-[17px]">
                          A wish from {form.firstName || "you"}
                          {form.lastName ? ` ${form.lastName}` : ""}
                        </b>
                        <span className="mt-[1px] block text-[8px] text-plum/55">Sent with WishDem</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-[5px]">
                <h2 className="font-display text-[25px]">A little about you</h2>
                <p className="mb-[17px] mt-1 text-[10px] text-plum/60">
                  These details are private and help WishDem recognize the right moments in the
                  right place.
                </p>

                <div className="grid grid-cols-1 gap-[13px] sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-[6px] block text-[9px] font-extrabold text-plum">
                      Date of birth <em className="font-medium text-plum/45">optional</em>
                    </span>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                      className="h-[42px] w-full rounded-[8px] border border-plum/[0.15] bg-[#F9F9FB] px-[11px] text-[11px] font-medium text-plum outline-none focus:border-mulberry"
                    />
                    <small className="mt-[5px] block text-[8px] leading-[1.45] text-plum/50">
                      Private to you. We use this to recognize your birthday in WishDem.
                    </small>
                  </label>
                  <label className="block">
                    <span className="mb-[6px] block text-[9px] font-extrabold text-plum">Country</span>
                    <select
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      className="h-[42px] w-full rounded-[8px] border border-plum/[0.15] bg-[#F9F9FB] px-[11px] text-[11px] font-medium text-plum outline-none focus:border-mulberry"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <small className="mt-[5px] block text-[8px] leading-[1.45] text-plum/50">
                      This helps us handle local birthday dates correctly.
                    </small>
                  </label>
                  <label className="col-span-full block">
                    <span className="mb-[6px] block text-[9px] font-extrabold text-plum">
                      Region <em className="font-medium text-plum/45">optional</em>
                    </span>
                    <input
                      value={form.region}
                      onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                      placeholder="e.g. England"
                      className="h-[42px] w-full rounded-[8px] border border-plum/[0.15] bg-[#F9F9FB] px-[11px] text-[11px] font-medium text-plum outline-none focus:border-mulberry"
                    />
                    <small className="mt-[5px] block text-[8px] leading-[1.45] text-plum/50">
                      For {form.country}, you can add your region. This changes naturally if your
                      country changes.
                    </small>
                  </label>
                </div>
              </section>

              {error && <p className="mt-3 text-[11px] text-mulberry">{error}</p>}

              <div className="mt-5 flex flex-wrap items-center gap-[13px]">
                {dirty && (
                  <span className="order-first w-full text-[9px] text-plum/50 sm:order-none sm:ml-auto sm:w-auto">
                    You have unsaved changes.
                  </span>
                )}
                <Button type="submit" variant="dark" disabled={saving || !form.firstName.trim()}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <button
                  type="button"
                  onClick={() => setForm(saved)}
                  className="text-[9px] font-extrabold text-mulberry"
                >
                  Cancel
                </button>
              </div>
            </form>

            <footer className="mt-6 flex flex-wrap justify-center gap-[14px] text-[8px] font-extrabold text-porcelain/55">
              <Link to="/how-it-works#faq">Account &amp; security</Link>
              <Link to="/how-it-works#faq">Privacy</Link>
              <button type="button" onClick={handleSignOut} className="text-rose">
                Sign out
              </button>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}
