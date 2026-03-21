'use client';

type TajweedGuideProps = {
  isDark: boolean;
};

type StopSymbol = {
  symbol: string;
  name: string;
  ruling: string;
  action: string;
};

type RuleItem = {
  title: string;
  trigger: string;
  how: string;
};

const STOP_SYMBOLS: StopSymbol[] = [
  { symbol: 'م', name: 'وقف لازم', ruling: 'يلزم الوقف', action: 'قف ولا تصل؛ الوصل يغيّر المعنى أو يوقع في لبس.' },
  { symbol: 'لا', name: 'لا تقف', ruling: 'يُمنع الوقف', action: 'الأفضل أن تصل ما قبلها بما بعدها.' },
  { symbol: 'ج', name: 'وقف جائز', ruling: 'الوقف أو الوصل جائزان', action: 'لك الخيار؛ اختر ما يوضّح المعنى أكثر.' },
  { symbol: 'ز', name: 'جواز الوقف مع الوصل أولى', ruling: 'يجوز الوقف', action: 'الوصل أفضل غالبا.' },
  { symbol: 'صلى', name: 'الوصل أولى', ruling: 'يجوز الوقف', action: 'الأَوْلى أن تصل.' },
  { symbol: 'قلى', name: 'الوقف أولى', ruling: 'يجوز الوصل', action: 'الأَوْلى أن تقف.' },
  { symbol: 'س', name: 'سكتة لطيفة', ruling: 'سكت بلا تنفّس', action: 'قف وقفة قصيرة جدا دون أخذ نفس ثم أكمل.' },
  { symbol: 'قف', name: 'علامة وقف إرشادية', ruling: 'الوقف حسن', action: 'الوقف هنا أجود غالبا.' },
  { symbol: '۩', name: 'موضع سجدة', ruling: 'ليس علامة وقف ملزمة', action: 'يُشرع السجود عندها لمن أراد.' },
];

const RULE_GROUPS: Array<{ heading: string; items: RuleItem[] }> = [
  {
    heading: 'أحكام النون الساكنة والتنوين',
    items: [
      { title: 'الإظهار', trigger: 'قبل ء هـ ع ح غ خ', how: 'تُقرأ النون/التنوين واضحة بلا غنّة زائدة.' },
      { title: 'الإدغام بغنّة', trigger: 'قبل ي ن م و', how: 'إدخال الحرفين مع غنّة مقدار حركتين.' },
      { title: 'الإدغام بلا غنّة', trigger: 'قبل ل ر', how: 'إدغام مباشر بلا غنّة.' },
      { title: 'الإقلاب', trigger: 'قبل ب', how: 'تقلب النون/التنوين ميما مخفاة مع غنّة.' },
      { title: 'الإخفاء', trigger: 'قبل بقية الحروف (15 حرفا)', how: 'إخفاء بين الإظهار والإدغام مع غنّة.' },
    ],
  },
  {
    heading: 'أحكام الميم الساكنة',
    items: [
      { title: 'إخفاء شفوي', trigger: 'قبل ب', how: 'إخفاء الميم مع غنّة.' },
      { title: 'إدغام شفوي', trigger: 'قبل م', how: 'إدغام الميم في الميم مع غنّة.' },
      { title: 'إظهار شفوي', trigger: 'قبل باقي الحروف', how: 'إظهار الميم بوضوح.' },
    ],
  },
  {
    heading: 'أحكام المدود (المقادير العملية)',
    items: [
      { title: 'مد طبيعي', trigger: 'ا و ي دون همز/سكون بعده', how: 'يمد حركتين.' },
      { title: 'مد متصل واجب', trigger: 'همز بعد حرف المد في نفس الكلمة', how: 'يمد 4-5 حركات.' },
      { title: 'مد منفصل جائز', trigger: 'حرف المد آخر كلمة والهمز أول التالية', how: 'يمد 4-5 حركات غالبا.' },
      { title: 'مد لازم', trigger: 'سكون أصلي بعد حرف المد', how: 'يمد 6 حركات.' },
      { title: 'مد عارض للسكون', trigger: 'الوقف على كلمة آخرها مد قبل سكون عارض', how: 'يمد 2 أو 4 أو 6.' },
      { title: 'مد اللين', trigger: 'واو/ياء ساكنتان بعد فتح عند الوقف', how: 'يمد 2 أو 4 أو 6.' },
    ],
  },
  {
    heading: 'أحكام متكررة مهمة',
    items: [
      { title: 'القلقلة', trigger: 'حروف قطب جد عند السكون', how: 'نبرة ارتداد خفيفة للحرف الساكن.' },
      { title: 'التفخيم والترقيق', trigger: 'خصوصا الراء واللام وحروف الاستعلاء', how: 'يفخم أو يرقق بحسب الحركة والسياق.' },
      { title: 'الغنّة', trigger: 'في النون والميم المشددتين وأبوابها', how: 'غنّة كاملة بمقدار حركتين.' },
      { title: 'همزة الوصل', trigger: 'تثبت ابتداء وتسقط وصلا', how: 'لا تُنطق عند وصل الكلمة بما قبلها.' },
    ],
  },
];

export function TajweedGuide({ isDark }: TajweedGuideProps) {
  const cardClass = isDark ? 'bg-dark-bg border-gray-700' : 'bg-light-bg border-gray-200';
  const subtleClass = isDark ? 'text-gray-300' : 'text-gray-700';
  const hintClass = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <section className={`rounded-lg border p-3 ${cardClass}`}>
      <h3 className="font-bold text-sm mb-1">دليل أحكام التجويد</h3>
      <p className={`text-xs mb-3 ${hintClass}`}>
        ملخّص عملي للوقف والابتداء وأشهر الأحكام أثناء التلاوة.
      </p>

      <details className="mb-3" open>
        <summary className="cursor-pointer text-xs font-bold">علامات الوقف والابتداء</summary>
        <div className="mt-2 space-y-2">
          {STOP_SYMBOLS.map((s) => (
            <div key={s.symbol + s.name} className={`rounded border px-2 py-2 ${cardClass}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{s.name}</span>
                <span className="inline-flex min-w-9 justify-center rounded-full border px-2 py-0.5 text-xs font-bold">
                  {s.symbol}
                </span>
              </div>
              <p className={`text-xs mt-1 ${subtleClass}`}>الحكم: {s.ruling}</p>
              <p className={`text-xs ${hintClass}`}>التطبيق: {s.action}</p>
            </div>
          ))}
        </div>
      </details>

      <details>
        <summary className="cursor-pointer text-xs font-bold">الأحكام الأساسية مرتبة</summary>
        <div className="mt-2 space-y-3">
          {RULE_GROUPS.map((group) => (
            <div key={group.heading} className={`rounded border px-2 py-2 ${cardClass}`}>
              <p className="text-xs font-bold mb-2">{group.heading}</p>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.title} className="text-xs leading-5">
                    <p className="font-semibold">{item.title}</p>
                    <p className={subtleClass}>متى: {item.trigger}</p>
                    <p className={hintClass}>كيف: {item.how}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
