export const APP_NAME = "Codebase Navigator";

export const REPOSITORY_STATUS = {
  QUEUED: "queued",
  ANALYZING: "analyzing",
  COMPLETED: "completed",
  FAILED: "failed"
};

export const STATUS_LABELS = {
  [REPOSITORY_STATUS.QUEUED]: "Queued",
  [REPOSITORY_STATUS.ANALYZING]: "Analyzing repository…",
  [REPOSITORY_STATUS.COMPLETED]: "Analysis complete",
  [REPOSITORY_STATUS.FAILED]: "Analysis failed"
};

export const MAX_LOCAL_REPOSITORIES = 20;

export const TABS = {
  FILES: "files",
  GRAPH: "graph"
};