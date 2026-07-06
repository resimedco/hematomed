import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const googleApiKey = defineSecret('GOOGLE_API_KEY');

export const googleAi = onRequest({ cors: true, secrets: [googleApiKey] }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body ?? {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const system = typeof body.system === 'string' ? body.system : undefined;
  const maxTokens = typeof body.max_tokens === 'number' ? body.max_tokens : 1000;

  if (!messages.length) {
    res.status(400).json({ error: 'Se requiere un array de mensajes.' });
    return;
  }

  const apiKey = googleApiKey.value();
  if (!apiKey) {
    res.status(500).json({ error: 'La clave de Google API no está configurada en Secret Manager.' });
    return;
  }

  try {
    // Convertir mensajes al formato de Gemini
    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Agregar system prompt si existe
    const systemInstruction = system
      ? {
          parts: [{ text: system }],
        }
      : undefined;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: systemInstruction,
          contents,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      const errorMessage = ((data as Record<string, any>)?.error?.message as string) || 'Error en la solicitud a Google AI';
      res.status(response.status).json({ error: errorMessage });
      return;
    }

    const candidates = (data as Record<string, any>)?.candidates;
    const firstTextPart = Array.isArray(candidates)
      ? candidates[0]?.content?.parts?.find((part: any) => typeof part?.text === 'string')
      : null;

    if (!firstTextPart?.text || typeof firstTextPart.text !== 'string') {
      res.status(502).json({ error: 'Google AI devolvió una respuesta vacía o inválida.' });
      return;
    }

    res.json({ text: firstTextPart.text });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error inesperado en la función.' });
  }
});
