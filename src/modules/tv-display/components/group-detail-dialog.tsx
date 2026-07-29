"use client";

import { BookOpen, GraduationCap, Target, UserRound, Users } from "lucide-react";
import type { ReactNode } from "react";

import { useGroup } from "@/modules/groups";
import {
  Badge,
  EmptyState,
  LoadingState,
  ResponsiveDialog,
} from "@/shared/components";

import type { ProjectDisplayItem } from "../types";

type GroupDetailDialogProps = {
  groupId: number;
  onClose: () => void;
  progress?: ProjectDisplayItem;
};

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "Chưa cập nhật";
  return String(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Chưa có hạn tiếp theo";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background p-4">
      <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
        {label}
      </dt>
      <dd className="m-0 mt-1 break-words text-sm leading-relaxed text-foreground">
        {formatValue(value)}
      </dd>
    </div>
  );
}

function SectionTitle({ children, icon }: { children: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-foreground">
      <span className="grid size-9 place-items-center rounded-xl bg-surface-warm text-brand-primary">
        {icon}
      </span>
      <h3 className="m-0 text-base font-bold">{children}</h3>
    </div>
  );
}

export function GroupDetailDialog({
  groupId,
  onClose,
  progress,
}: GroupDetailDialogProps) {
  const groupQuery = useGroup(groupId);
  const group = groupQuery.data?.data;

  return (
    <ResponsiveDialog
      bodyClassName="grid gap-5"
      className="min-[761px]:max-w-[960px]"
      closeLabel="Đóng thông tin group"
      description={
        group
          ? `${group.groupNo} · ${group.term} · ${group.courseCode}`
          : "Thông tin đầy đủ và tiến độ của group."
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={group?.projectName ?? group?.name ?? "Thông tin group"}
    >
      {groupQuery.isLoading ? (
        <LoadingState title="Đang tải thông tin group" />
      ) : groupQuery.isError ? (
        <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không thể tải thông tin group. Vui lòng thử lại sau.
        </p>
      ) : !group ? (
        <EmptyState
          description="Không tìm thấy dữ liệu của group đã chọn."
          title="Thông tin không khả dụng"
        />
      ) : (
        <>
          <section className="grid gap-4 rounded-2xl border border-border-warm bg-surface-warm p-4 min-[761px]:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle icon={<Target size={18} />}>Tiến độ thực hiện</SectionTitle>
              <Badge tone={group.status === "ACTIVE" ? "success" : "neutral"}>
                {group.status}
              </Badge>
            </div>
            {progress ? (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="m-0 text-sm text-muted">Hoàn thành công việc</p>
                    <strong className="mt-1 block text-3xl font-bold text-foreground">
                      {progress.progressPercent}%
                    </strong>
                  </div>
                  <p className="m-0 text-right text-sm text-muted">
                    {progress.completedTasks}/{progress.totalTasks} nhiệm vụ
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface">
                  <div
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={progress.progressPercent}
                    className="h-full rounded-full bg-brand-secondary transition-[width] duration-200"
                    role="progressbar"
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
                <dl className="m-0 grid grid-cols-2 gap-3 min-[761px]:grid-cols-4">
                  <InfoItem label="Đang thực hiện" value={progress.inProgressTasks} />
                  <InfoItem label="Quá hạn" value={progress.overdueTasks} />
                  <InfoItem label="Thành viên" value={group.members.length} />
                  <InfoItem label="Hạn gần nhất" value={formatDateTime(progress.nextDueAt)} />
                </dl>
              </>
            ) : (
              <p className="m-0 text-sm text-muted">
                Chưa có dữ liệu tiến độ tổng hợp cho group này.
              </p>
            )}
          </section>

          <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 min-[761px]:p-6">
            <SectionTitle icon={<BookOpen size={18} />}>Thông tin dự án</SectionTitle>
            <dl className="m-0 grid grid-cols-2 gap-3 min-[761px]:grid-cols-4 max-[480px]:grid-cols-1">
              <InfoItem label="Tên group" value={group.name} />
              <InfoItem label="Học kỳ" value={group.term} />
              <InfoItem label="Môn học" value={group.courseCode} />
              <InfoItem label="Mã group" value={group.groupNo} />
              <InfoItem label="Lĩnh vực" value={group.researchDomain} />
              <InfoItem label="GPA yêu cầu" value={group.requiredGpa} />
              <InfoItem label="Điểm mục tiêu" value={group.targetGrade} />
              <InfoItem
                label="Trạng thái thành viên"
                value={group.isLock ? "Đã khóa" : "Đang mở"}
              />
            </dl>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="m-0 text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Mô tả ý tưởng
              </p>
              <p className="mt-2 mb-0 break-words text-sm leading-[1.6] text-foreground">
                {group.ideaDescription ?? "Chưa có mô tả ý tưởng."}
              </p>
            </div>
            {group.selectedProblem && (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-foreground">
                <span className="font-bold text-brand-primary">
                  {group.selectedProblem.code}
                </span>{" "}
                · {group.selectedProblem.title}
              </div>
            )}
          </section>

          <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 min-[761px]:p-6">
            <SectionTitle icon={<GraduationCap size={18} />}>Phụ trách group</SectionTitle>
            <dl className="m-0 grid gap-3 min-[761px]:grid-cols-3">
              <InfoItem label="Instructor" value={group.instructorName} />
              <InfoItem label="Mentor" value={group.mentor?.fullName} />
              <InfoItem label="Group leader" value={group.leader?.fullName} />
            </dl>
          </section>

          <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 min-[761px]:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle icon={<Users size={18} />}>Thành viên</SectionTitle>
              <Badge tone="neutral">{group.members.length} thành viên</Badge>
            </div>
            <div className="grid gap-3 min-[761px]:grid-cols-2">
              {group.members.map((member) => (
                <div
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background p-4"
                  key={member.studentId}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-warm text-brand-primary">
                    <UserRound size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-bold text-foreground">
                      {member.fullName}
                    </p>
                    <p className="mt-1 mb-0 truncate text-xs text-muted">
                      {member.studentCode} · {member.email}
                    </p>
                  </div>
                  <Badge tone={member.role === "LEADER" ? "brand" : "neutral"}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 min-[761px]:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle icon={<Users size={18} />}>
                Nhu cầu tuyển thành viên
              </SectionTitle>
              <Badge tone={group.recruitmentNeeds.length ? "warning" : "neutral"}>
                {group.recruitmentNeeds.reduce(
                  (total, need) => total + need.quantity,
                  0,
                )}{" "}
                vị trí
              </Badge>
            </div>
            <div className="grid gap-3 min-[761px]:grid-cols-2">
              {group.recruitmentNeeds.map((need) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-warm bg-surface-warm p-4"
                  key={need.role}
                >
                  <div className="min-w-0">
                    <p className="m-0 break-words text-sm font-bold text-foreground">
                      {need.displayNameVi}
                    </p>
                    <p className="mt-1 mb-0 text-xs text-muted">
                      {need.displayNameEn}
                    </p>
                  </div>
                  <Badge tone="warning">x{need.quantity}</Badge>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </ResponsiveDialog>
  );
}
