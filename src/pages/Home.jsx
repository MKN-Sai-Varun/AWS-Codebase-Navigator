import Navbar from "../components/Navbar.jsx";
import { useRepositories } from "../hooks/useRepositories.js";

export default function Home() {
  return (
    <div className="app-shell">
      <Navbar />

      <div className="container">
        <h1 style={{ marginTop: 60 }}>
          Home page placeholder
        </h1>
      </div>
    </div>
  );
}