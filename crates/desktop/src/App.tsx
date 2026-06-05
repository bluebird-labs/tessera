import { HashRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./app-shell";
import { ProjectPicker } from "./project-picker";
import { ProjectScreen } from "./project-screen";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ProjectPicker />} />
        <Route path="/project/:id" element={<ProjectScreen />} />
        <Route path="/demo" element={<AppShell />} />
      </Routes>
    </HashRouter>
  );
}
