/**
 * EcoTrace AI — Footer Component
 */

export function Footer() {
  return (
    <footer
      className="mt-auto py-8 px-4 text-center text-sm text-slate-500"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        <p className="mb-2">
          <span className="gradient-text font-semibold">EcoTrace AI</span>{' '}
          — 100% Free, Open Source, Privacy-First
        </p>
        <p className="text-xs text-slate-600">
          Emission factors sourced from IPCC AR6, UK BEIS 2023, India CEA 2022, EPA eGRID 2023.
          <br />
          No paid APIs. No account required. Your data stays on your device.
        </p>
      </div>
    </footer>
  );
}
