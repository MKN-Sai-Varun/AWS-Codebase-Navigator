export const STORAGE_KEYS = {
  REPOSITORIES: "codebaseNavigator.repositories",
  CURRENT_REPOSITORY: "codebaseNavigator.currentRepositoryId"
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function getStoredRepositories() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.REPOSITORIES);
    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRepositories(repositories) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.REPOSITORIES,
      JSON.stringify(repositories)
    );
  } catch {
    // localStorage may be unavailable (private browsing, quota, etc). Fail silently.
  }
}

export function getCurrentRepositoryId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.CURRENT_REPOSITORY) || null;
  } catch {
    return null;
  }
}

export function saveCurrentRepositoryId(repositoryId) {
  if (typeof window === "undefined") return;
  try {
    if (repositoryId) {
      window.localStorage.setItem(STORAGE_KEYS.CURRENT_REPOSITORY, repositoryId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.CURRENT_REPOSITORY);
    }
  } catch {
    // ignore
  }
}

export function clearRepositoryStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.REPOSITORIES);
    window.localStorage.removeItem(STORAGE_KEYS.CURRENT_REPOSITORY);
  } catch {
    // ignore
  }
}