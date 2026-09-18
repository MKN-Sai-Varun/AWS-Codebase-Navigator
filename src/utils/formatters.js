export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function formatRepositoryName(repository) {
  if (!repository) return "Untitled repository";
  if (repository.name) return repository.name;
  try {
    const url = new URL(repository.url);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[1] || parts[0] || repository.url;
  } catch {
    return repository.url || "Untitled repository";
  }
}

export function formatFileCount(count) {
  if (typeof count !== "number" || Number.isNaN(count)) return "— files";
  return `${count} file${count === 1 ? "" : "s"}`;
}

export function truncateText(text, maxLength = 80) {
  if (typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}