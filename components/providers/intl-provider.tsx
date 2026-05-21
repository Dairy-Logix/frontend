"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SupportedLocale } from "@/lib/types";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/constants";

type MessageNode = string | { [key: string]: MessageNode };
type Messages = Record<string, MessageNode>;

interface IntlContextValue {
  locale: SupportedLocale;
  messages: Messages;
}

const IntlContext = createContext<IntlContextValue>({
  locale: DEFAULT_LOCALE,
  messages: {},
});

function lookup(messages: Messages, path: string): string | undefined {
  const parts = path.split(".");
  let node: MessageNode | undefined = messages;
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = (node as Record<string, MessageNode>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

export function useIntl() {
  return useContext(IntlContext);
}

export function useTranslations(namespace?: string) {
  const { messages } = useContext(IntlContext);
  return (key: string, fallback?: string): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const value = lookup(messages, fullKey);
    if (value !== undefined) return value;
    return fallback ?? key;
  };
}

interface IntlProviderProps {
  children: ReactNode;
}

function isSupported(value: string | null): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function getSavedLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const saved = localStorage.getItem("preferred-locale");
  return isSupported(saved) ? saved : DEFAULT_LOCALE;
}

async function loadMessages(locale: string): Promise<Messages> {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch {
    return (await import(`@/messages/en.json`)).default;
  }
}

export function IntlProvider({ children }: IntlProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Messages | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocale(getSavedLocale());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    loadMessages(locale).then((m) => {
      if (!cancelled) setMessages(m);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, hydrated]);

  useEffect(() => {
    function handleLocaleChange(e: Event) {
      const detail = (e as CustomEvent<{ locale: SupportedLocale }>).detail;
      if (detail?.locale && isSupported(detail.locale)) {
        setLocale(detail.locale);
        try {
          localStorage.setItem("preferred-locale", detail.locale);
        } catch {
          // ignore quota / privacy mode errors
        }
      }
    }

    window.addEventListener("locale-change", handleLocaleChange);
    return () => window.removeEventListener("locale-change", handleLocaleChange);
  }, []);

  if (!messages) {
    return <>{children}</>;
  }

  return (
    <IntlContext.Provider value={{ locale, messages }}>
      {children}
    </IntlContext.Provider>
  );
}

export function changeLocale(locale: SupportedLocale) {
  try {
    localStorage.setItem("preferred-locale", locale);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("locale-change", { detail: { locale } }));
}
