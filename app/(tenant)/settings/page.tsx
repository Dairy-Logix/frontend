"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Globe,
  FileText,
  ToggleLeft,
  Upload,
  Smartphone,
  BarChart3,
  Bell,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useSettings, useUpdateSettings, useTenant, useUpdateTenant } from "@/lib/hooks";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getLogoUrl } from "@/lib/utils";

// --- Profile Data Types ---

interface ProfileData {
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

// --- Feature Metadata ---

interface FeatureMeta {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const featureList: FeatureMeta[] = [
  {
    key: "advancedAnalytics",
    label: "Advanced Analytics",
    description:
      "Access detailed analytics dashboards with sales trends, product performance, and revenue forecasting.",
    icon: BarChart3,
  },
  {
    key: "pushNotifications",
    label: "Push Notifications",
    description:
      "Enable browser and mobile push notifications for real-time alerts on orders, deliveries, and payments.",
    icon: Smartphone,
  },
  {
    key: "appNotifications",
    label: "App Notifications",
    description:
      "Show the notification bell in the header so admins receive in-app alerts for orders, deliveries, payments, and other important events.",
    icon: Bell,
  },
];

// --- Main Page ---

export default function SettingsPage() {
  // Fetch settings from backend
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  // Fetch tenant profile
  const tenantId = useAuthStore((s) => s.getTenantId()) ?? '';
  const { data: tenantData, isLoading: isLoadingTenant } = useTenant(tenantId);
  const updateTenant = useUpdateTenant();

  // Local state for form fields
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currencyFormat, setCurrencyFormat] = useState("INR");

  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [invoiceNumberFormat, setInvoiceNumberFormat] = useState("YYYY-NNNN");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const [features, setFeatures] = useState<Record<string, boolean>>({
    advancedAnalytics: false,
    pushNotifications: false,
    appNotifications: false,
  });

  const [profile, setProfile] = useState<ProfileData>({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);


  // Sync tenant profile data into form
  useEffect(() => {
    if (tenantData) {
      const t = tenantData as any;
      setProfile({
        businessName: t.companyName || t.name || "",
        contactPerson: t.ownerName || t.contactPerson || "",
        email: t.ownerEmail || t.email || "",
        phone: t.ownerPhone || t.phone || "",
        addressLine1: t.address || "",
        addressLine2: "",
        city: t.city || "",
        state: t.state || "",
        pincode: t.pincode || "",
      });
      if (t.logo) setLogoUrl(t.logo);
    }
  }, [tenantData]);

  // Sync backend settings to local state
  useEffect(() => {
    if (settings) {
      // Preferences
      if (settings.config.defaultLanguage) {
        setDefaultLanguage(settings.config.defaultLanguage);
      }
      if (settings.config.timezone) {
        setTimezone(settings.config.timezone);
      }
      if (settings.config.currencyFormat) {
        setCurrencyFormat(settings.config.currencyFormat);
      }

      // Invoice settings
      if (settings.config.invoiceSettings) {
        setInvoicePrefix(settings.config.invoiceSettings.invoicePrefix || "INV");
        setInvoiceNumberFormat(settings.config.invoiceSettings.invoiceNumberFormat || "YYYY-NNNN");
        setTermsAndConditions(settings.config.invoiceSettings.termsAndConditions || "");
      }

      // Features
      if (settings.config.features) {
        setFeatures({
          advancedAnalytics: settings.config.features.advancedAnalytics ?? false,
          pushNotifications: settings.config.features.pushNotifications ?? false,
          appNotifications: settings.config.features.appNotifications ?? false,
        });
      }
    }
  }, [settings]);

  // --- Profile handlers ---
  function updateProfile(field: keyof ProfileData, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    if (!file.type.match(/^image\/(jpeg|jpg|png|svg\+xml)$/)) {
      setLogoError("Only JPEG, PNG, or SVG images are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("File must be under 2MB.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleClearLogoFile() {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function resizeAndEncodeImage(file: File, maxPx = 128): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width >= height) {
            height = Math.round((height * maxPx) / width);
            width = maxPx;
          } else {
            width = Math.round((width * maxPx) / height);
            height = maxPx;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        // Use JPEG at 80% quality — much smaller than PNG for photos/complex logos
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  }

  async function handleSaveProfile() {
    if (!tenantId) return;
    setLogoError(null);

    let logoBase64: string | undefined;
    if (logoFile) {
      setIsUploadingLogo(true);
      try {
        logoBase64 = await resizeAndEncodeImage(logoFile);
      } catch {
        setLogoError("Failed to process logo image.");
        setIsUploadingLogo(false);
        return;
      }
      setIsUploadingLogo(false);
    }

    updateTenant.mutate({
      id: tenantId,
      input: {
        companyName: profile.businessName,
        ownerName: profile.contactPerson,
        ownerEmail: profile.email,
        ownerPhone: profile.phone,
        address: profile.addressLine1,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        ...(logoBase64 ? { logo: logoBase64 } : {}),
      } as any,
    }, {
      onSuccess: () => {
        if (logoBase64) {
          setLogoUrl(logoBase64);
          setLogoFile(null);
          setLogoPreview(null);
          if (logoInputRef.current) logoInputRef.current.value = "";
        }
      },
    });
  }

  // --- Preferences handlers ---
  function handleSavePreferences() {
    updateSettings.mutate({
      defaultLanguage: defaultLanguage as "en" | "hi" | "gu",
      timezone,
      currencyFormat,
    });
  }

  // --- Invoice handlers ---
  function handleSaveInvoice() {
    updateSettings.mutate({
      invoiceSettings: {
        invoicePrefix,
        invoiceNumberFormat,
        termsAndConditions,
      },
    });
  }

  // --- Features handlers ---
  function toggleFeature(key: string) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSaveFeatures() {
    updateSettings.mutate({
      features: {
        advancedAnalytics: features.advancedAnalytics,
        pushNotifications: features.pushNotifications,
        appNotifications: features.appNotifications,
      },
    });
  }

  // --- Loading State ---
  if (isLoading || isLoadingTenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your tenant configuration and preferences"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load settings. {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your tenant configuration and preferences"
      />

      <Tabs defaultValue="profile">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="profile">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="invoice">
            <FileText className="h-4 w-4" />
            Invoice
          </TabsTrigger>
          <TabsTrigger value="features">
            <ToggleLeft className="h-4 w-4" />
            Features
          </TabsTrigger>
        </TabsList>

        {/* ===================== PROFILE TAB ===================== */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl p-6 mt-4 space-y-6"
          >
            {/* Business Info */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    placeholder="Your business name"
                    value={profile.businessName}
                    onChange={(e) => updateProfile("businessName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-person">Name</Label>
                  <Input
                    id="contact-person"
                    placeholder="Owner name"
                    value={profile.contactPerson}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    placeholder="admin@yourbusiness.com"
                    value={profile.email}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={profile.phone}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="address-line1">Address Line 1</Label>
                  <Input
                    id="address-line1"
                    placeholder="Street address, building name"
                    value={profile.addressLine1}
                    onChange={(e) => updateProfile("addressLine1", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="address-line2">Address Line 2</Label>
                  <Input
                    id="address-line2"
                    placeholder="Area, landmark (optional)"
                    value={profile.addressLine2}
                    onChange={(e) => updateProfile("addressLine2", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address-city">City</Label>
                  <Input
                    id="address-city"
                    placeholder="City"
                    value={profile.city}
                    onChange={(e) => updateProfile("city", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address-state">State</Label>
                  <Input
                    id="address-state"
                    placeholder="State"
                    value={profile.state}
                    onChange={(e) => updateProfile("state", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address-pincode">Pincode</Label>
                  <Input
                    id="address-pincode"
                    placeholder="Pincode"
                    value={profile.pincode}
                    onChange={(e) => updateProfile("pincode", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Business Logo</h3>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                className="hidden"
                onChange={handleLogoFileChange}
              />
              <div className="glass-subtle rounded-xl border-2 border-dashed border-border/50 p-8 flex flex-col items-center justify-center text-center gap-3">
                {/* Preview: file selected or existing logo */}
                {(logoPreview || getLogoUrl(logoUrl)) ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview ?? getLogoUrl(logoUrl)!}
                      alt="Business logo"
                      className="h-24 w-24 rounded-xl object-contain border border-border bg-background"
                    />
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleClearLogoFile}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full p-4">
                    <Upload className="h-8 w-8 text-blue-400" />
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium">
                    {logoUrl && !logoPreview ? "Logo uploaded" : "Upload your business logo"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PNG, JPG or SVG. Max 2MB. Recommended: 256×256px
                  </p>
                </div>

                {logoError && (
                  <p className="text-xs text-destructive">{logoError}</p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo || updateTenant.isPending}
                  >
                    {logoUrl && !logoPreview ? "Change Logo" : "Choose File"}
                  </Button>
                </div>

                {logoFile && (
                  <p className="text-xs text-muted-foreground">
                    {isUploadingLogo ? "Processing…" : `${logoFile.name} — will save with profile`}
                  </p>
                )}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                onClick={handleSaveProfile}
                disabled={updateTenant.isPending}
              >
                {updateTenant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {updateTenant.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* ===================== PREFERENCES TAB ===================== */}
        <TabsContent value="preferences">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl p-6 mt-4 space-y-6"
          >
            <h3 className="text-sm font-semibold">Regional Preferences</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pref-language">Default Language</Label>
                <Select
                  value={defaultLanguage}
                  onValueChange={setDefaultLanguage}
                >
                  <SelectTrigger id="pref-language" className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="gu">Gujarati</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Default language for the application interface
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pref-timezone">Timezone</Label>
                <Select
                  value={timezone}
                  onValueChange={setTimezone}
                >
                  <SelectTrigger id="pref-timezone" className="w-full">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">
                      Asia/Kolkata (IST, UTC+5:30)
                    </SelectItem>
                    <SelectItem value="Asia/Mumbai">
                      Asia/Mumbai (IST, UTC+5:30)
                    </SelectItem>
                    <SelectItem value="Asia/Dubai">
                      Asia/Dubai (GST, UTC+4:00)
                    </SelectItem>
                    <SelectItem value="UTC">UTC (UTC+0:00)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Used for report generation and scheduling
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pref-currency">Currency Format</Label>
                <Select
                  value={currencyFormat}
                  onValueChange={setCurrencyFormat}
                >
                  <SelectTrigger id="pref-currency" className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Currency used for pricing and invoices
                </p>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                onClick={handleSavePreferences}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* ===================== INVOICE TAB ===================== */}
        <TabsContent value="invoice">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl p-6 mt-4 space-y-6"
          >
            <h3 className="text-sm font-semibold">Invoice Configuration</h3>

            {/* Invoice Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
                <Input
                  id="invoice-prefix"
                  placeholder="e.g. SKD-INV"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Prefix added to all generated invoice numbers
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invoice-format">Invoice Number Format</Label>
                <Input
                  id="invoice-format"
                  placeholder="e.g. YYYY-NNNN"
                  value={invoiceNumberFormat}
                  onChange={(e) => setInvoiceNumberFormat(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  YYYY = Year, NNNN = Sequential number (e.g. SKD-INV-2025-0001)
                </p>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-1.5">
              <Label htmlFor="invoice-terms">Terms & Conditions</Label>
              <Textarea
                id="invoice-terms"
                placeholder="Enter your invoice terms and conditions..."
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                rows={6}
              />
              <p className="text-[10px] text-muted-foreground">
                Printed at the bottom of every generated invoice
              </p>
            </div>

            {/* Preview */}
            <div className="glass-subtle rounded-lg p-4">
              <p className="text-xs font-medium mb-2">Invoice Number Preview</p>
              <p className="text-sm font-mono text-muted-foreground">
                {invoicePrefix}-
                {invoiceNumberFormat
                  .replace("YYYY", "2025")
                  .replace("NNNN", "0001")}
              </p>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                onClick={handleSaveInvoice}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? "Saving..." : "Save Invoice Settings"}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* ===================== FEATURES TAB ===================== */}
        <TabsContent value="features">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 mt-4"
          >
            {featureList.map((feature, index) => {
              const FeatureIcon = feature.icon;
              const isEnabled = features[feature.key] ?? false;

              return (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-2.5 shrink-0 mt-0.5">
                      <FeatureIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{feature.label}</h3>
                        {isEnabled && (
                          <span className="inline-flex items-center rounded-full bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 px-2 py-0.5 text-[10px] font-medium">
                            Enabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleFeature(feature.key)}
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                onClick={handleSaveFeatures}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? "Saving..." : "Save Feature Settings"}
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
