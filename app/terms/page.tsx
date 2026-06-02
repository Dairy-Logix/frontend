import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | BeatMitra",
  description:
    "The terms that govern your use of the BeatMitra platform and the BeatMitra Store and BeatMitra Field mobile apps.",
};

const LAST_UPDATED = "1 June 2026";
const SUPPORT_EMAIL = "support@beatmitra.com";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Applies to the BeatMitra platform and the{" "}
            <strong>BeatMitra Store</strong> and <strong>BeatMitra Field</strong>{" "}
            mobile apps.
          </p>
        </header>

        <Section title="1. Acceptance of these terms">
          <p>
            By creating an account, signing in, or using BeatMitra (the
            &ldquo;Service&rdquo;), you agree to these Terms of Service. If you
            do not agree, do not use the Service. If you use the Service on
            behalf of a business, you confirm you are authorised to accept these
            terms for that business.
          </p>
        </Section>

        <Section title="2. About the Service">
          <p>
            BeatMitra is a distribution-management platform for dairy
            distributors and their store network. It provides ordering,
            delivery, invoicing, and payment-collection tools. The mobile apps
            connect store owners (BeatMitra Store) and field staff (BeatMitra
            Field) to their distributor&rsquo;s BeatMitra account.
          </p>
        </Section>

        <Section title="3. Accounts and access">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Accounts are created and managed by your distributor. You are
              responsible for keeping your login credentials secure.
            </li>
            <li>
              You must provide accurate information and use the Service only for
              its intended business purpose.
            </li>
            <li>
              You are responsible for all activity that occurs under your
              account. Notify us immediately of any unauthorised use.
            </li>
          </ul>
        </Section>

        <Section title="4. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Use the Service for any unlawful or fraudulent purpose.</li>
            <li>
              Attempt to access data belonging to other businesses or users, or
              interfere with the security or operation of the Service.
            </li>
            <li>
              Reverse-engineer, copy, or resell the Service except as permitted
              by law.
            </li>
          </ul>
        </Section>

        <Section title="5. Orders, invoices and payments">
          <p>
            Orders, invoices, balances, and payment records in the app reflect
            transactions between you and your distributor. Your distributor — not
            BeatMitra — is responsible for pricing, fulfilment, and the
            commercial relationship. Any disputes about an order, invoice, or
            payment should be raised with your distributor.
          </p>
        </Section>

        <Section title="6. Privacy">
          <p>
            Your use of the Service is also governed by our{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            , which explains what data we collect and how we use it.
          </p>
        </Section>

        <Section title="7. Service availability">
          <p>
            We work to keep the Service available and reliable, but we provide it
            &ldquo;as is&rdquo; without warranties of uninterrupted or error-free
            operation. We may update, suspend, or discontinue features from time
            to time.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>
            To the extent permitted by law, BeatMitra is not liable for indirect,
            incidental, or consequential damages, or for loss of profits, data,
            or business arising from your use of the Service. Nothing in these
            terms limits liability that cannot be limited under applicable law.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            We or your distributor may suspend or terminate your access if these
            terms are breached or if your account is closed. You may stop using
            the Service at any time; data handling after termination is described
            in our{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="10. Changes to these terms">
          <p>
            We may update these terms as the Service evolves. Material changes
            will be announced in-app or by email before they take effect.
            Continued use after changes take effect means you accept the updated
            terms.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>
            These terms are governed by the laws of India. Courts at our
            registered place of business have exclusive jurisdiction over any
            dispute, subject to applicable law.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these terms? Email us at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </main>
    </div>
  );
}
