import { NextRequest, NextResponse } from 'next/server';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const MODELS = ['grok-4-1-fast-reasoning', 'grok-4-1-fast-non-reasoning'];

async function callXAI(key: string, model: string, messages: Array<{ role: string; content: string }>, opts: Record<string, unknown> = {}): Promise<string> {
  const res = await fetch(XAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: 2500, temperature: 0.7, ...opts }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content ?? '';
}

async function tryModels(key: string, messages: Array<{ role: string; content: string }>, opts: Record<string, unknown> = {}): Promise<string> {
  let lastError = '';
  for (const model of MODELS) {
    try {
      return await callXAI(key, model, messages, opts);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`Model ${model} failed:`, lastError);
    }
  }
  throw new Error(lastError || 'All models failed');
}

export async function POST(req: NextRequest) {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'XAI_API_KEY is not configured.' }, { status: 500 });
  }

  let body: {
    type: 'flashcards' | 'quiz' | 'explanation' | 'case';
    topic?: string;
    question?: string;
    correctAnswer?: string;
    userAnswer?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, topic, question, correctAnswer, userAnswer } = body;

  // ── FLASHCARDS ──────────────────────────────────────────────────────────────
  if (type === 'flashcards') {
    if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

    const prompt = `You are an expert echocardiography educator creating study flashcards. Generate exactly 5 high-quality flashcards about: "${topic}".

IMPORTANT: Each card front MUST be a specific clinical question (e.g., "What is the modified Bernoulli equation and when is it used?", "How do you calculate RVSP from a TR jet?", "What are the echo criteria for severe aortic stenosis?"). NOT just a term.

Return a JSON object with key "cards" containing an array of 5 objects, each with:
- "front": string — a specific, targeted clinical question (10–20 words). Must end with "?"
- "back": string — thorough answer (3–6 sentences). Include mechanisms, clinical significance, formulas, and exam pitfalls. Be clinically precise.
- "category": string — use "${topic}" or a relevant subcategory
- "normalValues": string — include ONLY if there are specific numeric thresholds relevant to this card (e.g., "Normal EF ≥55% | Severe AS: AVA <1.0 cm²"). Omit the key if not applicable.

Make questions progressively harder — mix recall, interpretation, and clinical application questions.

Respond with ONLY valid JSON, no markdown, no code blocks, no explanation.`;

    try {
      const result = await tryModels(key, [{ role: 'user', content: prompt }], { response_format: { type: 'json_object' } });
      let parsed: { cards: Array<{ front: string; back: string; category: string; normalValues?: string }> };
      try {
        parsed = JSON.parse(result);
      } catch {
        const match = result.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Could not parse JSON from response');
        parsed = JSON.parse(match[0]);
      }
      if (!Array.isArray(parsed.cards)) throw new Error('Missing cards array in response');
      return NextResponse.json({ cards: parsed.cards });
    } catch (err) {
      console.error('Generate flashcards error:', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate flashcards' }, { status: 500 });
    }
  }

  // ── QUIZ ────────────────────────────────────────────────────────────────────
  if (type === 'quiz') {
    if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

    const prompt = `You are an expert echocardiography educator creating a high-quality clinical quiz. Generate exactly 5 multiple-choice questions about: "${topic}".

Question quality requirements:
- Include a mix of: direct knowledge (1–2 questions), clinical scenario/case-based (2–3 questions), and calculation/interpretation (1 question)
- Clinical scenarios should describe a real patient (age, symptoms, specific echo measurements) and ask for interpretation or next step
- Distractors must be plausible — common misconceptions or similar-sounding values, NOT obviously wrong
- Include at least one question with specific numeric values that must be interpreted (e.g., "TAPSE 14mm, E/e' 18, RVSP 55mmHg — what does this indicate?")

Return a JSON object with key "questions" containing an array of 5 objects, each with:
- "question": string — specific, clinically rich question (may include patient scenario with measurements)
- "options": array of exactly 4 strings — plausible answer choices, no A/B/C/D prefix
- "correctIndex": number — 0–3, index of the correct answer
- "explanation": string — 3–5 sentences: explain WHY the correct answer is right with clinical reasoning, WHY each wrong answer is wrong or commonly confused, and include a relevant threshold/formula/mnemonic

Respond with ONLY valid JSON, no markdown, no code blocks.`;

    try {
      const result = await tryModels(key, [{ role: 'user', content: prompt }], { response_format: { type: 'json_object' } });
      let parsed: { questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }> };
      try {
        parsed = JSON.parse(result);
      } catch {
        const match = result.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Could not parse JSON from response');
        parsed = JSON.parse(match[0]);
      }
      if (!Array.isArray(parsed.questions)) throw new Error('Missing questions array in response');
      return NextResponse.json({ questions: parsed.questions });
    } catch (err) {
      console.error('Generate quiz error:', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate quiz' }, { status: 500 });
    }
  }

  // ── EXPLANATION (streaming) ─────────────────────────────────────────────────
  if (type === 'explanation') {
    if (!question || !correctAnswer) {
      return NextResponse.json({ error: 'question and correctAnswer are required' }, { status: 400 });
    }

    const prompt = `You are an expert echocardiography educator. A student got this quiz question wrong. Explain it using ONLY bullet points — no paragraphs.

Question: "${question}"
Correct answer: "${correctAnswer}"
${userAnswer ? `Student's wrong answer: "${userAnswer}"` : ''}

Respond with short, clear bullets organized like this:
• **✅ Why "${correctAnswer}" is correct:** — specific clinical reasoning
• **❌ Why "${userAnswer || 'the other answer'}" is wrong:** — common misconception explained
• **Key value/formula:** — relevant threshold or equation (if applicable)
• **Remember:** — one-line mnemonic or clinical pearl

Keep every bullet to 1–2 lines. Be encouraging and precise.`;

    let lastError = '';
    for (const model of MODELS) {
      try {
        const res = await fetch(XAI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model, stream: true, max_tokens: 512, temperature: 0.7,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          lastError = err?.error?.message ?? `HTTP ${res.status}`;
          if (res.status === 403 || res.status === 404) continue;
          return NextResponse.json({ error: lastError }, { status: res.status });
        }

        // Stream text chunks only (not SSE format) for simpler client parsing
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                for (const line of chunk.split('\n')) {
                  if (!line.startsWith('data: ')) continue;
                  const d = line.slice(6).trim();
                  if (d === '[DONE]') continue;
                  try {
                    const text = JSON.parse(d).choices?.[0]?.delta?.content ?? '';
                    if (text) controller.enqueue(encoder.encode(text));
                  } catch {}
                }
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });

        return new Response(stream, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`Explanation model ${model} failed:`, lastError);
      }
    }

    return NextResponse.json({ error: lastError || 'All models failed' }, { status: 500 });
  }

  // ── CASE STUDY ──────────────────────────────────────────────────────────────
  if (type === 'case') {
    if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

    const prompt = `You are an expert echocardiography educator. Generate a detailed clinical echocardiography case study about: "${topic}".

Return a JSON object with these exact fields:
- "title": string — the diagnosis (e.g., "Aortic Stenosis")
- "subtitle": string — one-line patient summary (e.g., "72-year-old male, exertional dyspnea")
- "difficulty": "Beginner" | "Intermediate" | "Advanced"
- "icon": string — one relevant emoji (heart, stethoscope, warning sign, etc.)
- "patient": string — 2–3 sentence clinical presentation with age, sex, chief complaint, and key symptoms
- "history": string — 1–2 sentences of relevant labs, vitals, ECG findings, or diagnostic context
- "echoFindings": array of 8–10 strings — specific measured values (e.g., "AVA 0.7 cm² — severely stenotic", "Mean gradient 52 mmHg", "LV posterior wall 12mm — concentric hypertrophy")
- "keyQuestion": string — the core clinical teaching question for this case
- "diagnosis": string — complete one-sentence diagnosis with severity
- "teachingPoints": array of 5–6 strings — clinical pearls with specific thresholds, formulas, or mnemonics relevant to this diagnosis

All echo findings MUST include specific numeric values. Teaching points must be clinically precise with numbers and thresholds.

Respond with ONLY valid JSON, no markdown, no code blocks.`;

    try {
      const result = await tryModels(key, [{ role: 'user', content: prompt }], { response_format: { type: 'json_object' } });
      let parsed: { title: string; subtitle: string; difficulty: string; icon: string; patient: string; history: string; echoFindings: string[]; keyQuestion: string; diagnosis: string; teachingPoints: string[] };
      try {
        parsed = JSON.parse(result);
      } catch {
        const match = result.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Could not parse JSON from response');
        parsed = JSON.parse(match[0]);
      }
      if (!parsed.title || !Array.isArray(parsed.echoFindings)) throw new Error('Invalid case structure');
      return NextResponse.json({ case: parsed });
    } catch (err) {
      console.error('Generate case error:', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate case' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
}
