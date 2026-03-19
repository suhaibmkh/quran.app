'use client';

import React, { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { Ayah } from '@/lib/alQuranCloud';
import { formatSurahLabel } from '@/lib/surahName';

interface MushafPageProps {
  ayahs: Ayah[];
  pageNumber: number;
  fontSize: number;
  onVersePress?: (ayah: Ayah, rect: DOMRect) => void;
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

export function MushafPage({ ayahs, pageNumber, fontSize, onVersePress, highlightedAyahNumber }: Omit<MushafPageProps, 'surahVerseCounts'>) {
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

  const textColor   = isDark ? '#e2d5bc' : '#24180c';
  const bismillahColor = isDark ? '#c9a84c' : '#4f3913';
  const hljBg       = isDark ? 'rgba(201,168,76,0.18)' : 'rgba(201,168,76,0.25)';

  return (
    <div dir="rtl" className="mushaf-frame" style={{ fontFamily: 'var(--font-mushaf)' }}>
      <div className="mushaf-inner">
        <span className="mushaf-corner tl" />
        <span className="mushaf-corner tr" />
        <span className="mushaf-corner bl" />
        <span className="mushaf-corner br" />

        {/* ── Top meta bar ──────────────────── */}
        <div className="mushaf-top-meta">
          <div className="mushaf-meta-pill">{juzName}</div>
          <div className="mushaf-header-ornament" />
          <div className="mushaf-meta-pill end">{firstSurahName ? formatSurahLabel(firstSurahName) : ''}</div>
        </div>

        {/* ── Surah groups ──────────────────── */}
        {groups.map((group, gi) => {
          const firstAyah = group.ayahs[0];
          const firstAyahText = firstAyah?.text ?? '';
          const firstAyahHasBasmalah = normalizeArabic(firstAyahText).startsWith(NORMALIZED_BASMALAH);
          const showBasmalah = group.surahId !== 1 && group.surahId !== 9;

          return (
            <div key={`${group.surahId}-${gi}`}>
              {/* Surah banner */}
              {group.startsFromVerse1 && (
                <div className="mushaf-surah-banner">
                  <div style={{ fontSize: Math.max(20, fontSize - 2), fontWeight: 700, color: textColor }}>
                    {formatSurahLabel(group.surahName)}
                  </div>
                  {showBasmalah && (
                    <div style={{ fontSize: Math.max(18, fontSize - 4), color: bismillahColor, marginTop: 4 }}>
                      {BASMALAH}
                    </div>
                  )}
                </div>
              )}

              {/* Flowing verse text */}
              <div
                style={{
                  fontSize,
                  lineHeight: 2.6,
                  textAlign: 'justify',
                  direction: 'rtl',
                  color: textColor,
                } as React.CSSProperties}
              >
                {group.ayahs.map((ayah) => {
                  const isHighlighted = highlightedAyahNumber === ayah.number;
                  const isFirstAyah = group.startsFromVerse1 && ayah.number === firstAyah?.number;
                  const displayText =
                    isFirstAyah && firstAyahHasBasmalah
                      ? stripLeadingBasmalah(ayah.text)
                      : ayah.text;
                  return (
                    <span key={ayah.number} style={{ display: 'inline' }}>
                      <span
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          onVersePress?.(ayah, rect);
                        }}
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
                          if (!isHighlighted) (e.currentTarget as HTMLSpanElement).style.background = 'transparent';
                        }}
                      >
                        {displayText}
                      </span>
                      {'\u00A0'}
                      <span className="mushaf-verse-num" aria-label={`آية ${ayah.numberInSurah}`}>
                        {toArabicNumerals(ayah.numberInSurah)}
                      </span>
                      {' '}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Page number footer ────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, position: 'relative', zIndex: 3 }}>
          <div className="mushaf-page-num">{toArabicNumerals(pageNumber)}</div>
        </div>
      </div>
    </div>
  );
}
