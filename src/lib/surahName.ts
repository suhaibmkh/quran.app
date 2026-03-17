export function normalizeSurahName(name?: string): string {
  if (!name) return '';

  return name
    .trim()
    // Remove a leading "سورة" even if it includes Arabic diacritics.
    .replace(/^س[\u064B-\u065F\u0670\u06D6-\u06ED]*\s*و[\u064B-\u065F\u0670\u06D6-\u06ED]*\s*ر[\u064B-\u065F\u0670\u06D6-\u06ED]*\s*ة[\u064B-\u065F\u0670\u06D6-\u06ED]*\s+/u, '')
    .trim();
}

export function formatSurahLabel(name?: string): string {
  const normalized = normalizeSurahName(name);
  return normalized ? `سورة ${normalized}` : '';
}
