import { cx } from "@/lib/utils";

export function PageHeader({
  index,
  title,
  description,
  actions,
  className,
}: {
  /** Mono index, e.g. "02". */
  index?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {index && <p className="label mb-4">{index}</p>}
        <h1 className="display text-[40px] text-ink md:text-[56px]">{title}</h1>
        {description && <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
