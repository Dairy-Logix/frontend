"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { useCreateTenant } from "@/lib/hooks";

import type { SubscriptionPlan } from "@/lib/types";
import { useTranslations } from "@/components/providers/intl-provider";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FormState {
  name: string;
  slug: string;
  contactPerson: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  plan: SubscriptionPlan;
  gpsTracking: boolean;
  pushNotifications: boolean;
}

const initialState: FormState = {
  name: "",
  slug: "",
  contactPerson: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  plan: "basic",
  gpsTracking: false,
  pushNotifications: false,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function CreateTenantPage() {
  const tPage = useTranslations("pages.adminTenantCreate");
  const router = useRouter();
  const createTenant = useCreateTenant();
  const [form, setForm] = useState<FormState>(initialState);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "name" && !slugManuallyEdited) {
          next.slug = slugify(value as string);
        }
        return next;
      });
    },
    [slugManuallyEdited]
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug: slugify(value) }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.contactPerson.trim() || !form.email.trim()) {
      return;
    }

    // Map form fields to backend DTO
    const tenantData = {
      companyName: form.name,
      slug: form.slug,
      ownerName: form.contactPerson,
      ownerEmail: form.email,
      ownerPhone: form.phone || "+91 0000000000",
      address: form.addressLine1,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      subscriptionPlan: form.plan,
      // Limits are automatically set by backend based on subscription plan
      features: [
        ...(form.gpsTracking ? ['gpsTracking'] : []),
        ...(form.pushNotifications ? ['pushNotifications'] : []),
      ],
    };

    createTenant.mutate(tenantData, {
      onSuccess: () => {
        router.push("/admin/tenants");
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Tenant"
        description="Register a new tenant organization on the platform."
        action={
          <Button variant="outline" asChild>
            <Link href="/admin/tenants">
              <ArrowLeft className="h-4 w-4" />
              Back to Tenants
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Business Information */}
          <motion.div variants={itemVariants}>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Basic details about the tenant organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Shree Krishna Dairy"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="auto-generated-slug"
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from name. Edit to customize.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Details */}
          <motion.div variants={itemVariants}>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
                <CardDescription>
                  Primary contact person for this tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="Full name"
                    value={form.contactPerson}
                    onChange={(e) => updateField("contactPerson", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Address */}
          <motion.div variants={itemVariants}>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>
                  Business address for the tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addressLine1">Street Address</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Street address, building, etc."
                    value={form.addressLine1}
                    onChange={(e) => updateField("addressLine1", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Landmark, area (optional)"
                    value={form.addressLine2}
                    onChange={(e) => updateField("addressLine2", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="000000"
                    value={form.pincode}
                    onChange={(e) => updateField("pincode", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Plan */}
          <motion.div variants={itemVariants}>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>
                  Choose the subscription tier for this tenant. Limits are automatically set based on the plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={form.plan}
                    onValueChange={(val) => updateField("plan", val as SubscriptionPlan)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic — ₹399/mo</SelectItem>
                      <SelectItem value="standard">Standard — ₹599/mo</SelectItem>
                      <SelectItem value="premium">Premium — ₹899/mo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manual creation skips Razorpay. Customers normally sign up via{" "}
                  <code>/signup</code> with a 10-day trial.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Toggles */}
          <motion.div variants={itemVariants}>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>
                  Enable or disable features for this tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="gpsTracking">GPS Tracking</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable real-time GPS tracking for delivery employees.
                    </p>
                  </div>
                  <Switch
                    id="gpsTracking"
                    checked={form.gpsTracking}
                    onCheckedChange={(val) => updateField("gpsTracking", val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable push notifications for mobile app users.
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={form.pushNotifications}
                    onCheckedChange={(val) => updateField("pushNotifications", val)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit */}
          <motion.div variants={itemVariants} className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/tenants">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createTenant.isPending}>
              {createTenant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {createTenant.isPending ? "Creating..." : "Create Tenant"}
            </Button>
          </motion.div>
        </motion.div>
      </form>
    </div>
  );
}
