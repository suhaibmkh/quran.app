'use client';

import { Moon, Sun, BookOpen, Settings } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  currentChapter: { name: string; englishName: string };
  onSettingsClick: () => void;
  readOnlyMushaf: boolean;
  onToggleMushaf: () => void;
}

export const Header = ({ currentChapter, onSettingsClick, readOnlyMushaf, onToggleMushaf }: HeaderProps) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={`${isDark ? 'bg-dark-card border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-300`}>
      <div className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
        <div className="max-w-6xl mx-auto px-4 py-2 text-center">
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="text-quran-green font-semibold">إهداء</span>{' '}
            إلى روح والدي ووالدتي والشهداء بإذن الله علي الخاطر عبدالرحمن الويس محمد الويس
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo / Mushaf mode toggle */}
        <button
          type="button"
          onClick={onToggleMushaf}
          className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-colors ${
            readOnlyMushaf
              ? 'bg-quran-green/10 ring-1 ring-quran-green/40'
              : isDark
              ? 'hover:bg-gray-700'
              : 'hover:bg-gray-100'
          }`}
          title={readOnlyMushaf ? 'إيقاف وضع المصحف (قراءة فقط)' : 'تفعيل وضع المصحف (قراءة فقط)'}
        >
          <BookOpen className="w-8 h-8 text-quran-green" />
          <div className="text-right">
            <h1 className="text-2xl font-bold text-quran-green">القرآن الكريم</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {readOnlyMushaf ? 'وضع المصحف • قراءة فقط' : 'وضع التفاعل • تلاوة وتفسير'}
            </p>
          </div>
        </button>

        {/* Current Chapter */}
        <div className="text-center">
          <h2 className="text-xl font-bold">{currentChapter.name}</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentChapter.englishName}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="تبديل المظهر"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={onSettingsClick}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="الإعدادات"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
