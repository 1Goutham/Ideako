"use client";

import { cx } from "@/lib/utils";

interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onToggle"> {
  selected?: boolean;
  size?: "sm" | "md";
  /** Show a small mark when selected (multi-select groups). */
  checkable?: boolean;
}

export function Chip({ selected, size = "md", checkable, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border font-normal transition-[background-color,border-color,color] duration-200 select-none disabled:opacity-40",
        size === "sm" ? "h-8 px-3.5 text-[13px]" : "h-9 px-4 text-[14px]",
        selected ? "border-ink bg-ink text-[#f5f3ef]" : "border-line-2 bg-transparent text-ink-2 hover:border-ink hover:text-ink",
        className,
      )}
      {...rest}
    >
      {checkable && (
        <span
          className={cx("size-1.5 rounded-full transition-colors", selected ? "bg-accent" : "bg-ink-4/60")}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

export function ChipGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("flex flex-wrap gap-2", className)}>{children}</div>;
}
