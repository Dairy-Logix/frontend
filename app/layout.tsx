import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { IntlProvider } from "@/components/providers/intl-provider";
import { TenantProvider } from "@/components/providers/tenant-provider";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dairy Logix | Multi-Tenant Dairy Management System",
  description: "Comprehensive dairy management platform with multi-tenant architecture for dairy product distribution management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const context = (headersList.get("x-tenant-context") as "super_admin" | "tenant" | "marketing") || "marketing";
  const slug = headersList.get("x-tenant-slug") || null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <QueryProvider>
            <TenantProvider context={context} slug={slug}>
              <IntlProvider>
                {children}
                <Toaster />
              </IntlProvider>
            </TenantProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
