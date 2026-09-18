import { useState } from "react";
import { isValidQuestion } from "../utils/validators.js";

const EXAMPLES = [
  "Where is authentication implemented?",
  "Where is the database connection created?",
  "Which files depend on AuthService?"
];

export default function QuestionBox({ onAsk, loading }) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!isValidQuestion(question)) {
      setError("Enter a question about this codebase.");
      return;
    }
    setError("");
    onAsk(question.trim());
  }

  return (
    <div className="panel panel-body">
      <div className="panel-title" style={{ marginBottom: 10 }}>Ask about this codebase</div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="question-row">
          <input
            type="text"
            className={`text-input${error ? " has-error" : ""}`}
            placeholder={EXAMPLES[0]}
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              if (error) setError("");
            }}
            disabled={loading}
            aria-label="Question about this codebase"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Generating answer…" : "Ask"}
          </button>
        </div>
        {error ? <div className="field-error">{error}</div> : null}
      </form>
    </div>
  );
}