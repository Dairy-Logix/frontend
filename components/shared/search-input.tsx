"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the value our debounce most recently pushed up. When the parent
  // re-renders with this same value, the sync-from-prop effect below
  // recognises it as our own echo and skips — preventing it from
  // overwriting characters the user typed between the debounce firing
  // and the parent re-render.
  const lastSentRef = useRef(value);

  useEffect(() => {
    // Only adopt the prop value when it differs from what we just sent.
    // That guards against the race: user types "Ravi", debounce sends
    // "Ravi" up, user immediately types " ", parent re-renders with
    // value="Ravi", and (without this guard) the effect would clobber
    // the user's pending space. External resets (parent setting search
    // to "" or to some other value) still sync correctly.
    if (value === lastSentRef.current) return;
    setInternalValue(value);
  }, [value]);

  const debouncedOnChange = useCallback(
    (newValue: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        lastSentRef.current = newValue;
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    lastSentRef.current = "";
    setInternalValue("");
    onChange("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {internalValue && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
