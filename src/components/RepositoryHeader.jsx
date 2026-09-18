import { ExternalLink } from "lucide-react";
import AnalysisStatus from "./AnalysisStatus.jsx";
import { formatFileCount } from "../utils/formatters.js";

export default function RepositoryHeader({ repository }) {
  if (!repository) return null;

  return (
    <div className="repo-header">
      <div>
        <h1>{repository.name}</h1>
        <div className="repo-header-url">{repository.url}</div>
      </div>

      <div className="repo-header-right">
        <AnalysisStatus status={repository.status} />

        <div className="repo-header-count">
          {formatFileCount(repository.fileCount)}
        </div>

        <a
          href={repository.url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Open GitHub <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}