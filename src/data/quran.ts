export type Reciter = {
  id: string;
  name: string;
  identifier: string;
};

export type Tafsir = {
  id: string;
  name: string;
  identifier: string;
};

// Reciters & tafsir sources (backed by https://api.alquran.cloud)
export const reciters: Reciter[] = [
  { id: 'ar.alafasy', name: 'مشاري العفاسي', identifier: 'ar.alafasy' },
  { id: 'ar.abdulsamad', name: 'عبدالباسط عبدالصمد', identifier: 'ar.abdulsamad' },
  { id: 'ar.husary', name: 'محمود خليل الحصري', identifier: 'ar.husary' },
  { id: 'ar.abdurrahmaansudais', name: 'عبدالرحمن السديس', identifier: 'ar.abdurrahmaansudais' },
  { id: 'ar.shaatree', name: 'أبو بكر الشاطري', identifier: 'ar.shaatree' },
  { id: 'ar.ahmedajamy', name: 'أحمد بن علي العجمي', identifier: 'ar.ahmedajamy' },
];

export const tafsirs: Tafsir[] = [
  { id: 'ar.muyassar', name: 'تفسير الميسر', identifier: 'ar.muyassar' },
  { id: 'ar.jalalayn', name: 'تفسير الجلالين', identifier: 'ar.jalalayn' },
  { id: 'ar.qurtubi', name: 'تفسير القرطبي', identifier: 'ar.qurtubi' },
  { id: 'ar.waseet', name: 'التفسير الوسيط', identifier: 'ar.waseet' },
  { id: 'ar.baghawi', name: 'تفسير البغوي', identifier: 'ar.baghawi' },
  { id: 'ar.miqbas', name: 'تنوير المقباس (ابن عباس)', identifier: 'ar.miqbas' },
];
