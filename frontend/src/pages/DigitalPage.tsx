/**
 * EcoTrace AI — Digital Tracker Page
 *
 * Combines:
 * - Web-based Device Simulator (no CLI needed!)
 * - CLI Agent integration card (for advanced users)
 */

import { useState } from 'react';
import { DeviceSimulator } from '../components/digital/DeviceSimulator';
import { DeviceFootprintCard } from '../components/digital/DeviceFootprintCard';

type TabId = 'simulator' | 'cli';

export function DigitalPage() {
  const [activeTab, setActiveTab] = useState<TabId>('simulator');

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-1">
          <span className="gradient-text">Digital Infrastructure Tracker</span>
        </h1>
        <p className="text-slate-400">
          Monitor your device's energy consumption and carbon emissions
        </p>
      </header>

      {/* Tab Toggle */}
      <div
        className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit"
        role="tablist"
        aria-label="Digital tracker mode"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'simulator'}
          aria-controls="panel-simulator"
          id="tab-simulator"
          onClick={() => setActiveTab('simulator')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🖥️ Web Simulator
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'cli'}
          aria-controls="panel-cli"
          id="tab-cli"
          onClick={() => setActiveTab('cli')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'cli'
              ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          ⌨️ CLI Agent
        </button>
      </div>

      {/* Simulator Panel */}
      <div
        id="panel-simulator"
        role="tabpanel"
        aria-labelledby="tab-simulator"
        hidden={activeTab !== 'simulator'}
      >
        {activeTab === 'simulator' && <DeviceSimulator />}
      </div>

      {/* CLI Panel */}
      <div
        id="panel-cli"
        role="tabpanel"
        aria-labelledby="tab-cli"
        hidden={activeTab !== 'cli'}
      >
        {activeTab === 'cli' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DeviceFootprintCard data={null} />

            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">How It Works</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="text-emerald-400 font-bold text-lg">1</span>
                  <div>
                    <p className="text-sm text-white font-medium">Install the CLI Agent</p>
                    <p className="text-xs text-slate-400">
                      Navigate to <code className="text-emerald-400">cli-agent</code> and run{' '}
                      <code className="text-emerald-400">pip install -r requirements.txt</code>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-emerald-400 font-bold text-lg">2</span>
                  <div>
                    <p className="text-sm text-white font-medium">Run the Agent</p>
                    <p className="text-xs text-slate-400">
                      Execute <code className="text-emerald-400">python ecotrace_agent.py --country IN</code>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-emerald-400 font-bold text-lg">3</span>
                  <div>
                    <p className="text-sm text-white font-medium">View Results</p>
                    <p className="text-xs text-slate-400">
                      Collects real CPU/RAM metrics, estimates power draw, calculates CO₂
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-white/3 border border-white/5">
                <p className="text-xs text-slate-400 mb-2">
                  <strong className="text-emerald-400">🔒 Security Note:</strong>
                </p>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                  <li>Uses <code className="text-slate-300">psutil</code> + <code className="text-slate-300">py-cpuinfo</code> — no subprocess calls</li>
                  <li>No sudo or admin privileges required</li>
                  <li>Generates safe text guidelines, never executable scripts</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
