import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import RepositoryHeader from "../components/RepositoryHeader.jsx";
import FileExplorer from "../components/FileExplorer.jsx";
import CodeViewer from "../components/CodeViewer.jsx";
import DependencyGraph from "../components/DependencyGraph.jsx";
import QuestionBox from "../components/QuestionBox.jsx";
import AnswerPanel from "../components/AnswerPanel.jsx";
import RelevantFiles from "../components/RelevantFiles.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { ToastStack } from "../components/Toast.jsx";
import { useRepositories } from "../hooks/useRepositories.js";
import { getRepository, getFile, askQuestion, ApiError } from "../services/api.js";
import { TABS } from "../utils/constants.js";

export default function Repository() {
  const { repositoryId } = useParams();
  const navigate = useNavigate();
  const { repositories, setCurrentRepository, removeRepository, touchRepository } =
    useRepositories();

  const localRepo = repositories.find((r) => r.repositoryId === repositoryId) || null;

  const [repoDetail, setRepoDetail] = useState(null);
  const [loadingRepo, setLoadingRepo] = useState(true);
  const [repoError, setRepoError] = useState(null);
  const [staleNotice, setStaleNotice] = useState(false);

  const [activeTab, setActiveTab] = useState(TABS.FILES);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [relevantFiles, setRelevantFiles] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState(null);

  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message) => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Reset repository-specific temporary state whenever the route's
  // repositoryId changes, so switching repos never mixes their data.
  useEffect(() => {
    setCurrentRepository(repositoryId);
    touchRepository(repositoryId);
    setActiveTab(TABS.FILES);
    setSelectedFile(null);
    setFileData(null);
    setQuestion("");
    setAnswer(null);
    setRelevantFiles([]);
    setAskError(null);
    setStaleNotice(false);
  }, [repositoryId, setCurrentRepository, touchRepository]);

  const loadRepository = useCallback(async () => {
    setLoadingRepo(true);
    setRepoError(null);
    try {
      const data = await getRepository(repositoryId);
      setRepoDetail(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setStaleNotice(true);
      } else {
        const message =
          err instanceof ApiError
            ? err.message
            : "Something went wrong while processing the request.";
        setRepoError(message);
      }
    } finally {
      setLoadingRepo(false);
    }
  }, [repositoryId]);

  useEffect(() => {
    loadRepository();
  }, [loadRepository]);

  // Stale local reference: backend has no record of this repository.
  useEffect(() => {
    if (!staleNotice) return;
    removeRepository(repositoryId);
    const timer = setTimeout(() => navigate("/"), 2200);
    return () => clearTimeout(timer);
  }, [staleNotice, repositoryId, removeRepository, navigate]);

  async function handleFileSelect(path) {
    setActiveTab(TABS.FILES);
    setSelectedFile(path);
    setLoadingFile(true);
    try {
      const data = await getFile(repositoryId, path);
      setFileData(data);
    } catch {
      setFileData(null);
      pushToast(`Could not load ${path}`);
    } finally {
      setLoadingFile(false);
    }
  }

  async function handleAsk(text) {
    setQuestion(text);
    setIsAsking(true);
    setAskError(null);
    try {
      const data = await askQuestion(repositoryId, text);
      setAnswer(data.answer);
      setRelevantFiles(data.relevantFiles || []);
    } catch (err) {
      // Keep the previous successful answer visible rather than clearing it.
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while processing the request.";
      setAskError(message);
    } finally {
      setIsAsking(false);
    }
  }

  const repository = repoDetail || localRepo;

  if (staleNotice) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="container" style={{ paddingTop: 40 }}>
          <ErrorMessage title="This repository analysis is no longer available. Please analyze the repository again." />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container">
        {loadingRepo && !repository ? (
          <LoadingState message="Loading repository…" />
        ) : repoError ? (
          <ErrorMessage title={repoError} onRetry={loadRepository} />
        ) : (
          <>
            <RepositoryHeader repository={repository} />

            <div className="workspace">
              <FileExplorer
                files={repoDetail?.files || []}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
              />

              <div className="panel main-panel">
                <div className="tabs">
                  <button
                    type="button"
                    className={`tab${activeTab === TABS.FILES ? " active" : ""}`}
                    onClick={() => setActiveTab(TABS.FILES)}
                  >
                    Files
                  </button>
                  <button
                    type="button"
                    className={`tab${activeTab === TABS.GRAPH ? " active" : ""}`}
                    onClick={() => setActiveTab(TABS.GRAPH)}
                  >
                    Graph
                  </button>
                </div>
                <div className="main-panel-body">
                  {activeTab === TABS.FILES ? (
                    <CodeViewer file={fileData} loading={loadingFile} />
                  ) : (
                    <DependencyGraph graph={repoDetail?.graph} onNodeSelect={handleFileSelect} />
                  )}
                </div>
              </div>
            </div>

            <div className="qa-section">
              <QuestionBox onAsk={handleAsk} loading={isAsking} />
              {askError ? (
                <div style={{ marginTop: 12 }}>
                  <ErrorMessage title={askError} />
                </div>
              ) : null}
              <AnswerPanel answer={answer} loading={isAsking && !answer} />
              <RelevantFiles files={relevantFiles} onSelect={handleFileSelect} />
            </div>

            <div className="page-bottom-space" />
          </>
        )}
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}