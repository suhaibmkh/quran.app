export default function NotFound() {
  return (
    <div dir="rtl" className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">الصفحة غير موجودة</h2>
        <p className="text-sm text-gray-600">تعذر العثور على الصفحة المطلوبة.</p>
      </div>
    </div>
  );
}
