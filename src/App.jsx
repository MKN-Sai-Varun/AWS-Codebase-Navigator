import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Repository from "./pages/Repository.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/repository/:repositoryId" element={<Repository />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}