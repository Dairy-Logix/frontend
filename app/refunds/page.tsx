import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cancellation and Refund Policy | BeatMitra",
  description:
    "How subscription cancellations and refunds work on the BeatMitra platform.",
};

const LAST_UPDATED = "2 June 2026";
const SUPPORT_EMAIL = "support@beatmitra.com";
const SUPPORT_PHONE = "+91 88812 56324";

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

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Cancellation and Refund Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Applies to paid subscriptions to the BeatMitra platform.
          </p>
        </header>

        <Section title="1. What you are paying for">
          <p>
            BeatMitra is a software-as-a-service (SaaS) subscription. Distributors
            pay a recurring fee — billed monthly or annually, depending on the
            plan chosen — for continued access to the platform and its features.
            No physical goods are sold or shipped as part of the subscription.
          </p>
        </Section>

        <Section title="2. Cancelling your subscription">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              You may cancel your subscription at any time from the{" "}
              <strong>Billing</strong> section of your account, or by emailing{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </li>
            <li>
              When you cancel, your plan stays active until the end of the
              billing period you have already paid for. You keep full access
              until that date — cancellation stops the next renewal, it does not
              cut off access immediately.
            </li>
            <li>
              No further charges are made after cancellation. Any UPI Autopay or
              card mandate set up for automatic renewal is cancelled at the same
              time.
            </li>
          </ul>
        </Section>

        <Section title="3. Refunds">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Subscription fees are charged in advance for the full billing
              period and are <strong>non-refundable</strong> once the period has
              begun. Cancelling part-way through a period does not entitle you to
              a pro-rated refund of the remaining days.
            </li>
            <li>
              If you were charged in error — for example, a duplicate charge or a
              charge after a confirmed cancellation — contact us within{" "}
              <strong>7 days</strong> of the charge and we will refund the
              incorrect amount in full.
            </li>
            <li>
              Approved refunds are returned to the original payment method.
              Once initiated, the refund typically reaches your account within
              5–7 working days, depending on your bank or UPI provider.
            </li>
          </ul>
        </Section>

        <Section title="4. Free trials">
          <p>
            Where a free trial is offered, you will not be charged during the
            trial. If you do not cancel before the trial ends, the subscription
            converts to a paid plan and the section above applies from the first
            paid charge.
          </p>
        </Section>

        <Section title="5. How to request a cancellation or refund">
          <p>
            Email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            or call {SUPPORT_PHONE} with your account email and the charge in
            question. We respond to all cancellation and refund requests within
            3 working days.
          </p>
        </Section>

        <Section title="6. Related policies">
          <p>
            This policy should be read together with our{" "}
            <Link
              href="/terms"
              className="text-primary underline underline-offset-4"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </Section>
      </main>
    </div>
  );
}
