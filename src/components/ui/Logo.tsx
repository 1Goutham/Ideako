import Image from "next/image";
import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cx } from "@/lib/utils";

export function Logo({
  href = "/",
  tagline,
  size = 28,
  className,
}: {
  href?: string;
  tagline?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <Link href={href} className={cx("inline-flex items-center gap-2.5", className)} aria-label={APP_NAME}>
      <Image src="/logo.png" alt="" width={size} height={size} priority className="shrink-0" />
      <span className="text-[15px] font-semibold tracking-tight text-ink">{APP_NAME}</span>
      {tagline && (
        <span className="hidden items-center gap-2.5 sm:inline-flex">
          <span className="h-3.5 w-px bg-line-2" aria-hidden="true" />
          <span className="text-[13px] text-ink-3">{APP_TAGLINE}</span>
        </span>
      )}
    </Link>
  );
}
