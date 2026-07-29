"use client";

import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mouse,
  Radio,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Button, EmptyState, LoadingState, TextInput } from "@/shared/components";
import { cn } from "@/shared/lib";

import { useTvDisplay } from "../hooks";
import type {
  ProjectDisplayItem,
  RecruitmentDisplayItem,
} from "../types";
import { GroupDetailDialog } from "./group-detail-dialog";
import { VerticalCarousel } from "./vertical-carousel";

type SearchScope = "progress" | "recruitment";

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
    <div className="hidden text-right min-[1200px]:block">
      <strong className="block text-xl font-bold tabular-nums text-foreground min-[1440px]:text-2xl">
        {timeLabel}
      </strong>
      <span className="mt-0.5 block text-xs text-muted">{dateLabel}</span>
    </div>
  );
}

function ProjectCard({
  active,
  item,
  onClick,
}: {
  active: boolean;
  item: ProjectDisplayItem;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={`Xem chi tiết ${item.projectName}`}
      className={cn(
        "grid min-h-[270px] w-full cursor-pointer content-between gap-5 rounded-2xl border border-l-4 border-border border-l-brand-primary bg-surface p-6 text-left shadow-card transition-[border-color,box-shadow] duration-200 outline-none min-[1440px]:min-h-[310px] min-[1440px]:p-8",
        active &&
          "border-brand-secondary shadow-card-interactive focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]",
      )}
      onClick={onClick}
      tabIndex={active ? 0 : -1}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-surface-warm px-3 py-1.5 text-xs font-bold tracking-[0.04em] text-brand-primary uppercase">
          {item.groupLabel}
        </span>
        <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
          {item.courseCode}
        </span>
      </div>
      <div className="min-w-0">
        <p className="m-0 text-xs font-bold tracking-[0.08em] text-brand-primary uppercase">
          Dự án đang triển khai
        </p>
        <h3 className="mt-2 mb-0 line-clamp-2 break-words text-[clamp(22px,2vw,34px)] leading-[1.15] font-bold text-foreground">
          {item.projectName}
        </h3>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-background text-brand-primary">
          <GraduationCap size={21} />
        </span>
        <div className="min-w-0">
          <span className="block text-xs font-medium text-muted">Instructor</span>
          <strong className="mt-0.5 block truncate text-sm font-bold text-foreground min-[1440px]:text-base">
            {item.instructorName}
          </strong>
        </div>
      </div>
      <div className="grid gap-2.5">
        <div className="flex items-end justify-between gap-4 text-sm text-muted">
          <span>
            {item.totalTasks > 0
              ? `${item.completedTasks}/${item.totalTasks} nhiệm vụ hoàn tất`
              : "Chưa có nhiệm vụ"}
          </span>
          <strong className="text-xl font-bold text-foreground">
            {item.progressPercent}%
          </strong>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-background">
          <span
            className="block h-full rounded-full bg-brand-secondary"
            style={{ width: `${item.progressPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function RecruitmentCard({
  active,
  item,
  onClick,
}: {
  active: boolean;
  item: RecruitmentDisplayItem;
  onClick: () => void;
}) {
  const visiblePositions = item.positions.slice(0, 3);

  return (
    <button
      aria-label={`Xem chi tiết tuyển thành viên của ${item.projectName}`}
      className={cn(
        "grid min-h-[270px] w-full cursor-pointer content-between gap-4 rounded-2xl border border-l-4 border-border-warm border-l-brand-secondary bg-surface p-6 text-left shadow-card transition-[border-color,box-shadow] duration-200 outline-none min-[1440px]:min-h-[310px] min-[1440px]:p-8",
        active &&
          "border-brand-secondary shadow-card-interactive focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]",
      )}
      onClick={onClick}
      tabIndex={active ? 0 : -1}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-surface-warm px-3 py-1.5 text-xs font-bold text-foreground">
          {item.totalOpenings} vị trí đang mở
        </span>
        <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
          {item.courseCode}
        </span>
      </div>
      <div className="min-w-0">
        <p className="m-0 text-xs font-bold tracking-[0.08em] text-brand-primary uppercase">
          Bảng tin tuyển thành viên
        </p>
        <h3 className="mt-2 mb-0 line-clamp-2 break-words text-[clamp(22px,2vw,34px)] leading-[1.15] font-bold text-foreground">
          {item.projectName}
        </h3>
        <p className="mt-2 mb-0 truncate text-sm text-muted">
          {item.groupLabel} · Instructor {item.instructorName}
        </p>
      </div>
      <div className="grid gap-2">
        {visiblePositions.map((position) => (
          <div
            className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-border-warm bg-surface-warm px-4 py-2.5"
            key={position.role}
          >
            <span className="truncate text-sm font-medium text-foreground">
              {position.displayNameVi}
            </span>
            <strong className="shrink-0 text-sm font-bold text-brand-primary">
              x{position.quantity}
            </strong>
          </div>
        ))}
        {item.positions.length > visiblePositions.length && (
          <p className="m-0 text-right text-xs text-muted">
            +{item.positions.length - visiblePositions.length} nhóm vị trí khác
          </p>
        )}
      </div>
    </button>
  );
}

export function TvDisplayPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("progress");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const displayQuery = useTvDisplay();
  const data = displayQuery.data;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const selectedProgress = useMemo(
    () => data?.projects.find((item) => item.groupId === selectedGroupId),
    [data?.projects, selectedGroupId],
  );
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase("vi");
  const filteredProjects = useMemo(() => {
    if (!normalizedSearchQuery || searchScope !== "progress") {
      return data?.projects ?? [];
    }
    return (data?.projects ?? []).filter(
      (item) =>
        item.groupName.toLocaleLowerCase("vi").includes(normalizedSearchQuery) ||
        item.groupLabel.toLocaleLowerCase("vi").includes(normalizedSearchQuery),
    );
  }, [data?.projects, normalizedSearchQuery, searchScope]);
  const filteredRecruitments = useMemo(() => {
    if (!normalizedSearchQuery || searchScope !== "recruitment") {
      return data?.recruitments ?? [];
    }
    return (data?.recruitments ?? []).filter(
      (item) =>
        item.groupName.toLocaleLowerCase("vi").includes(normalizedSearchQuery) ||
        item.groupLabel.toLocaleLowerCase("vi").includes(normalizedSearchQuery),
    );
  }, [data?.recruitments, normalizedSearchQuery, searchScope]);

  if (displayQuery.isPending) {
    return (
      <main className="fixed inset-0 z-40 grid place-items-center bg-background p-6">
        <LoadingState
          className="w-[min(520px,100%)]"
          description="Dữ liệu dự án đang được đồng bộ."
          title="Đang chuẩn bị bảng trình chiếu"
        />
      </main>
    );
  }

  if (displayQuery.isError || !data) {
    return (
      <main className="fixed inset-0 z-40 grid place-items-center bg-background p-6">
        <EmptyState
          className="w-[min(520px,100%)]"
          description="Hãy kiểm tra phiên đăng nhập ADMIN và kết nối mạng."
          title="Chưa thể tải dữ liệu trình chiếu"
        />
      </main>
    );
  }

  return (
    <>
      <main className="fixed inset-0 z-40 grid min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background font-sans text-foreground max-[760px]:overflow-y-auto">
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
                Dự án & cơ hội tham gia
              </h1>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 min-[1440px]:gap-5 max-[760px]:w-full max-[760px]:flex-wrap">
            <div
              aria-label="Phạm vi tìm kiếm"
              className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-background p-1"
              role="group"
            >
              <Button
                aria-pressed={searchScope === "progress"}
                onClick={() => setSearchScope("progress")}
                size="sm"
                variant={searchScope === "progress" ? "primary" : "ghost"}
              >
                Tiến độ
              </Button>
              <Button
                aria-pressed={searchScope === "recruitment"}
                onClick={() => setSearchScope("recruitment")}
                size="sm"
                variant={searchScope === "recruitment" ? "primary" : "ghost"}
              >
                Ứng tuyển
              </Button>
            </div>
            <TextInput
              aria-label={
                searchScope === "progress"
                  ? "Tìm group tiến độ"
                  : "Tìm group ứng tuyển"
              }
              fieldClassName="w-[min(24vw,320px)] min-w-[210px] max-[960px]:min-w-[170px] max-[760px]:order-3 max-[760px]:w-full"
              icon={<Search size={17} />}
              id="tv-group-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                searchScope === "progress"
                  ? "Tìm group tiến độ..."
                  : "Tìm group ứng tuyển..."
              }
              value={searchQuery}
            />
            {searchQuery && (
              <Button
                aria-label="Xóa nội dung tìm kiếm"
                className="size-11 shrink-0 px-0"
                icon={<X size={17} />}
                onClick={() => setSearchQuery("")}
                variant="ghost"
              >
                <span className="sr-only">Xóa tìm kiếm</span>
              </Button>
            )}
            <span className="hidden items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800 min-[1200px]:flex">
              <Radio className="animate-pulse" size={15} />
              LIVE
            </span>
            <ClockDisplay />
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-2 max-[760px]:grid-cols-1">
          <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 p-6 min-[761px]:p-8 min-[1440px]:px-12 min-[1440px]:py-9 max-[760px]:min-h-[620px]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-warm text-brand-primary">
                <BriefcaseBusiness size={21} />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-xs font-bold tracking-[0.08em] text-brand-primary uppercase">
                  Đang triển khai
                </p>
                <h2 className="m-0 mt-1 text-2xl font-bold text-foreground">
                  Tiến độ dự án
                </h2>
              </div>
              <span className="ml-auto rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted">
                {filteredProjects.length} dự án
              </span>
            </div>
            <VerticalCarousel
              emptyState={
                <EmptyState
                  className="h-full border-0 bg-transparent shadow-none"
                  description={
                    searchQuery && searchScope === "progress"
                      ? "Hãy thử một tên hoặc mã group khác."
                      : undefined
                  }
                  icon={<Sparkles size={22} />}
                  title={
                    searchQuery && searchScope === "progress"
                      ? `Không tìm thấy group “${searchQuery}”`
                      : "Chưa có dự án đang triển khai"
                  }
                />
              }
              items={filteredProjects}
              label="Danh sách tiến độ dự án. Cuộn lên hoặc xuống để chuyển dự án."
              onSelect={(item) => setSelectedGroupId(item.groupId)}
              renderItem={(item, active, selectItem) => (
                <ProjectCard active={active} item={item} onClick={selectItem} />
              )}
            />
          </section>

          <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 border-l border-border-warm bg-surface-warm p-6 min-[761px]:p-8 min-[1440px]:px-12 min-[1440px]:py-9 max-[760px]:min-h-[620px] max-[760px]:border-t max-[760px]:border-l-0">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-brand-primary">
                <UsersRound size={21} />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-xs font-bold tracking-[0.08em] text-brand-primary uppercase">
                  Cơ hội tham gia
                </p>
                <h2 className="m-0 mt-1 text-2xl font-bold text-foreground">
                  Tuyển thành viên
                </h2>
              </div>
              <span className="ml-auto rounded-full border border-border-warm bg-surface px-3 py-1.5 text-xs font-medium text-muted">
                {filteredRecruitments.reduce(
                  (total, item) => total + item.totalOpenings,
                  0,
                )}{" "}
                vị trí
              </span>
            </div>
            <VerticalCarousel
              emptyState={
                <EmptyState
                  className="h-full border-0 bg-transparent shadow-none"
                  description={
                    searchQuery && searchScope === "recruitment"
                      ? "Hãy thử một tên hoặc mã group khác."
                      : undefined
                  }
                  icon={<Sparkles size={22} />}
                  title={
                    searchQuery && searchScope === "recruitment"
                      ? `Không tìm thấy group “${searchQuery}”`
                      : "Chưa có thông báo tuyển thành viên"
                  }
                />
              }
              items={filteredRecruitments}
              label="Danh sách tuyển thành viên. Cuộn lên hoặc xuống để chuyển dự án."
              onSelect={(item) => setSelectedGroupId(item.groupId)}
              renderItem={(item, active, selectItem) => (
                <RecruitmentCard
                  active={active}
                  item={item}
                  onClick={selectItem}
                />
              )}
            />
          </section>
        </div>

        <footer className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-6 py-2.5 text-xs text-muted min-[761px]:px-10 min-[1440px]:px-14">
          <span className="flex items-center gap-2">
            <Mouse size={15} />
            Cuộn con lăn để xem thêm · Bấm vào thẻ để xem chi tiết
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            Chỉ render tối đa 5 card mỗi cột
          </span>
          <span className="flex items-center gap-2">
            <Clock3 size={15} />
            Cập nhật gần nhất:{" "}
            {new Date(data.refreshedAt).toLocaleTimeString("vi-VN")}
          </span>
        </footer>
      </main>

      {selectedGroupId !== null && (
        <GroupDetailDialog
          groupId={selectedGroupId}
          onClose={() => setSelectedGroupId(null)}
          progress={selectedProgress}
        />
      )}
    </>
  );
}
