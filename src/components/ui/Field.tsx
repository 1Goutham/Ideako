"use client";

import { forwardRef, useEffect, useId, useRef } from "react";
import { cx } from "@/lib/utils";

interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  optional?: boolean;
  error?: string;
  className?: string;
  children: (id: string) => React.ReactNode;
  /** Something to show at the end of the label row (a counter, a small action). */
  aside?: React.ReactNode;
}

export function Field({ label, hint, optional, error, className, children, aside }: FieldProps) {
  const id = useId();
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={id} className="text-[13.5px] font-medium text-ink">
              {label}
              {optional && <span className="ml-1.5 text-ink-4 font-normal">optional</span>}
            </label>
          )}
          {aside && <span className="text-xs text-ink-4">{aside}</span>}
        </div>
      )}
      {children(id)}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-md border border-line-2 bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-4 transition-[border-color,box-shadow] duration-150 hover:border-ink-4 focus:border-ink focus:outline-none focus:ring-0";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx(inputBase, "h-11", className)} {...rest} />;
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow with content. */
  autosize?: boolean;
  minRows?: number;
  /** Borderless editor mode (used by the post editor). */
  bare?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, autosize, minRows = 3, bare, value, onChange, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el || !autosize) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, autosize]);

  return (
    <textarea
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      rows={minRows}
      value={value}
      onChange={onChange}
      className={cx(
        bare
          ? "w-full resize-none bg-transparent text-ink placeholder:text-ink-4 focus:outline-none"
          : cx(inputBase, "resize-none py-3 leading-relaxed"),
        className,
      )}
      {...rest}
    />
  );
});
