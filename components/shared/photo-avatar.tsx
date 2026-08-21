"use client";

import type { LucideIcon } from "lucide-react";

interface PhotoAvatarProps {
  /** Photo URL; falls back to the icon placeholder when absent. */
  src?: string | null;
  alt: string;
  icon: LucideIcon;
  /** Size/shape/visibility classes for the box, e.g. "h-10 w-10 rounded-lg". */
  className?: string;
  iconClassName?: string;
}

/**
 * Entity thumbnail: renders the photo when one exists, otherwise the same
 * gradient icon placeholder used across list avatars.
 */
export function PhotoAvatar({
  src,
  alt,
  icon: Icon,
  className = "h-10 w-10 rounded-lg",
  iconClassName = "h-5 w-5",
}: PhotoAvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`${className} object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${className} bg-gradient-to-br from-blue-500/20 to-purple-500/20 items-center justify-center shrink-0 flex`}
    >
      <Icon className={`${iconClassName} text-blue-500`} />
    </div>
  );
}
