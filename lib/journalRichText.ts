export type JournalLinePreset = 'title' | 'heading' | 'subheading' | 'body';

export interface JournalRichSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string | null;
  highlight?: string | null;
  stylePreset?: JournalLinePreset;
}

export function serializeJournalSegments(segments: JournalRichSegment[]): string {
  return JSON.stringify(segments ?? []);
}

export function parseJournalSegments(value: string | null | undefined): JournalRichSegment[] {
  const raw = value ?? '';
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const mapped: JournalRichSegment[] = [];
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const anyItem = item as any;
        if (typeof anyItem.text !== 'string') continue;

        const stylePreset: JournalLinePreset | undefined = anyItem.stylePreset;
        const allowedPresets = new Set<JournalLinePreset>(['title', 'heading', 'subheading', 'body']);
        const safePreset = allowedPresets.has(stylePreset as JournalLinePreset) ? (stylePreset as JournalLinePreset) : undefined;

        mapped.push({
          text: anyItem.text,
          bold: typeof anyItem.bold === 'boolean' ? anyItem.bold : undefined,
          italic: typeof anyItem.italic === 'boolean' ? anyItem.italic : undefined,
          underline: typeof anyItem.underline === 'boolean' ? anyItem.underline : undefined,
          strikethrough: typeof anyItem.strikethrough === 'boolean' ? anyItem.strikethrough : undefined,
          color: typeof anyItem.color === 'string' ? anyItem.color : null,
          highlight: typeof anyItem.highlight === 'string' ? anyItem.highlight : null,
          stylePreset: safePreset,
        });
      }

      if (mapped.length > 0) return mapped;
    }
  } catch {
    // If it wasn't JSON, fall back to plain text.
  }

  // Legacy/plain-text fallback.
  return [{ text: raw, stylePreset: 'body' }];
}

export function journalSegmentsToPlainText(segments: JournalRichSegment[]): string {
  return (segments ?? []).map(s => s.text).join('');
}

