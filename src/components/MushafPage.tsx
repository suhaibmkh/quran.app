'use client';

import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { Ayah } from '@/lib/alQuranCloud';
import { formatSurahLabel } from '@/lib/surahName';

interface MushafPageProps {
  ayahs: Ayah[];
  pageNumber: number;
  fontSize: number;
  onVersePress?: (ayah: Ayah) => void;
  highlightedAyahNumber?: number | null;
  surahVerseCounts?: Record<number, number>;
}

function toArabicNumerals(n: number): string {
  return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

const JUZ_NAMES: Record<number, string> = {
  1: 'الجزء الأوَّل', 2: 'الجزء الثاني', 3: 'الجزء الثالث', 4: 'الجزء الرابع',
  5: 'الجزء الخامس', 6: 'الجزء السادس', 7: 'الجزء السابع', 8: 'الجزء الثامن',
  9: 'الجزء التاسع', 10: 'الجزء العاشر', 11: 'الجزء الحادي عشر', 12: 'الجزء الثاني عشر',
  13: 'الجزء الثالث عشر', 14: 'الجزء الرابع عشر', 15: 'الجزء الخامس عشر',
  16: 'الجزء السادس عشر', 17: 'الجزء السابع عشر', 18: 'الجزء الثامن عشر',
  19: 'الجزء التاسع عشر', 20: 'الجزء العشرون', 21: 'الجزء الحادي والعشرون',
  22: 'الجزء الثاني والعشرون', 23: 'الجزء الثالث والعشرون', 24: 'الجزء الرابع والعشرون',
  25: 'الجزء الخامس والعشرون', 26: 'الجزء السادس والعشرون', 27: 'الجزء السابع والعشرون',
  28: 'الجزء الثامن والعشرون', 29: 'الجزء التاسع والعشرون', 30: 'الجزء الثلاثون',
};

// Uthmanic Basmalah (shown before each surah except Al-Fatiha and At-Tawbah)
const BASMALAH = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';

function normalizeArabic(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const NORMALIZED_BASMALAH = normalizeArabic('بسم الله الرحمن الرحيم');

function stripLeadingBasmalah(text: string): string {
  const normalized = normalizeArabic(text);
  if (!normalized.startsWith(NORMALIZED_BASMALAH)) return text;

  // In API text, basmalah is typically the first 4 words; keep only the remainder.
  const words = text.trim().split(/\s+/);
  if (words.length <= 4) return text;
  return words.slice(4).join(' ').trim();
}

type SurahGroup = {
  surahId: number;
  surahName: string;
  startsFromVerse1: boolean;
  ayahs: Ayah[];
};

export function MushafPage({ ayahs, pageNumber, fontSize, onVersePress, highlightedAyahNumber, surahVerseCounts }: MushafPageProps) {
  const { isDark } = useTheme();

  const groups = useMemo((): SurahGroup[] => {
    const result: SurahGroup[] = [];
    for (const ayah of ayahs) {
      const last = result[result.length - 1];
      if (!last || last.surahId !== (ayah.surahId ?? 0)) {
        result.push({
          surahId: ayah.surahId ?? 0,
          surahName: ayah.surahName ?? '',
          startsFromVerse1: ayah.numberInSurah === 1,
          ayahs: [ayah],
        });
      } else {
        last.ayahs.push(ayah);
      }
    }
    return result;
  }, [ayahs]);

  const juzNumber = ayahs[0]?.juz;
  const juzName = juzNumber ? (JUZ_NAMES[juzNumber] ?? '') : '';
  const firstSurahName = groups[0]?.surahName ?? '';

  // ─── theme tokens ───────────────────────────────────────────
  const pageBg        = isDark ? '#0e1117' : '#faf6ed';
  const outerBorder   = isDark ? '#6b5020' : '#b5892a';
  const innerBorder   = isDark ? '#4a3812' : '#d4aa50';
  const textColor     = isDark ? '#e2d5bc' : '#17120a';
  const mutedColor    = isDark ? '#a08840' : '#8a6a10';
  const headerBg      = isDark ? '#16110a' : '#f5edda';
  const surahBannerBg = isDark ? '#1c1507' : '#f2e6c2';
  const surahBannerBorder = isDark ? '#6b5020' : '#b5892a';
  const verseNumColor = isDark ? '#c9a84c' : '#8a6a10';
  const hljBg         = isDark ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.12)';

  const outerBoxShadow = isDark
    ? '0 6px 32px rgba(0,0,0,0.6), inset 0 0 80px rgba(201,168,76,0.03)'
    : '0 6px 32px rgba(0,0,0,0.18), inset 0 0 80px rgba(201,168,76,0.06)';

  const cornerStyle = (top: boolean, right: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: top ? 5 : undefined,
    bottom: top ? undefined : 5,
    right: right ? 5 : undefined,
    left: right ? undefined : 5,
    color: outerBorder,
    fontSize: 14,
    lineHeight: 1,
    zIndex: 2,
    userSelect: 'none',
  });

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: 'var(--font-mushaf)',
        backgroundColor: pageBg,
        color: textColor,
        border: `3px double ${outerBorder}`,
        borderRadius: 4,
        outline: `1px solid ${innerBorder}`,
        outlineOffset: -9,
        position: 'relative',
        boxShadow: outerBoxShadow,
        userSelect: 'text',
      }}
    >
      {/* Corner ornaments */}
      <span style={cornerStyle(true,  true)}>✦</span>
      <span style={cornerStyle(true,  false)}>✦</span>
      <span style={cornerStyle(false, true)}>✦</span>
      <span style={cornerStyle(false, false)}>✦</span>

      {/* ── Page header ─────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '7px 28px',
          borderBottom: `1px solid ${outerBorder}`,
          backgroundColor: headerBg,
          fontFamily: "'Cairo', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: mutedColor,
        }}
      >
        <span>{juzName}</span>
        <span style={{ color: verseNumColor, fontSize: 15, fontWeight: 700 }}>
          {'✦ '}{toArabicNumerals(pageNumber)}{' ✦'}
        </span>
        <span>{firstSurahName ? formatSurahLabel(firstSurahName) : ''}</span>
      </div>

      {/* ── Text content ────────────────────── */}
      <div style={{ padding: '20px 28px 28px' }}>
        {groups.map((group, gi) => (
          <div key={`${group.surahId}-${gi}`}>
            {(() => {
              const firstAyah = group.ayahs[0];
              const firstAyahText = firstAyah?.text ?? '';
              const firstAyahHasBasmalah =
                normalizeArabic(firstAyahText).startsWith(NORMALIZED_BASMALAH);
              const showDecorativeBasmalah = group.surahId !== 1 && group.surahId !== 9;
              const firstAyahNumber = firstAyah?.number;
              const renderedAyahs = group.ayahs;

              return (
                <>

            {/* Decorated surah opener line (name right, basmalah center, ayah count left) */}
            {group.startsFromVerse1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '14px 0 12px',
                  background: surahBannerBg,
                  border: `1px solid ${surahBannerBorder}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  boxShadow: `inset 0 0 18px ${isDark ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.18)'}`,
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: Math.max(20, fontSize - 2),
                    color: textColor,
                    lineHeight: 2.2,
                    whiteSpace: 'normal',
                  }}
                >
                  {showDecorativeBasmalah ? `﴾ ${BASMALAH} ﴿` : '۞'}
                </div>
              </div>
            )}

            {/* ── Flowing verse text ─────────── */}
            <div
              style={{
                fontSize,
                lineHeight: 2.6,
                textAlign: 'justify',
                textJustify: 'inter-word',
                direction: 'rtl',
                color: textColor,
              } as React.CSSProperties}
            >
              {renderedAyahs.map((ayah) => {
                const isHighlighted = highlightedAyahNumber === ayah.number;
                const isFirstAyahOfSurah = group.startsFromVerse1 && ayah.number === firstAyahNumber;
                const displayText =
                  isFirstAyahOfSurah && firstAyahHasBasmalah
                    ? stripLeadingBasmalah(ayah.text)
                    : ayah.text;
                return (
                <span key={ayah.number} style={{ display: 'inline' }}>
                  <span
                    onClick={() => onVersePress?.(ayah)}
                    title={`الآية ${toArabicNumerals(ayah.numberInSurah)} — ${group.surahName}`}
                    style={{
                      cursor: onVersePress ? 'pointer' : 'default',
                      borderRadius: 2,
                      transition: 'background 0.15s',
                      background: isHighlighted ? hljBg : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (onVersePress) (e.currentTarget as HTMLSpanElement).style.background = hljBg;
                    }}
                    onMouseLeave={(e) => {
                      if (!isHighlighted) {
                        (e.currentTarget as HTMLSpanElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {displayText}
                  </span>
                  {'\u00A0'}
                  {/* Ornamental verse-end circle */}
                  <span
                    aria-label={`آية ${ayah.numberInSurah}`}
                    style={{
                      display: 'inline-block',
                      color: verseNumColor,
                      fontSize: Math.round(fontSize * 0.62),
                      verticalAlign: 'middle',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ﴿{toArabicNumerals(ayah.numberInSurah)}﴾
                  </span>
                  {' '}
                </span>
                );
              })}
            </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>

      {/* ── Page footer ─────────────────────── */}
      <div
        style={{
          borderTop: `1px solid ${outerBorder}`,
          padding: '6px 28px',
          textAlign: 'center',
          backgroundColor: headerBg,
          color: verseNumColor,
          fontFamily: "'Cairo', sans-serif",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        ─ {toArabicNumerals(pageNumber)} ─
      </div>
    </div>
  );
}
