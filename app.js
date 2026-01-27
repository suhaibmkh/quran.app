// فارغ
    currentSurah: 0,
    currentPage: 0,
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    currentReader: "ar",
    currentTafsir: "tabari",
    selectedVerse: null
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    populateSuraList();
    displaySurah(0);
    setupEventListeners();
    loadTheme();
}

function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('suraSearch').addEventListener('input', filterSuras);
    document.getElementById('prevBtn').addEventListener('click', previousPage);
    document.getElementById('nextBtn').addEventListener('click', nextPage);
    document.getElementById('playVerse').addEventListener('click', playVerse);
    document.getElementById('readerSelect').addEventListener('change', (e) => {
        appState.currentReader = e.target.value;
    });
    document.getElementById('tafsirSelect').addEventListener('change', (e) => {
        appState.currentTafsir = e.target.value;
        if (appState.selectedVerse) {
            displayTafsir(appState.selectedVerse);
        }
    });
}

function populateSuraList() {
    const suraList = document.getElementById('suraList');
    quranData.forEach((sura, index) => {
        const li = document.createElement('li');
        li.textContent = `${sura.number}. ${sura.name}`;
        li.addEventListener('click', () => displaySurah(index));
        if (index === 0) li.classList.add('active');
        suraList.appendChild(li);
    });
}

function filterSuras(e) {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.sura-list li').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(searchTerm) ? 'block' : 'none';
    });
}

function displaySurah(index) {
    appState.currentSurah = index;
    appState.currentPage = 0;
    const sura = quranData[index];
    
    document.getElementById('suraName').textContent = sura.name;
    document.getElementById('suraInfo').textContent = `${sura.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} - ${sura.numberOfVerses} آية`;
    
    document.querySelectorAll('.sura-list li').forEach((li, i) => {
        li.classList.toggle('active', i === index);
    });
    
    displayVerses();
    document.getElementById('verseDetailsPanel').classList.add('hidden');
}

function displayVerses() {
    const sura = quranData[appState.currentSurah];
    const container = document.getElementById('versesContainer');
    container.innerHTML = '';
    
    const start = appState.currentPage * VERSES_PER_PAGE;
    const end = Math.min(start + VERSES_PER_PAGE, sura.verses.length);
    
    sura.verses.slice(start, end).forEach(verse => {
        const div = document.createElement('div');
        div.className = 'verse';
        div.innerHTML = `<span class="verse-number">${verse.number}</span><span class="verse-text">${verse.text}</span>`;
        div.addEventListener('click', () => selectVerse(verse, appState.currentSurah));
        container.appendChild(div);
    });
    
    updatePagination();
}

function updatePagination() {
    const sura = quranData[appState.currentSurah];
    const totalPages = Math.ceil(sura.verses.length / VERSES_PER_PAGE);
    
    document.getElementById('pageInfo').textContent = `الصفحة ${appState.currentPage + 1} من ${totalPages}`;
    document.getElementById('prevBtn').disabled = appState.currentPage === 0;
    document.getElementById('nextBtn').disabled = appState.currentPage === totalPages - 1;
}

function previousPage() {
    if (appState.currentPage > 0) {
        appState.currentPage--;
        displayVerses();
    }
}

function nextPage() {
    const sura = quranData[appState.currentSurah];
    const totalPages = Math.ceil(sura.verses.length / VERSES_PER_PAGE);
    if (appState.currentPage < totalPages - 1) {
        appState.currentPage++;
        displayVerses();
    }
}

function selectVerse(verse, suraIndex) {
    appState.selectedVerse = {
        verse: verse,
        suraIndex: suraIndex,
        suraName: quranData[suraIndex].name,
        suraNumber: quranData[suraIndex].number
    };
    document.getElementById('verseDetailsPanel').classList.remove('hidden');
    displayTafsir(appState.selectedVerse);
}

function displayTafsir(selectedVerse) {
    const verseKey = `${selectedVerse.suraNumber}:${selectedVerse.verse.number}`;
    const content = tafsirSamples[verseKey]?.[appState.currentTafsir] || 'التفسير غير متوفر';
    document.getElementById('tafsirContent').innerHTML = `<p>${content}</p>`;
}

function playVerse() {
    if (appState.selectedVerse) {
        const { suraNumber, verse } = appState.selectedVerse;
        const reciterIds = {
            "ar": 13,
            "alafasy": 15,
            "minshawi": 19,
            "sudais": 6,
            "shuraim": 7
        };
        const reciterId = reciterIds[appState.currentReader] || 13;
        const audioUrl = `https://api.alquran.cloud/api/v1/ayah/${suraNumber}:${verse.number}/ar.${reciterId}`;
        
        fetch(audioUrl)
            .then(res => res.json())
            .then(data => {
                if (data.data?.audio) {
                    document.getElementById('audioPlayer').src = data.data.audio;
                    document.getElementById('audioPlayer').play();
                }
            })
            .catch(err => console.error('خطأ في تشغيل الصوت:', err));
    }
}

function closeVersePanel() {
    document.getElementById('verseDetailsPanel').classList.add('hidden');
}

function toggleTheme() {
    appState.isDarkMode = !appState.isDarkMode;
    localStorage.setItem('darkMode', appState.isDarkMode);
    loadTheme();
}

function loadTheme() {
    const body = document.body;
    if (appState.isDarkMode) {
        body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        body.classList.remove('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
}
