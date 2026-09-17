"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cx } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,color,border-color,opacity,transform] duration-150 select-none disabled:opacity-50 active:translate-y-px";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-[#2a2f35] disabled:hover:bg-ink",
  secondary: "bg-surface text-ink border border-line-2 hover:bg-surface-2 hover:border-ink-4",
  ghost: "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-transparent text-danger hover:bg-danger-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, full, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(base, variants[variant], sizes[size], full && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner className={variant === "primary" ? "text-white" : "text-ink-3"} />}
      {children}
    </button>
  );
});

type LinkButtonProps = BaseProps & { href: string; prefetch?: boolean };

export function LinkButton({ href, variant = "secondary", size = "md", full, className, children, prefetch }: LinkButtonProps) {
  return (
    <Link href={href} prefetch={prefetch} className={cx(base, variants[variant], sizes[size], full && "w-full", className)}>
      {children}
    </Link>
  );
}

/** A tiny text-only action, used in toolbars where buttons would be too loud. */
export function TextAction({
  className,
  active,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[13px] font-medium transition-colors disabled:opacity-40",
        active ? "text-ink bg-surface-2" : "text-ink-3 hover:text-ink hover:bg-surface-2",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
