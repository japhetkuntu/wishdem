import { Seo } from "@/components/Seo";
import { LegalLayout } from "@/components/LegalLayout";

export default function TermsPage() {
  return (
    <>
      <Seo
        title="Terms of Service — WishDem"
        description="The terms that govern using WishDem to create and deliver private birthday wishes."
        path="/terms"
      />
      <LegalLayout
        title="Terms of Service"
        effectiveDate="Effective 10 August 2026"
        intro="These terms cover what you can expect from WishDem, and what we expect from you. By creating an account or a wish, you're agreeing to them."
        sections={[
          {
            heading: "What WishDem is",
            body: (
              <p>WishDem lets you write a private birthday message today and have it delivered to someone on their birthday, at a time you choose. Every feature is currently free to use — there's no payment involved.</p>
            ),
          },
          {
            heading: "Your account",
            body: (
              <>
                <p>You sign in with a one-time code sent to your email, or with your Google account — there's no password to manage. You're responsible for keeping access to that email or Google account secure, since it's how we verify it's you.</p>
                <p>To keep the delivery system usable for everyone, new wishes are capped at three per day per account. That's an anti-spam measure, not a feature limit — legitimate use rarely comes close to it.</p>
              </>
            ),
          },
          {
            heading: "What you send",
            body: (
              <>
                <p>You're responsible for what you write and attach to a wish, and for making sure the recipient's contact details are accurate — WishDem delivers what you give it, and can't verify a birthday, phone number, or relationship on your behalf.</p>
                <p>Don't use WishDem to send anything illegal, threatening, harassing, or intended to deceive or harm the recipient. We review reported content and may remove a wish or suspend an account that violates this.</p>
              </>
            ),
          },
          {
            heading: "Delivery",
            body: (
              <>
                <p>We make a genuine effort to deliver every wish at the time you scheduled it, by the channel you chose (SMS or a private link). Delivery by SMS depends on the recipient's phone number being correct and their carrier accepting the message — neither of which WishDem controls. If a delivery fails after repeated attempts, we'll do our best to let you know.</p>
                <p>Because WishDem is free, we can't offer compensation for a missed or delayed delivery — but we do want to know if one happens, so we can help and improve the system.</p>
              </>
            ),
          },
          {
            heading: "Ownership",
            body: (
              <p>You own what you write and upload. By using WishDem, you give us the limited right to store, transmit, and display that content solely to operate the service — schedule it, deliver it, and show it to you and your recipient. We don't use your wishes for anything beyond that.</p>
            ),
          },
          {
            heading: "Suspension and termination",
            body: (
              <p>We may suspend or close an account that violates these terms, abuses the delivery system, or attempts to harm other users. You can stop using WishDem and ask us to delete your account at any time.</p>
            ),
          },
          {
            heading: "No warranty",
            body: (
              <p>WishDem is provided as-is. We work hard to keep it reliable, but we don't guarantee it will be uninterrupted, error-free, or available at every future date you schedule a wish for — most of that risk sits with third-party carriers and infrastructure outside our control.</p>
            ),
          },
          {
            heading: "Changes to these terms",
            body: (
              <p>If we materially change these terms, we'll update the date at the top of this page and, where the change is significant, let you know directly.</p>
            ),
          },
          {
            heading: "Governing law",
            body: <p>These terms are governed by the laws of Ghana.</p>,
          },
          {
            heading: "Contact",
            body: (
              <p>
                Questions about these terms:{" "}
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
