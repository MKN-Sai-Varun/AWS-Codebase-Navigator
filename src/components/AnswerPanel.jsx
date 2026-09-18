import ReactMarkdown from "react-markdown";
import LoadingState from "./LoadingState.jsx";

export default function AnswerPanel({ answer, loading }) {
  if (loading) return <LoadingState message="Generating answer…" />;
  if (!answer) return null;

  return (
    <div className="panel answer-panel">
      <div className="panel-header">
        <span className="panel-title">Answer</span>
      </div>
      <div className="panel-body answer-body">
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>
    </div>
  );
}