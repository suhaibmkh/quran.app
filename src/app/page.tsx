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

const UNSUPPORTED_RECITER_IDENTIFIERS = new Set<string>([
  // Not available as an audio edition on alquran.cloud (as of Jan 2026)
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
  const [readOnlyMushaf, setReadOnlyMushaf] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const mushafTotalPages = Math.max(1, mushafPages.pageNumbers.length);
  const activeMushafPageNumber =
    mushafPages.pageNumbers[mushafPageIndex - 1] ?? mushafPages.pageNumbers[0];
  const activeMushafVerses =
    typeof activeMushafPageNumber === 'number'
      ? mushafPages.pageMap.get(activeMushafPageNumber) ?? []
      : [];

  const highlightedAyahNumber = autoIndex >= 0 ? verses[autoIndex]?.number : null;

  // Keep the playing ayah visible by updating pagination page
  useEffect(() => {
    if (autoIndex < 0) return;
    const desiredPage = Math.floor(autoIndex / VERSES_PER_PAGE) + 1;
    if (desiredPage !== verseListPage) {
      setVerseListPage(desiredPage);
    }
  }, [autoIndex, verseListPage]);

  // If mushaf page mode is active, keep the page number in range
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

  return (
    <div className="min-h-screen bg-light-bg text-gray-900 dark:bg-dark-bg dark:text-white">
      {/* Header */}
      <Header
        currentChapter={headerTitle}
        onSettingsClick={() => setSettingsOpen(true)}
        readOnlyMushaf={readOnlyMushaf}
        onToggleMushaf={() => {
          setReadOnlyMushaf((prev) => !prev);
          setSettingsOpen(false);
          setVerseModalOpen(false);
          setActiveVerse(null);
          stopAutoPlay();
        }}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        selectedReciter={selectedReciter}
        selectedTafsir={selectedTafsir}
        onReciterChange={setSelectedReciter}
        onTafsirChange={setSelectedTafsir}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        readOnlyMushaf={readOnlyMushaf}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Bookmark Bar */}
          {bookmark && (
            <div
              className={`border rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap ${
                isDark ? 'bg-dark-card border-gray-700' : 'bg-light-card border-gray-200'
              }`}
            >
              <div className="text-sm">
                <span className="font-bold">آخر موضع:</span>{' '}
                {bookmark.kind === 'page'
                  ? `صفحة ${bookmark.pageNumber}`
                  : `${bookmark.surahName ? `سورة ${bookmark.surahName} ` : ''}آية ﴿${bookmark.ayahNumberInSurah}﴾`}
              </div>

              <div className="flex items-center gap-2">
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
                      setReadOnlyMushaf(false);
                      setBrowseMode('surah');
                      setSelectedChapter(bookmark.surahId);
                      setSelectedJuz(1);
                      setPendingOpenAyah({
                        surahId: bookmark.surahId,
                        ayahNumberInSurah: bookmark.ayahNumberInSurah,
                      });
                      stopAutoPlay();
                    }
                  }}
                  className="bg-quran-green text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  الانتقال
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBookmark(null);
                    try {
                      window.localStorage.removeItem(BOOKMARK_STORAGE_KEY);
                    } catch {
                      // ignore
                    }
                  }}
                  className={`${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  } px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}
                >
                  مسح
                </button>
              </div>
            </div>
          )}

          {bookmarkToast && (
            <div className="text-sm text-quran-green font-semibold">
              {bookmarkToast}
            </div>
          )}

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              onChapterSelect={setSelectedChapter}
              selectedJuz={selectedJuz}
              onJuzSelect={setSelectedJuz}
            />

            <WordSearch
              selectedReciter={selectedReciter}
              onOpenTafsir={(ayah) => {
                setActiveVerse(ayah);
                setVerseModalOpen(true);
                stopAutoPlay();
              }}
            />
          </div>

          {/* Verses Content */}
          <div>
            {browseMode === 'surah' && chaptersLoading ? (
              <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-card' : 'bg-light-card'}`}>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>جاري تحميل السور...</p>
              </div>
            ) : browseMode === 'surah' && chaptersError ? (
              <div className="rounded-lg p-6 bg-red-50 text-red-700 border border-red-200">
                {chaptersError}
              </div>
            ) : (
              <>
                {versesLoading ? (
                  <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-card' : 'bg-light-card'}`}>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>جاري تحميل الآيات...</p>
                  </div>
                ) : versesError ? (
                  <div className="rounded-lg p-6 bg-red-50 text-red-700 border border-red-200">
                    {versesError}
                  </div>
                ) : (
                  <>
                    {readOnlyMushaf ? (
                      <>
                        <div
                          className={`mb-4 rounded-lg p-4 border ${
                            isDark ? 'border-gray-700 bg-dark-card' : 'border-gray-200 bg-light-card'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              <p className="font-bold">وضع المصحف (قراءة فقط)</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                صفحات المصحف (مشابه لمصحف المدينة) — تنقّل بين الصفحات 1 إلى 604
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  saveBookmark({ kind: 'page', pageNumber: mushafPageNumber, savedAt: Date.now() });
                                  setBookmarkToast(`تم حفظ الموضع: صفحة ${mushafPageNumber}`);
                                }}
                                className="bg-quran-green/10 ring-1 ring-quran-green/30 text-quran-green px-3 py-2 rounded-lg text-sm font-semibold hover:bg-quran-green/20 transition-colors"
                                title="حفظ علامة مرجعية"
                              >
                                حفظ الموضع
                              </button>

                              <button
                                type="button"
                                onClick={() => setMushafPageNumber((p) => Math.max(1, p - 1))}
                                className={`${
                                  isDark
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                } px-3 py-2 rounded-lg text-sm font-semibold transition-colors`}
                                title="الصفحة السابقة"
                              >
                                السابقة
                              </button>

                              <button
                                type="button"
                                onClick={() => setMushafPageNumber((p) => Math.min(604, p + 1))}
                                className={`${
                                  isDark
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                } px-3 py-2 rounded-lg text-sm font-semibold transition-colors`}
                                title="الصفحة التالية"
                              >
                                التالية
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <input
                              type="range"
                              min={1}
                              max={604}
                              value={mushafPageNumber}
                              onChange={(e) => setMushafPageNumber(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>

                        {pageVersesLoading ? (
                          <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-card' : 'bg-light-card'}`}>
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>جاري تحميل صفحة المصحف...</p>
                          </div>
                        ) : pageVersesError ? (
                          <div className="rounded-lg p-6 bg-red-50 text-red-700 border border-red-200">
                            {pageVersesError}
                          </div>
                        ) : (
                          <div
                            className={`rounded-lg p-3 border ${
                              isDark ? 'border-gray-700 bg-dark-card' : 'border-gray-200 bg-light-card'
                            }`}
                          >
                            <div
                              className={`${
                                isDark ? 'bg-[#0f141a] border-gray-700' : 'bg-[#fffdf6] border-[#e6ddc6]'
                              } border rounded-md p-6 md:p-10`}
                            >
                              <div className="flex items-center justify-between text-xs mb-4">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                  {pageVersesCache[mushafPageNumber]?.[0]?.surahName
                                    ? `سورة ${pageVersesCache[mushafPageNumber]?.[0]?.surahName}`
                                    : ''}
                                </span>
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                  صفحة {mushafPageNumber}
                                </span>
                              </div>

                              <div
                                dir="rtl"
                                className="font-mushaf select-text leading-[2.8] text-right"
                                style={{
                                  fontSize: fontSize + 8,
                                  textAlign: 'justify',
                                  textJustify: 'inter-word',
                                }}
                              >
                                {(pageVersesCache[mushafPageNumber] ?? []).map((v) => (
                                  <span key={v.number}>
                                    {v.text}{' '}
                                    <span className="text-quran-green">﴿{v.numberInSurah}﴾</span>{' '}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={`mb-4 rounded-lg p-4 border ${isDark ? 'border-gray-700 bg-dark-card' : 'border-gray-200 bg-light-card'}`}>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="font-bold">{browseMode === 'surah' ? 'تشغيل السورة تلقائياً' : 'تشغيل الجزء تلقائياً'}</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                سيتم تمييز الآية المقروءة تلقائياً
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {!autoPlaying ? (
                                <button
                                  onClick={startAutoPlay}
                                  disabled={autoLoading || verses.length === 0}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                    autoLoading || verses.length === 0
                                      ? isDark
                                        ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-quran-green text-white hover:bg-green-700'
                                  }`}
                                >
                                  {autoLoading ? 'جاري التحضير...' : 'تشغيل'}
                                </button>
                              ) : (
                                <button
                                  onClick={stopAutoPlay}
                                  className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg font-semibold transition-colors`}
                                >
                                  إيقاف
                                </button>
                              )}
                            </div>
                          </div>

                          {autoError && <div className="mt-3 text-sm text-red-500">{autoError}</div>}

                          <audio
                            ref={autoAudioRef}
                            className="hidden"
                            onError={() => {
                              setAutoPlaying(false);
                              setAutoLoading(false);
                              setAutoError('تعذّر تحميل الصوت لهذا القارئ (قد لا يكون مدعوماً)');
                              stopAutoPlay();
                            }}
                            onEnded={() => {
                              const next = autoIndex + 1;
                              if (next < verses.length) {
                                playAtIndex(next);
                              } else {
                                stopAutoPlay();
                              }
                            }}
                          />
                        </div>

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
                      </>
                    )}
                  </>
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
              </>
            )}
          </div>
        </div>
      </main>

      {/* Verse Modal (Audio + Tafsir) */}
      {!readOnlyMushaf && (
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
      )}

      {/* Footer */}
      <footer className={`${isDark ? 'bg-dark-card border-gray-700' : 'bg-light-card border-gray-200'} border-t mt-12`}>
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            تطبيق القرآن الكريم © 2026
          </p>
        </div>
      </footer>
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
