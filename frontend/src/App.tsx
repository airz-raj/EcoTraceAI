/**
 * EcoTrace AI — Main Application
 *
 * React Router v6 with 5 main pages:
 * - Dashboard (overview + charts + streak calendar + insights)
 * - Calculator (transport, food, energy, shopping forms)
 * - Bill Parser (OCR → carbon footprint pipeline)
 * - Digital Tracker (web simulator + CLI agent)
 * - Impact Hub (carbon budget, what-if scenarios, climate action)
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CarbonProvider } from './context/CarbonContext';
import { SkipToMain } from './components/layout/SkipToMain';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Lazy load pages for code splitting
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const CalculatorPage = React.lazy(() => import('./pages/CalculatorPage').then(module => ({ default: module.CalculatorPage })));
const ParserPage = React.lazy(() => import('./pages/ParserPage').then(module => ({ default: module.ParserPage })));
const DigitalPage = React.lazy(() => import('./pages/DigitalPage').then(module => ({ default: module.DigitalPage })));
const ImpactHubPage = React.lazy(() => import('./pages/ImpactHubPage').then(module => ({ default: module.ImpactHubPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" aria-label="Loading page..."></div>
    </div>
  );
}

export default function App() {
  return (
    <CarbonProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <SkipToMain />
          <Navbar />

          <main id="main-content" className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/parser" element={<ParserPage />} />
                <Route path="/digital" element={<DigitalPage />} />
                <Route path="/impact" element={<ImpactHubPage />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </CarbonProvider>
  );
}
