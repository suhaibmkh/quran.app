'use client';

import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { SurahSummary } from '@/lib/alQuranCloud';
import { ChevronDown } from 'lucide-react';

interface ChapterListProps {
  mode: 'surah' | 'juz';
  onModeChange: (mode: 'surah' | 'juz') => void;
  chapters: SurahSummary[];
  selectedChapter: number;
  onChapterSelect: (chapterId: number) => void;
  selectedJuz: number;
  onJuzSelect: (juzNumber: number) => void;
}

export const ChapterList = ({
  mode,
  onModeChange,
  chapters,
  selectedChapter,
  onChapterSelect,
  selectedJuz,
  onJuzSelect,
}: ChapterListProps) => {
  const { isDark } = useTheme();
  const juzList = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);

  const containerClass = isDark ? 'bg-dark-card border-gray-700' : 'bg-light-card border-gray-200';
  const selectClass = `w-full rounded-lg px-3 py-3 outline-none border appearance-none pr-10 text-sm ${
    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
  }`;

  return (
    <section className={`${containerClass} border rounded-lg p-4`}
      aria-label="اختيار السورة أو الجزء">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => onModeChange('surah')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'surah'
              ? 'bg-quran-green text-white'
              : isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          السور
        </button>
        <button
          type="button"
          onClick={() => onModeChange('juz')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'juz'
              ? 'bg-quran-green text-white'
              : isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          الأجزاء
        </button>
      </div>

      <div className="relative">
        <ChevronDown
          size={18}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
            isDark ? 'text-gray-300' : 'text-gray-500'
          }`}
        />

        {mode === 'surah' ? (
          <select
            value={selectedChapter}
            onChange={(e) => onChapterSelect(Number(e.target.value))}
            className={selectClass}
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}. {c.name} — {c.versesCount} آية
              </option>
            ))}
          </select>
        ) : (
          <select
            value={selectedJuz}
            onChange={(e) => onJuzSelect(Number(e.target.value))}
            className={selectClass}
          >
            {juzList.map((n) => (
              <option key={n} value={n}>
                الجزء {n}
              </option>
            ))}
          </select>
        )}
      </div>
    </section>
  );
};
