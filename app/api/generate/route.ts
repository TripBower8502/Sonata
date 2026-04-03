import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const MODEL_PRIORITY = ['grok-4-1-fast-non-reasoning', 'grok-3-fast', 'grok-3'];

async function tryModels<T>(fn: (model: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const model of MODEL_PRIORITY) {
    try {
      return await fn(model);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // only retry on model-not-found type errors
      if (!msg.toLowerCase().includes('model') && !msg.toLowerCase().includes('not found')) {
        throw err;
      }
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  if (!process.env.XAI_API_KEY) {
    return NextResponse.json(
      { error: 'XAI_API_KEY is not configured. Add it to your .env.local file.' },
      { status: 500 },
    );
  }

  let body: {
    type: 'flashcards' | 'quiz' | 'explanation';
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

  // ── FLASHCARDS ───────────────────────────────────────────────────────────────
  if (type === 'flashcards') {
    if (!topic) {
      return NextResponse.json({ error: 'topic is required for flashcard generation' }, { status: 400 });
    }

    const prompt = `You are an expert echocardiography educator. Generate exactly 5 high-quality flashcards about the topic: "${topic}".

Return a JSON object with a single key "cards" containing an array of 5 flashcard objects. Each object must have:
- "front": string (concise term or question, max 10 words)
- "back": string (thorough explanation, 2–5 sentences, clinically accurate)
- "category": string (use "${topic}" or a relevant subcategory)
- "normalValues": string (optional — include only if there are specific numeric normal ranges relevant to this card; omit the key otherwise)

Focus on clinically important, exam-relevant content. Include real numeric thresholds and formulas where applicable.

Example format:
{"cards":[{"front":"Term or question","back":"Detailed explanation here.","category":"${topic}","normalValues":"Normal: X | Abnormal: Y"}]}`;

    try {
      const result = await tryModels(async (model) => {
        const completion = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });
        return completion.choices[0].message.content ?? '';
      });

      let parsed: { cards: Array<{ front: string; back: string; category: string; normalValues?: string }> };
      try {
        parsed = JSON.parse(result);
      } catch {
        // fallback: try to extract JSON from the text
        const match = result.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Could not parse JSON from model response');
        parsed = JSON.parse(match[0]);
      }

      if (!Array.isArray(parsed.cards)) {
        throw new Error('Unexpected response shape — missing cards array');
      }

      return NextResponse.json({ cards: parsed.cards });
    } catch (err) {
      console.error('Generate flashcards error:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate flashcards';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ── QUIZ ─────────────────────────────────────────────────────────────────────
  if (type === 'quiz') {
    if (!topic) {
      return NextResponse.json({ error: 'topic is required for quiz generation' }, { status: 400 });
    }

    const prompt = `You are an expert echocardiography educator creating a multiple-choice quiz. Generate exactly 5 quiz questions about the topic: "${topic}".

Return a JSON object with a single key "questions" containing an array of 5 question objects. Each object must have:
- "question": string (clear, specific clinical question)
- "options": array of exactly 4 strings (the answer choices, labeled without A/B/C/D prefix)
- "correctIndex": number (0–3, the index of the correct answer in the options array)
- "explanation": string (2–4 sentences explaining why the answer is correct and why others are wrong)

Questions should range from straightforward recall to application-level clinical scenarios. Use realistic values and clinical contexts.

Example format:
{"questions":[{"question":"What is the normal range for...","options":["Option 1","Option 2","Option 3","Option 4"],"correctIndex":2,"explanation":"Option 3 is correct because..."}]}`;

    try {
      const result = await tryModels(async (model) => {
        const completion = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2500,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });
        return completion.choices[0].message.content ?? '';
      });

      let parsed: {
        questions: Array<{
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }>;
      };
      try {
        parsed = JSON.parse(result);
      } catch {
        const match = result.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Could not parse JSON from model response');
        parsed = JSON.parse(match[0]);
      }

      if (!Array.isArray(parsed.questions)) {
        throw new Error('Unexpected response shape — missing questions array');
      }

      return NextResponse.json({ questions: parsed.questions });
    } catch (err) {
      console.error('Generate quiz error:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate quiz';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ── EXPLANATION (streaming) ──────────────────────────────────────────────────
  if (type === 'explanation') {
    if (!question || !correctAnswer) {
      return NextResponse.json(
        { error: 'question and correctAnswer are required for explanation' },
        { status: 400 },
      );
    }

    const userAnswerLine = userAnswer
      ? `The student selected: "${userAnswer}" (which was incorrect).`
      : '';

    const prompt = `You are an expert echocardiography educator. A student got the following quiz question wrong.

Question: "${question}"
Correct answer: "${correctAnswer}"
${userAnswerLine}

Please provide a clear, educational explanation (3–5 sentences) that:
1. Explains why the correct answer is right, with specific clinical reasoning
2. If the student's wrong answer is known, briefly explains why it was incorrect
3. Includes a memorable clinical pearl or mnemonic if applicable
4. Mentions any relevant normal values or thresholds

Be warm, encouraging, and focus on helping them understand the concept.`;

    try {
      const stream = await tryModels(async (model) => {
        return client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          max_tokens: 512,
          temperature: 0.7,
        });
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content ?? '';
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (err) {
      console.error('Generate explanation error:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate explanation';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
}
