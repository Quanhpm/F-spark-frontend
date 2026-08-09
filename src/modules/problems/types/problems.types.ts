import type {
  ApiListQuery,
  EntityId,
  ISODateTimeString,
  ProblemDifficulty,
  ProblemSourceType,
  ProblemStatus,
} from "@/shared/types";

export type ProblemSummaryDto = {
  id: EntityId;
  code: string;
  title: string;
  domainCode: string;
  domainName: string;
  difficultyLevel: ProblemDifficulty;
  sourceType: ProblemSourceType;
  status: ProblemStatus;
  strategicTheme: string | null;
  researchArea: string | null;
  proposedByGroupId: EntityId | null;
  proposedByGroupNo: string | null;
  proposedByGroupName: string | null;
};

export type ProblemDetailDto = {
  id: EntityId;
  code: string;
  title: string;
  statement: string;
  strategicTheme: string | null;
  researchArea: string | null;
  difficultyLevel: ProblemDifficulty;
  expectedOutput: string | null;
  ownerLab: string | null;
  suggestedCourses: string | null;
  driveFolderLink: string | null;
  sourceType: ProblemSourceType;
  status: ProblemStatus;
  domain: {
    id: EntityId;
    code: string;
    name: string;
  } | null;
  proposedByGroup: {
    id: EntityId;
    groupNo: string;
    name: string;
  } | null;
  proposedByStudent: {
    id: EntityId;
    studentCode: string;
    fullName: string;
  } | null;
  reviewComment: string | null;
  reviewedBy: {
    id: EntityId;
    email: string;
  } | null;
  reviewedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ProblemDomainDto = {
  id: EntityId;
  code: string;
  name: string;
  description: string | null;
  macroDomain: string | null;
  subDomain: string | null;
  typicalExamples: string | null;
  primaryDiscipline: string | null;
  supportingDisciplines: string | null;
  bestSources: string | null;
  studentCapabilities: string | null;
  potentialOutputs: string | null;
  notes: string | null;
  status: ProblemStatus;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ProblemEvaluationCriteriaDto = {
  id: EntityId;
  code: string;
  category: string;
  question: string;
  suggestion: string | null;
  maxScore: number;
  displayOrder: number;
  active: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ProblemsQuery = ApiListQuery & {
  domainCode?: string;
  difficulty?: ProblemDifficulty;
  expectedOutput?: string;
  sourceType?: ProblemSourceType;
  status?: ProblemStatus;
};

export type AdminProblemsQuery = ProblemsQuery;

export type CreateOfficialProblemRequest = {
  domainCode?: string;
  title: string;
  statement: string;
  code?: string;
  strategicTheme?: string;
  researchArea?: string;
  difficultyLevel: ProblemDifficulty;
  expectedOutput?: string;
  ownerLab?: string;
  suggestedCourses?: string;
  driveFolderLink?: string;
  status?: ProblemStatus;
};

export type UpdateProblemRequest = {
  domainCode?: string;
  title?: string;
  statement?: string;
  code?: string;
  strategicTheme?: string;
  researchArea?: string;
  difficultyLevel?: ProblemDifficulty;
  expectedOutput?: string;
  ownerLab?: string;
  suggestedCourses?: string;
  driveFolderLink?: string;
  status?: ProblemStatus;
};

export type UpdateProblemStatusRequest = {
  status: ProblemStatus;
};

export type ReviewProblemRequest = {
  status: ProblemStatus;
  comment?: string;
};

export type SelectProblemRequest = {
  problemId: EntityId;
};

export type ProposeProblemRequest = {
  title: string;
  statement: string;
  strategicTheme?: string;
  researchArea?: string;
  difficultyLevel: ProblemDifficulty;
  expectedOutput?: string;
  domainCode: string;
};

export type CreateProblemDomainRequest = {
  code: string;
  name: string;
  description?: string;
  macroDomain?: string;
  subDomain?: string;
  typicalExamples?: string;
  primaryDiscipline?: string;
  supportingDisciplines?: string;
  bestSources?: string;
  studentCapabilities?: string;
  potentialOutputs?: string;
  notes?: string;
  status?: ProblemStatus;
};

export type UpdateProblemDomainRequest = {
  code?: string;
  name?: string;
  description?: string;
  macroDomain?: string;
  subDomain?: string;
  typicalExamples?: string;
  primaryDiscipline?: string;
  supportingDisciplines?: string;
  bestSources?: string;
  studentCapabilities?: string;
  potentialOutputs?: string;
  notes?: string;
  status?: ProblemStatus;
};

export type DomainsQuery = {
  search?: string;
  status?: ProblemStatus;
};
