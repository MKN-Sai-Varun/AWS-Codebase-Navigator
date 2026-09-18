import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import RepoInput from "../components/RepoInput.jsx";
import RepositoryHistory from "../components/RepositoryHistory.jsx";
import { ToastStack } from "../components/Toast.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useRepositories } from "../hooks/useRepositories.js";
import { analyzeRepository, ApiError } from "../services/api.js";
import { formatRepositoryName } from "../utils/formatters.js";

export default function Home() {
  const navigate = useNavigate();
  const { repositories, addRepository, removeRepository, clearRepositories, setCurrentRepository } =
    useRepositories();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  function pushToast(message) {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  async function handleAnalyze(url) {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeRepository(url);
      const now = new Date().toISOString();
      const repository = {
        repositoryId: data.repositoryId,
        name: data.name,
        url: data.url || url,
        status: data.status,
        fileCount: data.fileCount ?? 0,
        createdAt: now,
        lastOpenedAt: now
      };
      addRepository(repository);
      setCurrentRepository(repository.repositoryId);
      pushToast(`${formatRepositoryName(repository)} added`);
      navigate(`/repository/${repository.repositoryId}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while processing the request.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container">
        <div className="hero">
          <div className="hero-eyebrow">GitHub → analysis → grounded Q&amp;A</div>
          <h1>Understand any codebase</h1>
          <p>
            Paste a public GitHub repository and explore its structure,
            dependencies and behavior, then ask questions and get answers
            grounded in the actual source.
          </p>
          <RepoInput onAnalyze={handleAnalyze} loading={loading} />
          {error ? (
            <div style={{ marginTop: 16 }}>
              <ErrorMessage
                title="Unable to analyze this repository."
                hints={[
                  "The URL is correct.",
                  "The repository is public.",
                  "GitHub can be reached."
                ]}
                onRetry={() => setError(null)}
              />
            </div>
          ) : null}
        </div>

        <div className="section-heading">
          <h2>Recent repositories</h2>
        </div>
        <RepositoryHistory
          repositories={repositories}
          onOpen={setCurrentRepository}
          onDelete={removeRepository}
          onClear={clearRepositories}
        />
        <div className="page-bottom-space" />
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}