import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { MAX_LOCAL_REPOSITORIES } from "../utils/constants.js";
import { STORAGE_KEYS } from "../utils/storage.js";
const RepositoryContext = createContext(null);

export function RepositoryProvider({ children }) {
  const [repositories, setRepositories] = useLocalStorage(
    STORAGE_KEYS.REPOSITORIES,
    []
  );
  const [currentRepositoryId, setCurrentRepositoryIdState] = useLocalStorage(
    STORAGE_KEYS.CURRENT_REPOSITORY,
    null
  );

  const setCurrentRepository = useCallback(
    (repositoryId) => {
      setCurrentRepositoryIdState(repositoryId);
    },
    [setCurrentRepositoryIdState]
  );

  const addRepository = useCallback(
    (repository) => {
      setRepositories((prev) => {
        const existingIndex = prev.findIndex(
          (r) => r.url === repository.url
        );
        let next;
        if (existingIndex >= 0) {
          // Same URL analyzed again: update in place and move to top.
          const merged = { ...prev[existingIndex], ...repository };
          next = [merged, ...prev.filter((_, i) => i !== existingIndex)];
        } else {
          next = [repository, ...prev];
        }
        if (next.length > MAX_LOCAL_REPOSITORIES) {
          // Trim the oldest by lastOpenedAt, but never drop the active one.
          const sorted = [...next].sort(
            (a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt)
          );
          next = sorted.slice(0, MAX_LOCAL_REPOSITORIES);
        }
        return next;
      });
    },
    [setRepositories]
  );

  const removeRepository = useCallback(
    (repositoryId) => {
      setRepositories((prev) => prev.filter((r) => r.repositoryId !== repositoryId));
      setCurrentRepositoryIdState((prevId) =>
        prevId === repositoryId ? null : prevId
      );
    },
    [setRepositories, setCurrentRepositoryIdState]
  );

  const clearRepositories = useCallback(() => {
    setRepositories([]);
    setCurrentRepositoryIdState(null);
  }, [setRepositories, setCurrentRepositoryIdState]);

  const touchRepository = useCallback(
    (repositoryId) => {
      setRepositories((prev) =>
        prev.map((r) =>
          r.repositoryId === repositoryId
            ? { ...r, lastOpenedAt: new Date().toISOString() }
            : r
        )
      );
    },
    [setRepositories]
  );

  const currentRepository = useMemo(
    () => repositories.find((r) => r.repositoryId === currentRepositoryId) || null,
    [repositories, currentRepositoryId]
  );

  const value = useMemo(
    () => ({
      repositories,
      currentRepositoryId,
      currentRepository,
      setCurrentRepository,
      addRepository,
      removeRepository,
      clearRepositories,
      touchRepository
    }),
    [
      repositories,
      currentRepositoryId,
      currentRepository,
      setCurrentRepository,
      addRepository,
      removeRepository,
      clearRepositories,
      touchRepository
    ]
  );

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositoryContext() {
  const ctx = useContext(RepositoryContext);
  if (!ctx) {
    throw new Error(
      "useRepositoryContext must be used within a RepositoryProvider"
    );
  }
  return ctx;
}