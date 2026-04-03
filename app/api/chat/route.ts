import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const SYSTEM_PROMPT = `You are an expert echocardiographer and cardiac sonographer educator with 20+ years of clinical experience. Your role is to help students master echocardiography through clear, accurate, and clinically relevant teaching.

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
  try {
    const { messages } = await req.json();

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured. Add it to your .env.local file.' },
        { status: 500 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const stream = await client.chat.completions.create({
      model: 'grok-4-1-fast-non-reasoning',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
