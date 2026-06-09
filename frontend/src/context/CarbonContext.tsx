/**
 * EcoTrace AI — Application State Context
 *
 * Centralized state management using React Context + useReducer.
 * Zero external dependencies — pure React patterns.
 */

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction, CarbonEntry, AIInsightResponse } from '../types';

// ─── Initial State ───────────────────────────────────────────

const STORAGE_KEY = 'ecotrace_state';

function loadPersistedState(): Partial<AppState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        entries: parsed.entries ?? [],
        userCountry: parsed.userCountry ?? 'IN',
        darkMode: parsed.darkMode ?? false,
      };
    }
  } catch {
    // Silently fail — localStorage may be unavailable
  }
  return {};
}

const persisted = loadPersistedState();

const initialState: AppState = {
  entries: persisted.entries ?? [],
  currentEntry: null,
  userCountry: persisted.userCountry ?? 'IN',
  isLoading: false,
  error: null,
  insights: null,
  darkMode: persisted.darkMode ?? false,
};

// ─── Reducer ─────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [action.payload, ...state.entries],
        currentEntry: null,
        isLoading: false,
      };

    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
        currentEntry: null,
      };

    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.payload),
      };

    case 'SET_CURRENT_ENTRY':
      return { ...state, currentEntry: action.payload };

    case 'SET_COUNTRY':
      return { ...state, userCountry: action.payload };

    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload, isLoading: false };

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    case 'LOAD_ENTRIES':
      return { ...state, entries: action.payload, isLoading: false };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────

interface CarbonContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  /** Convenience: add a new carbon entry */
  addEntry: (entry: CarbonEntry) => void;
  /** Convenience: delete an entry by ID */
  deleteEntry: (id: string) => void;
  /** Convenience: set AI insights */
  setInsights: (insights: AIInsightResponse | null) => void;
  /** Convenience: toggle dark mode */
  toggleDarkMode: () => void;
  /** Convenience: set user country */
  setCountry: (country: string) => void;
}

const CarbonContext = createContext<CarbonContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────

interface CarbonProviderProps {
  children: ReactNode;
}

export function CarbonProvider({ children }: CarbonProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persist relevant state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          entries: state.entries,
          userCountry: state.userCountry,
          darkMode: state.darkMode,
        })
      );
    } catch {
      // Silently fail
    }
  }, [state.entries, state.userCountry, state.darkMode]);

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  const addEntry = (entry: CarbonEntry) => {
    dispatch({ type: 'ADD_ENTRY', payload: entry });
  };

  const deleteEntry = (id: string) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  };

  const setInsights = (insights: AIInsightResponse | null) => {
    dispatch({ type: 'SET_INSIGHTS', payload: insights });
  };

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  const setCountry = (country: string) => {
    dispatch({ type: 'SET_COUNTRY', payload: country });
  };

  return (
    <CarbonContext.Provider
      value={{
        state,
        dispatch,
        addEntry,
        deleteEntry,
        setInsights,
        toggleDarkMode,
        setCountry,
      }}
    >
      {children}
    </CarbonContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

/**
 * Access the Carbon context. Must be used within a CarbonProvider.
 *
 * @throws Error if used outside of CarbonProvider
 */
export function useCarbonContext(): CarbonContextType {
  const context = useContext(CarbonContext);
  if (!context) {
    throw new Error('useCarbonContext must be used within a CarbonProvider');
  }
  return context;
}
