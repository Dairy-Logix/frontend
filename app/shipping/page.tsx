import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping and Exchange Policy | BeatMitra",
  description:
    "BeatMitra is a software subscription service — no physical goods are shipped or exchanged.",
};

const LAST_UPDATED = "2 June 2026";
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

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Shipping and Exchange Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <Section title="No physical goods">
          <p>
            BeatMitra is a software-as-a-service (SaaS) platform. We sell
            subscriptions to digital software only. We do{" "}
            <strong>not</strong> sell, ship, or deliver any physical products,
            and therefore no shipping charges apply and no shipping or exchange
            of goods takes place.
          </p>
        </Section>

        <Section title="Service activation">
          <p>
            Access to the platform is delivered electronically. Once your
            subscription payment is confirmed, your account is activated
            immediately — there is no waiting period or physical dispatch
            involved.
          </p>
        </Section>

        <Section title="Cancellations and refunds">
          <p>
            Because there are no physical goods to return or exchange,
            cancellations and refunds for your subscription are handled under our{" "}
            <Link
              href="/refunds"
              className="text-primary underline underline-offset-4"
            >
              Cancellation and Refund Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="Questions">
          <p>
            For any questions about your subscription or account access, email{" "}
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
