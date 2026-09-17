"use client";

import { useId, useState } from "react";
import { cx } from "@/lib/utils";

interface DisclosureProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small mono index shown before the title, e.g. "01". */
  index?: string;
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/** Hairline accordion row with a "+" that turns into "−". */
export function Disclosure({ title, description, index, meta, defaultOpen, open, onOpenChange, children, className }: DisclosureProps) {
  const [internal, setInternal] = useState(!!defaultOpen);
  const isOpen = open ?? internal;
  const id = useId();
  const toggle = () => {
    const next = !isOpen;
    setInternal(next);
    onOpenChange?.(next);
  };
  return (
    <section className={cx("border-y border-line", className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={toggle}
        className="group flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="flex min-w-0 items-baseline gap-4">
          {index && <span className="label shrink-0">{index}</span>}
          <span className="min-w-0">
            <span className="block text-[16px] text-ink">{title}</span>
            {description && <span className="mt-0.5 block text-[13px] text-ink-3">{description}</span>}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-4">
          {meta && <span className="mono text-[11.5px] text-ink-3">{meta}</span>}
          <PlusMinus open={isOpen} />
        </span>
      </button>
      {isOpen && (
        <div id={id} className="pb-6 animate-fade">
          {children}
        </div>
      )}
    </section>
  );
}

export function PlusMinus({ open, className }: { open: boolean; className?: string }) {
  return (
    <span className={cx("relative block size-3 text-ink-3 transition-colors group-hover:text-ink", className)} aria-hidden="true">
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
      <span
        className={cx(
          "absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-300",
          open ? "scale-y-0" : "scale-y-100",
        )}
      />
    </span>
  );
}
