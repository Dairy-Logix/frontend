import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | BeatMitra",
  description:
    "Get in touch with the BeatMitra team for support, billing, or general enquiries.",
};

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

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We&rsquo;re here to help with support, billing, and general
            enquiries.
          </p>
        </header>

        <Section title="Email">
          <p>
            For all support, billing, and account questions, email us at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>
            . We aim to respond within 1 working day.
          </p>
        </Section>

        <Section title="Phone">
          <p>
            Call or message us at{" "}
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="text-primary underline underline-offset-4"
            >
              {SUPPORT_PHONE}
            </a>{" "}
            during business hours, Monday to Saturday, 9:00 AM – 7:00 PM IST.
          </p>
        </Section>

        <Section title="Business hours">
          <p>
            Monday – Saturday: 9:00 AM – 7:00 PM IST
            <br />
            Sunday and public holidays: closed (email enquiries are answered the
            next working day).
          </p>
        </Section>
      </main>
    </div>
  );
}
