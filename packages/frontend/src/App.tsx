/**
 * Main Application Component
 * Handles routing and layout with code splitting
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from './components/AppShell';

// Lazy load page components for code splitting
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ConceptEditorPage = lazy(() => import('./pages/ConceptEditorPage').then(m => ({ default: m.ConceptEditorPage })));
const TemplateBrowserPage = lazy(() => import('./pages/TemplateBrowserPage').then(m => ({ default: m.TemplateBrowserPage })));
const HealthPage = lazy(() => import('./pages/HealthPage').then(m => ({ default: m.HealthPage })));
const TutorialPage = lazy(() => import('./pages/TutorialPage').then(m => ({ default: m.TutorialPage })));
const ProjectArchitectPage = lazy(() => import('./pages/ProjectArchitectPage').then(m => ({ default: m.ProjectArchitectPage })));

import { JewelSpinner } from './components/JewelSpinner';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <JewelSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// Animated routes component
function AnimatedRoutes() {
  const location = useLocation();

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 1.02
    }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ConceptEditorPage />} />
          <Route path="/projects/:projectId/architect" element={<ProjectArchitectPage />} />
          <Route path="/templates" element={<TemplateBrowserPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AppShell>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatedRoutes />
        </Suspense>
      </AppShell>
    </Router>
  );
}

export default App;
