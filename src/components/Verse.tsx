'use client';

import { useTheme } from '@/context/ThemeContext';
import { Play, BookOpen } from 'lucide-react';
import type { Ayah } from '@/lib/alQuranCloud';

interface VerseComponentProps {
  verse: Ayah;
  fontSize: number;
  onOpen: () => void;
  isHighlighted?: boolean;
}

export const Verse = ({
  verse,
  fontSize,
  onOpen,
  isHighlighted,
}: VerseComponentProps) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`${
        isDark ? 'bg-dark-card hover:bg-gray-700' : 'bg-light-card hover:bg-gray-200'
      } ${
        isHighlighted
          ? 'ring-2 ring-quran-green bg-quran-green/10'
          : ''
      } rounded-lg p-4 mb-4 transition-colors duration-300 cursor-pointer group`}
      onClick={onOpen}
    >
      {/* Verse Number and Text */}
      <div className="flex items-start gap-4">
        <div className="flex-1 text-right">
          <p className="leading-relaxed" style={{ fontSize }}>{verse.text}</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {verse.surahName ? `سورة ${verse.surahName} • ` : ''}﴿{verse.numberInSurah}﴾
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-col opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="bg-quran-green text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
            title="تشغيل الآية"
          >
            <Play size={18} fill="white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className={`${
              isDark
                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            } p-2 rounded-lg transition-colors`}
            title="عرض التفسير"
          >
            <BookOpen size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
