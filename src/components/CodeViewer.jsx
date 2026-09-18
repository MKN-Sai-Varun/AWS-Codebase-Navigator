import EmptyState from "./EmptyState.jsx";
import LoadingState from "./LoadingState.jsx";
import { FileCode } from "lucide-react";

export default function CodeViewer({ file, loading }) {
  if (loading) return <LoadingState message="Loading file…" />;

  if (!file) {
    return (
      <EmptyState
        icon={FileCode}
        title="No file selected."
        description="Choose a file from the repository explorer."
      />
    );
  }

  const lines = (file.content || "").split("\n");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="code-header">{file.path}</div>
      <div className="code-body">
        {lines.map((line, index) => (
          <div className="code-line" key={index}>
            <span className="code-line-number">{index + 1}</span>
            <span className="code-line-content">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}