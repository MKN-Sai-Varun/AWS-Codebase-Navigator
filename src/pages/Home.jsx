import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import RepoInput from "../components/RepoInput.jsx";

export default function Home() {
  const [loading, setLoading] = useState(false);

  function handleAnalyze(url) {
    console.log("Would analyze:", url);
    setLoading(true);
    setTimeout(() => setLoading(false), 800); // fake delay
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
            dependencies and behavior — then ask questions and get answers
            grounded in the actual source.
          </p>
          <RepoInput onAnalyze={handleAnalyze} loading={loading} />
        </div>
      </div>
    </div>
  );
}