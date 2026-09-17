import { cx } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-lg border border-line bg-surface/70 px-6 py-14 text-center", className)}>
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-3">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
