'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SettingsModal } from '@/components/SettingsModal';
import { Verse } from '@/components/Verse';
import { Pagination } from '@/components/Pagination';
import { ChapterList } from '@/components/ChapterList';
import { WordSearch } from '@/components/WordSearch';
import { useTheme } from '@/context/ThemeContext';
import { reciters, tafsirs } from '@/data/quran';
import { ThemeProvider } from '@/context/ThemeContext';
import { VerseModal } from '@/components/VerseModal';
import { MushafPage } from '@/components/MushafPage';
import type { Ayah, SurahSummary } from '@/lib/alQuranCloud';
import { fetchAyahAudioUrl, fetchJuzAyahs, fetchPageAyahs, fetchSurahAyahs, fetchSurahs } from '@/lib/alQuranCloud';

const VERSES_PER_PAGE = 10;

type ReadingBookmark =
  | {
      kind: 'page';
      pageNumber: number;
      savedAt: number;
    }
  | {
      kind: 'ayah';
      surahId: number;
      ayahNumberInSurah: number;
      globalAyahNumber: number;
      surahName?: string;
      savedAt: number;
    };

const BOOKMARK_STORAGE_KEY = 'quran:lastBookmark:v1';
const PIN_RECITER_KEY = 'quran:pinReciter:v1';
const PIN_TAFSIR_KEY = 'quran:pinTafsir:v1';
const FIXED_RECITER_KEY = 'quran:fixedReciter:v1';
const FIXED_TAFSIR_KEY = 'quran:fixedTafsir:v1';

const UNSUPPORTED_RECITER_IDENTIFIERS = new Set<string>([
  'ar.muhammadimran',
]);

function QuranAppContent() {
  const { isDark } = useTheme();
  const [chapters, setChapters] = useState<SurahSummary[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  const [browseMode, setBrowseMode] = useState<'surah' | 'juz'>('surah');

  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [verseListPage, setVerseListPage] = useState(1);
  const [mushafPageIndex, setMushafPageIndex] = useState(1);
  const [readOnlyMushaf, setReadOnlyMushaf] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Read-only mushaf page browsing (Madinah Mushaf pages 1..604)
  const [mushafPageNumber, setMushafPageNumber] = useState(1);
  const [pageVersesCache, setPageVersesCache] = useState<Record<number, Ayah[]>>({});
  const [pageVersesLoading, setPageVersesLoading] = useState(false);
  const [pageVersesError, setPageVersesError] = useState<string | null>(null);

  const [bookmark, setBookmark] = useState<ReadingBookmark | null>(null);
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  const [pendingOpenAyah, setPendingOpenAyah] = useState<
    { surahId: number; ayahNumberInSurah: number } | null
  >(null);

  const [selectedReciter, setSelectedReciter] = useState<string>(reciters[0]?.identifier ?? 'ar.alafasy');
  const [selectedTafsir, setSelectedTafsir] = useState<string>(tafsirs[0]?.identifier ?? 'ar.muyassar');
  const [pinReciter, setPinReciter] = useState(true);
  const [pinTafsir, setPinTafsir] = useState(true);

  const [fontSize, setFontSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 22
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [surahVersesCache, setSurahVersesCache] = useState<Record<number, Ayah[]>>({});
  const [juzVersesCache, setJuzVersesCache] = useState<Record<number, Ayah[]>>({});
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState<string | null>(null);

  const [verseModalOpen, setVerseModalOpen] = useState(false);
  const [activeVerse, setActiveVerse] = useState<Ayah | null>(null);

  // Auto-play (full surah)
  const autoAudioRef = useRef<HTMLAudioElement | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [autoIndex, setAutoIndex] = useState<number>(-1);

  // Mushaf listening mode (page-by-page with ayah highlight)
  const mushafAudioRef = useRef<HTMLAudioElement | null>(null);
  const [mushafListening, setMushafListening] = useState(false);
  const [mushafListeningLoading, setMushafListeningLoading] = useState(false);
  const [mushafListeningError, setMushafListeningError] = useState<string | null>(null);
  const [mushafHighlightedAyahNumber, setMushafHighlightedAyahNumber] = useState<number | null>(null);
  const [mushafPendingNextPageAutoPlay, setMushafPendingNextPageAutoPlay] = useState(false);

  const selectedSurah = chapters.find((c) => c.id === selectedChapter) || chapters[0];
  const verses =
    browseMode === 'surah'
      ? (selectedSurah && surahVersesCache[selectedSurah.id]) || []
      : juzVersesCache[selectedJuz] || [];

  const saveBookmark = (b: ReadingBookmark) => {
    setBookmark(b);
    try {
      window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(b));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ReadingBookmark;
      if (parsed && typeof parsed === 'object' && 'kind' in parsed) {
        setBookmark(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!bookmarkToast) return;
    const t = window.setTimeout(() => setBookmarkToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [bookmarkToast]);

  useEffect(() => {
    try {
      const savedPinReciter = window.localStorage.getItem(PIN_RECITER_KEY);
      const savedPinTafsir = window.localStorage.getItem(PIN_TAFSIR_KEY);
      const shouldPinReciter = savedPinReciter !== '0';
      const shouldPinTafsir = savedPinTafsir !== '0';

      setPinReciter(shouldPinReciter);
      setPinTafsir(shouldPinTafsir);

      if (shouldPinReciter) {
        const savedReciter = window.localStorage.getItem(FIXED_RECITER_KEY);
        if (savedReciter && reciters.some((r) => r.id === savedReciter)) {
          setSelectedReciter(savedReciter);
        }
      }

      if (shouldPinTafsir) {
        const savedTafsir = window.localStorage.getItem(FIXED_TAFSIR_KEY);
        if (savedTafsir && tafsirs.some((t) => t.id === savedTafsir)) {
          setSelectedTafsir(savedTafsir);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PIN_RECITER_KEY, pinReciter ? '1' : '0');
      if (pinReciter) {
        window.localStorage.setItem(FIXED_RECITER_KEY, selectedReciter);
      }
    } catch {
      // ignore
    }
  }, [pinReciter, selectedReciter]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PIN_TAFSIR_KEY, pinTafsir ? '1' : '0');
      if (pinTafsir) {
        window.localStorage.setItem(FIXED_TAFSIR_KEY, selectedTafsir);
      }
    } catch {
      // ignore
    }
  }, [pinTafsir, selectedTafsir]);

  // Fetch chapters once
  useEffect(() => {
    let cancelled = false;
    setChaptersLoading(true);
    setChaptersError(null);
    fetchSurahs()
      .then((data) => {
        if (cancelled) return;
        setChapters(data);
        if (data.length > 0) setSelectedChapter((prev) => (prev ? prev : data[0].id));
      })
      .catch((err) => {
        if (cancelled) return;
        setChaptersError(err instanceof Error ? err.message : 'تعذّر تحميل السور');
      })
      .finally(() => {
        if (cancelled) return;
        setChaptersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Reset pagination when the selection changes
  useEffect(() => {
    setVerseListPage(1);
    setMushafPageIndex(1);
  }, [browseMode, selectedChapter, selectedJuz]);

  // Fetch verses for the current mushaf page in read-only mode (with caching)
  useEffect(() => {
    if (!readOnlyMushaf) return;
    const page = mushafPageNumber;
    if (!page) return;
    if (pageVersesCache[page]) return;

    let cancelled = false;
    setPageVersesLoading(true);
    setPageVersesError(null);

    fetchPageAyahs(page)
      .then((ayahs) => {
        if (cancelled) return;
        if (!ayahs.length) {
          setPageVersesError('تعذّر عرض الصفحة الحالية. حاول صفحة أخرى أو أعد المحاولة.');
          return;
        }
        setPageVersesCache((prev) => ({ ...prev, [page]: ayahs }));
      })
      .catch((err) => {
        if (cancelled) return;
        setPageVersesError(err instanceof Error ? err.message : 'تعذّر تحميل صفحة المصحف');
      })
      .finally(() => {
        if (cancelled) return;
        setPageVersesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [readOnlyMushaf, mushafPageNumber, pageVersesCache]);

  // Auto-save bookmark when navigating mushaf pages
  useEffect(() => {
    if (!readOnlyMushaf) return;
    saveBookmark({ kind: 'page', pageNumber: mushafPageNumber, savedAt: Date.now() });
  }, [readOnlyMushaf, mushafPageNumber]);

  // Stop auto-play when selection changes
  useEffect(() => {
    setAutoPlaying(false);
    setAutoLoading(false);
    setAutoError(null);
    setAutoIndex(-1);
    if (autoAudioRef.current) {
      autoAudioRef.current.pause();
      autoAudioRef.current.currentTime = 0;
    }
  }, [browseMode, selectedChapter, selectedJuz]);

  // Fetch verses for the current selection (with caching)
  useEffect(() => {
    const activeId = browseMode === 'surah' ? selectedChapter : selectedJuz;
    if (!activeId) return;

    if (browseMode === 'surah' && surahVersesCache[activeId]) return;
    if (browseMode === 'juz' && juzVersesCache[activeId]) return;

    let cancelled = false;
    setVersesLoading(true);
    setVersesError(null);

    const fetcher = browseMode === 'surah' ? fetchSurahAyahs(activeId) : fetchJuzAyahs(activeId);

    fetcher
      .then((ayahs) => {
        if (cancelled) return;
        if (browseMode === 'surah') {
          setSurahVersesCache((prev) => ({ ...prev, [activeId]: ayahs }));
        } else {
          setJuzVersesCache((prev) => ({ ...prev, [activeId]: ayahs }));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setVersesError(err instanceof Error ? err.message : 'تعذّر تحميل الآيات');
      })
      .finally(() => {
        if (cancelled) return;
        setVersesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [browseMode, selectedChapter, selectedJuz, surahVersesCache, juzVersesCache]);

  // When switching into read-only mushaf, try to jump to the current mushaf page
  useEffect(() => {
    if (!readOnlyMushaf) return;
    const surah = chapters.find((c) => c.id === selectedChapter) || chapters[0];
    const currentVerses =
      browseMode === 'surah'
        ? (surah && surahVersesCache[surah.id]) || []
        : juzVersesCache[selectedJuz] || [];

    if (!currentVerses.length) return;
    const first = currentVerses.find((v) => typeof v.page === 'number');
    if (first?.page) setMushafPageNumber(first.page);
  }, [
    readOnlyMushaf,
    browseMode,
    selectedChapter,
    selectedJuz,
    chapters,
    surahVersesCache,
    juzVersesCache,
  ]);

  // If we have a pending ayah to open, do it once verses are available
  useEffect(() => {
    if (!pendingOpenAyah) return;
    if (browseMode !== 'surah') return;
    if (selectedSurah?.id !== pendingOpenAyah.surahId) return;
    if (!verses.length) return;

    const found = verses.find((v) => v.numberInSurah === pendingOpenAyah.ayahNumberInSurah);
    if (!found) return;

    setActiveVerse(found);
    setVerseModalOpen(true);
    setPendingOpenAyah(null);
  }, [pendingOpenAyah, browseMode, selectedSurah?.id, verses]);

  const headerTitle =
    browseMode === 'surah'
      ? {
          name: selectedSurah?.name ?? 'القرآن الكريم',
          englishName: selectedSurah?.englishName ?? '',
        }
      : {
          name: `الجزء ${selectedJuz}`,
          englishName: `Juz ${selectedJuz}`,
        };

  const versesTotalPages = Math.max(1, Math.ceil(verses.length / VERSES_PER_PAGE));
  const startIndex = (verseListPage - 1) * VERSES_PER_PAGE;
  const paginatedVerses = verses.slice(startIndex, startIndex + VERSES_PER_PAGE);

  const mushafPages = useMemo(() => {
    const pageMap = new Map<number, Ayah[]>();
    for (const v of verses) {
      if (typeof v.page !== 'number') continue;
      const arr = pageMap.get(v.page);
      if (arr) arr.push(v);
      else pageMap.set(v.page, [v]);
    }
    const pageNumbers = Array.from(pageMap.keys()).sort((a, b) => a - b);
    return { pageMap, pageNumbers };
  }, [verses]);

  // These are kept for potential future use / preventing unused variable errors
  const _mushafTotalPages = Math.max(1, mushafPages.pageNumbers.length);
  const _activeMushafPageNumber =
    mushafPages.pageNumbers[mushafPageIndex - 1] ?? mushafPages.pageNumbers[0];
  void _mushafTotalPages;
  void _activeMushafPageNumber;

  const highlightedAyahNumber = autoIndex >= 0 ? verses[autoIndex]?.number : null;
  const surahVerseCounts = useMemo(() => {
    const map: Record<number, number> = {};
    for (const c of chapters) {
      map[c.id] = c.versesCount;
    }
    return map;
  }, [chapters]);

  // Keep the playing ayah visible by updating pagination page
  useEffect(() => {
    if (autoIndex < 0) return;
    const desiredPage = Math.floor(autoIndex / VERSES_PER_PAGE) + 1;
    if (desiredPage !== verseListPage) {
      setVerseListPage(desiredPage);
    }
  }, [autoIndex, verseListPage]);

  // Keep mushaf page number in range
  useEffect(() => {
    if (!readOnlyMushaf) return;
    setMushafPageNumber((prev) => {
      if (prev < 1) return 1;
      if (prev > 604) return 604;
      return prev;
    });
  }, [readOnlyMushaf]);

  const playAtIndex = async (index: number) => {
    const ayah = verses[index];
    if (!ayah) return;
    const audioEl = autoAudioRef.current;
    if (!audioEl) return;

    if (UNSUPPORTED_RECITER_IDENTIFIERS.has(selectedReciter)) {
      setAutoPlaying(false);
      setAutoLoading(false);
      setAutoError('هذا القارئ غير متوفر صوتياً حالياً (اختر قارئاً آخر)');
      return;
    }

    setAutoLoading(true);
    setAutoError(null);
    setAutoIndex(index);

    try {
      const url = await fetchAyahAudioUrl(selectedReciter, ayah.number);
      audioEl.src = url;
      await audioEl.play();
      setAutoPlaying(true);
    } catch (err) {
      setAutoPlaying(false);
      setAutoError(err instanceof Error ? err.message : 'تعذّر تشغيل التلاوة');
    } finally {
      setAutoLoading(false);
    }
  };

  const startAutoPlay = async () => {
    if (!verses.length) return;
    await playAtIndex(0);
  };

  const stopAutoPlay = () => {
    setAutoPlaying(false);
    setAutoLoading(false);
    if (autoAudioRef.current) {
      autoAudioRef.current.pause();
      autoAudioRef.current.currentTime = 0;
    }
  };

  const stopMushafListening = () => {
    setMushafListening(false);
    setMushafListeningLoading(false);
    setMushafListeningError(null);
    setMushafPendingNextPageAutoPlay(false);
    setMushafHighlightedAyahNumber(null);

    if (mushafAudioRef.current) {
      mushafAudioRef.current.pause();
      mushafAudioRef.current.currentTime = 0;
    }
  };

  const playMushafAyah = async (ayah: Ayah) => {
    const audioEl = mushafAudioRef.current;
    if (!audioEl) return;

    if (UNSUPPORTED_RECITER_IDENTIFIERS.has(selectedReciter)) {
      setMushafListening(false);
      setMushafListeningLoading(false);
      setMushafListeningError('هذا القارئ غير متوفر صوتياً حالياً (اختر قارئاً آخر)');
      return;
    }

    setMushafListeningLoading(true);
    setMushafListeningError(null);
    setMushafHighlightedAyahNumber(ayah.number);

    try {
      const url = await fetchAyahAudioUrl(selectedReciter, ayah.number);
      audioEl.src = url;
      await audioEl.play();
      setMushafListening(true);
    } catch (err) {
      setMushafListening(false);
      setMushafListeningError(err instanceof Error ? err.message : 'تعذّر تشغيل تلاوة المصحف');
    } finally {
      setMushafListeningLoading(false);
    }
  };

  const startMushafListening = async () => {
    const pageAyahs = pageVersesCache[mushafPageNumber] ?? [];
    if (!pageAyahs.length) {
      setMushafListeningError('لا توجد آيات متاحة في الصفحة الحالية بعد');
      return;
    }

    const currentHighlighted = pageAyahs.find((a) => a.number === mushafHighlightedAyahNumber);
    await playMushafAyah(currentHighlighted ?? pageAyahs[0]);
  };

  const handleMushafAudioEnded = async () => {
    if (!mushafListening) return;

    const pageAyahs = pageVersesCache[mushafPageNumber] ?? [];
    if (!pageAyahs.length) {
      stopMushafListening();
      return;
    }

    const currentIndex = pageAyahs.findIndex((a) => a.number === mushafHighlightedAyahNumber);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= 0 && nextIndex < pageAyahs.length) {
      await playMushafAyah(pageAyahs[nextIndex]);
      return;
    }

    if (mushafPageNumber < 604) {
      setMushafPendingNextPageAutoPlay(true);
      setMushafPageNumber((p) => Math.min(604, p + 1));
      return;
    }

    stopMushafListening();
  };

  useEffect(() => {
    if (!mushafListening) return;
    if (!mushafPendingNextPageAutoPlay) return;

    const pageAyahs = pageVersesCache[mushafPageNumber] ?? [];
    if (!pageAyahs.length) return;

    setMushafPendingNextPageAutoPlay(false);
    playMushafAyah(pageAyahs[0]);
  }, [mushafListening, mushafPendingNextPageAutoPlay, mushafPageNumber, pageVersesCache]);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-light-bg text-gray-900 dark:bg-dark-bg dark:text-white">
      {/* Header */}
      <Header
        currentChapter={headerTitle}
        onSettingsClick={() => setSettingsOpen(true)}
        readOnlyMushaf={readOnlyMushaf}
        onToggleMushaf={() => {
          // Interactive mode is disabled; keep mushaf mode active.
          setReadOnlyMushaf(true);
        }}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        hideModeToggle={true}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        selectedReciter={selectedReciter}
        selectedTafsir={selectedTafsir}
        onReciterChange={setSelectedReciter}
        onTafsirChange={setSelectedTafsir}
        pinReciter={pinReciter}
        pinTafsir={pinTafsir}
        onPinReciterChange={setPinReciter}
        onPinTafsirChange={setPinTafsir}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        readOnlyMushaf={readOnlyMushaf}
      />

      {/* Body: sidebar + main */}
      <div className="flex flex-1 relative overflow-hidden lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            'absolute top-0 right-0 bottom-0 z-40 w-72 overflow-y-auto border-l transition-transform duration-300 ease-in-out',
            'lg:relative lg:z-10 lg:h-full lg:w-full lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full',
            isDark ? 'bg-dark-card border-gray-700' : 'bg-white border-gray-200',
          ].join(' ')}
        >
          <div className="p-4 space-y-4 pb-20">
            {/* Close button – mobile only */}
            <div className="flex items-center justify-between lg:hidden">
              <span className="font-bold text-sm">القائمة</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bookmark */}
            {bookmark && (
              <div className={`border rounded-lg p-3 ${isDark ? 'bg-dark-bg border-gray-700' : 'bg-light-bg border-gray-200'}`}>
                <p className="text-xs font-bold mb-1">آخر موضع</p>
                <p className="text-xs mb-2">
                  {bookmark.kind === 'page'
                    ? `صفحة ${bookmark.pageNumber}`
                    : `${bookmark.surahName ? `سورة ${bookmark.surahName} ` : ''}آية ﴿${bookmark.ayahNumberInSurah}﴾`}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (bookmark.kind === 'page') {
                        setReadOnlyMushaf(true);
                        setVerseModalOpen(false);
                        setActiveVerse(null);
                        setMushafPageNumber(bookmark.pageNumber);
                        stopAutoPlay();
                      } else {
                        setReadOnlyMushaf(true);
                        setMushafPageNumber(1);
                      }
                      setSidebarOpen(false);
                    }}
                    className="bg-quran-green text-white hover:bg-green-700 px-3 py-1 rounded text-xs font-semibold transition-colors"
                  >
                    الانتقال
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookmark(null);
                      try { window.localStorage.removeItem(BOOKMARK_STORAGE_KEY); } catch { /* ignore */ }
                    }}
                    className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1 rounded text-xs font-semibold transition-colors`}
                  >
                    مسح
                  </button>
                </div>
              </div>
            )}

            {/* Chapter / Juz selector */}
            <ChapterList
              mode={browseMode}
              onModeChange={(m) => {
                setBrowseMode(m);
                setVerseModalOpen(false);
                setActiveVerse(null);
                stopAutoPlay();
              }}
              chapters={chapters}
              selectedChapter={selectedChapter}
              onChapterSelect={(c) => { setSelectedChapter(c); setSidebarOpen(false); }}
              selectedJuz={selectedJuz}
              onJuzSelect={(j) => { setSelectedJuz(j); setSidebarOpen(false); }}
            />

            {/* Word search */}
            <WordSearch
              selectedReciter={selectedReciter}
              onOpenTafsir={(ayah) => {
                setActiveVerse(ayah);
                setVerseModalOpen(true);
                stopAutoPlay();
                setSidebarOpen(false);
              }}
            />

            {/* Auto-play – interactive mode only */}
            {!readOnlyMushaf && (
              <div className={`rounded-lg p-3 border ${isDark ? 'border-gray-700 bg-dark-bg' : 'border-gray-200 bg-light-bg'}`}>
                <p className="font-bold text-sm mb-1">
                  {browseMode === 'surah' ? 'تشغيل السورة' : 'تشغيل الجزء'}
                </p>
                <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  تمييز الآية المقروءة تلقائياً
                </p>
                <div className="flex items-center gap-2">
                  {!autoPlaying ? (
                    <button
                      onClick={startAutoPlay}
                      disabled={autoLoading || verses.length === 0}
                      className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                        autoLoading || verses.length === 0
                          ? isDark
                            ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-quran-green text-white hover:bg-green-700'
                      }`}
                    >
                      {autoLoading ? 'جاري...' : 'تشغيل'}
                    </button>
                  ) : (
                    <button
                      onClick={stopAutoPlay}
                      className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1 rounded text-sm font-semibold transition-colors`}
                    >
                      إيقاف
                    </button>
                  )}
                </div>
                {autoError && <p className="mt-2 text-xs text-red-500">{autoError}</p>}
                <audio
                  ref={autoAudioRef}
                  className="hidden"
                  onError={() => {
                    setAutoPlaying(false);
                    setAutoLoading(false);
                    setAutoError('تعذّر تحميل الصوت لهذا القارئ');
                    stopAutoPlay();
                  }}
                  onEnded={() => {
                    const next = autoIndex + 1;
                    if (next < verses.length) playAtIndex(next);
                    else stopAutoPlay();
                  }}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Main reading area */}
        <main className="flex-1 overflow-y-auto min-w-0 w-full">
          {/* Mushaf navigation bar – sticky at top, mushaf mode only */}
          {readOnlyMushaf && (
            <div className={`sticky top-0 z-20 border-b px-3 py-2 flex items-center gap-2 flex-wrap ${isDark ? 'bg-dark-card border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setMushafPageNumber((p) => Math.max(1, p - 1))}
                className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1.5 rounded text-sm font-semibold transition-colors`}
              >
                السابقة
              </button>
              <input
                type="range"
                min={1}
                max={604}
                value={mushafPageNumber}
                onChange={(e) => setMushafPageNumber(Number(e.target.value))}
                className="flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => setMushafPageNumber((p) => Math.min(604, p + 1))}
                className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1.5 rounded text-sm font-semibold transition-colors`}
              >
                التالية
              </button>
              <button
                type="button"
                onClick={() => {
                  saveBookmark({ kind: 'page', pageNumber: mushafPageNumber, savedAt: Date.now() });
                  setBookmarkToast(`تم حفظ الموضع: صفحة ${mushafPageNumber}`);
                }}
                className="bg-quran-green/10 ring-1 ring-quran-green/30 text-quran-green px-3 py-1.5 rounded text-sm font-semibold hover:bg-quran-green/20 transition-colors"
              >
                حفظ
              </button>
              {!mushafListening ? (
                <button
                  type="button"
                  onClick={startMushafListening}
                  disabled={mushafListeningLoading || pageVersesLoading || (pageVersesCache[mushafPageNumber]?.length ?? 0) === 0}
                  className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                    mushafListeningLoading || pageVersesLoading || (pageVersesCache[mushafPageNumber]?.length ?? 0) === 0
                      ? isDark
                        ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-quran-green text-white hover:bg-green-700'
                  }`}
                >
                  {mushafListeningLoading ? 'جاري التحضير...' : 'استماع'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopMushafListening}
                  className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1.5 rounded text-sm font-semibold transition-colors`}
                >
                  إيقاف الاستماع
                </button>
              )}
            </div>
          )}

          {readOnlyMushaf && mushafListeningError && (
            <div className="px-3 py-2 text-sm text-red-500">{mushafListeningError}</div>
          )}

          {/* Bookmark toast */}
          {bookmarkToast && (
            <div className="text-center py-2 text-sm text-quran-green font-semibold">
              {bookmarkToast}
            </div>
          )}

          <div className="p-3 sm:p-5 max-w-3xl mx-auto">
            {readOnlyMushaf ? (
              pageVersesLoading ? (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-card' : 'bg-light-card'}`}>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>جاري تحميل صفحة المصحف...</p>
                </div>
              ) : pageVersesError ? (
                <div className="rounded-lg p-6 bg-red-50 text-red-700 border border-red-200">
                  {pageVersesError}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPageVersesError(null);
                        setPageVersesCache((prev) => {
                          const next = { ...prev };
                          delete next[mushafPageNumber];
                          return next;
                        });
                      }}
                      className="px-3 py-1.5 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                    <button
                      type="button"
                      onClick={() => setMushafPageNumber((p) => Math.min(604, p + 1))}
                      className="px-3 py-1.5 rounded bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                      الصفحة التالية
                    </button>
                  </div>
                </div>
              ) : (pageVersesCache[mushafPageNumber]?.length ?? 0) === 0 ? (
                <div className={`rounded-lg p-6 border ${isDark ? 'bg-dark-card border-gray-700 text-gray-300' : 'bg-light-card border-gray-200 text-gray-700'}`}>
                  <p className="font-semibold mb-2">لا توجد بيانات للصفحة الحالية بعد.</p>
                  <p className="text-sm mb-4">يمكنك إعادة التحميل أو الانتقال للوضع التفاعلي مؤقتًا.</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPageVersesError(null);
                        setPageVersesCache((prev) => {
                          const next = { ...prev };
                          delete next[mushafPageNumber];
                          return next;
                        });
                      }}
                      className="px-3 py-1.5 rounded bg-quran-green text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      تحميل الصفحة
                    </button>
                    <button
                      type="button"
                      onClick={() => setMushafPageNumber((p) => Math.min(604, p + 1))}
                      className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1.5 rounded text-sm font-semibold transition-colors`}
                    >
                      الصفحة التالية
                    </button>
                  </div>
                </div>
              ) : (
                <MushafPage
                  ayahs={pageVersesCache[mushafPageNumber] ?? []}
                  pageNumber={mushafPageNumber}
                  fontSize={fontSize + 8}
                  surahVerseCounts={surahVerseCounts}
                  highlightedAyahNumber={mushafHighlightedAyahNumber}
                  onVersePress={(ayah) => {
                    setActiveVerse(ayah);
                    setVerseModalOpen(true);
                  }}
                />
              )
            ) : browseMode === 'surah' && chaptersLoading ? (
              <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-card' : 'bg-light-card'}`}>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>جاري تحميل السور...</p>
              </div>
            ) : browseMode === 'surah' && chaptersError ? (
              <div className="rounded-lg p-6 bg-red-50 text-red-700 border border-red-200">{chaptersError}</div>
            ) : versesLoading ? (
              <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-card' : 'bg-light-card'}`}>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>جاري تحميل الآيات...</p>
              </div>
            ) : versesError ? (
              <div className="rounded-lg p-6 bg-red-50 text-red-700 border border-red-200">{versesError}</div>
            ) : (
              <div className="page-transition">
                {paginatedVerses.map((verse) => (
                  <Verse
                    key={verse.number}
                    verse={verse}
                    fontSize={fontSize}
                    isHighlighted={highlightedAyahNumber === verse.number}
                    onOpen={() => {
                      setActiveVerse(verse);
                      setVerseModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {readOnlyMushaf ? (
              <Pagination
                currentPage={mushafPageNumber}
                totalPages={604}
                onPageChange={setMushafPageNumber}
              />
            ) : (
              versesTotalPages > 1 && (
                <Pagination
                  currentPage={verseListPage}
                  totalPages={versesTotalPages}
                  onPageChange={setVerseListPage}
                />
              )
            )}
          </div>

          <footer className={`${isDark ? 'bg-dark-card border-gray-700' : 'bg-light-card border-gray-200'} border-t mt-12`}>
            <div className="px-4 py-6 text-center">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                تطبيق القرآن الكريم © 2026
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* Verse Modal */}
      <VerseModal
        isOpen={verseModalOpen}
        onClose={() => setVerseModalOpen(false)}
        surahId={activeVerse?.surahId ?? selectedSurah?.id ?? selectedChapter}
        surahName={activeVerse?.surahName ?? selectedSurah?.name ?? ''}
        verses={
          activeVerse?.surahId && browseMode === 'surah' && selectedSurah?.id === activeVerse.surahId
            ? verses
            : activeVerse
            ? [activeVerse]
            : verses
        }
        verse={activeVerse}
        onVerseChange={(v) => setActiveVerse(v)}
        onSetBookmark={(v) => {
          const b: ReadingBookmark = {
            kind: 'ayah',
            surahId: v.surahId ?? selectedSurah?.id ?? selectedChapter,
            ayahNumberInSurah: v.numberInSurah,
            globalAyahNumber: v.number,
            surahName: v.surahName ?? selectedSurah?.name,
            savedAt: Date.now(),
          };
          saveBookmark(b);
          setBookmarkToast(`تم حفظ الموضع: آية ﴿${v.numberInSurah}﴾`);
        }}
        reciters={reciters}
        tafsirs={tafsirs}
        selectedReciter={selectedReciter}
        selectedTafsir={selectedTafsir}
        onReciterChange={setSelectedReciter}
        onTafsirChange={setSelectedTafsir}
        fontSize={fontSize}
      />

      <audio
        ref={mushafAudioRef}
        className="hidden"
        onError={() => {
          setMushafListening(false);
          setMushafListeningLoading(false);
          setMushafListeningError('تعذّر تحميل الصوت لهذا القارئ');
        }}
        onEnded={() => {
          handleMushafAudioEnded();
        }}
      />
    </div>
  );
}

export default function QuranApp() {
  return (
    <ThemeProvider>
      <QuranAppContent />
    </ThemeProvider>
  );
}
