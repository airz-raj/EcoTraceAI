/**
 * EcoTrace AI — Dashboard Page
 */

import { CarbonSummaryCard } from '../components/dashboard/CarbonSummaryCard';
import { TrendChart } from '../components/dashboard/TrendChart';
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown';
import { EcoStreakCalendar } from '../components/dashboard/EcoStreakCalendar';
import { InsightPanel } from '../components/insights/InsightPanel';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-1">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-slate-400">
          Track, analyze, and reduce your carbon footprint
        </p>
      </header>

      <CarbonSummaryCard />

      <EcoStreakCalendar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart />
        <CategoryBreakdown />
      </div>

      <InsightPanel />
    </div>
  );
}
