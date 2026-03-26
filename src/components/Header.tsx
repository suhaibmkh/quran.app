'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, BookOpen, Settings, Download } from 'lucide-react';
import { Menu, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface HeaderProps {
  currentChapter: { name: string; englishName: string };
  onSettingsClick: () => void;
  readOnlyMushaf: boolean;
  onToggleMushaf: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  hideModeToggle?: boolean;
}

export const Header = ({ currentChapter, onSettingsClick, readOnlyMushaf, onToggleMushaf, sidebarOpen, onToggleSidebar, hideModeToggle = false }: HeaderProps) => {
  const { isDark, toggleTheme } = useTheme();
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [showIOSInstallHint, setShowIOSInstallHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ((window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    if (standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredInstallPrompt(null);
      setShowIOSInstallHint(false);
    };

    const userAgent = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(userAgent);
    const webkit = /WebKit/.test(userAgent);
    const notOtherBrowser = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
    setIsIOSDevice(iOS);
    setIsIOSSafari(iOS && webkit && notOtherBrowser);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredInstallPrompt(null);
      }
      return;
    }

    if (isIOSDevice) {
      setShowIOSInstallHint(true);
    }
  };

  return (
      <header
        className={`sticky top-0 z-50 ${
          isDark ? 'bg-dark-card border-gray-700' : 'bg-white border-gray-200'
        } border-b transition-colors duration-300`}
      >
        {/* Dedication ribbon */}
        <div className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
          <div className="px-4 py-1 text-center">
            <p className={`text-[10px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="text-quran-green font-semibold">إهداء</span>{' '}
              إلى روح والدي ووالدتي والشهداء بإذن الله علي الخاطر عبدالرحمن الويس محمد الويس
            </p>
          </div>
        </div>

        {/* Main row */}
        <div className="px-3 py-2 flex items-center gap-2" dir="rtl">
          {/* Sidebar toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              sidebarOpen
                ? 'bg-quran-green text-white'
                : isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={sidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <BookOpen className="w-5 h-5 text-quran-green" />
            <span className="text-base font-bold text-quran-green hidden sm:inline">القرآن الكريم</span>
          </div>

          {/* Current chapter */}
          <div className="flex-1 text-center min-w-0 px-1">
            <p className="text-sm sm:text-base font-bold truncate">{currentChapter.name}</p>
            <p className={`text-[10px] sm:text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentChapter.englishName}
            </p>
          </div>

          {/* Mode toggle */}
          {!hideModeToggle && (
            <button
              type="button"
              onClick={onToggleMushaf}
              className={`flex-shrink-0 px-2 py-1.5 rounded-lg transition-colors text-xs font-semibold ${
                readOnlyMushaf
                  ? 'bg-quran-green/10 ring-1 ring-quran-green/50 text-quran-green'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={readOnlyMushaf ? 'التبديل إلى وضع التفاعل' : 'التبديل إلى وضع المصحف'}
            >
              {readOnlyMushaf ? 'تفاعلي' : 'مصحف'}
            </button>
          )}

          {/* Theme */}
          {!isInstalled && (deferredInstallPrompt || isIOSDevice) && (
            <button
              onClick={handleInstallClick}
              className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-700 text-quran-green hover:bg-gray-600'
                  : 'bg-gray-100 text-quran-green hover:bg-gray-200'
              }`}
              title={deferredInstallPrompt ? 'تثبيت التطبيق' : 'إضافة إلى الشاشة الرئيسية'}
            >
              <Download size={18} />
            </button>
          )}

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="تبديل المظهر"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsClick}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="الإعدادات"
          >
            <Settings size={18} />
          </button>
        </div>

        {showIOSInstallHint && !isInstalled && (          <div className={`px-3 pb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`} dir="rtl">
            <div className={`rounded-lg border p-2 text-xs leading-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <p>
                  {isIOSSafari
                    ? 'على iPhone: اضغط زر المشاركة في Safari ثم اختر "إضافة إلى الشاشة الرئيسية".'
                    : 'على iPhone: افتح الموقع في Safari أولاً، ثم اضغط مشاركة واختر "إضافة إلى الشاشة الرئيسية".'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowIOSInstallHint(false)}
                  className={`flex-shrink-0 rounded p-1 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  aria-label="إغلاق"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
    </header>
  );
};
