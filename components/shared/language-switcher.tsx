"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LOCALES, LOCALE_NAMES } from "@/lib/constants";
import { changeLocale } from "@/components/providers/intl-provider";
import type { SupportedLocale } from "@/lib/types";
import { useEffect, useState } from "react";

function getSavedLocale(): SupportedLocale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("preferred-locale") as SupportedLocale | null;
  if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) return saved;
  return "en";
}

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(getSavedLocale);

  useEffect(() => {
    function handleLocaleChange(e: CustomEvent<{ locale: SupportedLocale }>) {
      setCurrentLocale(e.detail.locale);
    }
    window.addEventListener("locale-change", handleLocaleChange as EventListener);
    return () => window.removeEventListener("locale-change", handleLocaleChange as EventListener);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change Language">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => {
              changeLocale(locale as SupportedLocale);
              setCurrentLocale(locale as SupportedLocale);
            }}
            className={currentLocale === locale ? "bg-accent" : ""}
          >
            {LOCALE_NAMES[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
