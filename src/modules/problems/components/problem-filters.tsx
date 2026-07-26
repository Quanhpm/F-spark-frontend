import { useProblemDomains } from "../hooks";
import { Select, TextInput } from "@/shared/components";
import { Search } from "lucide-react";

type ProblemFiltersProps = {
  search: string;
  onSearchChange: (val: string) => void;
  domainCode: string;
  onDomainChange: (val: string) => void;
  difficulty: string;
  onDifficultyChange: (val: string) => void;
  status?: string;
  onStatusChange?: (val: string) => void;
  sourceType?: string;
  onSourceTypeChange?: (val: string) => void;
  showAdminFilters?: boolean;
};

export function ProblemFilters({
  search,
  onSearchChange,
  domainCode,
  onDomainChange,
  difficulty,
  onDifficultyChange,
  status,
  onStatusChange,
  sourceType,
  onSourceTypeChange,
  showAdminFilters = false,
}: ProblemFiltersProps) {
  // Query active domains list
  const { data: domainsResponse } = useProblemDomains({ status: "ACTIVE" });
  const domains = domainsResponse?.data || [];

  return (
    <div className="grid min-w-0 grid-cols-1 items-end gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-sm min-[640px]:grid-cols-2 min-[1000px]:grid-cols-4">
      {/* Search Title */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Search Problems
        </label>
        <div className="relative">
          <TextInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-9"
          />
          <Search className="absolute left-3 top-3.5 size-4 text-muted" />
        </div>
      </div>

      {/* Domain code */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Problem Domain
        </label>
        <Select
          value={domainCode}
          onChange={(e) => onDomainChange(e.target.value)}
        >
          <option value="">All Domains</option>
          {domains.map((d) => (
            <option key={d.id} value={d.code}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Difficulty */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Difficulty Level
        </label>
        <Select
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </Select>
      </div>

      {/* Admin specific filters */}
      {showAdminFilters ? (
        <>
          {onStatusChange && (
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <Select
                value={status || ""}
                onChange={(e) => onStatusChange(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
          )}
        </>
      ) : (
        <>
          {onSourceTypeChange && (
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Source Type
              </label>
              <Select
                value={sourceType || ""}
                onChange={(e) => onSourceTypeChange(e.target.value)}
              >
                <option value="">All Sources</option>
                <option value="OFFICIAL">Official Bank</option>
                <option value="SELF_PROPOSED">Group Proposals</option>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
