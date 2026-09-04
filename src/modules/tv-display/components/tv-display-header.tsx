"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { BackToDashboardButton } from "./back-to-dashboard-button";

function ClockDisplay() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const kickoffTimer = window.setTimeout(() => setNow(new Date()), 0);
    const clockTimer = window.setInterval(() => setNow(new Date()), 1_000);

    return () => {
      window.clearInterval(clockTimer);
      window.clearTimeout(kickoffTimer);
    };
  }, []);

  const timeLabel = now
    ? new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now)
    : "--:--:--";
  const dateLabel = now
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(now)
    : "--/--/----";

  return (
    <div className="text-right">
      <strong className="block text-xl font-bold tabular-nums text-foreground min-[1440px]:text-2xl">
        {timeLabel}
      </strong>
      <span className="mt-0.5 block text-xs text-muted">{dateLabel}</span>
    </div>
  );
}

export function TvDisplayHeader({ activeTermCode }: { activeTermCode: string }) {
  return (
    <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-4 min-[761px]:gap-6 min-[761px]:px-10 min-[1440px]:px-14 max-[760px]:flex-wrap">
      <div className="flex min-w-0 items-center gap-3 min-[761px]:gap-5">
        <Image
          alt="F-Spark"
          className="h-auto w-[94px] object-contain min-[481px]:w-[120px] min-[1440px]:w-[146px]"
          height={62}
          src="/logo.svg"
          width={158}
          priority
        />
        <span className="hidden h-10 w-px bg-border min-[1101px]:block" />
        <div className="hidden min-w-0 min-[1101px]:block">
          <p className="m-0 text-xs font-bold tracking-[0.1em] text-brand-primary uppercase">
            Project display
          </p>
          <h1 className="m-0 mt-1 truncate text-xl font-bold text-foreground min-[1440px]:text-2xl">
            Dự án & Chiêu mộ
          </h1>
          <p className="m-0 mt-1 text-xs font-semibold text-muted">
            Học kỳ đang hoạt động: {activeTermCode}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 min-[761px]:gap-4">
        <ClockDisplay />
        <span className="hidden h-10 w-px bg-border min-[481px]:block" />
        <BackToDashboardButton />
      </div>
    </header>
  );
}
