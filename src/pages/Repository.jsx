import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function Repository() {
  const { repositoryId } = useParams();
  return (
    <div className="app-shell">
      <Navbar />
      <div className="container">
        <h1 style={{ marginTop: 60 }}>Repository page placeholder — id: {repositoryId}</h1>
      </div>
    </div>
  );
}