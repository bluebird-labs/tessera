import { HashRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./app-shell";
import { ProjectPicker } from "./project-picker";
import { ProjectScreen } from "./project-screen";
import { WorkspaceDemo } from "./workspace/WorkspaceDemo";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ProjectPicker />} />
        <Route path="/project/:id" element={<ProjectScreen />} />
        <Route path="/demo" element={<AppShell />} />
        <Route path="/workspace-demo" element={<WorkspaceDemo />} />
      </Routes>
    </HashRouter>
  );
}
