import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ResultsCard from '../components/ResultsCard';
import { CaseIntro } from '../components/CaseIntro';
import { ContextualTutorPrompt } from '../components/ContextualTutorPrompt';
import { MaturityMap } from '../components/MaturityMap';
import { useTimer } from '../components/Timer';
import { TEMAS } from '../data/temas';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useStats } from '../hooks/useStats';
import type { AppTab, Pregunta } from '../types';

interface QuizProps {
  onNavigate: (tab: AppTab) => void;
}

const loadingMessages = ['Generando preguntas...', 'Calibrando dificultad...', 'Construyendo opciones...', 'Casi listo...'];

type View = 'case_intro' | 'config' | 'loading' | 'active' | 'results';

function Quiz({ onNavigate }: QuizProps) {
  const { generateQuiz, generateClinicalCase, error } = useClaudeAPI();
  const { addQuizResult, addSession } = useStats();

  const [view, setView] = useState<View>('case_intro');
  const [caseText, setCaseText] = useState('');
  const [caseLoading, setCaseLoading] = useState(false);
  const [selectedCaseTopic, setSelectedCaseTopic] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [numQ, setNumQ] = useState('5');
  const [diff, setDiff] = useState('intermedio');
  const [qtype, setQtype] = useState('mixto');
  const [questions, setQuestions] = useState<Pregunta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Array<{ q: string; ok: boolean; tema: string; explicacion: string }>>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [resultPct, setResultPct] = useState(0);
  const [resultTitle, setResultTitle] = useState('');
  const [resultSub, setResultSub] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [userName, setUserName] = useState('');
  const [docenteMode, setDocenteMode] = useState(false);
  const [quizRunId, setQuizRunId] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const elapsed = useTimer(view === 'active', quizRunId);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Generar caso clínico inicial
  useEffect(() => {
    if (view !== 'case_intro') {
      return;
    }

    const generateCase = async () => {
      try {
        setCaseLoading(true);
        const randomTopic = TEMAS[Math.floor(Math.random() * TEMAS.length)];
        setSelectedCaseTopic(randomTopic.id);
        const caseTextResponse = await generateClinicalCase(randomTopic);
        setCaseText(caseTextResponse);
      } catch {
        setCaseText('No se pudo generar el caso. Intenta de nuevo.');
      } finally {
        setCaseLoading(false);
      }
    };

    generateCase();
  }, [view, generateClinicalCase]);

  useEffect(() => {
    if (view !== 'loading') {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [view]);

  const availableTopics = useMemo(() => (selectedTopics.length > 0 ? TEMAS.filter((t) => selectedTopics.includes(t.id)) : TEMAS), [selectedTopics]);

  const startQuiz = async () => {
    const tema = availableTopics[Math.floor(Math.random() * availableTopics.length)] || TEMAS[0];
    setView('loading');
    setLoadingIndex(0);
    setQuizRunId((prev) => prev + 1);

    try {
      const payload = await generateQuiz(tema, Number(numQ), diff, qtype);
      setQuestions(payload);
      setCurrentIndex(0);
      setScore(0);
      setAnswered([]);
      setSelectedOption(null);
      setFeedbackOpen(false);
      setView('active');
    } catch (err) {
      setView('config');
      window.alert(err instanceof Error ? err.message : 'Error generando preguntas. Intenta de nuevo.');
    }
  };

  const answerQuestion = (idx: number) => {
    const current = questions[currentIndex];
    if (!current) {
      return;
    }

    const isCorrect = idx === current.correcta;
    const tema = current.tema || 'General';

    setSelectedOption(idx);
    setFeedbackOpen(docenteMode ? false : true);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    const updatedAnswered = [...answered, { q: current.pregunta, ok: isCorrect, tema, explicacion: current.explicacion }];
    setAnswered(updatedAnswered);

    addQuizResult(tema, isCorrect);
  };

  useEffect(() => {
    if (view !== 'active' || questions.length === 0) {
      return;
    }

    const current = questions[currentIndex];
    if (!current) {
      return;
    }

    if (!feedbackOpen && !docenteMode) {
      setSelectedOption(null);
    }
  }, [currentIndex, feedbackOpen, questions, view, docenteMode]);

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFeedbackOpen(false);
      setSelectedOption(null);
      return;
    }

    const pct = Math.round((score / questions.length) * 100);
    const titleAndSub = pct >= 80
      ? ['Excelente dominio clínico', 'Continúa con los temas más difíciles.']
      : pct >= 60
        ? ['Buen desempeño', 'Refuerza los temas con errores usando flashcards.']
        : ['Sigue practicando', 'Usa el tutor para los conceptos difíciles.'];

    setResultPct(pct);
    setResultTitle(titleAndSub[0]);
    setResultSub(titleAndSub[1]);

    addSession({
      date: new Date().toLocaleDateString('es-CO'),
      score: pct,
      total: questions.length,
      ok: score,
    });

    setView('results');
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setAnswered([]);
    setSelectedOption(null);
    setFeedbackOpen(false);
    setView('config');
  };

  const handleAnalyzeCase = () => {
    setView('config');
  };

  const handleRegenerateCase = async () => {
    try {
      setCaseLoading(true);
      const randomTopic = TEMAS[Math.floor(Math.random() * TEMAS.length)];
      setSelectedCaseTopic(randomTopic.id);
      const caseTextResponse = await generateClinicalCase(randomTopic);
      setCaseText(caseTextResponse);
    } catch {
      setCaseText('No se pudo generar el caso. Intenta de nuevo.');
    } finally {
      setCaseLoading(false);
    }
  };

  const handleAskTutor = (tutorPrompt: string, context?: any) => {
    // Almacenar el mensaje precargado en localStorage
    window.localStorage.setItem('tutor_initial_message', tutorPrompt);
    // Almacenar contexto para Paso 4 (pregunta activadora)
    if (context) {
      window.localStorage.setItem('tutor_context', JSON.stringify(context));
    }
    // Navegar a tutor
    onNavigate('tutor');
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? Math.round((currentIndex / questions.length) * 100) : 0;

  useEffect(() => {
    const storedName = window.localStorage.getItem('hemato_username');
    if (storedName) {
      setUserName(storedName);
    }

    const storedMode = window.localStorage.getItem('hemato_docente_mode');
    setDocenteMode(storedMode === '1');
  }, []);

  const handleShareResult = async () => {
    if (!exportRef.current) {
      return;
    }

    setIsSharing(true);

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0F1B2D',
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const filename = `hematomed-result-${Date.now()}.png`;

      if (navigator.share && navigator.canShare?.({ files: [new File([await (await fetch(url)).blob()], filename, { type: 'image/png' })] })) {
        const file = await (await fetch(url)).blob();
        const shareFile = new File([file], filename, { type: 'image/png' });
        await navigator.share({
          title: 'Hematomed resultado',
          text: 'Mira mi resultado en Hematomed',
          files: [shareFile],
        });
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      }
    } catch (err) {
      window.alert('No se pudo exportar el resultado. Intenta nuevamente.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {view === 'case_intro' && (
        <CaseIntro
          topic={selectedCaseTopic ? TEMAS.find((t) => t.id === selectedCaseTopic)?.name || 'Tema' : 'Tema'}
          caseText={caseText}
          loading={caseLoading}
          onAnalyze={handleAnalyzeCase}
          onRegenerate={handleRegenerateCase}
        />
      )}

      {view === 'config' && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7A8FA0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Selecciona temas (opcional)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12, maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
            {TEMAS.map((tema) => {
              const selected = selectedTopics.includes(tema.id);
              return (
                <button
                  key={tema.id}
                  type="button"
                  onClick={() => toggleTopic(tema.id)}
                  style={{
                      background: selected ? 'var(--surface-50)' : 'var(--surface-0)',
                      border: selected ? '1.5px solid var(--accent-primary-start)' : '1.5px solid var(--border-default)',
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
              );
            })}
          </div>

          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '1rem', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--app-muted)', fontWeight: 600, minWidth: 140 }}>Número de preguntas</span>
              <select value={numQ} onChange={(e) => setNumQ(e.target.value)} style={{ fontSize: 13, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--surface-0)', color: 'var(--app-text)', fontFamily: 'inherit', fontWeight: 500 }}>
                <option value="3">3 preguntas</option>
                <option value="5">5 preguntas</option>
                <option value="10">10 preguntas</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--app-muted)', fontWeight: 600, minWidth: 140 }}>Dificultad</span>
              <select value={diff} onChange={(e) => setDiff(e.target.value)} style={{ fontSize: 13, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--surface-0)', color: 'var(--app-text)', fontFamily: 'inherit', fontWeight: 500 }}>
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--app-muted)', fontWeight: 600, minWidth: 140 }}>Tipo de preguntas</span>
              <select value={qtype} onChange={(e) => setQtype(e.target.value)} style={{ fontSize: 13, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--surface-0)', color: 'var(--app-text)', fontFamily: 'inherit', fontWeight: 500 }}>
                <option value="mixto">Mixto</option>
                <option value="diagnostico">Diagnóstico</option>
                <option value="tratamiento">Tratamiento</option>
                <option value="fisiopatologia">Fisiopatología</option>
              </select>
            </div>
          </div>

          <button type="button" onClick={startQuiz} className="hemato-button hemato-button-primary" style={{ width: '100%', padding: '11px 22px', fontSize: 14, fontWeight: 700 }}>
            <i className="ti ti-sparkles" style={{ marginRight: 7 }} />Generar cuestionario con IA
          </button>
          {error && <div style={{ marginTop: 10, color: 'var(--danger-text)', fontSize: 13 }}>{error}</div>}
        </div>
      )}

      {view === 'loading' && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <div style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary-start)', animation: 'bounce 1.2s infinite' }} />
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary-start)', animation: 'bounce 1.2s infinite 0.2s' }} />
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary-start)', animation: 'bounce 1.2s infinite 0.4s' }} />
          </div>
          <p style={{ marginTop: 1, fontSize: 14, color: 'var(--app-muted)', fontWeight: 500 }}>{loadingMessages[loadingIndex]}</p>
        </div>
      )}

      {view === 'active' && currentQuestion && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 6, background: 'var(--surface-0)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--accent-primary-start) 0%, var(--accent-secondary-start) 100%)', transition: 'width 0.45s ease' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {docenteMode && (
                <span style={{ fontSize: 12, color: 'var(--app-text)', fontWeight: 700, whiteSpace: 'nowrap', background: 'var(--surface-50)', border: '1px solid var(--border-default)', borderRadius: 999, padding: '4px 8px' }}>
                  <i className="ti ti-clock" style={{ marginRight: 4 }} />{elapsed}s
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--app-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{currentIndex + 1}/{questions.length}</span>
            </div>
          </div>

          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '1.1rem', boxShadow: '0 1px 3px rgba(15,27,45,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)', lineHeight: 1.75, marginBottom: 12 }}>{currentQuestion.pregunta}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 12 }}>
                {currentQuestion.opciones.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrect = currentQuestion.correcta === index;
                const stateClass = feedbackOpen ? (isCorrect ? 'correct' : isSelected ? 'incorrect' : '') : '';
                const isLocked = selectedOption !== null || feedbackOpen;
                return (
                  <button
                    key={`${currentQuestion.pregunta}-${index}`}
                    type="button"
                    onClick={() => !isLocked && answerQuestion(index)}
                    disabled={isLocked}
                    style={{
                      background: feedbackOpen ? (stateClass === 'correct' ? 'var(--success-bg)' : stateClass === 'incorrect' ? 'var(--danger-bg)' : 'var(--surface-50)') : 'var(--surface-50)',
                      border: '1.5px solid var(--border-default)',
                      borderLeft: feedbackOpen ? (stateClass === 'correct' ? '4px solid var(--accent-secondary-start)' : stateClass === 'incorrect' ? '4px solid var(--danger-text)' : '4px solid transparent') : (docenteMode && isSelected ? '4px solid rgba(15,27,45,0.9)' : '4px solid transparent'),
                      borderRadius: 10,
                      padding: '12px 15px',
                      cursor: isLocked ? 'default' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 11,
                      lineHeight: 1.55,
                      fontWeight: 500,
                      color: 'var(--app-text)',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 11, minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 6, flexShrink: 0, marginTop: 1 }}>{String.fromCharCode(65 + index)}</span>
                    <span>{option.replace(/^[A-D]\s*/, '')}</span>
                  </button>
                );
              })}
            </div>

            {feedbackOpen && !docenteMode && (
              <div>
                <div style={{ background: 'var(--surface-50)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '1rem 1.1rem', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className={`ti ${selectedOption === currentQuestion.correcta ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ color: selectedOption === currentQuestion.correcta ? 'var(--success-text)' : 'var(--danger-text)', fontSize: 18 }} />
                    <span style={{ color: selectedOption === currentQuestion.correcta ? 'var(--success-text)' : 'var(--danger-text)' }}>{selectedOption === currentQuestion.correcta ? 'Correcto' : 'Incorrecto'}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--app-muted)', lineHeight: 1.75 }}>{currentQuestion.explicacion}</div>
                </div>

                {selectedOption !== currentQuestion.correcta && selectedOption !== null && (
                  <ContextualTutorPrompt
                    pregunta={currentQuestion.pregunta}
                    opcionElegida={currentQuestion.opciones[selectedOption] || 'Opción desconocida'}
                    opcionCorrecta={currentQuestion.opciones[currentQuestion.correcta]}
                    tema={selectedCaseTopic ? TEMAS.find((t) => t.id === selectedCaseTopic)?.name || 'Tema' : 'Tema'}
                    onAskTutor={handleAskTutor}
                  />
                )}

                <button type="button" onClick={goNext} className="hemato-button hemato-button-primary" style={{ width: '100%', padding: '11px 22px', fontSize: 14, fontWeight: 700, marginTop: selectedOption !== currentQuestion.correcta ? 12 : 0 }}>
                  <span>{currentIndex < questions.length - 1 ? 'Siguiente pregunta' : 'Ver resultados'}</span>
                  <i className="ti ti-arrow-right" style={{ marginLeft: 7 }} />
                </button>
              </div>
            )}

            {docenteMode && selectedOption !== null && (
              <button type="button" onClick={goNext} className="hemato-button hemato-button-primary" style={{ width: '100%', padding: '11px 22px', fontSize: 14, fontWeight: 700 }}>
                <span>{currentIndex < questions.length - 1 ? 'Siguiente' : 'Ver resultados'}</span>
                <i className="ti ti-arrow-right" style={{ marginLeft: 7 }} />
              </button>
            )}
          </div>
        </div>
      )}

      {view === 'results' && (
        <div>
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', marginBottom: 12 }}>
            <div className="hemato-card-hero" style={{ width: 104, height: 104, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(15,27,45,0.25)', border: '3px solid var(--accent-secondary-start)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{resultPct}%</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Puntuación</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--app-text)', textAlign: 'center' }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correctas</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--app-text)', textAlign: 'center' }}>{questions.length - score}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Incorrectas</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--app-text)', textAlign: 'center' }}>{questions.length}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 6 }}>{resultTitle}</div>
            <div style={{ fontSize: 14, color: 'var(--app-muted)', lineHeight: 1.6 }}>{resultSub}</div>
          </div>

          {/* Mapa de Madurez Clínica */}
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '1rem 0.85rem', marginBottom: 10 }}>
            <MaturityMap
              answered={answered}
              temaNames={Object.fromEntries(TEMAS.map((t) => [t.id, t.name]))}
            />
          </div>

          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '0.75rem 0.85rem', marginBottom: 10 }}>
            {answered.map((entry, index) => (
              <div key={`${entry.q}-${index}`} className="hemato-card" style={{ background: 'var(--surface-50)', borderRadius: 10, padding: '11px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text)', marginBottom: 3, lineHeight: 1.45 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.03em', marginRight: 6, textTransform: 'uppercase', background: entry.ok ? 'var(--success-bg)' : 'var(--danger-bg)', color: entry.ok ? 'var(--success-text)' : 'var(--danger-text)', border: entry.ok ? '1px solid #72B894' : '1px solid #D4899A' }}>
                    {entry.ok ? '✓' : '✗'}
                  </span>
                  {entry.q.substring(0, 90)}{entry.q.length > 90 ? '...' : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tema: {entry.tema}</div>
                <div style={{ fontSize: 12, color: 'var(--app-muted)', marginTop: 6, lineHeight: 1.5 }}>{entry.explicacion}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
            <button type="button" onClick={handleShareResult} disabled={isSharing} className="hemato-button hemato-button-ghost" style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: isSharing ? 'wait' : 'pointer', opacity: isSharing ? 0.8 : 1 }}>
              <i className="ti ti-share" style={{ marginRight: 6 }} />{isSharing ? 'Generando...' : 'Compartir resultado'}
            </button>
            <button type="button" onClick={() => onNavigate('home')} className="hemato-button hemato-button-secondary" style={{ padding: '10px 16px' }}>
              <i className="ti ti-home-2" style={{ marginRight: 6 }} />Inicio
            </button>
            <button type="button" onClick={resetQuiz} className="hemato-button hemato-button-primary" style={{ padding: '10px 16px' }}>
              <i className="ti ti-refresh" style={{ marginRight: 6 }} />Nuevo quiz
            </button>
          </div>

          <div ref={exportRef} style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden' }}>
            <ResultsCard
              userName={userName}
              date={new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              moduleName={selectedTopics.length > 0 ? selectedTopics.map((id) => TEMAS.find((tema) => tema.id === id)?.name || id).join(', ') : 'Módulo general'}
              score={resultPct}
              total={questions.length}
              correct={score}
              incorrect={questions.length - score}
              title={resultTitle}
              subtitle={resultSub}
              answered={answered}
              docenteMode={docenteMode}
              elapsedSeconds={elapsed}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .5; }
          40% { transform: translateY(-7px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Quiz;
