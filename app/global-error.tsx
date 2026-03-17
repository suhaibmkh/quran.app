'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-white">
          <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">تعذر تحميل التطبيق</h2>
            <p className="text-sm text-red-600 mb-2">{error.message || 'حدث خطأ عام.'}</p>
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
