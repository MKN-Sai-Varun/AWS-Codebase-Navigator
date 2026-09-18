import { useState } from "react";
import { isValidGitHubUrl } from "../utils/validators.js";

export default function RepoInput({ onAnalyze, loading }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a GitHub repository URL.");
      return;
    }
    if (!isValidGitHubUrl(trimmed)) {
      setError("Enter a valid public GitHub repository URL, e.g. https://github.com/owner/repo");
      return;
    }
    setError("");
    onAnalyze(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="repo-input-row">
        <input
          type="text"
          className={`text-input${error ? " has-error" : ""}`}
          placeholder="https://github.com/owner/repository"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) setError("");
          }}
          disabled={loading}
          aria-label="GitHub repository URL"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Analyzing…" : "Analyze repository"}
        </button>
      </div>
      {error ? <div className="field-error">{error}</div> : null}
    </form>
  );
}