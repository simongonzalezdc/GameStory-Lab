/**
 * Main Application Component
 * Handles routing and layout with code splitting
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

// Lazy load page components for code splitting
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ConceptEditorPage = lazy(() => import('./pages/ConceptEditorPage').then(m => ({ default: m.ConceptEditorPage })));
const TemplateBrowserPage = lazy(() => import('./pages/TemplateBrowserPage').then(m => ({ default: m.TemplateBrowserPage })));
const HealthPage = lazy(() => import('./pages/HealthPage').then(m => ({ default: m.HealthPage })));
const TutorialPage = lazy(() => import('./pages/TutorialPage').then(m => ({ default: m.TutorialPage })));
const ProjectArchitectPage = lazy(() => import('./pages/ProjectArchitectPage').then(m => ({ default: m.ProjectArchitectPage })));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ConceptEditorPage />} />
            <Route path="/projects/:projectId/architect" element={<ProjectArchitectPage />} />
            <Route path="/templates" element={<TemplateBrowserPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/tutorial" element={<TutorialPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
