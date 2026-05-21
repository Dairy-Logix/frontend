"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePublicPlans, useSubmitSignup } from "@/lib/hooks/use-signup";
import { MarketingHeader } from "@/components/layout/marketing-header";

const BUSINESS_TYPES = [
  "Dairy & Milk Products",
  "Beverages",
  "Food & Grocery",
  "FMCG / Consumer Goods",
  "Bakery & Confectionery",
  "Frozen Foods",
  "Meat & Poultry",
  "Fruits & Vegetables",
  "Agriculture & Farm Produce",
  "Pharmaceutical & Medical",
  "Cosmetics & Personal Care",
  "Stationery & Office Supplies",
  "Electronics & Appliances",
  "Hardware & Building Materials",
  "Textiles & Apparel",
  "Footwear & Accessories",
  "Auto Parts & Spares",
  "Industrial Goods",
  "Wholesale Distribution",
  "Retail Chain",
  "E-commerce / Online Retail",
  "Logistics & Transportation",
  "Restaurant / Hospitality",
  "Other",
] as const;

type Step = 1 | 2 | 3 | 4;

interface FormState {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  planSlug: "basic" | "standard" | "premium";
}

const initialForm: FormState = {
  companyName: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  businessType: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstNumber: "",
  planSlug: "standard",
};

const steps = [
  { id: 1, label: "Business" },
  { id: 2, label: "Plan" },
  { id: 3, label: "Review" },
];

const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { data: plans, isLoading: loadingPlans } = usePublicPlans();
  const submit = useSubmitSignup();

  const setField = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep1 = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.companyName.trim()) e.companyName = "Required";
    if (!form.ownerName.trim()) e.ownerName = "Required";
    if (!form.ownerEmail.trim()) e.ownerEmail = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.ownerEmail.trim()))
      e.ownerEmail = "Invalid email";
    if (!form.ownerPhone.trim()) e.ownerPhone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleSubmit = () => {
    submit.mutate(
      {
        companyName: form.companyName.trim(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        ownerPhone: form.ownerPhone.trim(),
        businessType: form.businessType.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        planSlug: form.planSlug,
      },
      { onSuccess: () => setStep(4) },
    );
  };

  const selectedPlan = plans?.find((p) => p.slug === form.planSlug);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-animated opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--gradient-primary-start)_0%,_transparent_50%)] opacity-20 pointer-events-none" />

      <MarketingHeader />

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="glass gradient-border">
          <CardHeader className="space-y-4 text-center">
            <Image
              src="/logo-transparent.png"
              alt="BeatMitra"
              width={64}
              height={64}
              priority
              className="mx-auto h-16 w-16 object-contain"
            />
            <div>
              <CardTitle className="text-2xl font-bold">
                {step === 4 ? "Check your email" : "Create your account"}
              </CardTitle>
              <CardDescription>
                {step === 4
                  ? "We've sent a verification link to start your trial"
                  : "Start your 10-day free trial"}
              </CardDescription>
            </div>

            {step !== 4 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                {steps.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold",
                        step >= s.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {step > s.id ? <Check className="h-3 w-3" /> : s.id}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        step >= s.id ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company Name *" error={errors.companyName}>
                    <Input
                      value={form.companyName}
                      onChange={(e) => setField("companyName", e.target.value)}
                      placeholder="Amul Distributors"
                    />
                  </Field>
                  <Field label="Business Type" error={errors.businessType}>
                    <Select
                      value={form.businessType}
                      onValueChange={(value) => setField("businessType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Owner Name *" error={errors.ownerName}>
                    <Input
                      value={form.ownerName}
                      onChange={(e) => setField("ownerName", e.target.value)}
                      placeholder="Rajesh Patel"
                    />
                  </Field>
                  <Field label="Phone *" error={errors.ownerPhone}>
                    <Input
                      value={form.ownerPhone}
                      onChange={(e) => setField("ownerPhone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </Field>
                </div>
                <Field label="Email *" error={errors.ownerEmail}>
                  <Input
                    type="email"
                    value={form.ownerEmail}
                    onChange={(e) => setField("ownerEmail", e.target.value)}
                    placeholder="rajesh@example.com"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Address">
                    <Input
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                    />
                  </Field>
                  <Field label="GST Number">
                    <Input
                      value={form.gstNumber}
                      onChange={(e) => setField("gstNumber", e.target.value)}
                      placeholder="24ABCDE1234F1Z5"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City">
                    <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
                  </Field>
                  <Field label="State">
                    <Input
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value)}
                    />
                  </Field>
                  <Field label="Pincode">
                    <Input
                      value={form.pincode}
                      onChange={(e) => setField("pincode", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {loadingPlans ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  plans?.map((plan) => {
                    const selected = form.planSlug === plan.slug;
                    return (
                      <button
                        key={plan.slug}
                        type="button"
                        onClick={() => setField("planSlug", plan.slug)}
                        className={cn(
                          "w-full text-left rounded-lg border p-4 transition-colors cursor-pointer",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{plan.label}</h4>
                              {selected && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {plan.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold">
                              {formatPrice(plan.priceInPaise)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              /{plan.billingPeriod === "monthly" ? "mo" : "yr"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          {plan.trialDays}-day free trial · GST inclusive
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {step === 3 && selectedPlan && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Company</span>
                    <span className="text-sm font-medium">{form.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Owner</span>
                    <span className="text-sm font-medium">{form.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{form.ownerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="text-sm font-medium">{form.ownerPhone}</span>
                  </div>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">{selectedPlan.label} plan</span>
                    <span className="text-base font-bold">
                      {formatPrice(selectedPlan.priceInPaise)}/mo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    First {selectedPlan.trialDays} days free. After that, you'll be asked to pay
                    via UPI Autopay, card, or netbanking.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  We'll send a verification link to <b>{form.ownerEmail}</b>. Click it to start
                  your trial.
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm">
                    We've sent a verification link to:
                  </p>
                  <p className="font-mono font-medium">{form.ownerEmail}</p>
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click the link in your email to verify your address and start your{" "}
                  {selectedPlan?.label} trial. The link expires in 48 hours.
                </p>
                <p className="text-xs text-muted-foreground">
                  Didn't get it?{" "}
                  <button
                    onClick={handleSubmit}
                    className="underline hover:text-foreground"
                    disabled={submit.isPending}
                  >
                    Resend email
                  </button>
                </p>
              </div>
            )}

            {step !== 4 && (
              <div className="flex items-center justify-between pt-4 border-t">
                {step > 1 ? (
                  <Button variant="ghost" onClick={handleBack} disabled={submit.isPending}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Already have an account? Log in
                  </Link>
                )}
                {step < 3 && (
                  <Button onClick={handleNext}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                {step === 3 && (
                  <Button onClick={handleSubmit} disabled={submit.isPending}>
                    {submit.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Send verification email
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
