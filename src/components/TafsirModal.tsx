'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { Ayah } from '@/lib/alQuranCloud';
import { fetchAyahTafsirText } from '@/lib/alQuranCloud';
import type { Tafsir } from '@/data/quran';

interface TafsirModalProps {
  isOpen: boolean;
  ayah: Ayah | null;
  tafsirs: Tafsir[];
  selectedTafsir: string;
  onTafsirChange: (id: string) => void;
  onClose: () => void;
}

function toArabicNumerals(n: number): string {
  return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

export function TafsirModal({
  isOpen,
  ayah,
  tafsirs,
  selectedTafsir,
  onTafsirChange,
  onClose,
}: TafsirModalProps) {
  const { isDark } = useTheme();
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTafsir = useCallback(async () => {
    if (!ayah || !selectedTafsir) return;
    setLoading(true);
    setError(null);
    setTafsirText(null);
    try {
      const text = await fetchAyahTafsirText(
        ayah.surahId ?? 1,
        ayah.numberInSurah,
        selectedTafsir
      );
      setTafsirText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل التفسير');
    } finally {
      setLoading(false);
    }
  }, [ayah, selectedTafsir]);

  useEffect(() => {
    if (isOpen && ayah) {
      fetchTafsir();
    }
  }, [isOpen, ayah, fetchTafsir]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !ayah) return null;

  const bg       = isDark ? '#1f2937' : '#ffffff';
  const border   = isDark ? '#374151' : '#e5e7eb';
  const text     = isDark ? '#e5e7eb' : '#1f2937';
  const muted    = isDark ? '#9ca3af' : '#6b7280';
  const headerBg = isDark ? '#111827' : '#f9fafb';

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 'min(660px, 100%)',
          maxHeight: 'min(82vh, 640px)',
          background: bg,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 12px 56px rgba(0,0,0,0.30)',
          animation: 'tafsir-zoom-in 0.2s ease-out',
        }}
      >
        {/* ── Sticky header — always visible even with long text ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: headerBg,
            borderBottom: `1px solid ${border}`,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Cairo', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: text,
              flexShrink: 0,
            }}
          >
            تفسير: {ayah.surahName ?? ''}&nbsp;﴿{toArabicNumerals(ayah.numberInSurah)}﴾
          </span>

          <select
            value={selectedTafsir}
            onChange={(e) => onTafsirChange(e.target.value)}
            style={{
              marginInlineStart: 'auto',
              padding: '5px 10px',
              borderRadius: 7,
              border: `1px solid ${border}`,
              background: isDark ? '#374151' : '#ffffff',
              color: text,
              fontFamily: "'Cairo', sans-serif",
              fontSize: 13,
              cursor: 'pointer',
              maxWidth: 180,
            }}
          >
            {tafsirs.map((t) => (
              <option key={t.id} value={t.identifier}>{t.name}</option>
            ))}
          </select>

          {/* Close — always accessible in header, never hidden by scrolling */}
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              padding: '6px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: isDark ? '#374151' : '#e5e7eb',
              color: muted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="إغلاق"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Verse text (non-scrollable) ── */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: `1px solid ${border}`,
            fontFamily: 'var(--font-mushaf)',
            fontSize: 20,
            lineHeight: 2,
            color: isDark ? '#c9a84c' : '#5c3d11',
            direction: 'rtl',
            flexShrink: 0,
            background: isDark ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.07)',
          }}
        >
          {ayah.text}
        </div>

        {/* ── Scrollable tafsir body ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            fontFamily: "'Cairo', sans-serif",
            fontSize: 16,
            lineHeight: 2.1,
            color: text,
            direction: 'rtl',
          }}
        >
          {loading ? (
            <p style={{ color: muted, textAlign: 'center', padding: '32px 0' }}>
              جاري تحميل التفسير...
            </p>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: '#dc2626', marginBottom: 14 }}>{error}</p>
              <button
                type="button"
                onClick={fetchTafsir}
                style={{
                  padding: '7px 20px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#16a34a',
                  color: '#fff',
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : tafsirText ? (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{tafsirText}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
