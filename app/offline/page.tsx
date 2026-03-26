export default function OfflinePage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'linear-gradient(180deg, #f5efe0 0%, #efe4ca 100%)',
        color: '#24180c',
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <section
        style={{
          width: 'min(520px, 100%)',
          background: '#fffaf0',
          border: '1px solid #d8c6a0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>أنت الآن بدون إنترنت</h1>
        <p style={{ marginTop: '10px', lineHeight: 1.9, color: '#5e4a26' }}>
          يمكنك متابعة القراءة من الصفحات التي تم تحميلها سابقا.
          <br />
          عند عودة الاتصال افتح الصفحة الرئيسية لتحميل المزيد.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '14px',
            padding: '10px 16px',
            borderRadius: '12px',
            background: '#1f9d55',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          الرجوع للرئيسية
        </a>
      </section>
    </main>
  );
}
