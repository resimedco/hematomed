import type { FlashCard, Pregunta, Tema } from '../types';

const GOOGLE_AI_FUNCTION_URL = '/google-ai';

export async function callGoogleAI(prompt: string, systemPrompt?: string, maxTokens = 1000): Promise<string> {
  try {
    const response = await fetch(GOOGLE_AI_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_tokens: maxTokens,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = data?.error?.message || 'Error en la solicitud a Google AI';
      throw new Error(`Google AI request failed: ${detail}`);
    }

    if (typeof data?.text === 'string' && data.text.trim()) {
      return data.text;
    }

    throw new Error('Google AI returned an empty or invalid response.');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('No se pudo completar la solicitud a Google AI.');
  }
}

export async function generateQuiz(tema: Tema, n: number, diff: string, qtype: string): Promise<Pregunta[]> {
  const dD: Record<string, string> = {
    basico: 'básico para internos/residentes primer año',
    intermedio: 'intermedio para residentes de medicina interna',
    avanzado: 'avanzado con casos clínicos complejos',
  };

  const qD: Record<string, string> = {
    mixto: 'mixtas de diagnóstico, tratamiento y fisiopatología',
    diagnostico: 'orientadas al diagnóstico diferencial',
    tratamiento: 'orientadas al manejo terapéutico',
    fisiopatologia: 'sobre mecanismos fisiopatológicos',
  };

  const prompt = `Eres experto en hematología clínica. Genera exactamente ${n} preguntas de opción múltiple de nivel ${dD[diff] || dD.intermedio}, tipo ${qD[qtype] || qD.mixto} sobre: ${tema.name}.

Contenido:
${tema.cont}

Responde SOLO con JSON válido sin texto adicional:
{"preguntas":[{"pregunta":"texto","opciones":["A. texto","B. texto","C. texto","D. texto"],"correcta":0,"explicacion":"explicación clínica 40-80 palabras","tema":"${tema.id}"}]}

En español. Opciones plausibles, una sola correcta.`;

  try {
    const responseText = await callGoogleAI(prompt, undefined, 4000);
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { preguntas?: Pregunta[] };

    if (!Array.isArray(parsed?.preguntas)) {
      throw new Error('La respuesta de Claude no contiene un array de preguntas válido.');
    }

    return parsed.preguntas;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`No se pudieron generar las preguntas: ${error.message}`);
    }

    throw new Error('No se pudieron generar las preguntas.');
  }
}

export async function generateFlashcards(tema: Tema, mode: string): Promise<FlashCard[]> {
  const mD: Record<string, string> = {
    nuevas: 'tarjetas nuevas para aprender conceptos por primera vez',
    repasar: 'repaso de conceptos difíciles con énfasis en puntos clave',
    todas: 'mezcla completa de diagnóstico, tratamiento y fisiopatología',
  };

  const prompt = `Eres profesor experto de hematología clínica. Genera exactamente 10 flashcards para ${tema.name} (${mD[mode] || mD.todas}).

Contenido:
${tema.cont}

Responde SOLO con JSON:
{"cards":[{"frente":"pregunta clínica concisa","reverso":"respuesta con criterios/valores específicos máximo 60 palabras","tema":"${tema.name}"}]}

En español. Incluye valores numéricos y fármacos.`;

  try {
    const responseText = await callGoogleAI(prompt, undefined, 3000);
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { cards?: FlashCard[] };

    if (!Array.isArray(parsed?.cards)) {
      throw new Error('La respuesta de Claude no contiene un array de flashcards válido.');
    }

    return parsed.cards;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`No se pudieron generar las flashcards: ${error.message}`);
    }

    throw new Error('No se pudieron generar las flashcards.');
  }
}

export async function getTutorReply(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const prompt = messages
    .map(({ role, content }) => `${role === 'user' ? 'Usuario' : 'Asistente'}: ${content}`)
    .join('\n\n');

  return callGoogleAI(prompt, systemPrompt, 800);
}

export async function generateClinicalCase(tema: Tema): Promise<string> {
  const prompt = `Eres experto en hematología clínica. Genera un caso clínico narrativo corto sobre: ${tema.name}.

Requisitos:
- Narrativa de 3-4 líneas en español
- Describe un paciente real con síntomas, contexto clínico y edad
- Incluye hallazgos iniciales (síntomas, signos, datos de laboratorio si es relevante)
- Sin opciones de respuesta
- Sin formulación de preguntas
- Solo la narrativa clínica
- Máximo 80 palabras
- Tono profesional pero accesible

Contenido base:
${tema.cont}

Responde SOLO con la narrativa, sin explicaciones adicionales.`;

  return callGoogleAI(prompt, undefined, 800);
}
