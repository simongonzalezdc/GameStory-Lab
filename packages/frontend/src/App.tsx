/**
 * Main Application Component
 * Handles routing and layout
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProjectsPage } from './pages/ProjectsPage';
import { ConceptEditorPage } from './pages/ConceptEditorPage';
import { TemplateBrowserPage } from './pages/TemplateBrowserPage';
import { HealthPage } from './pages/HealthPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ConceptEditorPage />} />
          <Route path="/templates" element={<TemplateBrowserPage />} />
          <Route path="/health" element={<HealthPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
