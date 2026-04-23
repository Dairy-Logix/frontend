"use client";

import Link from "next/link";
import { ArrowRight, Truck, Store, CreditCard, BarChart3, Users, Milk } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-animated opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--gradient-primary-start)_0%,_transparent_50%)] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_var(--gradient-secondary-start)_0%,_transparent_50%)] opacity-20 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 glass border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Milk className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient-primary">
                Dairy Logix
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-primary hover-glow-primary">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block"
            >
              <div className="glass-subtle rounded-full px-4 py-2 border inline-flex items-center gap-2">
                <Milk className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Multi-Tenant Dairy Distribution Platform
                </span>
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Manage Your Dairy{" "}
              <span className="text-gradient-primary">Distribution</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect factories, distributors, employees, and stores on one
              platform. Streamline orders, deliveries, invoicing, and payment
              collection for your dairy business.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-primary hover-glow-primary shine">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="glass-subtle">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20"
          >
            <div className="glass gradient-border rounded-2xl p-2">
              <div className="bg-card rounded-xl p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Store className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-2xl font-bold">1000+</span>
                    <span className="text-sm text-muted-foreground">Stores</span>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-xl bg-gradient-secondary flex items-center justify-center">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-2xl font-bold">500+</span>
                    <span className="text-sm text-muted-foreground">Daily Deliveries</span>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-xl bg-gradient-accent flex items-center justify-center">
                      <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-2xl font-bold">99%</span>
                    <span className="text-sm text-muted-foreground">Collection Rate</span>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center pulse-glow">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-2xl font-bold">50+</span>
                    <span className="text-sm text-muted-foreground">Distributors</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Your Dairy Business Needs
            </h2>
            <p className="text-lg text-muted-foreground">
              From order management to payment collection, all in one place
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="glass rounded-xl p-6 hover-glow-primary"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: "Order Management",
    description: "Collect orders from stores, aggregate for factory ordering, and track status in real-time.",
    icon: Store,
  },
  {
    title: "Delivery Tracking",
    description: "Plan delivery routes, track with GPS, and confirm deliveries with photo proof.",
    icon: Truck,
  },
  {
    title: "Payment Collection",
    description: "Record online and offline payments, generate receipts, and track outstanding balances.",
    icon: CreditCard,
  },
  {
    title: "Employee Management",
    description: "Assign stores to collection agents, track performance, and manage field operations.",
    icon: Users,
  },
  {
    title: "Invoicing",
    description: "Auto-generate invoices per delivery, download PDFs, and share via WhatsApp.",
    icon: BarChart3,
  },
  {
    title: "Reports & Analytics",
    description: "Sales, collection, delivery, and financial reports with PDF and Excel export.",
    icon: BarChart3,
  },
];
