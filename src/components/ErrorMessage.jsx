export default function ErrorMessage({ title = "Something went wrong.", hints = [], onRetry }) {
  return (
    <div className="error-block">
      <div className="error-block-title">{title}</div>
      {hints.length > 0 && (
        <ul>
          {hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      )}
      {onRetry && (
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-secondary" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}