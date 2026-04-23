"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { useTenant } from "@/lib/hooks";

interface TenantLayoutProps {
  children: React.ReactNode;
}

function TenantBrandingLoader() {
  const tenantId = useAuthStore((s) => s.getTenantId()) ?? '';
  const { data: tenantData } = useTenant(tenantId);
  const setTenant = useTenantStore((s) => s.setTenant);

  useEffect(() => {
    if (!tenantData) return;
    const t = tenantData as any;
    setTenant({
      id: t._id || t.id || '',
      name: t.companyName || t.name || '',
      slug: t.slug || '',
      contactPerson: t.ownerName || t.contactPerson || '',
      email: t.ownerEmail || t.email || '',
      phone: t.ownerPhone || t.phone || '',
      logo: t.logo || undefined,
      status: t.status,
      plan: t.subscriptionPlan || t.plan,
      config: t.config,
      agencyCount: t.agencyCount || 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    });

    // Update browser favicon when tenant logo is available
    if (t.logo) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = t.logo;
    }
  }, [tenantData, setTenant]);

  return null;
}

export function TenantLayout({ children }: TenantLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <TenantBrandingLoader />
      <TenantSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto relative">
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(14, 165, 233, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto p-4 md:p-6 lg:p-8 relative z-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
