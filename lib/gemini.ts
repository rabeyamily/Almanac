export type GeneratedTaskCategory = 'habit' | 'task' | 'reminder';

export interface GeneratedTaskItem {
  title: string;
  time: string | null;
  category: GeneratedTaskCategory;
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_INSTRUCTION = [
  'You convert natural language into structured planner items.',
  'Return ONLY a valid JSON array.',
  'Do not return markdown, backticks, or explanation text.',
  'Every array item must be:',
  '{ "title": string, "time": string | null, "category": "habit" | "task" | "reminder" }',
].join(' ');

function extractJsonArray(text: string): string | null {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function normalizeItem(value: unknown): GeneratedTaskItem | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
  if (!title) return null;

  const rawTime = candidate.time;
  const time = typeof rawTime === 'string' && rawTime.trim().length > 0 ? rawTime.trim() : null;

  const rawCategory = candidate.category;
  const category =
    rawCategory === 'habit' || rawCategory === 'task' || rawCategory === 'reminder'
      ? rawCategory
      : 'task';

  return { title, time, category };
}

export async function generateTasksFromText(input: string): Promise<GeneratedTaskItem[]> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const prompt = input.trim();
    if (!apiKey || !prompt) return [];

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const modelText = json.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('\n') ?? '';
    const arrayText = extractJsonArray(modelText);
    if (!arrayText) return [];

    const parsed = JSON.parse(arrayText) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeItem).filter((item): item is GeneratedTaskItem => item !== null);
  } catch {
    return [];
  }
}
