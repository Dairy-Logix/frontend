"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useForgotPassword } from "@/lib/hooks";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate(email);
  };

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
              <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
              <CardDescription>
                {forgotPassword.isSuccess
                  ? "Check your inbox for a reset link"
                  : "Enter your email and we'll send you a reset link"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {forgotPassword.isSuccess ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>,
                  we&apos;ve sent a link to reset your password. The link expires in 1 hour.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass-subtle"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full shine bg-gradient-primary hover-glow-primary"
                  disabled={forgotPassword.isPending}
                >
                  {forgotPassword.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

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
