import { NextRequest, NextResponse } from 'next/server';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const MODELS = ['grok-4-1-fast-reasoning', 'grok-4-1-fast-non-reasoning'];

const DEFAULT_SYSTEM = `You are an expert echocardiographer and cardiac sonographer educator with 20+ years of clinical experience helping students master echocardiography.

FORMATTING RULES — follow these strictly every response:
- Always respond using bullet points (•). Never write paragraphs.
- Start sections with a bold header on its own line: **Header:**
- One idea per bullet, 1–2 lines max.
- Put each formula or value on its own bullet.
- End every response with a **Bottom Line:** bullet.
- If the user asks for more detail, expand with 3–5 additional focused bullets on the requested topic.

Content standards:
- Include specific numeric thresholds (e.g., "EF <30% = severely reduced")
- Explain the clinical "why" briefly
- Flag exam pitfalls with ⚠️
- Use formulas in their own bullet (e.g., "• RVSP = 4(TRv)² + RAP")

Always note responses are for educational purposes only.`;

export async function POST(req: NextRequest) {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'XAI_API_KEY is not configured.' }, { status: 500 });
  }

  let messages: Array<{ role: string; content: string }>;
  let systemPrompt: string | undefined;

  try {
    const body = await req.json();
    messages = body.messages;
    systemPrompt = body.systemPrompt;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
  }

  const body = {
    messages: [
      { role: 'system', content: systemPrompt || DEFAULT_SYSTEM },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    stream: true,
    max_tokens: 2048,
    temperature: 0.7,
  };

  let lastError = '';
  for (const model of MODELS) {
    try {
      const res = await fetch(XAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ ...body, model }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
        lastError = err?.error?.message ?? `HTTP ${res.status}`;
        // try next model on permission/model errors
        if (res.status === 403 || res.status === 404) continue;
        return NextResponse.json({ error: lastError }, { status: res.status });
      }

      // Forward the SSE stream directly
      return new Response(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`Chat model ${model} failed:`, lastError);
    }
  }

  return NextResponse.json({ error: lastError || 'All models failed' }, { status: 500 });
}
