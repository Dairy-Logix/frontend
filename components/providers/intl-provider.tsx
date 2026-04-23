"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SupportedLocale } from "@/lib/types";
import { DEFAULT_LOCALE } from "@/lib/constants";

type Messages = Record<string, Record<string, string>>;

interface IntlContextValue {
  locale: SupportedLocale;
  messages: Messages;
}

const IntlContext = createContext<IntlContextValue>({
  locale: DEFAULT_LOCALE,
  messages: {},
});

export function useIntl() {
  return useContext(IntlContext);
}

export function useTranslations(namespace?: string) {
  const { messages } = useContext(IntlContext);
  return (key: string) => {
    if (namespace) {
      return (messages[namespace] as Record<string, string>)?.[key] ?? key;
    }
    return key;
  };
}

interface IntlProviderProps {
  children: ReactNode;
}

function getSavedLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const saved = localStorage.getItem("preferred-locale") as SupportedLocale | null;
  if (saved && ["en", "hi", "gu"].includes(saved)) return saved;
  return DEFAULT_LOCALE;
}

async function loadMessages(locale: string): Promise<Messages> {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch {
    return (await import(`@/messages/en.json`)).default;
  }
}

export function IntlProvider({ children }: IntlProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(getSavedLocale);
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    loadMessages(locale).then(setMessages);
  }, [locale]);

  useEffect(() => {
    function handleLocaleChange(e: CustomEvent<{ locale: SupportedLocale }>) {
      const newLocale = e.detail.locale;
      setLocale(newLocale);
      localStorage.setItem("preferred-locale", newLocale);
    }

    window.addEventListener("locale-change", handleLocaleChange as EventListener);
    return () => window.removeEventListener("locale-change", handleLocaleChange as EventListener);
  }, []);

  if (!messages) {
    return null;
  }

  return (
    <IntlContext.Provider value={{ locale, messages }}>
      {children}
    </IntlContext.Provider>
  );
}

export function changeLocale(locale: SupportedLocale) {
  localStorage.setItem("preferred-locale", locale);
  window.dispatchEvent(
    new CustomEvent("locale-change", { detail: { locale } })
  );
}
