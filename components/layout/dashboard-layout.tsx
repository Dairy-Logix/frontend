"use client";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto relative">
          {/* Animated Background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(14, 165, 233, 0.12) 0%, transparent 50%)",
                  "radial-gradient(circle at 50% 80%, rgba(154, 247, 100, 0.12) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)",
                ],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 80% 20%, rgba(96, 165, 250, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 80%, rgba(154, 247, 100, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 80%, rgba(125, 211, 252, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 20%, rgba(96, 165, 250, 0.1) 0%, transparent 50%)",
                ],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 50% 50%, rgba(147, 197, 253, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 30% 70%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 70% 30%, rgba(154, 247, 100, 0.08) 0%, transparent 50%)",
                  "radial-gradient(circle at 50% 50%, rgba(147, 197, 253, 0.08) 0%, transparent 50%)",
                ],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
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
