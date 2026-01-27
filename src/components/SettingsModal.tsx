'use client';

import { useTheme } from '@/context/ThemeContext';
import { reciters, tafsirs } from '@/data/quran';
import { X, Volume2, BookOpen } from 'lucide-react';

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
}: SettingsModalProps) => {
  const { isDark } = useTheme();

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

        {!readOnlyMushaf && (
          <>
            {/* Reciter Selection */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 size={20} className="text-quran-green" />
                <label className="text-lg font-semibold">القارئ</label>
              </div>
              <div className="space-y-2">
                {reciters.map((reciter) => (
                  <button
                    key={reciter.id}
                    onClick={() => onReciterChange(reciter.id)}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                      selectedReciter === reciter.id
                        ? 'bg-quran-green text-white'
                        : isDark
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {reciter.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tafsir Selection */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={20} className="text-quran-green" />
                <label className="text-lg font-semibold">التفسير</label>
              </div>
              <div className="space-y-2">
                {tafsirs.map((tafsir) => (
                  <button
                    key={tafsir.id}
                    onClick={() => onTafsirChange(tafsir.id)}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                      selectedTafsir === tafsir.id
                        ? 'bg-quran-green text-white'
                        : isDark
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {tafsir.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Font Size */}
        <div className="mb-6">
          <label className="text-lg font-semibold block mb-3">حجم الخط</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="16"
              max="28"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold min-w-12">{fontSize}px</span>
          </div>
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
