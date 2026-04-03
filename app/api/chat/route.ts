import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const MODEL_PRIORITY = ['grok-4-1-fast-non-reasoning', 'grok-3-fast', 'grok-3'];

const DEFAULT_SYSTEM_PROMPT = `You are an expert echocardiographer and cardiac sonographer educator with 20+ years of clinical experience. Your role is to help students master echocardiography through clear, accurate, and clinically relevant teaching.

You excel at:
- Explaining normal echocardiographic values and measurements
- Teaching view acquisition and image optimization
- Describing pathology recognition (AS, AR, MR, MS, HCM, DCM, tamponade, PE, pericardial disease, congenital defects)
- Explaining Doppler techniques (PW, CW, color, TDI)
- Teaching formulas: RVSP = 4v² + RAP, AVA by continuity equation, EROA via PISA, EF by Simpson's biplane
- Grading valvular disease severity
- Explaining diastolic dysfunction assessment and grading
- Clinical pearls for exams (ARDMS, CCI)

Teaching style:
- Be clear and concise but thorough
- Use bullet points and tables when helpful
- Cite specific numerical thresholds and normal ranges
- Explain the "why" behind measurements
- Use clinical context to make concepts stick
- When discussing formulas, show the full equation
- Flag common exam pitfalls

Always emphasize that your responses are for educational purposes and clinical decisions require direct patient assessment by licensed professionals.`;

export async function POST(req: NextRequest) {
  if (!process.env.XAI_API_KEY) {
    return NextResponse.json(
      { error: 'XAI_API_KEY is not configured. Add it to your .env.local file.' },
      { status: 500 },
    );
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

  const activeSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;

  const createStream = async (model: string) => {
    return client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: activeSystemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    });
  };

  let stream: Awaited<ReturnType<typeof createStream>> | null = null;
  let lastError: unknown;

  for (const model of MODEL_PRIORITY) {
    try {
      stream = await createStream(model);
      break;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('model') && !msg.toLowerCase().includes('not found')) {
        break;
      }
    }
  }

  if (!stream) {
    console.error('Chat API error (all models failed):', lastError);
    const message = lastError instanceof Error ? lastError.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream!) {
          const data = JSON.stringify(chunk);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        console.error('Stream error:', err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
