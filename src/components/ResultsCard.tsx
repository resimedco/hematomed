interface AnswerEntry {
  q: string;
  ok: boolean;
  tema: string;
}

interface ResultsCardProps {
  userName?: string;
  date: string;
  moduleName: string;
  score: number;
  total: number;
  correct: number;
  incorrect: number;
  title: string;
  subtitle: string;
  answered: AnswerEntry[];
  docenteMode?: boolean;
  elapsedSeconds?: number;
}

function ResultsCard({
  userName,
  date,
  moduleName,
  score,
  total,
  correct,
  incorrect,
  title,
  subtitle,
  answered,
  docenteMode = false,
  elapsedSeconds = 0,
}: ResultsCardProps) {
  const name = userName?.trim() || 'Médico';
  const visibleAnswers = answered.slice(0, 8);
  const formattedTime = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  return (
    <div
      className="results-share-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Crimson Pro, Georgia, serif', letterSpacing: '-0.01em' }}>Hematomed</div>
          <div className="results-share-highlight" style={{ marginTop: 3 }}>MKSAP 18</div>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(201,168,76,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>🩸</span>
        </div>
      </div>

      {docenteMode && (
        <div className="results-share-highlight" style={{ marginBottom: 14 }}>
          Evaluación docente
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#C9A84C', marginBottom: 6 }}>Resultado del examen</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{date}</div>
      </div>

      <div className="results-share-row">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#C9A84C', marginBottom: 6 }}>Módulo evaluado</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{moduleName}</div>
        </div>
        <div className="results-share-circle">
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>Puntaje</div>
        </div>
      </div>

      <div className="results-share-row" style={{ marginBottom: 18 }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{correct}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Correctas</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{incorrect}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Incorrectas</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{total}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Total</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>{subtitle}</div>
        {docenteMode && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#E8CC80', fontWeight: 700 }}>Tiempo total: {formattedTime}</div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleAnswers.map((entry, index) => (
          <div key={`${entry.q}-${index}`} className="results-share-block" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', background: entry.ok ? '#1A5E3A' : '#8B1A2E', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
              {entry.ok ? '✓' : '✗'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.q}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.16)', fontSize: 11, color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>
        Generado por Hematomed · MKSAP 18
      </div>
    </div>
  );
}

export default ResultsCard;
