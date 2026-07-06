import { useEffect, useMemo, useState } from 'react';
import { TEMAS } from '../data/temas';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useStats } from '../hooks/useStats';
import type { AppTab, FlashCard } from '../types';

interface FlashProps {
  onNavigate: (tab: AppTab) => void;
}

type View = 'config' | 'loading' | 'active' | 'done';
type FlashMode = 'nuevas' | 'repasar' | 'todas';

function Flash({ onNavigate }: FlashProps) {
  const { generateFlashcards, error } = useClaudeAPI();
  const { stats, rateFlash } = useStats();

  const [view, setView] = useState<View>('config');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [mode, setMode] = useState<FlashMode>('nuevas');
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [doneMessage, setDoneMessage] = useState('');

  const currentCard = cards[currentIndex];
  const cardKey = currentCard ? currentCard.frente.substring(0, 30) : '';

  const selectedTema = useMemo(() => TEMAS.find((tema) => tema.id === selectedTopic) || TEMAS[0], [selectedTopic]);

  const startFlash = async (nextMode: FlashMode = mode) => {
    const tema = selectedTema;
    setView('loading');
    setFlipped(false);

    if (nextMode === 'repasar') {
      const difficultKeys = Object.entries(stats.flashRatings || {})
        .filter(([, rating]) => rating === 'dificil')
        .map(([key]) => key);

      const difficultThemes = TEMAS.filter((temaItem) => difficultKeys.some((key) => key.includes(temaItem.name.substring(0, 8))));
      const fallbackTema = difficultThemes[0] || tema;

      if (difficultKeys.length >= 3) {
        const localCards = Array.from({ length: Math.min(10, difficultKeys.length) }, (_, index) => ({
          frente: `${fallbackTema.name} — revisión ${index + 1}`,
          reverso: `Repaso de ${fallbackTema.name}`,
          tema: fallbackTema.name,
        }));
        setCards(localCards);
        setCurrentIndex(0);
        setView('active');
        return;
      }
    }

    try {
      const payload = await generateFlashcards(tema, nextMode);
      setCards(payload);
      setCurrentIndex(0);
      setView('active');
    } catch (err) {
      setView('config');
      window.alert(err instanceof Error ? err.message : 'Error generando flashcards. Intenta de nuevo.');
    }
  };

  useEffect(() => {
    if (!selectedTopic) {
      setSelectedTopic(TEMAS[0].id);
    }
  }, [selectedTopic]);

  const flipCard = () => {
    setFlipped((prev) => !prev);
  };

  const rateCard = (rating: string) => {
    if (!currentCard) {
      return;
    }

    const nextRatings = { ...ratings, [cardKey]: rating };
    setRatings(nextRatings);
    rateFlash(cardKey, rating);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFlipped(false);
    } else {
      const difficultCount = Object.values(nextRatings).filter((value) => value === 'dificil').length;
      setDoneMessage(`Completaste las ${cards.length} tarjetas.${difficultCount > 0 ? ` Tienes ${difficultCount} tarjetas difíciles para repasar.` : ' ¡Excelente trabajo!'}`);
      setView('done');
    }
  };

  const resetFlash = () => {
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);
    setRatings({});
    setDoneMessage('');
    setView('config');
  };

  return (
    <div style={{ width: '100%' }}>
      {view === 'config' && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Tema para flashcards
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
            {TEMAS.map((tema) => (
              <button
                key={tema.id}
                type="button"
                onClick={() => setSelectedTopic(tema.id)}
                style={{
                  background: selectedTopic === tema.id ? 'var(--surface-50)' : 'var(--surface-0)',
                  border: selectedTopic === tema.id ? '1.5px solid var(--accent-primary-start)' : '1.5px solid var(--border-default)',
                  borderRadius: 14,
                  padding: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 3px rgba(15,27,45,0.06)',
                }}
              >
                <i className={`ti ${tema.icon}`} style={{ fontSize: 20, color: 'var(--accent-primary-start)' }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--app-text)', lineHeight: 1.35, textAlign: 'center' }}>{tema.name}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button type="button" onClick={() => { setMode('nuevas'); void startFlash('nuevas'); }} className="hemato-button hemato-button-primary" style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
              <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Nuevas
            </button>
            <button type="button" onClick={() => { setMode('repasar'); void startFlash('repasar'); }} className="hemato-button hemato-button-secondary" style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
              <i className="ti ti-refresh" style={{ marginRight: 6 }} />Repasar difíciles
            </button>
            <button type="button" onClick={() => { setMode('todas'); void startFlash('todas'); }} className="hemato-button hemato-button-secondary" style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
              <i className="ti ti-cards" style={{ marginRight: 6 }} />Todas
            </button>
          </div>
          {error && <div style={{ color: '#8B1A2E', fontSize: 13 }}>{error}</div>}
        </div>
      )}

      {view === 'loading' && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <div style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary-start)', animation: 'bounce 1.2s infinite' }} />
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary-start)', animation: 'bounce 1.2s infinite 0.2s' }} />
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary-start)', animation: 'bounce 1.2s infinite 0.4s' }} />
          </div>
          <p style={{ marginTop: 1, fontSize: 14, color: 'var(--app-muted)', fontWeight: 500 }}>Generando flashcards con IA...</p>
        </div>
      )}

      {view === 'active' && currentCard && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <button type="button" onClick={() => setCurrentIndex((prev) => prev > 0 ? prev - 1 : prev)} className="hemato-button hemato-button-ghost" style={{ padding: '8px 12px' }}>
              <i className="ti ti-arrow-left" />
            </button>
            <div style={{ fontSize: 13, color: 'var(--app-muted)', fontWeight: 700, textAlign: 'center', flex: 1 }}>{currentIndex + 1} / {cards.length}</div>
            <button type="button" onClick={() => setCurrentIndex((prev) => prev < cards.length - 1 ? prev + 1 : prev)} className="hemato-button hemato-button-ghost" style={{ padding: '8px 12px' }}>
              <i className="ti ti-arrow-right" />
            </button>
          </div>

          <div style={{ marginBottom: 12, height: 6, background: 'var(--surface-0)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(((currentIndex + 1) / cards.length) * 100)}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--accent-primary-start) 0%, var(--accent-secondary-start) 100%)', transition: 'width 0.45s ease' }} />
          </div>

          <div onClick={flipCard} style={{ cursor: 'pointer', userSelect: 'none', perspective: 900, marginBottom: 12 }}>
            <div style={{ position: 'relative', minHeight: 250, transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)', transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 20, padding: '1.75rem', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 250, boxShadow: '0 4px 12px rgba(15,27,45,0.08)', borderTop: '4px solid var(--accent-primary-start)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem', color: 'var(--app-muted)' }}>{currentCard.tema || ''}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--app-text)', lineHeight: 1.55 }}>{currentCard.frente}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-hand-click" />Toca para ver la respuesta
                </div>
              </div>
              <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, var(--surface-900) 0%, var(--surface-800) 100%)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 20, padding: '1.75rem', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 250, boxShadow: '0 4px 12px rgba(15,27,45,0.08)', borderTop: '4px solid var(--accent-secondary-start)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem', color: 'rgba(201,168,76,0.7)' }}>Respuesta</div>
                <div style={{ fontSize: 15, color: 'var(--accent-secondary-text)', lineHeight: 1.65, fontWeight: 500 }}>{currentCard.reverso}</div>
              </div>
            </div>
          </div>

          {flipped && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button type="button" onClick={() => rateCard('dificil')} style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Difícil</button>
              <button type="button" onClick={() => rateCard('bien')} style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Bien</button>
              <button type="button" onClick={() => rateCard('facil')} style={{ background: 'var(--surface-50)', color: 'var(--app-text)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Fácil</button>
            </div>
          )}
        </div>
      )}

      {view === 'done' && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ fontSize: 52, color: 'var(--success-text)', display: 'block', marginBottom: 14 }}>
            <i className="ti ti-check" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--app-text)' }}>¡Listo!</div>
          <div style={{ fontSize: 14, color: 'var(--app-muted)', marginBottom: 18, lineHeight: 1.6 }}>{doneMessage}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => onNavigate('home')} className="hemato-button hemato-button-secondary" style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
              <i className="ti ti-home-2" style={{ marginRight: 6 }} />Inicio
            </button>
            <button type="button" onClick={resetFlash} className="hemato-button hemato-button-primary" style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
              <i className="ti ti-refresh" style={{ marginRight: 6 }} />Nueva sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flash;
