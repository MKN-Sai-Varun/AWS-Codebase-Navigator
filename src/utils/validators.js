const GITHUB_URL_PATTERN =
  /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\/?$/;

export function isValidGitHubUrl(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return GITHUB_URL_PATTERN.test(trimmed);
}

export function isValidQuestion(question) {
  if (typeof question !== "string") return false;
  const trimmed = question.trim();
  return trimmed.length > 0 && trimmed.length <= 2000;
}