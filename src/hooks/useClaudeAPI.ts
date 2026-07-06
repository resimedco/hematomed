import { useCallback, useState } from 'react';
import { generateFlashcards as generateFlashcardsClient, generateQuiz as generateQuizClient, getTutorReply as getTutorReplyClient, generateClinicalCase as generateClinicalCaseClient } from '../lib/claudeClient';
import type { FlashCard, Pregunta, Tema } from '../types';

export function useClaudeAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runWithState = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      return await operation();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateQuiz = useCallback(
    (tema: Tema, n: number, diff: string, qtype: string) =>
      runWithState<Pregunta[]>(() => generateQuizClient(tema, n, diff, qtype)),
    [runWithState],
  );

  const generateFlashcards = useCallback(
    (tema: Tema, mode: string) =>
      runWithState<FlashCard[]>(() => generateFlashcardsClient(tema, mode)),
    [runWithState],
  );

  const getTutorReply = useCallback(
    (messages: { role: string; content: string }[], systemPrompt: string) =>
      runWithState<string>(() => getTutorReplyClient(messages, systemPrompt)),
    [runWithState],
  );

  const askTutor = useCallback(
    (question: string) =>
      runWithState<string>(() =>
        getTutorReplyClient([{ role: 'user', content: question }], 'Eres un tutor clínico de hematología que responde de forma clara y práctica.'),
      ),
    [runWithState],
  );

  const generateClinicalCase = useCallback(
    (tema: Tema) =>
      runWithState<string>(() => generateClinicalCaseClient(tema)),
    [runWithState],
  );

  return {
    loading,
    error,
    generateQuiz,
    generateFlashcards,
    getTutorReply,
    askTutor,
    generateClinicalCase,
  };
}
