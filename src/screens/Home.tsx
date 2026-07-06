import { useEffect, useState } from 'react';
import type { AppTab } from '../types';

interface HomeProps {
  onNavigate: (tab: AppTab) => void;
}

function Home({ onNavigate }: HomeProps) {
  const [docenteMode, setDocenteMode] = useState(false);

  useEffect(() => {
    const storedMode = window.localStorage.getItem('hemato_docente_mode');
    setDocenteMode(storedMode === '1');
  }, []);

  const toggleDocenteMode = () => {
    const nextValue = !docenteMode;
    setDocenteMode(nextValue);
    window.localStorage.setItem('hemato_docente_mode', nextValue ? '1' : '0');
  };

  return (
    <div className="home-stack">
      <section className="hemato-card hemato-card-body home-top-card">
        <div className="home-top-card-row">
          <div className="home-top-card-title">
            <div className="home-top-card-icon">
              <i className="ti ti-clipboard-list" aria-hidden="true" />
            </div>
            <div>
              <p className="section-title" style={{ marginBottom: '0.35rem' }}>Generar nuevo quiz</p>
              <p className="body-copy text-muted" style={{ margin: 0 }}>Pon a prueba tus conocimientos</p>
            </div>
          </div>
          <button type="button" onClick={() => onNavigate('quiz')} className="hemato-button hemato-button-primary home-top-button">
            Empezar ahora
          </button>
        </div>
      </section>

      <div>
        <p className="section-label" style={{ marginBottom: '0.75rem' }}>Configuración de sesión</p>
        <section className="hemato-card hemato-card-body home-config-card">
          <div className="hemato-card-header">
            <div>
              <p className="hemato-card-title">Modo docente</p>
              <p className="hemato-card-title-strong" style={{ fontSize: '1rem' }}>Evaluación sin retroalimentación inmediata</p>
            </div>
            <div
              role="switch"
              aria-checked={docenteMode}
              className={`hemato-switch${docenteMode ? ' active' : ''}`}
              onClick={toggleDocenteMode}
            >
              <div className="hemato-thumb" style={{ marginLeft: docenteMode ? '20px' : '2px' }} />
            </div>
          </div>
          <p className="body-copy text-muted" style={{ marginTop: '0.5rem' }}>
            El alumno ve los resultados solo al finalizar.
          </p>
        </section>
      </div>

      <section className="hemato-card hemato-card-body home-action-card">
        <div className="home-action-icon-wrapper">
          <div className="home-action-icon">
            <i className="ti ti-droplet-half-2" aria-hidden="true" />
          </div>
        </div>
        <p className="hemato-card-title" style={{ marginBottom: '0.6rem' }}>Comienza tu primera sesión</p>
        <p className="body-copy text-muted" style={{ marginBottom: '1.5rem' }}>
          Haz un quiz o explora flashcards para ver tu progreso aquí.
        </p>
        <div className="home-action-grid">
          <button type="button" onClick={() => onNavigate('quiz')} className="hemato-button hemato-button-primary home-cta-button">
            Hacer quiz
          </button>
          <button type="button" onClick={() => onNavigate('tutor')} className="hemato-button hemato-button-secondary home-cta-button">
            Hablar con tutor
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
