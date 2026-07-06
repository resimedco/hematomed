import { useMemo } from 'react';
import { TEMAS } from '../data/temas';
import { useStats } from '../hooks/useStats';
import type { AppTab } from '../types';

interface StatsProps {
  onNavigate: (tab: AppTab) => void;
}

function Stats({ onNavigate }: StatsProps) {
  const { stats, resetStats } = useStats();

  const accuracy = useMemo(() => {
    if (stats.totalQ === 0) {
      return 0;
    }
    return Math.round((stats.totalOk / stats.totalQ) * 100);
  }, [stats.totalQ, stats.totalOk]);

  const bestSession = useMemo(() => {
    if (stats.sessions.length === 0) {
      return 0;
    }
    return Math.max(...stats.sessions.map((session) => session.score));
  }, [stats.sessions]);

  const renderMetricCard = (label: string, value: string | number, accent?: boolean) => (
    <div
      key={label}
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(15,27,45,0.06), 0 1px 2px rgba(15,27,45,0.04)',
        border: '1px solid #EDEAE4',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 3,
          background: accent ? 'linear-gradient(90deg, #8B1A2E 0%, #C9A84C 100%)' : 'linear-gradient(90deg, #0F1B2D 0%, #1E3050 100%)',
        }}
      />
      <div style={{ padding: '0.95rem 1rem 0.85rem' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0F1B2D', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10.5, color: '#7A8FA0', marginTop: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 18 }}>
        {renderMetricCard('Total preguntas', stats.totalQ, true)}
        {renderMetricCard('Promedio global', `${accuracy}%`)}
        {renderMetricCard('Mejor sesión', `${bestSession}%`)}
        {renderMetricCard('Racha actual', `${stats.streak || 0}`)}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Progreso por tema
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #EDEAE4', borderRadius: 14, padding: '0.85rem', boxShadow: '0 1px 3px rgba(15,27,45,0.06)' }}>
          {TEMAS.map((tema) => {
            const current = stats.byTema[tema.id] || { q: 0, ok: 0 };
            const pct = current.q > 0 ? Math.round((current.ok / current.q) * 100) : 0;
            const fillColor = pct >= 80 ? '#1A5E3A' : pct >= 60 ? '#8B1A2E' : '#C9A84C';
            return (
              <div key={tema.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 110, fontSize: 11, fontWeight: 600, color: '#3A4F63', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }} title={tema.name}>
                  {tema.name}
                </div>
                <div style={{ flex: 1, height: 22, background: '#F7F5F2', borderRadius: 6, overflow: 'hidden', border: '1px solid #EDEAE4', minWidth: 0 }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, transition: 'width 0.65s ease', background: fillColor }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7A8FA0', minWidth: 36, textAlign: 'right' }}>{current.q > 0 ? `${pct}%` : '—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Historial de sesiones
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #EDEAE4', borderRadius: 14, padding: '0.85rem', boxShadow: '0 1px 3px rgba(15,27,45,0.06)' }}>
          {stats.sessions.length === 0 ? (
            <div style={{ fontSize: 14, color: '#7A8FA0', textAlign: 'center', padding: '1.25rem' }}>Completa tu primer quiz para ver el historial.</div>
          ) : (
            stats.sessions.slice(0, 10).map((session, index) => (
              <div key={`${session.date}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: index > 0 ? '1px solid #EDEAE4' : 'none' }}>
                <div style={{ fontSize: 12, color: '#7A8FA0', fontWeight: 600, minWidth: 72 }}>{session.date}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 6, background: '#F7F5F2', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${session.score}%`, height: '100%', borderRadius: 3, background: session.score >= 80 ? '#1A5E3A' : session.score >= 60 ? '#8B1A2E' : '#C9A84C', transition: 'width 0.45s ease' }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F1B2D', minWidth: 40, textAlign: 'right' }}>{session.score}%</div>
                <div style={{ fontSize: 11, color: '#7A8FA0' }}>{session.ok}/{session.total}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button type="button" onClick={() => onNavigate('home')} style={{ background: '#FFFFFF', color: '#0F1B2D', border: '1px solid #EDEAE4', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <i className="ti ti-home-2" style={{ marginRight: 6 }} />Inicio
        </button>
        <button type="button" onClick={() => { if (window.confirm('¿Reiniciar todas las estadísticas?')) resetStats(); }} style={{ background: 'linear-gradient(135deg, #8B1A2E 0%, #A8243A 100%)', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <i className="ti ti-refresh" style={{ marginRight: 6 }} />Reiniciar
        </button>
      </div>
    </div>
  );
}

export default Stats;
