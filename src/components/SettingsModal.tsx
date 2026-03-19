'use client';

import { useTheme } from '@/context/ThemeContext';
import { reciters, tafsirs } from '@/data/quran';
import { X, Volume2, BookOpen } from 'lucide-react';

export type MushafFontMode = 'uthmani' | 'amiri' | 'amiri-quran';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReciter: string;
  selectedTafsir: string;
  onReciterChange: (id: string) => void;
  onTafsirChange: (id: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  readOnlyMushaf?: boolean;
  mushafFontMode?: MushafFontMode;
  onMushafFontModeChange?: (mode: MushafFontMode) => void;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  selectedReciter,
  selectedTafsir,
  onReciterChange,
  onTafsirChange,
  fontSize,
  onFontSizeChange,
  readOnlyMushaf,
  mushafFontMode = 'amiri-quran',
  onMushafFontModeChange,
}: SettingsModalProps) => {
  const { isDark } = useTheme();
  const selectClass = `w-full rounded-lg px-3 py-3 outline-none border text-sm ${
    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
  }`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`${
          isDark ? 'bg-dark-card text-white' : 'bg-white text-gray-900'
        } rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">الإعدادات</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Reciter Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 size={20} className="text-quran-green" />
            <label className="text-lg font-semibold">القارئ</label>
          </div>
          <select
            value={selectedReciter}
            onChange={(e) => onReciterChange(e.target.value)}
            className={selectClass}
          >
            {reciters.map((reciter) => (
              <option key={reciter.id} value={reciter.id}>
                {reciter.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tafsir Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} className="text-quran-green" />
            <label className="text-lg font-semibold">التفسير</label>
          </div>
          <select
            value={selectedTafsir}
            onChange={(e) => onTafsirChange(e.target.value)}
            className={selectClass}
          >
            {tafsirs.map((tafsir) => (
              <option key={tafsir.id} value={tafsir.id}>
                {tafsir.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="mb-6">
          <label className="text-lg font-semibold block mb-3">حجم الخط</label>
          <select
            value={String(fontSize)}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className={selectClass}
          >
            {[16, 18, 20, 22, 24, 26, 28].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        {/* Mushaf Font */}
        <div className="mb-6">
          <label className="text-lg font-semibold block mb-3">نوع خط المصحف</label>
          <select
            value={mushafFontMode}
            onChange={(e) => onMushafFontModeChange?.(e.target.value as MushafFontMode)}
            className={selectClass}
          >
            <option value="uthmani">الخط العثماني</option>
            <option value="amiri">Amiri</option>
            <option value="amiri-quran">Amiri Quran</option>
          </select>
          {readOnlyMushaf && (
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              يطبّق هذا الخيار على عرض صفحات المصحف.
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-quran-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          تم
        </button>
      </div>
    </div>
  );
};
