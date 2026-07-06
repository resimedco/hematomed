interface MaturityMapProps {
  answered: Array<{ q: string; ok: boolean; tema: string; explicacion: string }>;
  temaNames: Record<string, string>;
}

interface TopicMaturity {
  temaId: string;
  temaName: string;
  total: number;
  correctas: number;
  porcentaje: number;
  nivel: 'dominio' | 'desarrollo' | 'refuerzo';
  etiqueta: string;
}

function calculateMaturity(porcentaje: number): { nivel: 'dominio' | 'desarrollo' | 'refuerzo'; etiqueta: string; color: string; bgColor: string } {
  if (porcentaje >= 80) {
    return {
      nivel: 'dominio',
      etiqueta: 'Dominio Clínico',
      color: 'var(--success-text)',
      bgColor: 'var(--success-bg)',
    };
  }
  if (porcentaje >= 50) {
    return {
      nivel: 'desarrollo',
      etiqueta: 'Comprensión en Desarrollo',
      color: 'var(--warning-text)',
      bgColor: 'var(--warning-bg)',
    };
  }
  return {
    nivel: 'refuerzo',
    etiqueta: 'Requiere Refuerzo',
    color: 'var(--danger-text)',
    bgColor: 'var(--danger-bg)',
  };
}

export function MaturityMap({ answered, temaNames }: MaturityMapProps) {
  // Agrupar por tema
  const topicStats: Record<string, { total: number; correctas: number }> = {};

  answered.forEach((entry) => {
    if (!topicStats[entry.tema]) {
      topicStats[entry.tema] = { total: 0, correctas: 0 };
    }
    topicStats[entry.tema].total += 1;
    if (entry.ok) {
      topicStats[entry.tema].correctas += 1;
    }
  });

  // Calcular madurez por tema
  const topicMaturity: TopicMaturity[] = Object.entries(topicStats).map(([temaId, stats]) => {
    const porcentaje = Math.round((stats.correctas / stats.total) * 100);
    const { nivel, etiqueta } = calculateMaturity(porcentaje);

    return {
      temaId,
      temaName: temaNames[temaId] || temaId,
      total: stats.total,
      correctas: stats.correctas,
      porcentaje,
      nivel,
      etiqueta,
    };
  });

  // Ordenar por dominio primero
  topicMaturity.sort((a, b) => {
    const levelOrder = { dominio: 0, desarrollo: 1, refuerzo: 2 };
    return levelOrder[a.nivel] - levelOrder[b.nivel];
  });

  return (
    <div style={{ marginTop: 20 }}>
      <div className="hemato-card-title">
        Tu mapa clínico
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topicMaturity.map((topic) => {
          const maturityInfo = calculateMaturity(topic.porcentaje);
          const borderColor = maturityInfo.color;

          return (
            <div
              key={topic.temaId}
              className="hemato-card hemato-card-compact"
              style={{ background: maturityInfo.bgColor, border: `1.5px solid ${borderColor}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', marginBottom: 4 }}>
                  {topic.temaName}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: borderColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {topic.etiqueta}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: borderColor }}>
                  {topic.correctas}/{topic.total}
                </div>
                <div style={{ fontSize: 11, color: '#7A8FA0', fontWeight: 600 }}>
                  {topic.porcentaje}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
