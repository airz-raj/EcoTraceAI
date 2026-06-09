/**
 * EcoTrace AI — Navigation Bar
 *
 * Responsive navbar with glassmorphism styling,
 * dark mode toggle, and active link highlighting.
 */

import { NavLink } from 'react-router-dom';
import { useCarbonContext } from '../../context/CarbonContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/calculator', label: 'Calculator', icon: '🧮' },
  { path: '/parser', label: 'Bill Parser', icon: '📄' },
  { path: '/digital', label: 'Digital Tracker', icon: '💻' },
];

export function Navbar() {
  const { state, toggleDarkMode } = useCarbonContext();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 glass-card-static"
      style={{
        borderRadius: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2 text-xl font-bold no-underline"
            aria-label="EcoTrace AI Home"
          >
            <span className="text-2xl" role="img" aria-hidden="true">🌍</span>
            <span className="gradient-text">EcoTrace AI</span>
          </NavLink>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1" role="menubar">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-1.5 text-sm ${isActive ? 'active' : ''}`
                }
                role="menuitem"
              >
                <span role="img" aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label={state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={state.darkMode ? 'Light mode' : 'Dark mode'}
            >
              {state.darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto gap-1 pb-2 -mx-1 px-1" role="menubar">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link flex items-center gap-1 text-xs whitespace-nowrap ${isActive ? 'active' : ''}`
              }
              role="menuitem"
            >
              <span role="img" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
