'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Search, Play, BookOpen, X } from 'lucide-react';
import type { Ayah } from '@/lib/alQuranCloud';
import { fetchAyahAudioUrl, searchAyahs } from '@/lib/alQuranCloud';
import { formatSurahLabel } from '@/lib/surahName';

interface WordSearchProps {
  selectedReciter: string;
  onOpenTafsir: (ayah: Ayah) => void;
}

export function WordSearch({ selectedReciter, onOpenTafsir }: WordSearchProps) {
  const { isDark } = useTheme();

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [matches, setMatches] = useState<Ayah[]>([]);
  const [isTruncated, setIsTruncated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const [playingLoading, setPlayingLoading] = useState(false);
  const [playingError, setPlayingError] = useState<string | null>(null);

  const containerClass = isDark ? 'bg-dark-card border-gray-700' : 'bg-light-card border-gray-200';

  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    setSubmittedQuery(trimmed);

    if (!trimmed) {
      setError(null);
      setCount(0);
      setMatches([]);
      setIsTruncated(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPlayingError(null);

    try {
      const res = await searchAyahs(trimmed, 'ar.uthmani', 200);
      setCount(res.count);
      setMatches(res.matches);
      setIsTruncated(res.count > res.matches.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر البحث');
      setCount(0);
      setMatches([]);
      setIsTruncated(false);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSubmittedQuery('');
    setError(null);
    setCount(0);
    setMatches([]);
    setIsTruncated(false);
  };

  const playAyah = async (ayah: Ayah) => {
    if (!audioRef.current) return;

    setPlayingLoading(true);
    setPlayingError(null);
    setPlayingAyahNumber(ayah.number);

    try {
      const url = await fetchAyahAudioUrl(selectedReciter, ayah.number);
      audioRef.current.src = url;
      await audioRef.current.play();
    } catch (err) {
      setPlayingError(err instanceof Error ? err.message : 'تعذّر تشغيل التلاوة');
      setPlayingAyahNumber(null);
    } finally {
      setPlayingLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <section className={`${containerClass} border rounded-lg p-4`} aria-label="البحث عن كلمة">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Search size={18} className="text-quran-green" />
            <h2 className="font-bold">بحث عن كلمة</h2>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearch(query);
                }}
                placeholder="اكتب كلمة (مثال: الرحمن)"
                className={`w-full pr-10 pl-3 py-3 rounded-lg outline-none border transition-colors text-sm ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-500'
                }`}
              />
              <Search
                size={16}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}
              />
            </div>

            <button
              type="button"
              onClick={() => runSearch(query)}
              disabled={!canSearch || loading}
              className={`px-5 py-3 rounded-lg font-semibold transition-colors text-sm ${
                !canSearch || loading
                  ? isDark
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-quran-green text-white hover:bg-green-700'
              }`}
            >
              {loading ? 'جاري البحث...' : 'بحث'}
            </button>
          </div>

          {(error || submittedQuery) && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className={`text-sm ${error ? 'text-red-500' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {error
                  ? error
                  : `عدد النتائج لكلمة "${submittedQuery}": ${count}`}
                {!error && isTruncated ? ' (تم عرض أول 200 نتيجة)' : ''}
              </div>

              {(submittedQuery || matches.length > 0) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-sm flex items-center gap-1`}
                  title="مسح البحث"
                >
                  <X size={16} />
                  مسح
                </button>
              )}
            </div>
          )}

          {playingError && <div className="mt-2 text-sm text-red-500">{playingError}</div>}
        </div>
      </div>

      <audio
        ref={audioRef}
        className="hidden"
        onEnded={() => setPlayingAyahNumber(null)}
        onError={() => {
          setPlayingAyahNumber(null);
          setPlayingLoading(false);
          setPlayingError('تعذّر تحميل الصوت لهذا القارئ (قد لا يكون مدعوماً)');
        }}
      />

      {matches.length > 0 && (
        <div className="mt-4 space-y-3">
          {matches.map((m) => (
            <div
              key={`${m.number}`}
              className={`${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 text-right">
                  <p className="leading-relaxed">{m.text}</p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {m.surahName ? `${formatSurahLabel(m.surahName)} • ` : ''}﴿{m.numberInSurah}﴾
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => playAyah(m)}
                    disabled={playingLoading && playingAyahNumber === m.number}
                    className={`p-2 rounded-lg transition-colors ${
                      playingAyahNumber === m.number
                        ? 'bg-quran-green text-white'
                        : isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                    title="تشغيل قراءة الآية"
                  >
                    <Play size={18} fill={playingAyahNumber === m.number ? 'white' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenTafsir(m)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                    title="عرض التفسير"
                  >
                    <BookOpen size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && submittedQuery && matches.length === 0 && !error && (
        <div className={`mt-4 text-sm p-3 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          لا توجد نتائج
        </div>
      )}
    </section>
  );
}
