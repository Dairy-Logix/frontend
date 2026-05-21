"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicPlans } from "@/lib/hooks/use-signup";
import { cn } from "@/lib/utils";
import { MarketingHeader } from "@/components/layout/marketing-header";

const featureLabels: Record<string, string> = {
  employees: "Employee management",
  deliveries: "Delivery tracking",
  gpsTracking: "GPS tracking",
  photoProofDelivery: "Photo proof of delivery",
  bulkImport: "Bulk import (CSV)",
  advancedAnalytics: "Advanced analytics",
  pushNotifications: "Store mobile push notifications",
  appNotifications: "In-app notifications",
  storeMobileApp: "Store mobile application",
  printTemplates: "Print templates",
};

const CORE_FEATURES = [
  "Order management",
  "Product management",
  "Store management",
];

const limitLabels: Record<string, string> = {
  maxAgencies: "Agencies",
  maxShopkeepers: "Stores",
  maxProducts: "Products",
  maxUsers: "Employees",
  maxOrdersPerMonth: "Orders/month",
};

const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const formatLimit = (n: number) =>
  n >= 999 ? "Unlimited" : n.toLocaleString("en-IN");

export default function PricingPage() {
  const { data: plans, isLoading } = usePublicPlans();
  const sortedPlans = (plans || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const middleSlug = sortedPlans[1]?.slug;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-animated opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--gradient-primary-start)_0%,_transparent_50%)] opacity-20 pointer-events-none" />

      <MarketingHeader />

      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick a plan, start a 10-day free trial. No card needed up front. Cancel anytime.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-6 md:grid-cols-3"
          >
            {sortedPlans.map((plan) => {
              const recommended = plan.slug === middleSlug;
              const enabledFeatures = Object.entries(plan.features).filter(
                ([, v]) => v,
              );
              return (
                <div
                  key={plan.slug}
                  className={cn(
                    "relative rounded-2xl border p-6 flex flex-col bg-card glass",
                    recommended ? "border-primary shadow-xl" : "border-border",
                  )}
                >
                  {recommended && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most popular
                    </Badge>
                  )}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold">{plan.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1 min-h-[3em]">
                      {plan.description}
                    </p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {formatPrice(plan.priceInPaise)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      GST inclusive · {plan.trialDays}-day trial
                    </p>
                  </div>
                  <Button asChild size="lg" className="mb-6 w-full" variant={recommended ? "default" : "outline"}>
                    <Link href={`/signup?plan=${plan.slug}`}>
                      Start free trial
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <div className="space-y-2 flex-1">
                    <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">
                      Includes
                    </p>
                    {CORE_FEATURES.map((label) => (
                      <div key={label} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{label}</span>
                      </div>
                    ))}
                    {enabledFeatures.map(([key]) => (
                      <div key={key} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{featureLabels[key] || key}</span>
                      </div>
                    ))}
                    <div className="pt-3 mt-3 border-t border-border space-y-1">
                      <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wide mb-2">
                        Limits
                      </p>
                      {Object.entries(plan.limits).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {limitLabels[k] || k}
                          </span>
                          <span className="font-medium">{formatLimit(v as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12 space-y-3"
        >
          <p className="text-sm text-muted-foreground">
            Want to try before signing up? Use our public demo:
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-mono">
            demo@beatmitra.com / Demo@123
          </div>
          <div>
            <Button asChild variant="link">
              <Link href="/auth/login">Already have an account? Sign in</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
