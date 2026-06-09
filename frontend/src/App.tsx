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

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CarbonProvider } from './context/CarbonContext';
import { SkipToMain } from './components/layout/SkipToMain';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DashboardPage } from './pages/DashboardPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { ParserPage } from './pages/ParserPage';
import { DigitalPage } from './pages/DigitalPage';
import { ImpactHubPage } from './pages/ImpactHubPage';

export default function App() {
  return (
    <CarbonProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <SkipToMain />
          <Navbar />

          <main id="main-content" className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/parser" element={<ParserPage />} />
              <Route path="/digital" element={<DigitalPage />} />
              <Route path="/impact" element={<ImpactHubPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </CarbonProvider>
  );
}
