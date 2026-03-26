'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Wifi, WifiOff, CheckCircle, Download, Info } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { fetchPageAyahs } from '@/lib/alQuranCloud';

interface OfflineGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMushafPage: number;
}

const CACHED_PAGES_KEY = 'quran:cachedPages:v1';
const PAGE_CACHE_PREFIX = 'quran:mushafPage:v1:';

function pageStorageKey(page: number): string {
  return `${PAGE_CACHE_PREFIX}${page}`;
}

function savePageToLocalStorage(page: number, ayahs: unknown) {
  try {
    localStorage.setItem(pageStorageKey(page), JSON.stringify(ayahs));
  } catch {
    // ignore storage quota issues
  }
}

type OfflineReadiness = {
  swSupported: boolean;
  swRegistered: boolean;
  swControlling: boolean;
  secureContext: boolean;
  localHostHttp: boolean;
  cacheStorageSupported: boolean;
  hasOfflineFallback: boolean;
  hasStartUrlCache: boolean;
  hasQuranApiCache: boolean;
};

// Standard Madinah Mushaf juz page ranges
const JUZ_PAGES: [number, number][] = [
  [1, 21], [22, 41], [42, 61], [62, 81], [82, 101],
  [102, 121], [122, 141], [142, 161], [162, 181], [182, 201],
  [202, 221], [222, 241], [242, 261], [262, 281], [282, 301],
  [302, 321], [322, 341], [342, 361], [362, 381], [382, 401],
  [402, 421], [422, 441], [442, 461], [462, 481], [482, 501],
  [502, 521], [522, 541], [542, 561], [562, 581], [582, 604],
];

const JUZ_AR = [
  'الأوَّل', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
  'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر',
  'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون',
  'الحادي والعشرون', 'الثاني والعشرون', 'الثالث والعشرون', 'الرابع والعشرون', 'الخامس والعشرون',
  'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون', 'التاسع والعشرون', 'الثلاثون',
];

function getJuzIndex(page: number): number {
  for (let i = 0; i < JUZ_PAGES.length; i++) {
    const [s, e] = JUZ_PAGES[i];
    if (page >= s && page <= e) return i;
  }
  return 0;
}

function loadCachedPages(): Set<number> {
  try {
    const raw = localStorage.getItem(CACHED_PAGES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveCachedPages(pages: Set<number>) {
  try {
    localStorage.setItem(CACHED_PAGES_KEY, JSON.stringify([...pages]));
  } catch { /* storage full */ }
}

export function OfflineGuideModal({ isOpen, onClose, currentMushafPage }: OfflineGuideModalProps) {
  const { isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [cachedPages, setCachedPages] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadDone, setDownloadDone] = useState(false);
  const [selectedJuzIndex, setSelectedJuzIndex] = useState(0);
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [readiness, setReadiness] = useState<OfflineReadiness | null>(null);

  const runReadinessCheck = useCallback(async () => {
    setCheckingReadiness(true);
    const result: OfflineReadiness = {
      swSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
      swRegistered: false,
      swControlling: false,
      secureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      localHostHttp:
        typeof window !== 'undefined' &&
        window.location.protocol === 'http:' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
      cacheStorageSupported: typeof window !== 'undefined' && 'caches' in window,
      hasOfflineFallback: false,
      hasStartUrlCache: false,
      hasQuranApiCache: false,
    };

    try {
      if (result.swSupported) {
        const registration = await navigator.serviceWorker.getRegistration();
        result.swRegistered = Boolean(registration);
        result.swControlling = Boolean(navigator.serviceWorker.controller);
      }

      if (result.cacheStorageSupported) {
        const cacheKeys = await caches.keys();
        const offlineUrl = new URL('/offline', window.location.origin).toString();
        const homeUrl = new URL('/', window.location.origin).toString();

        for (const key of cacheKeys) {
          const cache = await caches.open(key);
          const offlineHit = await cache.match(offlineUrl, { ignoreSearch: true });
          const homeHit = await cache.match(homeUrl, { ignoreSearch: true });

          if (offlineHit) result.hasOfflineFallback = true;
          if (homeHit || key.includes('start-url')) result.hasStartUrlCache = true;
          if (key.includes('quran-api-data')) result.hasQuranApiCache = true;
        }
      }
    } catch {
      // ignore readiness check failures and show best-effort status
    } finally {
      setReadiness(result);
      setCheckingReadiness(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    setCachedPages(loadCachedPages());
    setDownloadDone(false);
    setDownloadError(null);
    setSelectedJuzIndex(getJuzIndex(currentMushafPage));
    void runReadinessCheck();

    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, [isOpen, currentMushafPage, runReadinessCheck]);

  const [juzStart, juzEnd] = JUZ_PAGES[selectedJuzIndex];
  const juzPageCount = juzEnd - juzStart + 1;
  const cachedInJuz = [...cachedPages].filter(p => p >= juzStart && p <= juzEnd).length;
  const juzComplete = cachedInJuz === juzPageCount;

  const downloadRange = useCallback(async (start: number, end: number) => {
    if (downloading) return;
    setDownloading(true);
    setDownloadDone(false);
    setDownloadError(null);
    const count = end - start + 1;
    setTotal(count);
    setProgress(0);
    const newCached = new Set(cachedPages);
    for (let page = start; page <= end; page++) {
      if (newCached.has(page)) {
        setProgress(p => p + 1);
        continue;
      }
      try {
        const ayahs = await fetchPageAyahs(page, 'quran-uthmani');
        if (!Array.isArray(ayahs) || ayahs.length === 0) {
          throw new Error('EMPTY_PAGE');
        }
        savePageToLocalStorage(page, ayahs);
        newCached.add(page);
        setProgress(p => p + 1);
      } catch {
        setDownloadError(`فشل تحميل الصفحة ${page} — تحقق من الاتصال`);
        break;
      }
    }
    setCachedPages(new Set(newCached));
    saveCachedPages(newCached);
    setDownloading(false);
    setDownloadDone(true);
  }, [downloading, cachedPages]);

  if (!isOpen) return null;

  const bg = isDark ? '#111827' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textMain = isDark ? '#f3f4f6' : '#1f2937';
  const textSub = isDark ? '#9ca3af' : '#6b7280';
  const cardBg = isDark ? '#1f2937' : '#f9fafb';
  const totalCached = cachedPages.size;
  const readinessOk = Boolean(
    readiness &&
    readiness.swSupported &&
    (readiness.secureContext || readiness.localHostHttp) &&
    readiness.swRegistered &&
    readiness.swControlling &&
    readiness.hasOfflineFallback &&
    readiness.hasStartUrlCache &&
    (readiness.hasQuranApiCache || totalCached > 0)
  );

  const readinessHint = !readiness
    ? 'اضغط فحص الجاهزية لمعرفة حالة الأوف لاين'
    : !readiness.swSupported
    ? 'المتصفح لا يدعم Service Worker في هذه الجلسة'
    : !readiness.secureContext && !readiness.localHostHttp
    ? 'الرابط غير آمن (http). استخدم https أو localhost حتى يعمل الأوف لاين'
    : !readiness.swRegistered
    ? 'افتح التطبيق وهو متصل ثم أعد تشغيله ليتم تسجيل Service Worker'
    : !readiness.swControlling
    ? 'أغلق التطبيق وافتحه مرة أخرى ليصبح Service Worker متحكما'
    : !readiness.hasOfflineFallback
    ? 'لم يتم حفظ صفحة /offline بعد. افتح التطبيق أونلاين مرة أخرى'
    : totalCached === 0
    ? 'حمّل جزءا واحدا على الأقل قبل فصل الإنترنت'
    : 'جاهز غالبا للعمل أوف لاين';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: bg, border: `1px solid ${borderColor}` }}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2">
            {isOnline
              ? <Wifi size={20} className="text-quran-green" />
              : <WifiOff size={20} className="text-red-500" />
            }
            <h2 className="text-base font-bold" style={{ color: textMain }}>القراءة بدون إنترنت</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: textSub }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 text-sm overflow-y-auto max-h-[80vh]">
          {/* Connection status pill */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            isOnline ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
          }`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
            {isOnline ? 'متصل بالإنترنت — يمكنك تحميل البيانات الآن' : 'غير متصل — الصفحات المحفوظة فقط متاحة'}
          </div>

          {/* How it works */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
            <p className="font-bold" style={{ color: textMain }}>كيف تعمل القراءة أوف لاين؟</p>
            <div className="space-y-2.5">
              {[
                { n: '١', t: 'تأكد من اتصالك بالإنترنت' },
                { n: '٢', t: 'تصفّح الصفحات التي تريد قراءتها وهي ستُحفظ تلقائياً' },
                { n: '٣', t: 'أو اضغط "تحميل الجزء" لحفظ جزء كامل دفعةً واحدة' },
                { n: '٤', t: 'وبعدها افتح التطبيق بدون إنترنت وستعمل الصفحات المحفوظة' },
              ].map(({ n, t }) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-quran-green text-white text-xs font-bold mt-0.5">{n}</span>
                  <span className="leading-5" style={{ color: textSub }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PWA notice */}
          <div className="flex gap-2 px-3 py-2.5 rounded-lg" style={{ background: isDark ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.25)` }}>
            <Info size={15} className="flex-shrink-0 mt-0.5 text-yellow-600" />
            <p className="text-xs leading-5" style={{ color: isDark ? '#d4b96a' : '#92700a' }}>
              للحصول على تجربة أوف لاين كاملة، ثبّت التطبيق على جهازك (PWA). ابحث عن زر "تثبيت" أو "إضافة إلى الشاشة الرئيسية" في متصفحك.
            </p>
          </div>

          {/* Summary */}
          <div className="rounded-xl p-3" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
            <p className="text-xs" style={{ color: textSub }}>
              إجمالي الصفحات المحفوظة:{' '}
              <span className="font-bold text-quran-green">{totalCached}</span>
              {' '}من{' '}
              <span className="font-semibold" style={{ color: textMain }}>604</span>
            </p>
            {totalCached > 0 && (
              <div className="mt-2 h-1.5 rounded-full" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                <div
                  className="h-1.5 rounded-full bg-quran-green transition-all"
                  style={{ width: `${Math.round((totalCached / 604) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Offline readiness check */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold" style={{ color: textMain }}>فحص جاهزية الأوف لاين</p>
              <button
                type="button"
                onClick={() => void runReadinessCheck()}
                disabled={checkingReadiness}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: checkingReadiness ? (isDark ? '#374151' : '#e5e7eb') : '#2563eb',
                  color: checkingReadiness ? textSub : '#ffffff',
                  cursor: checkingReadiness ? 'not-allowed' : 'pointer',
                }}
              >
                {checkingReadiness ? 'جاري الفحص...' : 'فحص الآن'}
              </button>
            </div>

            {readiness && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span style={{ color: textSub }}>دعم Service Worker</span>
                  <span className={readiness.swSupported ? 'text-green-600' : 'text-red-500'}>{readiness.swSupported ? 'نعم' : 'لا'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: textSub }}>الرابط الآمن (https)</span>
                  <span className={(readiness.secureContext || readiness.localHostHttp) ? 'text-green-600' : 'text-red-500'}>
                    {(readiness.secureContext || readiness.localHostHttp) ? 'صحيح' : 'غير آمن'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: textSub }}>تسجيل Service Worker</span>
                  <span className={readiness.swRegistered ? 'text-green-600' : 'text-red-500'}>{readiness.swRegistered ? 'مسجل' : 'غير مسجل'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: textSub }}>تحكم Service Worker</span>
                  <span className={readiness.swControlling ? 'text-green-600' : 'text-amber-500'}>{readiness.swControlling ? 'متحكم' : 'بحاجة إعادة فتح'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: textSub }}>وجود صفحة الأوف لاين</span>
                  <span className={readiness.hasOfflineFallback ? 'text-green-600' : 'text-red-500'}>{readiness.hasOfflineFallback ? 'محفوظة' : 'غير محفوظة'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: textSub }}>بيانات صفحات القرآن</span>
                  <span className={(readiness.hasQuranApiCache || totalCached > 0) ? 'text-green-600' : 'text-red-500'}>{(readiness.hasQuranApiCache || totalCached > 0) ? 'متوفرة' : 'غير متوفرة'}</span>
                </div>
              </div>
            )}

            <div className={`rounded-lg px-3 py-2 text-xs ${readinessOk ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
              {readinessHint}
            </div>
          </div>

          {/* Juz selector + download */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
            <p className="font-bold" style={{ color: textMain }}>تحميل جزء كامل للقراءة أوف لاين</p>

            {/* Juz picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs flex-shrink-0" style={{ color: textSub }}>اختر الجزء:</label>
              <select
                value={selectedJuzIndex}
                onChange={e => setSelectedJuzIndex(Number(e.target.value))}
                disabled={downloading}
                className="flex-1 rounded-lg px-2 py-1.5 text-sm outline-none"
                style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${borderColor}`,
                  color: textMain,
                }}
              >
                {JUZ_AR.map((name, i) => (
                  <option key={i} value={i}>
                    الجزء {name} (ص {JUZ_PAGES[i][0]}–{JUZ_PAGES[i][1]})
                  </option>
                ))}
              </select>
            </div>

            {/* Progress of selected juz */}
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: textSub }}>
                <span>{juzComplete ? '✓ محفوظ بالكامل' : `${cachedInJuz} من ${juzPageCount} صفحة محفوظة`}</span>
                <span>{Math.round((cachedInJuz / juzPageCount) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                <div
                  className="h-2 rounded-full bg-quran-green transition-all"
                  style={{ width: `${Math.round((cachedInJuz / juzPageCount) * 100)}%` }}
                />
              </div>
            </div>

            {/* Download progress bar */}
            {downloading && (
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: textSub }}>
                  <span>جاري التحميل…</span>
                  <span>{progress}/{total}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${total > 0 ? Math.round((progress / total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            )}

            {downloadDone && !downloading && !downloadError && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle size={14} />
                تم الحفظ بنجاح — يمكنك قراءة هذا الجزء بدون إنترنت
              </div>
            )}

            {downloadError && (
              <p className="text-xs text-red-500">{downloadError}</p>
            )}

            <button
              type="button"
              disabled={!isOnline || downloading || juzComplete}
              onClick={() => downloadRange(juzStart, juzEnd)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: (!isOnline || downloading || juzComplete) ? (isDark ? '#374151' : '#e5e7eb') : '#16a34a',
                color: (!isOnline || downloading || juzComplete) ? textSub : '#ffffff',
                cursor: (!isOnline || downloading || juzComplete) ? 'not-allowed' : 'pointer',
              }}
            >
              {downloading && (
                <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              )}
              {juzComplete ? (
                <><CheckCircle size={16} /> الجزء محفوظ بالفعل</>
              ) : downloading ? (
                `جاري تحميل الصفحة ${progress + 1} من ${total}…`
              ) : !isOnline ? (
                'لا يوجد اتصال بالإنترنت'
              ) : (
                <><Download size={16} /> تحميل الجزء ({juzPageCount} صفحة)</>
              )}
            </button>
          </div>

          <p className="text-xs text-center" style={{ color: textSub }}>
            ملاحظة: التلاوة الصوتية تحتاج إنترنت دائماً — النصوص القرآنية فقط تعمل أوف لاين
          </p>
        </div>
      </div>
    </div>
  );
}
