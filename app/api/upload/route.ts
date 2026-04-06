import { NextRequest, NextResponse } from 'next/server';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const TEXT_MODELS = ['grok-3-fast', 'grok-4-1-fast-non-reasoning'];
const VISION_MODELS = ['grok-2-vision-1212'];

async function callXAI(
  key: string,
  model: string,
  messages: Array<{ role: string; content: unknown }>,
  opts: Record<string, unknown> = {}
): Promise<string> {
  const res = await fetch(XAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: 4000, temperature: 0.5, ...opts }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content ?? '';
}

function buildPrompt(contentDesc: string): string {
  return `You are an expert medical educator. A student has uploaded study material: ${contentDesc}

Analyze the content thoroughly and generate comprehensive study resources. Return ONLY a valid JSON object with these exact keys:

{
  "title": "concise title for this material (max 6 words)",
  "studyNotes": "comprehensive markdown study notes — use ## headings, **bold** key terms, bullet points, and include all important concepts, definitions, mechanisms, values/thresholds, and clinical pearls from the material. Aim for thorough coverage.",
  "flashcards": [
    {"front": "specific clinical question ending with ?", "back": "thorough answer 2-4 sentences", "category": "topic name"}
  ],
  "quizQuestions": [
    {"question": "clinical question or scenario", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "why correct, why others wrong, key value/formula"}
  ]
}

Requirements:
- Generate 10 flashcards: mix of recall, interpretation, and application questions
- Generate 5 quiz questions: include 2 clinical scenarios with specific values
- studyNotes: thorough markdown, covering all key topics from the material
- All content must be directly derived from the uploaded material

Respond with ONLY valid JSON, no markdown, no code blocks.`;
}

async function generateFromText(key: string, text: string, fileName: string): Promise<string> {
  const truncated = text.slice(0, 12000); // stay within token limits
  const prompt = buildPrompt(`a document called "${fileName}". Here is the extracted text content:\n\n${truncated}`);
  let lastError = '';
  for (const model of TEXT_MODELS) {
    try {
      return await callXAI(key, model, [{ role: 'user', content: prompt }], { response_format: { type: 'json_object' } });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(lastError || 'All text models failed');
}

async function generateFromImage(key: string, base64: string, mimeType: string, fileName: string): Promise<string> {
  const prompt = buildPrompt(`an image/slide called "${fileName}"`);
  let lastError = '';
  for (const model of VISION_MODELS) {
    try {
      return await callXAI(key, model, [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      }]);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  // Fallback to text models with description request
  for (const model of TEXT_MODELS) {
    try {
      return await callXAI(key, model, [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      }]);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(lastError || 'All vision models failed');
}

export async function POST(req: NextRequest) {
  const key = process.env.XAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'XAI_API_KEY not configured' }, { status: 500 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Could not parse form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const fileName = file.name;
  const mimeType = file.type;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let rawResult = '';

  try {
    if (mimeType.startsWith('image/')) {
      // Image — use vision model
      const base64 = buffer.toString('base64');
      rawResult = await generateFromImage(key, base64, mimeType, fileName);
    } else if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // PDF — extract text first
      // Dynamic import to avoid Next.js bundling issues
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      rawResult = await generateFromText(key, data.text, fileName);
    } else {
      // Plain text / markdown
      const text = buffer.toString('utf-8');
      rawResult = await generateFromText(key, text, fileName);
    }

    // Parse response
    let parsed: {
      title: string;
      studyNotes: string;
      flashcards: Array<{ front: string; back: string; category: string }>;
      quizQuestions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
    };

    try {
      parsed = JSON.parse(rawResult);
    } catch {
      const match = rawResult.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse JSON from AI response');
      parsed = JSON.parse(match[0]);
    }

    if (!parsed.title || !parsed.studyNotes || !Array.isArray(parsed.flashcards) || !Array.isArray(parsed.quizQuestions)) {
      throw new Error('Incomplete response from AI');
    }

    return NextResponse.json({
      title: parsed.title,
      studyNotes: parsed.studyNotes,
      flashcards: parsed.flashcards,
      quizQuestions: parsed.quizQuestions,
    });
  } catch (err) {
    console.error('Upload processing error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Processing failed' }, { status: 500 });
  }
}
