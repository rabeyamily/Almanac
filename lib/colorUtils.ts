function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return null;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

/**
 * Vintage/tinted color: mixes the provided hex with the app paper color.
 * This reduces “modern saturation” so tracker cells match the retro palette.
 */
export function vintageMixWithPaper(hex: string, mixWith: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(mixWith);
  if (!a || !b) return hex;

  const t = Math.max(0, Math.min(1, amount));
  const r = a.r * (1 - t) + b.r * t;
  const g = a.g * (1 - t) + b.g * t;
  const bb = a.b * (1 - t) + b.b * t;
  return rgbToHex(r, g, bb);
}

