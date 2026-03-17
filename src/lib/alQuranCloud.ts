export type SurahSummary = {
  id: number;
  name: string;
  englishName: string;
  versesCount: number;
  revelationType: string;
};

export type Ayah = {
  /** Global ayah number (1..6236) */
  number: number;
  /** Ayah number within the surah */
  numberInSurah: number;
  text: string;
  page?: number;
  juz?: number;
  /** Present when ayah is fetched as part of a juz or when provided by the API */
  surahId?: number;
  surahName?: string;
  surahEnglishName?: string;
};

export type AyahSearchResult = {
  count: number;
  matches: Ayah[];
};

const API_BASE = '/api/quran';

const quranEditionAyahsCache: Record<string, Promise<Ayah[]>> = {};

function normalizeArabicForSearch(input: string): string {
  return input
    .normalize('NFKD')
    // Arabic diacritics + Quranic annotation marks
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // Tatweel
    .replace(/\u0640/g, '')
    .toLowerCase()
    .trim();
}

async function fetchQuranEditionAyahs(edition: string): Promise<Ayah[]> {
  if (!quranEditionAyahsCache[edition]) {
    quranEditionAyahsCache[edition] = (async () => {
      const data = await fetchJson<{ data: { surahs: any[] } }>(`${API_BASE}/quran/${edition}`);
      const surahs = Array.isArray(data?.data?.surahs) ? data.data.surahs : [];

      const flattened: Ayah[] = [];
      for (const s of surahs) {
        const surahId: number | undefined = s?.number;
        const surahName: string | undefined = s?.name;
        const surahEnglishName: string | undefined = s?.englishName;
        const ayahs: any[] = Array.isArray(s?.ayahs) ? s.ayahs : [];

        for (const a of ayahs) {
          flattened.push({
            number: a.number,
            numberInSurah: a.numberInSurah,
            text: a.text,
            page: a.page,
            juz: a.juz,
            surahId,
            surahName,
            surahEnglishName,
          });
        }
      }

      return flattened;
    })();
  }

  return quranEditionAyahsCache[edition];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchSurahs(): Promise<SurahSummary[]> {
  const data = await fetchJson<{ data: any[] }>(`${API_BASE}/surah`);
  return data.data.map((s) => ({
    id: s.number,
    name: s.name,
    englishName: s.englishName,
    versesCount: s.numberOfAyahs,
    revelationType: s.revelationType,
  }));
}

export async function fetchSurahAyahs(surahId: number): Promise<Ayah[]> {
  const data = await fetchJson<{ data: { ayahs: any[] } }>(
    `${API_BASE}/surah/${surahId}/ar.uthmani`
  );

  return data.data.ayahs.map((a) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    page: a.page,
    juz: a.juz,
    surahId: a?.surah?.number ?? surahId,
    surahName: a?.surah?.name,
    surahEnglishName: a?.surah?.englishName,
  }));
}

export async function fetchJuzAyahs(juzNumber: number): Promise<Ayah[]> {
  if (!Number.isFinite(juzNumber) || juzNumber < 1 || juzNumber > 30) {
    throw new Error('رقم الجزء غير صالح');
  }

  const data = await fetchJson<{ data: { ayahs: any[] } }>(
    `${API_BASE}/juz/${juzNumber}/ar.uthmani`
  );

  return data.data.ayahs.map((a) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    page: a.page,
    juz: a.juz,
    surahId: a?.surah?.number,
    surahName: a?.surah?.name,
    surahEnglishName: a?.surah?.englishName,
  }));
}

export async function fetchPageAyahs(pageNumber: number, edition: string = 'ar.uthmani'): Promise<Ayah[]> {
  if (!Number.isFinite(pageNumber) || pageNumber < 1 || pageNumber > 604) {
    throw new Error('رقم الصفحة غير صالح');
  }

  const data = await fetchJson<{ data: { ayahs: any[] } }>(
    `${API_BASE}/page/${pageNumber}/${edition}`
  );

  return data.data.ayahs.map((a) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    page: a.page,
    juz: a.juz,
    surahId: a?.surah?.number,
    surahName: a?.surah?.name,
    surahEnglishName: a?.surah?.englishName,
  }));
}

export function getAyahAudioUrl(reciterIdentifier: string, globalAyahNumber: number) {
  // Matches the audio URL returned by alquran.cloud
  return `https://cdn.islamic.network/quran/audio/128/${reciterIdentifier}/${globalAyahNumber}.mp3`;
}

export async function fetchAyahAudioUrl(
  reciterIdentifier: string,
  globalAyahNumber: number
): Promise<string> {
  try {
    const data = await fetchJson<{ data: { audio?: string } }>(
      `${API_BASE}/ayah/${globalAyahNumber}/${reciterIdentifier}`
    );
    if (data?.data?.audio) return data.data.audio;
  } catch {
    // ignore and fallback
  }

  return getAyahAudioUrl(reciterIdentifier, globalAyahNumber);
}

export async function fetchAyahTafsirText(
  surahId: number,
  ayahNumberInSurah: number,
  tafsirIdentifier: string
): Promise<string> {
  const data = await fetchJson<{ data: { text: string } }>(
    `${API_BASE}/ayah/${surahId}:${ayahNumberInSurah}/${tafsirIdentifier}`
  );
  return data.data.text;
}

export async function searchAyahs(
  query: string,
  edition: string = 'ar.uthmani',
  maxMatches: number = 200
): Promise<AyahSearchResult> {
  const q = query.trim();
  if (!q) return { count: 0, matches: [] };

  // The /search endpoint is unreliable for full-Quran searches (often 404/500).
  // We instead fetch the full Quran edition once and search locally.
  const ayahs = await fetchQuranEditionAyahs(edition);
  const needle = normalizeArabicForSearch(q);

  let count = 0;
  const matches: Ayah[] = [];
  const limit = Math.max(0, maxMatches);

  for (const a of ayahs) {
    if (!a?.text) continue;
    if (normalizeArabicForSearch(a.text).includes(needle)) {
      count++;
      if (matches.length < limit) {
        matches.push(a);
      }
    }
  }

  return { count, matches };
}
