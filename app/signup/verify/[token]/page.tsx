"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Milk, CheckCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSignupLookup, useVerifySignup } from "@/lib/hooks/use-signup";
import { handleApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export default function VerifySignupPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const setAuth = useAuthStore((s) => s.setAuth);

  const lookup = useSignupLookup(token);
  const verify = useVerifySignup();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const lookupError = lookup.error ? handleApiError(lookup.error) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!password || !confirmPassword) {
      setFormError("Please fill in both password fields");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    if (password.length < 8 || !PASSWORD_REGEX.test(password)) {
      setFormError(
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character (@$!%*?&)",
      );
      return;
    }

    verify.mutate(
      { token, password },
      {
        onSuccess: (data) => {
          setAuth(data.user, data.accessToken, data.refreshToken);
          setSuccess(true);
          setTimeout(() => {
            if (data.user?.role === "super_admin") {
              router.replace("/admin/dashboard");
            } else {
              router.replace("/dashboard");
            }
          }, 1500);
        },
        onError: (err) => {
          setFormError(handleApiError(err));
        },
      },
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-animated opacity-10 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass gradient-border">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-primary">
              <Milk className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {success
                  ? "Trial activated"
                  : lookupError
                    ? "Verification failed"
                    : "Set your password"}
              </CardTitle>
              <CardDescription>
                {success
                  ? "Taking you to your dashboard..."
                  : lookupError
                    ? "We couldn't verify this link"
                    : lookup.isLoading
                      ? "Just a moment..."
                      : lookup.data
                        ? `Hi ${lookup.data.ownerName.split(" ")[0]}, set a password to start ${lookup.data.companyName}'s ${lookup.data.trialDays}-day ${lookup.data.planLabel} trial.`
                        : ""}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {success ? (
              <div className="text-center space-y-3 py-2">
                <CheckCircle className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  You're all set. Redirecting...
                </p>
                <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
              </div>
            ) : lookupError ? (
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-sm text-muted-foreground">{lookupError}</p>
                <div className="pt-2 flex flex-col gap-2">
                  <Button asChild variant="outline">
                    <Link href="/signup">Start over</Link>
                  </Button>
                  <Link
                    href="/auth/login"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Already verified? Log in
                  </Link>
                </div>
              </div>
            ) : lookup.isLoading || !lookup.data ? (
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-muted-foreground" />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={lookup.data.email}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    disabled={verify.isPending}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    disabled={verify.isPending}
                    required
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Password requirements:</strong>
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1 list-disc list-inside">
                    <li>At least 8 characters long</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains at least one number</li>
                    <li>Contains at least one special character (@$!%*?&)</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={verify.isPending}
                >
                  {verify.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating trial...
                    </>
                  ) : (
                    "Set password & start trial"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
