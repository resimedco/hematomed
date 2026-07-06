export interface Tema {
  id: string;
  name: string;
  icon: string;
  sub: string;
  cont: string;
}

export interface FlashCard {
  frente: string;
  reverso: string;
  tema: string;
}

export interface Pregunta {
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
  tema: string;
}

export interface TemaStat {
  q: number;
  ok: number;
}

export interface Session {
  date: string;
  score: number;
  total: number;
  ok: number;
}

export interface AppStats {
  totalQ: number;
  totalOk: number;
  streak: number;
  lastDate: string;
  sessions: Session[];
  byTema: Record<string, TemaStat>;
  flashRatings: Record<string, string>;
}

export type Theme = 'day' | 'night' | 'exam';

export type AppTab = 'home' | 'quiz' | 'flash' | 'profile' | 'tutor';

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TutorContext {
  pregunta: string;
  opcion_elegida: string;
  opcion_correcta: string;
  tema: string;
  desde_quiz: boolean;
}
