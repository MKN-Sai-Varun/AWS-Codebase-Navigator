import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ArrowUpRight } from "lucide-react";
import { formatDate, formatFileCount, formatRepositoryName } from "../utils/formatters.js";
import EmptyState from "./EmptyState.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function RepositoryHistory({ repositories, onOpen, onDelete, onClear }) {
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  function openRepository(repositoryId) {
    onOpen(repositoryId);
    navigate(`/repository/${repositoryId}`);
  }

  if (repositories.length === 0) {
    return (
      <EmptyState
        title="No repositories analyzed yet."
        description="Paste a GitHub URL above to get started."
      />
    );
  }

  return (
    <>
      <div className="history-list">
        {repositories.map((repo) => (
          <div className="history-item" key={repo.repositoryId}>
            <div
              className="history-item-main"
              role="button"
              tabIndex={0}
              onClick={() => openRepository(repo.repositoryId)}
              onKeyDown={(event) => {
                if (event.key === "Enter") openRepository(repo.repositoryId);
              }}
              style={{ cursor: "pointer", flex: 1, minWidth: 0 }}
            >
              <div className="history-item-name">{formatRepositoryName(repo)}</div>
              <div className="history-item-url">{repo.url}</div>
              <div className="history-item-meta">
                {formatFileCount(repo.fileCount)} · analyzed {formatDate(repo.createdAt)}
              </div>
            </div>
            <div className="history-item-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => openRepository(repo.repositoryId)}
                aria-label={`Open ${formatRepositoryName(repo)}`}
              >
                <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPendingDelete(repo.repositoryId)}
                aria-label={`Delete ${formatRepositoryName(repo)} from history`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {repositories.length > 1 && (
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmClear(true)}>
            Clear history
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this repository?"
        description="This only removes it from your browser history. It does not delete the analysis stored in AWS."
        confirmLabel="Remove"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          onDelete(pendingDelete);
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Clear repository history?"
        description="This clears every repository from your browser history. It does not delete analyses stored in AWS."
        confirmLabel="Clear all"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          onClear();
          setConfirmClear(false);
        }}
      />
    </>
  );
}