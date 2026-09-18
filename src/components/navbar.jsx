import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import { APP_NAME } from "../utils/constants.js";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <img src={logo} alt="" className="brand-mark" />
          <span className="brand-name">{APP_NAME}</span>
        </Link>
        <nav className="nav-links">
          <Link to="/">Home</Link>
        </nav>
      </div>
    </header>
  );
}