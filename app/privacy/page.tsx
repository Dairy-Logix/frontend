import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | BeatMitra",
  description:
    "How BeatMitra collects, uses, and protects your data across the BeatMitra Store and BeatMitra Field mobile apps.",
};

const LAST_UPDATED = "1 June 2026";
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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Applies to <strong>BeatMitra Store</strong> (com.beatmitra.store)
            and <strong>BeatMitra Field</strong> (com.beatmitra.field).
          </p>
        </header>

        <Section title="Who we are">
          <p>
            BeatMitra is a distribution-management platform for dairy
            distributors and their store network. The BeatMitra mobile apps
            connect store owners and field staff to their distributor&rsquo;s
            BeatMitra account.
          </p>
          <p>
            Contact:{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            · {SUPPORT_PHONE}
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Account information:</strong> your name, email address,
              phone number, and the distributor you belong to. This is provided
              by your distributor when they create your account; we do not
              collect it from you directly.
            </li>
            <li>
              <strong>Authentication tokens:</strong> stored in your
              device&rsquo;s secure storage so you stay signed in. Never
              transmitted to third parties.
            </li>
            <li>
              <strong>Push-notification token:</strong> a device-specific
              identifier used to send you order, invoice, and delivery
              notifications.
            </li>
            <li>
              <strong>App diagnostics:</strong> anonymous crash reports and
              basic performance metrics with no personally identifying content.
            </li>
          </ul>
        </Section>

        <Section title="Additional data — BeatMitra Field only">
          <p>
            The Field app, used by delivery and collection staff, also
            collects the following while you are on duty. The Store app does{" "}
            <strong>not</strong> request any of these.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Location (approximate &amp; precise):</strong> used to
              route deliveries and geo-stamp on-site payment collections. It is
              tied to your work activity and is not tracked in the background
              when the app is closed.
            </li>
            <li>
              <strong>Camera:</strong> used to photograph cheques at the point
              of payment collection. Images are attached to the related payment
              record and sent to your distributor.
            </li>
          </ul>
        </Section>

        <Section title="What we do NOT collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              The Store app does not access your location, camera, microphone,
              photos, or contacts.
            </li>
            <li>
              We do not sell, rent, or share your personal information with any
              third party for advertising or marketing.
            </li>
          </ul>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              To deliver the core service — orders, deliveries, invoices, and
              payment collection — between you and your distributor.
            </li>
            <li>To send you in-app notifications about your account activity.</li>
            <li>To diagnose crashes and improve the app.</li>
          </ul>
        </Section>

        <Section title="Who we share it with">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Your distributor:</strong> as the operator of the
              BeatMitra account you belong to, they can see your order history,
              invoices, payment status, and (for Field staff) the location and
              cheque images attached to your work.
            </li>
            <li>
              <strong>Google Firebase:</strong> we use Firebase Cloud Messaging
              for push notifications. Your push token is shared with Google in
              transit. See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                Google&rsquo;s privacy policy
              </a>
              .
            </li>
            <li>No one else.</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Data export:</strong> email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              to request a copy of your personal data in machine-readable form.
              We respond within 30 days.
            </li>
            <li>
              <strong>Data deletion:</strong> email the same address to request
              deletion of your account and associated data. We delete within 30
              days, except for transaction records we are legally required to
              retain (e.g. tax invoices, retained for 7 years per Indian GST
              rules).
            </li>
            <li>
              <strong>Withdraw consent:</strong> log out and uninstall the app.
              We then delete your push-notification token; other data is
              retained per the rule above until you explicitly request deletion.
            </li>
          </ul>
        </Section>

        <Section title="Security">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Authentication tokens are stored in your device&rsquo;s secure
              storage (iOS Keychain, Android Keystore).
            </li>
            <li>All network traffic is encrypted over HTTPS / TLS 1.2+.</li>
            <li>
              Our servers are hosted in India on infrastructure compliant with
              applicable data-protection laws.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p>
            BeatMitra is a business tool and is not intended for use by children
            under 13. We do not knowingly collect data from anyone under 13.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy as the app evolves. Material changes will
            be announced in-app at least 30 days before they take effect.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Email us at{" "}
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
