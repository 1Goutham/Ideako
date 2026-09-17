"use client";

import { cx } from "@/lib/utils";

interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onToggle"> {
  selected?: boolean;
  size?: "sm" | "md";
  /** Render a leading check when selected (for multi-select groups). */
  checkable?: boolean;
}

export function Chip({ selected, size = "md", checkable, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-[background-color,border-color,color] duration-150 select-none",
        size === "sm" ? "h-7 px-3 text-[12.5px]" : "h-9 px-3.5 text-[13.5px]",
        selected
          ? "border-ink bg-ink text-white"
          : "border-line-2 bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
        className,
      )}
      {...rest}
    >
      {checkable && (
        <span
          className={cx(
            "flex size-3.5 items-center justify-center rounded-full border transition-colors",
            selected ? "border-white/70 bg-white/15" : "border-line-2",
          )}
          aria-hidden="true"
        >
          {selected && (
            <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
              <path d="M2.5 6.5 5 9l4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      )}
      {children}
    </button>
  );
}

export function ChipGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("flex flex-wrap gap-2", className)}>{children}</div>;
}
