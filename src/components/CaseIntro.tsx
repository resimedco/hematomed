interface CaseIntroProps {
  topic: string;
  caseText: string;
  loading: boolean;
  onAnalyze: () => void;
  onRegenerate: () => void;
}

export function CaseIntro({ topic, caseText, loading, onAnalyze, onRegenerate }: CaseIntroProps) {
  return (
    <div className="hemato-card hemato-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Título */}
      <div className="hemato-case-header">
        Caso clínico
      </div>

      {/* Card principal */}
      <div className="hemato-card hemato-card-hero hemato-card-body" style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Texto del caso */}
        <div
          className="hemato-card-text"
          style={{ fontSize: 15, fontWeight: 400, minHeight: 100, display: 'flex', alignItems: 'center' }}
        >
          {loading ? (
            <div className="hemato-loading-dots">
              <span
                className="hemato-loading-dot"
              />
              <span
                className="hemato-loading-dot"
              />
              <span
                className="hemato-loading-dot"
              />
            </div>
          ) : (
            <span>{caseText}</span>
          )}
        </div>

        {/* Info del tema */}
        <div className="hemato-case-topic">Tema: <strong>{topic}</strong></div>
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
        {/* Botón primario */}
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="hemato-button hemato-button-secondary"
          style={{ width: '100%', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          <i className="ti ti-check" style={{ marginRight: 7 }} />
          Analizar este caso
        </button>

        {/* Botón secundario */}
        <button
          type="button"
          onClick={onRegenerate}
          disabled={loading}
          className="hemato-button hemato-button-outline"
          style={{ width: '100%', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          <i className="ti ti-refresh" style={{ marginRight: 7 }} />
          Otro caso
        </button>
      </div>
    </div>
  );
}
