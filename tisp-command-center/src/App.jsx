import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Radio, Shield } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Architecture from './components/Architecture';
import MISPNode from './components/MISPNode';
import TheHiveNode from './components/TheHiveNode';
import IdentityNode from './components/IdentityNode';
import AutomationNode from './components/AutomationNode';
import ProjectSettings from './components/ProjectSettings';
import TechnologyBlueprint from './components/TechnologyBlueprint';
import ModeIndicator from './components/ModeIndicator';
import NotFound from './components/NotFound';
import PlatformStatusBanner from './components/PlatformStatusBanner';
import LabWarningBanner from './components/LabWarningBanner';
import { PlatformProvider } from './state/PlatformContext';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';

const OpenCTINode = lazy(() => import('./components/OpenCTINode'));

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="flex h-full min-h-0 flex-col"
      >
        <Suspense
          fallback={
            <div className="flex h-full flex-1 items-center justify-center p-8">
              <div className="glass-panel px-5 py-4 text-sm font-semibold text-on-surface-muted">
                Loading module...
              </div>
            </div>
          }
        >
          <Routes location={location}>
            <Route path="/" element={<Overview />} />
            <Route path="/blueprint" element={<TechnologyBlueprint />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/misp" element={<MISPNode />} />
            <Route path="/opencti" element={<OpenCTINode />} />
            <Route path="/thehive" element={<TheHiveNode />} />
            <Route path="/identity" element={<ProtectedRoute requiredRole="admin"><IdentityNode /></ProtectedRoute>} />
            <Route path="/automation" element={<AutomationNode />} />
            <Route path="/settings" element={<ProjectSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <PlatformProvider>
      <Toaster position="top-right" richColors />
      <ProtectedRoute>
        <div className="flex h-screen min-h-screen bg-background text-on-surface font-main">
          <ModeIndicator />
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <LabWarningBanner />
            <PlatformStatusBanner />
            <div className="min-h-0 flex-1 overflow-hidden">
              <AnimatedRoutes />
            </div>

            <footer className="hidden h-12 items-center justify-between border-t border-outline bg-surface px-6 text-xs text-on-surface-muted lg:flex">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 size={14} /> Lab configuration validated
                </span>
                <span className="flex items-center gap-2">
                  <Radio size={14} /> MISP · OpenCTI · TheHive · Keycloak · n8n
                </span>
              </div>
              <span className="flex items-center gap-2 font-semibold text-on-surface">
                <Shield size={14} className="text-primary" /> SentinelMesh · Zero-trust auth · RS256/JWKS
              </span>
            </footer>
          </main>
        </div>
      </ProtectedRoute>
      </PlatformProvider>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
