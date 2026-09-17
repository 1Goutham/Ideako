import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cx } from "@/lib/utils";

export function Logo({ href = "/", size = 22, className }: { href?: string; size?: number; className?: string }) {
  return (
    <Link href={href} className={cx("inline-flex items-center gap-2", className)} aria-label={APP_NAME}>
      <Image src="/logo.png" alt="" width={size} height={size} priority className="shrink-0" />
      <span className="text-[15px] font-medium tracking-tight text-ink">{APP_NAME}</span>
    </Link>
  );
}
