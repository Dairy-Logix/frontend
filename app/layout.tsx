import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { IntlProvider } from "@/components/providers/intl-provider";
import { TenantProvider } from "@/components/providers/tenant-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeatMitra | Multi-Tenant Dairy Management System",
  description: "Comprehensive dairy management platform with multi-tenant architecture for dairy product distribution management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <QueryProvider>
            <TenantProvider>
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
