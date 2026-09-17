"use client";

import { cx } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx("inline-flex rounded-md border border-line-2 bg-surface-2 p-0.5", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex h-8 min-w-[72px] items-center justify-center rounded-[5px] px-3 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150",
              active ? "bg-surface text-ink shadow-[0_1px_2px_rgb(20_23_26/0.08)]" : "text-ink-3 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
