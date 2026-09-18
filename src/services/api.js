// This is the ONLY file that should know the API Gateway base URL.
// All backend communication for the app goes through the functions here.

const API_URL = import.meta.env.VITE_API_URL;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new ApiError(
      "VITE_API_URL is not configured. Set it in your .env file.",
      0
    );
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
  } catch {
    throw new ApiError("Unable to connect to the backend.", 0);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      (body && (body.message || body.error)) ||
      "Something went wrong while processing the request.";
    throw new ApiError(message, response.status);
  }

  return body;
}

export function analyzeRepository(repoUrl) {
  return request("/analyze", {
    method: "POST",
    body: JSON.stringify({ repoUrl })
  });
}

export function getRepository(repositoryId) {
  return request(`/repository/${encodeURIComponent(repositoryId)}`, {
    method: "GET"
  });
}

export function getFile(repositoryId, filePath) {
  const query = new URLSearchParams({ path: filePath }).toString();
  return request(
    `/repository/${encodeURIComponent(repositoryId)}/file?${query}`,
    { method: "GET" }
  );
}

export function askQuestion(repositoryId, question) {
  return request("/ask", {
    method: "POST",
    body: JSON.stringify({ repositoryId, question })
  });
}

export { ApiError };