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
import { changeLocale, useIntl, useTranslations } from "@/components/providers/intl-provider";
import type { SupportedLocale } from "@/lib/types";

export function LanguageSwitcher() {
  const { locale: currentLocale } = useIntl();
  const t = useTranslations("navbar");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title={t("changeLanguage")}>
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLocale(locale as SupportedLocale)}
            className={currentLocale === locale ? "bg-accent" : ""}
          >
            {LOCALE_NAMES[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
