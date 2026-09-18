export default function RelevantFiles({ files, onSelect }) {
  if (!files || files.length === 0) return null;

  return (
    <div className="panel relevant-files">
      <div className="panel-header">
        <span className="panel-title">Relevant files</span>
      </div>
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {files.map((file) => (
          <div
            key={file.path}
            className="relevant-file-item"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(file.path)}
            onKeyDown={(event) => event.key === "Enter" && onSelect(file.path)}
          >
            <span className="relevant-file-path">{file.path}</span>
            {file.reason ? <span className="relevant-file-reason">{file.reason}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}