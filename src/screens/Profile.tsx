import { useEffect, useMemo, useState } from 'react';
import { TEMAS } from '../data/temas';
import { useStats } from '../hooks/useStats';
import { useTheme } from '../hooks/useTheme';

interface ProfileProps {
  onNavigate: (tab: string) => void;
}

function Profile({ onNavigate }: ProfileProps) {
  const { stats, resetStats } = useStats();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('hemato_username');
    if (stored) {
      setName(stored);
    }
  }, []);

  const handleChange = (value: string) => {
    setName(value);
    window.localStorage.setItem('hemato_username', value);
  };

  const initials = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'HM';
    }

    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [name]);

  const bestSession = useMemo(() => {
    if (stats.sessions.length === 0) {
      return 0;
    }
    return Math.max(...stats.sessions.map((session) => session.score));
  }, [stats.sessions]);

  const dominantTopic = useMemo(() => {
    const ranked = TEMAS.map((tema) => {
      const current = stats.byTema[tema.id] || { q: 0, ok: 0 };
      const pct = current.q > 0 ? Math.round((current.ok / current.q) * 100) : 0;
      return { name: tema.name, pct };
    }).filter((entry) => entry.pct > 80);

    return ranked[0]?.name || '—';
  }, [stats.byTema]);

  const calculateTopicMaturity = (q: number, ok: number) => {
    if (q === 0) {
      return { etiqueta: 'Nuevo', color: '#7A8FA0', bgColor: '#F0F2F5' };
    }

    const porcentaje = Math.round((ok / q) * 100);
    if (porcentaje >= 80) {
      return { etiqueta: 'Dominado', color: '#0F3D25', bgColor: '#EBF5EF' };
    }
    if (porcentaje >= 50) {
      return { etiqueta: 'Avanzando', color: '#6B5414', bgColor: '#FFF9E6' };
    }
    return { etiqueta: 'En construcción', color: '#6B0F22', bgColor: '#FAF0F2' };
  };

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
      <div style={{ height: 3, background: accent ? 'linear-gradient(90deg, #8B1A2E 0%, #C9A84C 100%)' : 'linear-gradient(90deg, #0F1B2D 0%, #1E3050 100%)' }} />
      <div style={{ padding: '0.95rem 1rem 0.85rem' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0F1B2D', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10.5, color: '#7A8FA0', marginTop: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #EDEAE4', borderRadius: 16, padding: '1rem' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Perfil</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, #0F1B2D 0%, #1E3050 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: 18, boxShadow: '0 6px 16px rgba(15,27,45,0.16)' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={name}
              onChange={(event) => handleChange(event.target.value)}
              placeholder="Ej. Dra. Lina"
              style={{ width: '100%', borderRadius: 10, border: '1px solid #EDEAE4', padding: '10px 12px', fontSize: 14, outline: 'none', color: '#0F1B2D', fontWeight: 700 }}
            />
            <div style={{ marginTop: 6, fontSize: 12, color: '#3A4F63' }}>Médico en formación · Hematomed</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#3A4F63', lineHeight: 1.5 }}>Este nombre aparecerá en la tarjeta que puedes compartir al finalizar un examen.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {renderMetricCard('Tema dominado', dominantTopic, true)}
        {renderMetricCard('Mejor sesión', `${bestSession}%`)}
        {renderMetricCard('Racha máxima', `${stats.streak || 0}`)}
        {renderMetricCard('Flashcards calificadas', Object.keys(stats.flashRatings).length)}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #EDEAE4', borderRadius: 16, padding: '1rem' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Tu perfil clínico</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {TEMAS.map((tema) => {
            const current = stats.byTema[tema.id] || { q: 0, ok: 0 };
            const maturity = calculateTopicMaturity(current.q, current.ok);
            return (
              <div key={tema.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#F9FAFB', border: '1px solid #EDEAE4', borderRadius: 14, padding: '0.9rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #EDEAE4', flexShrink: 0 }}>
                    <i className={`ti ${tema.icon}`} style={{ fontSize: 16, color: '#0F1B2D' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tema.name}</div>
                    <div style={{ fontSize: 12, color: '#7A8FA0', marginTop: 2 }}>{current.q > 0 ? `${current.ok} de ${current.q} preguntas respondidas` : 'Sin datos aún'}</div>
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: maturity.bgColor, borderRadius: 999, padding: '6px 10px', border: `1px solid ${maturity.color}22`, color: maturity.color, fontSize: 12, fontWeight: 700 }}>
                  {maturity.etiqueta === 'Dominado' && <i className="ti ti-circle-check" style={{ fontSize: 13 }} />}
                  <span>{maturity.etiqueta}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #EDEAE4', borderRadius: 16, padding: '1rem' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Modo visual</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {([
            { key: 'day', label: 'Día' },
            { key: 'night', label: 'Noche' },
            { key: 'exam', label: 'Examen' },
          ] as const).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setTheme(option.key)}
              style={{
                background: theme === option.key ? 'linear-gradient(135deg, #0F1B2D 0%, #1E3050 100%)' : '#F7F5F2',
                color: theme === option.key ? '#FFFFFF' : '#0F1B2D',
                border: theme === option.key ? '1px solid #0F1B2D' : '1px solid #EDEAE4',
                borderRadius: 999,
                padding: '9px 10px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #EDEAE4', borderRadius: 16, padding: '0.85rem' }}>
        <button type="button" onClick={() => setDetailsOpen((prev) => !prev)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontWeight: 800, color: '#0F1B2D' }}>
          <span>Estadísticas detalladas</span>
          <i className={`ti ${detailsOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ color: '#7A8FA0' }} />
        </button>

        {detailsOpen && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Progreso por tema</div>
              <div style={{ background: '#F7F5F2', border: '1px solid #EDEAE4', borderRadius: 14, padding: '0.85rem' }}>
                {TEMAS.map((tema) => {
                  const current = stats.byTema[tema.id] || { q: 0, ok: 0 };
                  const pct = current.q > 0 ? Math.round((current.ok / current.q) * 100) : 0;
                  const fillColor = pct >= 80 ? '#1A5E3A' : pct >= 60 ? '#8B1A2E' : '#C9A84C';
                  return (
                    <div key={tema.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 110, fontSize: 11, fontWeight: 600, color: '#3A4F63', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }} title={tema.name}>
                        {tema.name}
                      </div>
                      <div style={{ flex: 1, height: 22, background: '#FFFFFF', borderRadius: 6, overflow: 'hidden', border: '1px solid #EDEAE4', minWidth: 0 }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, transition: 'width 0.65s ease', background: fillColor }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7A8FA0', minWidth: 36, textAlign: 'right' }}>{current.q > 0 ? `${pct}%` : '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Historial de sesiones</div>
              <div style={{ background: '#F7F5F2', border: '1px solid #EDEAE4', borderRadius: 14, padding: '0.85rem' }}>
                {stats.sessions.length === 0 ? (
                  <div style={{ fontSize: 14, color: '#7A8FA0', textAlign: 'center', padding: '1.25rem' }}>Completa tu primer quiz para ver el historial.</div>
                ) : (
                  stats.sessions.slice(0, 10).map((session, index) => (
                    <div key={`${session.date}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: index > 0 ? '1px solid #EDEAE4' : 'none' }}>
                      <div style={{ fontSize: 12, color: '#7A8FA0', fontWeight: 600, minWidth: 72 }}>{session.date}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 6, background: '#FFFFFF', borderRadius: 3, overflow: 'hidden' }}>
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
          </div>
        )}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #EDEAE4', borderRadius: 16, padding: '1rem' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Zona de peligro</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#3A4F63', lineHeight: 1.4 }}>Reinicia tu progreso y deja la app en estado inicial.</div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Reiniciar todo tu progreso?')) {
                resetStats();
              }
            }}
            style={{ background: '#FAF0F2', color: '#6B0F22', border: '1px solid #D4899A', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Reiniciar progreso
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button type="button" onClick={() => onNavigate('home')} style={{ background: '#FFFFFF', color: '#0F1B2D', border: '1px solid #EDEAE4', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <i className="ti ti-home-2" style={{ marginRight: 6 }} />Inicio
        </button>
        <button type="button" onClick={() => onNavigate('quiz')} style={{ background: 'linear-gradient(135deg, #8B1A2E 0%, #A8243A 100%)', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <i className="ti ti-player-play" style={{ marginRight: 6 }} />Hacer quiz
        </button>
      </div>
    </div>
  );
}

export default Profile;
