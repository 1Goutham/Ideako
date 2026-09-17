"use client";

import { useId, useState } from "react";
import { cx } from "@/lib/utils";
import { IconChevron } from "./Icons";

interface DisclosureProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small status text on the right of the header (e.g. "2 added"). */
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Disclosure({ title, description, meta, defaultOpen, open, onOpenChange, children, className }: DisclosureProps) {
  const [internal, setInternal] = useState(!!defaultOpen);
  const isOpen = open ?? internal;
  const id = useId();
  const toggle = () => {
    const next = !isOpen;
    setInternal(next);
    onOpenChange?.(next);
  };
  return (
    <section className={cx("rounded-lg border border-line bg-surface", className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="min-w-0">
          <span className="block text-[14px] font-medium text-ink">{title}</span>
          {description && <span className="mt-0.5 block text-[13px] text-ink-3">{description}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-3 text-xs text-ink-3">
          {meta}
          <IconChevron size={16} className={cx("transition-transform duration-200", isOpen && "rotate-180")} />
        </span>
      </button>
      {isOpen && (
        <div id={id} className="border-t border-line px-4 py-4 sm:px-5 animate-fade">
          {children}
        </div>
      )}
    </section>
  );
}
