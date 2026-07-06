interface ContextualTutorPromptProps {
  pregunta: string;
  opcionElegida: string;
  opcionCorrecta: string;
  tema?: string;
  onAskTutor: (prompt: string, context?: any) => void;
}

export function ContextualTutorPrompt({ pregunta, opcionElegida, opcionCorrecta, tema = '', onAskTutor }: ContextualTutorPromptProps) {
  const handleClick = () => {
    const tutorPrompt = `Acabo de responder incorrectamente esta pregunta: "${pregunta}". Elegí "${opcionElegida}" pero la correcta era "${opcionCorrecta}". ¿Puedes ayudarme a entender por qué me equivoqué y cuál es el razonamiento correcto?`;
    const context = {
      pregunta,
      opcion_elegida: opcionElegida,
      opcion_correcta: opcionCorrecta,
      tema,
      desde_quiz: true,
    };
    onAskTutor(tutorPrompt, context);
  };

  return (
    <div className="tutor-prompt-card">
      {/* Avatar */}
      <div className="hemato-chat-avatar">
        <i className="ti ti-robot" style={{ color: '#FFFFFF', fontSize: 16 }} />
      </div>

      {/* Contenido */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <p style={{ fontSize: 13, color: '#3A4F63', lineHeight: 1.5, margin: 0 }}>
          ¿Por qué elegiste esa opción? El tutor puede ayudarte a entender tu razonamiento.
        </p>
        <button
          type="button"
          onClick={handleClick}
          className="hemato-button hemato-button-primary"
          style={{ width: '100%' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#A8243A';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#8B1A2E';
          }}
        >
          <i className="ti ti-message" style={{ marginRight: 6 }} />
          Hablar con el tutor
        </button>
      </div>
    </div>
  );
}
