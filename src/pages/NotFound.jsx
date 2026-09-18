import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function NotFound() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="not-found">
        <div className="code">404</div>
        <p>This page does not exist.</p>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    </div>
  );
}