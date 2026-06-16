"use client";

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { AuthenticatedRoute, useAuthStore } from "@/modules/auth";

import { useGroups } from "../hooks/use-groups";
import type { GroupStatus, GroupSummary } from "../types/group.types";
import styles from "./groups.module.css";

const statusOptions: Array<"ALL" | GroupStatus> = ["ALL", "ACTIVE", "INACTIVE"];

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(1).replace(/\.0$/, "") : "-";
}

function getMemberTone(memberCount: number) {
  if (memberCount >= 6) return styles.memberFull;
  if (memberCount >= 4) return styles.memberReady;
  return styles.memberOpen;
}

function GroupCard({ group }: { group: GroupSummary }) {
  return (
    <article className={styles.groupCard}>
      <div className={styles.cardTopline}>
        <span className={styles.coursePill}>{group.courseCode || "EXE"}</span>
        <span
          className={`${styles.statusPill} ${
            group.status === "ACTIVE" ? styles.statusActive : styles.statusInactive
          }`}
        >
          {group.status}
        </span>
      </div>

      <div className={styles.cardHeader}>
        <div>
          <p className={styles.groupNo}>{group.groupNo || `Group #${group.id}`}</p>
          <h2>{group.name || "Untitled group"}</h2>
        </div>
        <span className={`${styles.memberBadge} ${getMemberTone(group.memberCount)}`}>
          <Users size={15} /> {group.memberCount}/6
        </span>
      </div>

      <p className={styles.projectName}>
        {group.projectName || "No project name yet"}
      </p>

      <dl className={styles.metricsGrid}>
        <div>
          <dt>Required GPA</dt>
          <dd>{formatNumber(group.requiredGpa)}</dd>
        </div>
        <div>
          <dt>Target Grade</dt>
          <dd>{formatNumber(group.targetGrade)}</dd>
        </div>
      </dl>

      <div className={styles.metaList}>
        <span>
          <CalendarDays size={15} /> {group.term || "No term"}
        </span>
        <span>
          <GraduationCap size={15} /> Leader: {group.leaderName || "TBA"}
        </span>
        <span>
          <Sparkles size={15} /> Mentor: {group.mentorName || group.mentorCode || "TBA"}
        </span>
      </div>

      <button className={styles.joinButton} type="button">
        View group details
      </button>
    </article>
  );
}

function GroupsSkeleton() {
  return (
    <div className={styles.grid} aria-label="Loading groups">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className={`${styles.groupCard} ${styles.skeletonCard}`} key={index}>
          <span />
          <strong />
          <p />
          <div />
        </div>
      ))}
    </div>
  );
}

function GroupsContent() {
  const userEmail = useAuthStore((state) => state.session?.user.email ?? "Student");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<"ALL" | GroupStatus>("ALL");
  const groupsQuery = useGroups(deferredSearch);

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const filteredGroups = useMemo(() => {
    if (statusFilter === "ALL") return groups;
    return groups.filter((group) => group.status === statusFilter);
  }, [groups, statusFilter]);

  const activeCount = groups.filter((group) => group.status === "ACTIVE").length;
  const openSlots = groups.reduce(
    (total, group) => total + Math.max(0, 6 - group.memberCount),
    0,
  );

  return (
    <main className={styles.pageShell}>
      <aside className={styles.sidebar}>
        <Link className={styles.logo} href="/dashboard">
          <span>
            <Sparkles size={20} />
          </span>
          F-Spark
        </Link>

        <nav className={styles.navList} aria-label="Student navigation">
          <Link href="/dashboard">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link className={styles.navActive} href="/groups">
            <Users size={18} /> Find Groups
          </Link>
          <a aria-disabled="true">
            <BookOpen size={18} /> Projects
          </a>
          <a aria-disabled="true">
            <Target size={18} /> Checkpoints
          </a>
        </nav>

        <div className={styles.sidebarCard}>
          <span>Signed in as</span>
          <strong>{userEmail}</strong>
          <p>Find a team that matches your goal, GPA and project direction.</p>
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <Link href="/dashboard" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
          <div className={styles.topbarActions}>
            <span className={styles.liveDot} /> Live group board
          </div>
        </header>

        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Student workspace</p>
            <h1>Find your EXE project group</h1>
            <p>
              Browse active teams, compare goals, and discover groups that still
              have room for new members.
            </p>
          </div>
          <div className={styles.heroStats}>
            <div>
              <span>{groups.length}</span>
              <small>Total groups</small>
            </div>
            <div>
              <span>{activeCount}</span>
              <small>Active groups</small>
            </div>
            <div>
              <span>{openSlots}</span>
              <small>Open slots</small>
            </div>
          </div>
        </section>

        <section className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by group, project, leader, mentor..."
            />
          </label>

          <div className={styles.filters} aria-label="Group status filters">
            {statusOptions.map((status) => (
              <button
                className={statusFilter === status ? styles.filterActive : ""}
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" ? "All" : status}
              </button>
            ))}
          </div>
        </section>

        {groupsQuery.isLoading ? <GroupsSkeleton /> : null}

        {groupsQuery.isError ? (
          <div className={styles.stateCard} role="alert">
            <h2>Unable to load groups</h2>
            <p>
              Your session may have expired, or the backend could not return the
              current group list.
            </p>
            <button type="button" onClick={() => groupsQuery.refetch()}>
              Try again
            </button>
          </div>
        ) : null}

        {!groupsQuery.isLoading && !groupsQuery.isError && filteredGroups.length === 0 ? (
          <div className={styles.stateCard}>
            <h2>No matching groups yet</h2>
            <p>Try another keyword or clear the status filter to see more teams.</p>
          </div>
        ) : null}

        {!groupsQuery.isLoading && !groupsQuery.isError && filteredGroups.length > 0 ? (
          <div className={styles.grid}>
            {filteredGroups.map((group) => (
              <GroupCard group={group} key={group.id} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function GroupsPage() {
  return (
    <AuthenticatedRoute
      fallback={<main className={styles.loadingShell}>Restoring your session...</main>}
    >
      <GroupsContent />
    </AuthenticatedRoute>
  );
}
