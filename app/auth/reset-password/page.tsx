"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useResetPassword } from "@/lib/hooks";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    resetPassword.mutate({ token, newPassword });
  };

  return (
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
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!token ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This reset link is missing its token. Please request a new one from the{" "}
              <Link href="/auth/forgot-password" className="underline">
                forgot password
              </Link>{" "}
              page.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="glass-subtle pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter the new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="glass-subtle"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters and include uppercase, lowercase, a number, and a
              special character.
            </p>

            <Button
              type="submit"
              className="w-full shine bg-gradient-primary hover-glow-primary"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resetting...
                </div>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-animated opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--gradient-primary-start)_0%,_transparent_50%)] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_var(--gradient-secondary-start)_0%,_transparent_50%)] opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center mt-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
