import { useState, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import type { AppTab, TutorMessage, TutorContext } from '../types';

interface TutorProps {
  onNavigate: (tab: AppTab) => void;
}

const prompts = [
  'Explícame esta anemia de forma simple.',
  '¿Qué diferencia hay entre trombocitopenia y leucopenia?',
  'Hazme una explicación clínica breve de la coagulación.',
  '¿Cuáles son las señales de alarma en un paciente con hemorragia?',
];

function Tutor({ onNavigate }: TutorProps) {
  const { askTutor, loading, error } = useClaudeAPI();
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hola, soy el tutor de Hematomed. Puedes preguntar sobre conceptos, diagnósticos o manejo clínico y te responderé en lenguaje claro.',
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [draft, setDraft] = useState('');

  // Leer contexto (desde_quiz) o mensaje precargado (desde Quiz)
  useEffect(() => {
    const contextStr = window.localStorage.getItem('tutor_context');
    const initialMessage = window.localStorage.getItem('tutor_initial_message');

    if (contextStr) {
      // Paso 4: Contexto desde quiz con pregunta activadora
      const context: TutorContext = JSON.parse(contextStr);
      window.localStorage.removeItem('tutor_context');

      if (context.desde_quiz) {
        // Generar mensaje activador de metacognición
        const activatingMsg = `Veo que elegiste "${context.opcion_elegida}" en esta pregunta sobre ${context.tema}. Antes de explicarte, cuéntame: ¿qué razonamiento te llevó a esa decisión? No hay respuesta incorrecta aquí.`;

        // Reemplazar welcome con pregunta activadora
        setMessages([
          {
            id: 'activating-question',
            role: 'assistant',
            content: activatingMsg,
            timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return; // No auto-enviar, esperar respuesta del estudiante
      }
    }

    // Paso 2: Mensaje precargado desde Quiz (contexto incompleto o no desde_quiz)
    if (initialMessage) {
      window.localStorage.removeItem('tutor_initial_message');
      void sendPrompt(initialMessage);
    }
  }, []);

  const sendPrompt = async (promptText?: string) => {
    const value = (promptText ?? draft).trim();
    if (!value) {
      return;
    }

    const userMessage: TutorMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: value,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');

    try {
      const reply = await askTutor(value);
      const assistantMessage: TutorMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const assistantMessage: TutorMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'No pude responder ahora mismo. Intenta otra vez.',
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void sendPrompt(prompt)}
            className="hemato-button hemato-button-pill hemato-button-secondary"
            style={{ padding: '8px 12px', fontSize: 12 }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="hemato-panel hemato-panel-inner" style={{ minHeight: 320, maxHeight: 380, overflowY: 'auto' }}>
        {messages.map((message) => (
          <div key={message.id} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div className={`hemato-chat-message ${message.role === 'user' ? 'user' : 'assistant'}`} style={{ maxWidth: '88%', borderRadius: 14, padding: '0.8rem 0.95rem' }}>
              <div style={{ fontSize: 11, color: 'var(--app-muted)', fontWeight: 700, marginBottom: 4 }}>{message.timestamp}</div>
              <div style={{ fontSize: 13, color: 'var(--app-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-muted" style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>El tutor está respondiendo…</div>
        )}
        {error && <div style={{ color: 'var(--danger-text)', fontSize: 13, marginTop: 4 }}>{error}</div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void sendPrompt();
            }
          }}
          placeholder="Escribe tu duda clínica"
          style={{ flex: 1, borderRadius: 999, border: '1px solid var(--border-default)', padding: '10px 14px', fontSize: 13, outline: 'none', background: 'var(--app-surface)' }}
        />
        <button type="button" onClick={() => void sendPrompt()} className="hemato-button hemato-button-primary hemato-button-pill" style={{ padding: '10px 16px', fontSize: 13 }}>
          Enviar
        </button>
      </div>

      <button type="button" onClick={() => onNavigate('home')} className="hemato-button hemato-button-secondary hemato-button-pill" style={{ alignSelf: 'center', padding: '8px 14px', fontSize: 13 }}>
        <i className="ti ti-home-2" style={{ marginRight: 6 }} />Inicio
      </button>
    </div>
  );
}

export default Tutor;
