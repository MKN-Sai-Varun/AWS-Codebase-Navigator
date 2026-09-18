import { useRepositoryContext } from "../context/RepositoryContext.jsx";

// Thin, readable wrapper around RepositoryContext for components that
// only need repository-management operations.
export function useRepositories() {
  const {
    repositories,
    currentRepositoryId,
    currentRepository,
    setCurrentRepository,
    addRepository,
    removeRepository,
    clearRepositories,
    touchRepository
  } = useRepositoryContext();

  return {
    getRepositories: () => repositories,
    repositories,
    addRepository,
    removeRepository,
    clearRepositories,
    setCurrentRepository,
    getCurrentRepository: () => currentRepository,
    currentRepository,
    currentRepositoryId,
    touchRepository
  };
}