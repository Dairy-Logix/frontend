"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useCreateUser, useTenants } from "@/lib/hooks";

import type { UserRole, UserStatus } from "@/lib/types";
import { useTranslations } from "@/components/providers/intl-provider";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  tenantSlug: string;
}

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "tenant_admin",
  status: "active",
  tenantId: "",
  tenantSlug: "",
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

export default function CreateUserPage() {
  const tPage = useTranslations("pages.adminUserCreate");
  const router = useRouter();
  const createUser = useCreateUser();
  const [form, setForm] = useState<FormState>(initialState);

  // Fetch tenants for dropdown
  const { data: tenantsData } = useTenants({ page: 1, limit: 100 });
  const tenants = tenantsData?.data || [];

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleTenantChange = useCallback((tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    setForm((prev) => ({
      ...prev,
      tenantId,
      tenantSlug: tenant?.slug || "",
    }));
  }, [tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      return;
    }

    // Validate tenant for non-super-admin roles
    if (form.role !== "super_admin" && !form.tenantId) {
      return;
    }

    // Prepare user data
    const userData: any = {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
      role: form.role,
      status: form.status,
    };

    // Add password if provided, otherwise backend sends invitation email
    if (form.password) {
      userData.password = form.password;
    }

    // Add tenant info for non-super-admin roles
    if (form.role !== "super_admin") {
      userData.tenantId = form.tenantId;
      userData.tenantSlug = form.tenantSlug;
    }

    createUser.mutate(userData, {
      onSuccess: () => {
        router.push("/admin/users");
      },
    });
  };

  const requiresTenant = form.role !== "super_admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New User"
        description="Add a new user to the system"
        action={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the user's personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Role & Access</CardTitle>
                <CardDescription>
                  Configure user role and tenant assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={form.role}
                      onValueChange={(value) => updateField("role", value as UserRole)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {requiresTenant && (
                    <div className="space-y-2">
                      <Label htmlFor="tenant">Tenant *</Label>
                      <Select
                        value={form.tenantId}
                        onValueChange={handleTenantChange}
                      >
                        <SelectTrigger id="tenant">
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.companyName || tenant.name} ({tenant.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => updateField("status", value as UserStatus)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Password (Optional)</CardTitle>
                <CardDescription>
                  Leave blank to send an invitation email with setup link
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Leave blank for invitation email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex justify-end gap-3"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUser.isPending}
            >
              {createUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
