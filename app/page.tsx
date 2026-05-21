"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Truck,
  Store,
  CreditCard,
  BarChart3,
  Users,
  Boxes,
  Milk,
  CupSoda,
  ShoppingBasket,
  Cookie,
  Snowflake,
  Apple,
  Wheat,
  Pill,
  Sparkles,
  Cpu,
  Hammer,
  Shirt,
  Footprints,
  Wrench,
  Factory,
  Warehouse,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-animated opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--gradient-primary-start)_0%,_transparent_50%)] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_var(--gradient-secondary-start)_0%,_transparent_50%)] opacity-20 pointer-events-none" />

      <MarketingHeader />

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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 -m-8 rounded-full bg-gradient-primary opacity-20 blur-3xl pointer-events-none" />
                <Image
                  src="/Full_log-transparent.png"
                  alt="BeatMitra"
                  width={240}
                  height={240}
                  priority
                  className="relative h-36 w-36 sm:h-44 sm:w-44 object-contain"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block"
            >
              <div className="glass-subtle rounded-full px-4 py-2 border inline-flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Multi-Tenant Distribution Management Platform
                </span>
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Run Your Distribution{" "}
              <span className="text-gradient-primary">Business</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect warehouses, distributors, field staff, and retailers on
              one platform. Streamline orders, deliveries, invoicing, and
              payment collection — across any product category.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-primary hover-glow-primary shine">
                  Start 10-day Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="glass-subtle">
                  See Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              No card needed. Try the demo:{" "}
              <span className="font-mono">demo@beatmitra.com / Demo@123</span>
            </p>
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
              Everything Your Distribution Business Needs
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

      {/* Industries Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for every distribution business
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whatever you distribute, BeatMitra adapts. No category-specific
              lock-in — the same platform powers dairy, FMCG, pharma, hardware,
              and many more.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {industries.map((industry, index) => (
              <motion.div
                key={industry.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * index, duration: 0.4 }}
                whileHover={{ y: -3 }}
                className="glass-subtle rounded-lg p-4 flex items-center gap-3 border"
              >
                <div className="h-9 w-9 rounded-md bg-gradient-primary flex items-center justify-center shrink-0">
                  <industry.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium truncate">{industry.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass gradient-border rounded-2xl p-10 md:p-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Sign up in two minutes. 10-day free trial on every plan, no card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-primary hover-glow-primary shine">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="glass-subtle">
                  Compare Plans
                </Button>
              </Link>
            </div>
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

const industries = [
  { label: "Dairy & Milk", icon: Milk },
  { label: "Beverages", icon: CupSoda },
  { label: "Food & Grocery", icon: ShoppingBasket },
  { label: "FMCG", icon: Boxes },
  { label: "Bakery", icon: Cookie },
  { label: "Frozen Foods", icon: Snowflake },
  { label: "Fruits & Veggies", icon: Apple },
  { label: "Agriculture", icon: Wheat },
  { label: "Pharma & Medical", icon: Pill },
  { label: "Personal Care", icon: Sparkles },
  { label: "Electronics", icon: Cpu },
  { label: "Hardware", icon: Hammer },
  { label: "Textiles & Apparel", icon: Shirt },
  { label: "Footwear", icon: Footprints },
  { label: "Auto Parts", icon: Wrench },
  { label: "Industrial Goods", icon: Factory },
  { label: "Wholesale", icon: Warehouse },
  { label: "Restaurants", icon: Utensils },
];
