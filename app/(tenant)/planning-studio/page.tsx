"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, ArrowRight, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/components/providers/intl-provider";

const calculators = [
  {
    href: "/planning-studio/agency-formula",
    name: "Order Final Calculator",
    description:
      "For each product ordered today, decide which of two agencies fulfills it. Assign the full quantity to one agency with a click, or type a manual split — the other agency gets the remainder.",
    icon: Building2,
    available: true,
  },
];

export default function PlanningStudioHubPage() {
  const tPage = useTranslations("pages.planningStudio");
  return (
    <div className="space-y-6">
      <PageHeader
        title={tPage("title")}
        description={tPage("description")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {calculators.map((calc, idx) => {
          const Icon = calc.icon;
          const card = (
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{calc.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {calc.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );

          return (
            <motion.div
              key={calc.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              {calc.available ? (
                <Link href={calc.href}>{card}</Link>
              ) : (
                <div className="opacity-60 pointer-events-none">{card}</div>
              )}
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-full border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground h-full min-h-[160px]">
              <Sparkles className="h-6 w-6 mb-2" />
              <p className="text-sm font-medium">More calculators coming soon</p>
              <p className="text-xs mt-1">
                Suggest one and we&apos;ll add it here.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
