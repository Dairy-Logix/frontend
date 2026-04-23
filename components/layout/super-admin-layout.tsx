"use client";

import { Navbar } from "@/components/layout/navbar";
import { SuperAdminSidebar } from "@/components/layout/super-admin-sidebar";
import { motion } from "framer-motion";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto relative">
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(249, 115, 22, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 50% 80%, rgba(234, 179, 8, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.08) 0%, transparent 50%)",
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
