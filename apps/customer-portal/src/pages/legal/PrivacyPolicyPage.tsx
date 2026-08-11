import { Seo } from "@/components/Seo";
import { LegalLayout } from "@/components/LegalLayout";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Seo
        title="Privacy Policy — WishDem"
        description="How WishDem collects, uses, and protects your information and the wishes you create."
        path="/privacy"
      />
      <LegalLayout
        title="Privacy Policy"
        effectiveDate="Effective 10 August 2026"
        intro="This describes exactly what WishDem collects, why, and who it's shared with — written to match what the product actually does, not boilerplate. If anything here is unclear, contact us using the details at the bottom."
        sections={[
          {
            heading: "What we collect",
            body: (
              <>
                <p>When you create an account: your email address, and — if you sign in with Google — the name, email, and account identifier Google shares with us.</p>
                <p>When you create a wish: the recipient's name, relationship to you, the occasion and its date, delivery time and timezone, and — if you choose SMS delivery — their phone number. Your written message, and any photo, video, or voice note you attach.</p>
                <p>When a recipient opens a wish: the time they opened it, recorded against that wish so you can see it was received.</p>
                <p>We don't collect payment information — every feature on WishDem is currently free.</p>
              </>
            ),
          },
          {
            heading: "How we use it",
            body: (
              <>
                <p>To create, schedule, and deliver your wish on the date and time you chose. To send you account emails — sign-in codes, and updates about a wish you've sent. To enforce a daily limit on new wishes, which exists to keep the delivery system from being used for spam rather than to limit you personally.</p>
                <p>We do not use your data to serve ads, and we do not sell it to anyone.</p>
              </>
            ),
          },
          {
            heading: "Who we share it with",
            body: (
              <>
                <p>We use a small number of service providers to actually run WishDem — each only sees what it needs to do its job:</p>
                <p><b>Mailtrap</b> — delivers our transactional emails (sign-in codes, wish notifications).</p>
                <p><b>Arkesel</b> — delivers SMS messages when you choose text delivery.</p>
                <p><b>Google</b> — only if you choose "Continue with Google" to sign in.</p>
                <p><b>DigitalOcean</b> — hosts our servers and stores any photo, video, or voice attachment you upload.</p>
                <p>None of these providers may use your information for their own purposes — they process it only to deliver the service back to you.</p>
              </>
            ),
          },
          {
            heading: "What your recipient sees",
            body: (
              <>
                <p>A recipient never needs a WishDem account. They access your wish through a private, unguessable link — sent by SMS or shared by you directly — and see only that one wish's content, never your account, other wishes, or contact list.</p>
              </>
            ),
          },
          {
            heading: "How we protect it",
            body: (
              <>
                <p>Customer accounts sign in with a one-time email code rather than a password, so there's no password to leak or reuse. All traffic between your device and WishDem is encrypted (HTTPS). Access to the operations dashboard used by our team is separately authenticated and logged.</p>
              </>
            ),
          },
          {
            heading: "How long we keep it",
            body: (
              <>
                <p>We keep your account and wish data for as long as your account is active. If you'd like your account and its data deleted, contact us and we'll action it — a wish already delivered to a recipient is theirs to keep regardless.</p>
              </>
            ),
          },
          {
            heading: "Your rights",
            body: (
              <>
                <p>You can ask us what data we hold about you, ask us to correct it, or ask us to delete it. Contact us using the details below and we'll respond as quickly as we can.</p>
              </>
            ),
          },
          {
            heading: "Changes to this policy",
            body: (
              <>
                <p>If we materially change how we handle your data, we'll update the date at the top of this page and, where the change is significant, let you know directly.</p>
              </>
            ),
          },
          {
            heading: "Contact",
            body: (
              <p>
                Questions about this policy or your data:{" "}
                <a href="mailto:support@wishdem.example" className="font-extrabold text-champagne">
                  support@wishdem.example
                </a>
              </p>
            ),
          },
        ]}
      />
    </>
  );
}
