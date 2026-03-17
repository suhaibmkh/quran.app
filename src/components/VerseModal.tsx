'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Play, Pause, BookOpen, Volume2, Bookmark } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { Ayah } from '@/lib/alQuranCloud';
import { fetchAyahAudioUrl, fetchAyahTafsirText } from '@/lib/alQuranCloud';
import type { Reciter, Tafsir } from '@/data/quran';
import { formatSurahLabel } from '@/lib/surahName';

const UNSUPPORTED_RECITER_IDENTIFIERS = new Set<string>([
  // Not available as an audio edition on alquran.cloud (as of Jan 2026)
  'ar.muhammadimran',
]);

interface VerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  surahId: number;
  surahName: string;
  verses: Ayah[];
  verse: Ayah | null;
  onVerseChange: (verse: Ayah) => void;
  onSetBookmark: (verse: Ayah) => void;
  reciters: Reciter[];
  tafsirs: Tafsir[];
  selectedReciter: string;
  selectedTafsir: string;
  onReciterChange: (id: string) => void;
  onTafsirChange: (id: string) => void;
  fontSize: number;
}

export function VerseModal({
  isOpen,
  onClose,
  surahId,
  surahName,
  verses,
  verse,
  onVerseChange,
  onSetBookmark,
  reciters,
  tafsirs,
  selectedReciter,
  selectedTafsir,
  onReciterChange,
  onTafsirChange,
  fontSize,
}: VerseModalProps) {
  const { isDark } = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const effectiveSurahId = verse?.surahId ?? surahId;
  const effectiveSurahName = verse?.surahName ?? surahName;

  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [tafsirText, setTafsirText] = useState<string>('');
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);

  const audioKey = useMemo(() => {
    if (!verse) return '';
    return `${selectedReciter}:${verse.number}`;
  }, [verse, selectedReciter]);

  useEffect(() => {
    if (!isOpen || !verse) return;

    if (UNSUPPORTED_RECITER_IDENTIFIERS.has(selectedReciter)) {
      setAudioUrl('');
      setAudioLoading(false);
      setAudioError('هذا القارئ غير متوفر صوتياً حالياً (اختر قارئاً آخر)');
      return;
    }

    let cancelled = false;
    setAudioLoading(true);
    setAudioError(null);

    fetchAyahAudioUrl(selectedReciter, verse.number)
      .then((url) => {
        if (cancelled) return;
        setAudioUrl(url);
      })
      .catch((err) => {
        if (cancelled) return;
        setAudioUrl('');
        setAudioError(err instanceof Error ? err.message : 'تعذّر تحميل الصوت');
      })
      .finally(() => {
        if (cancelled) return;
        setAudioLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, verse, selectedReciter, audioKey]);

  useEffect(() => {
    if (!isOpen) return;
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isOpen, audioUrl]);

  useEffect(() => {
    if (!isOpen || !verse) return;

    let cancelled = false;
    setTafsirLoading(true);
    setTafsirError(null);

    fetchAyahTafsirText(effectiveSurahId, verse.numberInSurah, selectedTafsir)
      .then((text) => {
        if (cancelled) return;
        setTafsirText(text);
      })
      .catch((err) => {
        if (cancelled) return;
        setTafsirError(err instanceof Error ? err.message : 'تعذّر جلب التفسير');
        setTafsirText('');
      })
      .finally(() => {
        if (cancelled) return;
        setTafsirLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, verse, effectiveSurahId, selectedTafsir]);

  if (!isOpen || !verse) return null;

  const currentIndex = verses.findIndex((v) => v.number === verse.number);
  const prevVerse = currentIndex > 0 ? verses[currentIndex - 1] : null;
  const nextVerse = currentIndex >= 0 && currentIndex < verses.length - 1 ? verses[currentIndex + 1] : null;

  const containerClass = isDark ? 'bg-dark-card text-white' : 'bg-white text-gray-900';

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
        setAudioError('تعذّر تشغيل الصوت لهذا القارئ');
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`${containerClass} rounded-xl w-full max-w-3xl max-h-[92vh] shadow-xl overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex-shrink-0 flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700 bg-dark-card' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => prevVerse && onVerseChange(prevVerse)}
              disabled={!prevVerse}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                prevVerse
                  ? isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  : isDark
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="الآية السابقة"
            >
              السابقة
            </button>

            <button
              onClick={() => nextVerse && onVerseChange(nextVerse)}
              disabled={!nextVerse}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                nextVerse
                  ? isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  : isDark
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="الآية التالية"
            >
              التالية
            </button>

            <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{formatSurahLabel(effectiveSurahName)}</p>
            <h3 className="text-lg font-bold">الآية ﴿{verse.numberInSurah}﴾</h3>
          </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetBookmark(verse)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="حفظ علامة مرجعية لهذا الموضع"
            >
              <Bookmark size={20} className="text-quran-green" />
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          <div className={`${isDark ? 'bg-gray-800/40' : 'bg-gray-50'} rounded-lg p-4`}
               style={{ fontSize }}>
            <p className="leading-relaxed text-right">{verse.text}</p>
          </div>

          {/* Audio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-quran-green" />
                القارئ
              </label>
              <select
                value={selectedReciter}
                onChange={(e) => onReciterChange(e.target.value)}
                className={`w-full rounded-lg px-3 py-3 outline-none border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                {reciters.map((r) => (
                  <option key={r.id} value={r.identifier}>
                    {UNSUPPORTED_RECITER_IDENTIFIERS.has(r.identifier)
                      ? `${r.name} (غير متوفر)`
                      : r.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={togglePlay}
              disabled={audioLoading || !audioUrl}
              className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                audioLoading || !audioUrl
                  ? isDark
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-quran-green text-white hover:bg-green-700'
              }`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} fill="white" />}
              {audioLoading ? 'جاري التحضير...' : isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            </button>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onError={() => {
                setIsPlaying(false);
                setAudioUrl('');
                setAudioError('تعذّر تحميل الصوت لهذا القارئ (قد لا يكون مدعوماً)');
              }}
              className="hidden"
            />
          </div>

          {audioError && (
            <div className="text-sm text-red-500">{audioError}</div>
          )}

          {/* Tafsir */}
          <div>
            <label className="text-sm font-semibold flex items-center gap-2 mb-2">
              <BookOpen size={16} className="text-blue-500" />
              التفسير
            </label>
            <select
              value={selectedTafsir}
              onChange={(e) => onTafsirChange(e.target.value)}
              className={`w-full rounded-lg px-3 py-3 outline-none border ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              {tafsirs.map((t) => (
                <option key={t.id} value={t.identifier}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className={`mt-3 rounded-lg p-4 border ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
              {tafsirLoading ? (
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>جاري تحميل التفسير...</p>
              ) : tafsirError ? (
                <p className="text-sm text-red-500">{tafsirError}</p>
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{tafsirText}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 z-10 flex-shrink-0 px-5 py-4 border-t ${isDark ? 'border-gray-700 bg-dark-card' : 'border-gray-200 bg-white'} flex justify-end`}>
          <button
            onClick={onClose}
            className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg font-semibold transition-colors`}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
