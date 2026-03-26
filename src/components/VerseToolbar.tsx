'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { Ayah } from '@/lib/alQuranCloud';
import type { Reciter } from '@/data/quran';

interface VerseToolbarProps {
  ayah: Ayah;
  rect: DOMRect;
  isPlaying: boolean;
  isLoading: boolean;
  reciters: Reciter[];
  selectedReciter: string;
  onReciterChange: (id: string) => void;
  onPlay: () => void;
  onStop: () => void;
  onTafsir: () => void;
  onClose: () => void;
}

function toArabicNumerals(n: number): string {
  return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

export function VerseToolbar({
  ayah,
  rect,
  isPlaying,
  isLoading,
  reciters,
  selectedReciter,
  onReciterChange,
  onPlay,
  onStop,
  onTafsir,
  onClose,
}: VerseToolbarProps) {
  const { isDark } = useTheme();  const [shareCopied, setShareCopied] = useState(false);

  const handleShareVerse = async () => {
    const ref = `${ayah.surahName ?? ''} (${ayah.surahId ?? ''}:${ayah.numberInSurah})`;
    const shareText = `${ayah.text}\n— ${ref}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: ref, text: shareText });
      } catch {
        // user cancelled
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 360;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 640;
  const toolbarWidth = Math.min(360, Math.max(240, viewportW - 24));
  const centerX = rect.left + rect.width / 2;
  const left = Math.max(12, Math.min(centerX - toolbarWidth / 2, viewportW - toolbarWidth - 12));
  const estimatedHeight = 54;
  const topAbove = rect.top - estimatedHeight - 10;
  const topBelow = rect.bottom + 10;
  const top = topAbove > 12 ? topAbove : Math.min(topBelow, viewportH - estimatedHeight - 12);

  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        width: toolbarWidth,
        zIndex: 55,
        pointerEvents: 'auto',
      }}
    >
      <div
        dir="rtl"
        className="verse-toolbar"
        style={{
          background: isDark ? '#111827' : '#ffffff',
          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
          color: isDark ? '#e5e7eb' : '#1f2937',
        }}
      >
      {/* Verse label */}
      <span className="verse-toolbar-label">
        {ayah.surahName ?? ''}&nbsp;﴿{toArabicNumerals(ayah.numberInSurah)}﴾
      </span>

      {/* Play / Stop */}
      <button
        type="button"
        onClick={isPlaying ? onStop : onPlay}
        disabled={isLoading}
        className={`verse-toolbar-btn ${isPlaying ? 'verse-toolbar-btn-stop' : 'verse-toolbar-btn-play'}`}
        aria-label={isPlaying ? 'إيقاف' : 'تشغيل'}
        title={isPlaying ? 'إيقاف' : 'تشغيل'}
      >
        {isLoading ? (
          <svg className="verse-toolbar-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <rect x="6" y="5" width="4" height="14" rx="1"/>
            <rect x="14" y="5" width="4" height="14" rx="1"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Reciter dropdown */}
      <select
        value={selectedReciter}
        onChange={(e) => onReciterChange(e.target.value)}
        className="verse-toolbar-select"
        style={{
          background: isDark ? '#1f2937' : '#f9fafb',
          border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
          color: isDark ? '#e5e7eb' : '#1f2937',
        }}
      >
        {reciters.map((r) => (
          <option key={r.id} value={r.identifier}>{r.name}</option>
        ))}
      </select>

      {/* Tafsir button */}
      <button
        type="button"
        onClick={onTafsir}
        className="verse-toolbar-btn verse-toolbar-btn-tafsir"
        style={{
          background: isDark ? '#1f2937' : '#f3f4f6',
          border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
          color: isDark ? '#e5e7eb' : '#374151',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        تفسير
      </button>

      {/* Share verse */}
      <button
        type="button"
        onClick={handleShareVerse}
        className="verse-toolbar-btn verse-toolbar-btn-tafsir"
        style={{
          background: isDark ? '#1f2937' : '#f3f4f6',
          border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
          color: shareCopied ? '#16a34a' : (isDark ? '#e5e7eb' : '#374151'),
        }}
        title="مشاركة الآية"
      >
        {shareCopied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        )}
        {shareCopied ? 'تم النسخ' : 'مشاركة'}
      </button>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="verse-toolbar-close"
        aria-label="إغلاق"
        style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      </div>
    </div>
  );
}
