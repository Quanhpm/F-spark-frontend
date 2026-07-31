import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BackToDashboardButton() {
  return (
    <Link
      aria-label="Quay lại trang quản trị"
      className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground transition-[background,border-color,color,box-shadow,transform] duration-200 hover:border-brand-secondary hover:bg-surface-warm hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] active:scale-[0.98] min-[761px]:px-4"
      href="/admin/dashboard"
    >
      <ArrowLeft aria-hidden="true" size={18} />
      <span className="hidden min-[761px]:inline">Quay lại</span>
    </Link>
  );
}
