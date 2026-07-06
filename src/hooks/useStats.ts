import { useCallback, useEffect, useReducer } from 'react';
import type { AppStats, Session } from '../types';

const STORAGE_KEY = 'hemato_stats_v3';

const initialStats: AppStats = {
  totalQ: 0,
  totalOk: 0,
  streak: 0,
  lastDate: '',
  sessions: [],
  byTema: {},
  flashRatings: {},
};

type Action =
  | { type: 'hydrate'; payload: AppStats }
  | { type: 'addQuizResult'; payload: { tema: string; ok: boolean } }
  | { type: 'addSession'; payload: Session }
  | { type: 'rateFlash'; payload: { key: string; rating: string } }
  | { type: 'reset' };

function readStats(): AppStats {
  if (typeof window === 'undefined') {
    return initialStats;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialStats;
    }

    const parsed = JSON.parse(raw) as Partial<AppStats>;
    return {
      ...initialStats,
      ...parsed,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      byTema: parsed.byTema && typeof parsed.byTema === 'object' ? parsed.byTema : {},
      flashRatings: parsed.flashRatings && typeof parsed.flashRatings === 'object' ? parsed.flashRatings : {},
    };
  } catch {
    return initialStats;
  }
}

function calculateStreak(prev: AppStats, today: string): number {
  if (prev.lastDate === today) {
    return prev.streak;
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  if (!prev.lastDate) {
    return 1;
  }

  return prev.lastDate === yesterday ? (prev.streak || 0) + 1 : 1;
}

function reducer(state: AppStats, action: Action): AppStats {
  switch (action.type) {
    case 'hydrate':
      return action.payload;

    case 'addQuizResult': {
      const today = new Date().toDateString();
      const byTema = {
        ...state.byTema,
        [action.payload.tema]: {
          q: (state.byTema[action.payload.tema]?.q || 0) + 1,
          ok: (state.byTema[action.payload.tema]?.ok || 0) + (action.payload.ok ? 1 : 0),
        },
      };

      return {
        ...state,
        totalQ: state.totalQ + 1,
        totalOk: state.totalOk + (action.payload.ok ? 1 : 0),
        streak: calculateStreak(state, today),
        lastDate: today,
        byTema,
      };
    }

    case 'addSession':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
      };

    case 'rateFlash':
      return {
        ...state,
        flashRatings: {
          ...state.flashRatings,
          [action.payload.key]: action.payload.rating,
        },
      };

    case 'reset':
      return initialStats;

    default:
      return state;
  }
}

export function useStats() {
  const [stats, dispatch] = useReducer(reducer, undefined, readStats);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats]);

  const addQuizResult = useCallback((tema: string, ok: boolean) => {
    dispatch({ type: 'addQuizResult', payload: { tema, ok } });
  }, []);

  const addSession = useCallback((session: Session) => {
    dispatch({ type: 'addSession', payload: session });
  }, []);

  const rateFlash = useCallback((key: string, rating: string) => {
    dispatch({ type: 'rateFlash', payload: { key, rating } });
  }, []);

  const resetStats = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  return {
    stats,
    addQuizResult,
    addSession,
    rateFlash,
    resetStats,
  };
}
