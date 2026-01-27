# Quran App - تطبيق القرآن الكريم

Beautiful Arabic Quran web application with modern features for reading and understanding the Holy Quran.

## Features ✨

- **🌙 Day/Night Mode** - Easy on the eyes with light and dark themes
- **📖 Per-Page Reading** - Read the Quran page by page with smooth navigation
- **🎤 Multiple Reciters** - Choose from famous Quran reciters
  - عبد الباسط عبد الصمد (Abdulbasit Abdulsamad)
  - محمد صديق المنشاوي (Al-Minshawi)
  - عبد الرحمن السديس (As-Sudais)
  - سعود الشريم (Al-Shuraim)
  - محمود خليل الحصري (Al-Husari)

- **📚 Multiple Tafsirs** - Access various Islamic commentaries
  - تفسير ابن كثير (Tafsir Ibn Kathir)
  - تفسير الطبري (Tafsir At-Tabari)
  - تفسير القرطبي (Tafsir Al-Qurtubi)
  - تفسير السعدي (Tafsir As-Sadi)
  - تفسير الواحدي (Tafsir Al-Wahidi)

- **🎯 Verse Actions** - Click any verse to:
  - Play audio recitation
  - View detailed Tafsir (commentary)

- **🎨 Beautiful UI** - Modern, responsive design
- **⚙️ Customizable Settings** - Adjust font size, reader, and tafsir
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Language**: Arabic (RTL)

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open your browser and visit:
```
http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Main Quran app page
│   └── globals.css   # Global styles
├── components/       # React components
│   ├── Header.tsx    # Header with theme toggle
│   ├── ChapterList.tsx # Chapter/Surah selector
│   ├── Verse.tsx     # Individual verse component
│   ├── Pagination.tsx # Page navigation
│   └── SettingsModal.tsx # Settings dialog
├── context/          # React Context
│   └── ThemeContext.tsx # Theme state management
└── data/             # Data and constants
    └── quran.ts      # Quran chapters, verses, reciters, tafsirs
```

## Features Guide

### Reading Quran
1. Select a chapter from the left sidebar
2. Navigate through pages using the pagination controls
3. Hover over any verse to reveal action buttons

## خط مصحف المدينة (اختياري)

الخط المستخدم في مصحف المدينة المنورة غالباً هو **KFGQPC Uthmanic Script (Hafs)** وهو خط بترخيص خاص؛ لذلك المشروع لا يضمّنه تلقائياً.

لتفعيله عندك بشكل قانوني:

- ضع ملفات الخط داخل `public/fonts/` بهذه الأسماء:
  - `KFGQPCUthmanicScriptHafs.woff2`
  - (اختياري) `KFGQPCUthmanicScriptHafs.woff`

بعدها سيُستخدم تلقائياً في وضع المصحف (قراءة فقط). إن لم تتوفر الملفات، سيُستخدم خط بديل (Amiri Quran).
### Listening to Recitation
1. Click the Settings button (⚙️)
2. Select your preferred reciter
3. Hover over a verse and click the Play button (▶️)

### Reading Tafsir
1. Click on any verse to expand the tafsir section
2. Or hover and click the Book button (📖)
3. Visit Settings to change the tafsir source

### Customizing Experience
1. Click Settings (⚙️)
2. Choose your preferred:
   - Reciter (القارئ)
   - Tafsir source (التفسير)
   - Font size

## API Integration

Currently, the app uses mock data. To integrate with real data:

1. Update `/src/data/quran.ts` to fetch from an API:
```typescript
// Example: Fetch from Quran API
const response = await fetch('https://api.quran.cloud/v1/quran/en.asad');
```

2. Popular Quran APIs:
- [Quran Cloud API](https://quran.cloud)
- [Al-Quran Cloud API](https://alquran.cloud)

## Contributing

Feel free to contribute! Please follow the existing code style and patterns.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Beautiful design inspired by modern Quran applications
- Data structure based on Islamic knowledge standards
- Icons from Lucide React
