"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const pathname = usePathname();
  const isPricing = pathname === "/pricing";
  const isSignup = pathname?.startsWith("/signup") ?? false;

  return (
    <nav className="relative z-20 glass border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-transparent.png"
              alt="BeatMitra"
              width={36}
              height={36}
              priority
              className="h-9 w-9 object-contain"
            />
            <span className="text-xl font-bold text-gradient-primary">
              BeatMitra
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/pricing" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                className={cn(isPricing && "bg-accent text-accent-foreground")}
              >
                Pricing
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            {!isSignup && (
              <Link href="/signup">
                <Button className="bg-gradient-primary hover-glow-primary">
                  Start Free Trial
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
