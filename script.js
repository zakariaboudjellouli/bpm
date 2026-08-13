const YOUTUBE_API_KEY = 'AIzaSyAYzuySfU5PBnDOX7NigIJ30svkYJpeJqc';

const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
    const entry = apiCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) { apiCache.delete(key); return null; }
    return entry.data;
}

function setCache(key, data) {
    apiCache.set(key, { data, timestamp: Date.now() });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector(anchor.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
});

const sliders = {
    bpm:         { el: document.getElementById('bpm'),         valueEl: document.getElementById('bpm-value'),         format: v => `${v} BPM` },
    temperature: { el: document.getElementById('temperature'), valueEl: document.getElementById('temperature-value'), format: v => `${parseFloat(v).toFixed(1)}°C` },
    sweat:       { el: document.getElementById('sweat'),       valueEl: document.getElementById('sweat-value'),       format: v => `${v}%` },
    light:       { el: document.getElementById('light'),       valueEl: document.getElementById('light-value'),       format: v => `${v}%` }
};

Object.values(sliders).forEach(({ el, valueEl, format }) => {
    el.addEventListener('input', e => valueEl.textContent = format(e.target.value));
});

const moodMap = {
    highIntensity: { icon: '🔥', title: 'Haute Intensité',    desc: 'Effort maximal — besoin de puissance pure' },
    mediumIntensity: { icon: '⚡', title: 'Énergie Dynamique', desc: 'Activité soutenue — rythme élevé' },
    lowIntensity:  { icon: '🌟', title: 'Activité Modérée',   desc: 'En mouvement — tempo confortable' },
    nightRest:     { icon: '🌙', title: 'Mode Nocturne',       desc: 'Ambiance sombre — détente profonde' },
    dayRest:       { icon: '😌', title: 'Détente Diurne',      desc: 'Repos actif — sérénité' }
};

const genreQueries = {
    'EDM': [
        'Martin Garrix official audio',
        'Avicii best songs',
        'David Guetta remix',
        'Marshmello music video',
        'EDM workout mix popular',
        'Calvin Harris official',
        'Tiësto club mix',
        'The Chainsmokers hits'
    ],
    'Hip-Hop': [
        'Drake official audio',
        'Kendrick Lamar hits',
        'Travis Scott best songs',
        'Metro Boomin official',
        'young prolétaire',
        'Playboi Carti official',
        'Future official audio',
        'A$AP Rocky best tracks'
    ],
    'Rock': [
        'AC/DC official',
        'Metallica best songs',
        'Linkin Park hits',
        'Foo Fighters official audio',
        'rock workout motivation',
        'Rage Against The Machine',
        'Red Hot Chili Peppers official',
        'Nirvana classic hits'
    ],
    'Pop': [
        'The Weeknd official audio',
        'Dua Lipa hits',
        'Harry Styles official',
        'Billie Eilish best songs',
        'pop hits motivation workout',
        'Bruno Mars official audio',
        'Ariana Grande hits',
        'Olivia Rodrigo official'
    ],
    'Lofi': [
        'lofi hip hop study',
        'lofi chill beats official',
        'lofi girl playlist',
        'chillhop music popular',
        'lofi beats relax',
        'ambient lofi night',
        'study beats lofi popular',
        'chill lofi instrumental'
    ],
    'Jazz': [
        'Miles Davis official',
        'John Coltrane best',
        'jazz cafe popular',
        'smooth jazz chill',
        'Bill Evans piano',
        'jazz classics relaxing',
        'Norah Jones official audio',
        'jazz morning best tracks'
    ],
    'Classical': [
        'Beethoven official',
        'Chopin nocturne',
        'Mozart best pieces',
        'Debussy clair de lune',
        'classical music relaxing popular',
        'Yiruma river flows in you',
        'Hans Zimmer official',
        'classical piano popular'
    ],
    'Rap français': [
        'Ninho , bigflo et oli',
        'Nekfeu officiel audio',
        'Damso officiel',
        'Hamza officiel audio',
        'huntrill , alpha wann, hologram lo , jungle jack',
        'PLK officiel audio',
        'zoro le frerot, sch , sdm',
        'Vald officiel audio , lacrim'
    ],
    'Metal': [
        'Metallica official',
        'Slipknot best songs',
        'System of a Down official',
        'metal workout motivation',
        'Iron Maiden official audio',
        'Rammstein official',
        'Pantera best tracks',
        'heavy metal popular hits'
    ],
    'R&B': [
        'Frank Ocean best songs',
        'SZA official audio',
        'H.E.R. official',
        'Daniel Caesar official',
        'R&B chill popular 2024',
        'Brent Faiyaz official',
        'Summer Walker official audio',
        'Jhené Aiko best tracks'
    ]
};

function buildYouTubeQuery(genre) {
    const cleanGenre = genre.trim();
    let matchedKey = Object.keys(genreQueries).find(k =>
        cleanGenre.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cleanGenre.toLowerCase())
    );
    if (!matchedKey) matchedKey = 'Pop';
    const pool = genreQueries[matchedKey];
    return pool[Math.floor(Math.random() * pool.length)];
}

function calculateIntensity(bpm, temp, sweat) {
    const bpmNorm   = Math.max(0, (bpm - 60) / 120);
    const tempNorm  = Math.max(0, (temp - 36) / 4);
    const sweatNorm = sweat / 100;
    const total = bpmNorm * 0.5 + tempNorm * 0.25 + sweatNorm * 0.25;
    return total > 0.75 ? 3 : total > 0.5 ? 2 : total > 0.25 ? 1 : 0;
}

async function generatePlaylist() {
    const bpm   = parseInt(sliders.bpm.el.value);
    const temp  = parseFloat(sliders.temperature.el.value);
    const sweat = parseInt(sliders.sweat.el.value);
    const light = parseInt(sliders.light.el.value);
    const selectedGenre = document.getElementById('genre-select').value;

    const btn = document.querySelector('.generate-button');
    const original = btn.innerHTML;
    btn.innerHTML = 'Analyse en cours... ⏳';
    btn.disabled = true;

    setTimeout(async () => {
        const intensity = calculateIntensity(bpm, temp, sweat);
        const isNight   = light < 30;
        const styleKey  = intensity === 0 ? (isNight ? 'nightRest' : 'dayRest')
                        : intensity === 1 ? 'lowIntensity'
                        : intensity === 2 ? 'mediumIntensity' : 'highIntensity';

        const mood = moodMap[styleKey];
        document.getElementById('mood-icon').textContent        = mood.icon;
        document.getElementById('mood-title').textContent       = mood.title;
        document.getElementById('mood-description').textContent = mood.desc;

        if (selectedGenre && YOUTUBE_API_KEY !== 'VOTRE_CLE_API_YOUTUBE') {
            showYouTubeSkeleton();
            await fetchYouTubeVideos(selectedGenre);
        } else {
            document.getElementById('youtube-results').style.display = 'none';
        }

        document.getElementById('music-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        btn.innerHTML = original;
        btn.disabled = false;
    }, 1500);
}

function showYouTubeSkeleton() {
    const container = document.getElementById('youtube-videos');
    container.innerHTML = Array(4).fill(0).map(() => `
        <div class="youtube-skeleton">
            <div class="skeleton-thumb"></div>
            <div class="skeleton-info">
                <div class="skeleton-line long"></div>
                <div class="skeleton-line short"></div>
            </div>
        </div>
    `).join('');
    document.getElementById('youtube-results').style.display = 'block';
}

async function fetchYouTubeVideos(genre) {
    const query  = buildYouTubeQuery(genre);
    const cached = getCached(query);
    if (cached) { displayYouTubeResults(cached, query); return; }

    try {
        const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        searchUrl.searchParams.set('part', 'snippet');
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
        searchUrl.searchParams.set('type', 'video');
        searchUrl.searchParams.set('maxResults', '8');
        searchUrl.searchParams.set('videoCategoryId', '10');
        searchUrl.searchParams.set('safeSearch', 'none');
        searchUrl.searchParams.set('order', 'viewCount');

        const searchRes = await fetch(searchUrl.toString());
        if (!searchRes.ok) {
            const err = await searchRes.json().catch(() => ({}));
            throw Object.assign(new Error(`HTTP ${searchRes.status}`), { apiError: err });
        }

        const searchData = await searchRes.json();
        if (!searchData.items?.length) throw new Error('NO_RESULTS');

        const videoIds  = searchData.items.map(i => i.id.videoId).join(',');
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        detailsUrl.searchParams.set('part', 'contentDetails,statistics,status');
        detailsUrl.searchParams.set('id', videoIds);
        detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const detailsRes  = await fetch(detailsUrl.toString());
        const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] };

        const enriched = searchData.items
            .map(item => {
                const detail = detailsData.items?.find(d => d.id === item.id.videoId) || {};
                return {
                    id:          item.id.videoId,
                    title:       item.snippet.title,
                    channel:     item.snippet.channelTitle,
                    thumbnail:   item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                    publishedAt: item.snippet.publishedAt,
                    duration:    parseDuration(detail.contentDetails?.duration),
                    viewCount:   parseInt(detail.statistics?.viewCount || 0),
                    views:       formatViews(detail.statistics?.viewCount),
                    isHD:        detail.contentDetails?.definition === 'hd',
                    isLive:      item.snippet.liveBroadcastContent === 'live',
                    embeddable:  detail.status?.embeddable !== false
                };
            })
            .sort((a, b) => b.viewCount - a.viewCount)
            .slice(0, 6);

        setCache(query, enriched);
        displayYouTubeResults(enriched, query);

    } catch (error) {
        displayYouTubeError(error, genre);
    }
}

function displayYouTubeResults(videos, query) {
    const container = document.getElementById('youtube-videos');
    container.innerHTML = '';

    const badge = document.createElement('div');
    badge.className = 'yt-query-badge';
    badge.textContent = `🔍 "${query}" • triés par vues`;
    container.appendChild(badge);

    videos.forEach((video, index) => {
        const age       = timeAgo(video.publishedAt);
        const hdBadge   = video.isHD   ? `<span class="yt-badge hd">HD</span>` : '';
        const liveBadge = video.isLive ? `<span class="yt-badge live">🔴 LIVE</span>` : '';

        const el = document.createElement('div');
        el.className = 'youtube-video';
        el.style.cssText = `opacity:0;transform:translateY(12px);transition:opacity .4s ease ${index * 80}ms,transform .4s ease ${index * 80}ms`;

        el.innerHTML = `
            <div class="youtube-thumbnail"
                 style="background-image:url(${video.thumbnail})"
                 onclick="toggleEmbed('${video.id}','embed-${index}',event)">
                <div class="youtube-play-btn">▶</div>
                ${video.duration ? `<span class="yt-duration-badge">${video.duration}</span>` : ''}
            </div>
            <div class="youtube-info">
                <div class="youtube-title">${video.title}</div>
                <div class="youtube-channel">${video.channel}</div>
                <div class="youtube-meta">
                    ${hdBadge}${liveBadge}
                    ${video.views    ? `<span class="youtube-views">👁 ${video.views}</span>` : ''}
                    ${video.duration ? `<span class="youtube-duration">⏱ ${video.duration}</span>` : ''}
                    ${age            ? `<span class="youtube-date">📅 ${age}</span>` : ''}
                </div>
                <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
                    ${video.embeddable ? `<button class="yt-expand-btn" onclick="toggleEmbed('${video.id}','embed-${index}',event)">▶ Lire ici</button>` : ''}
                    <button class="yt-expand-btn" onclick="window.open('https://www.youtube.com/watch?v=${video.id}','_blank')">↗ YouTube</button>
                </div>
                <div id="embed-${index}" class="yt-embed-wrapper" style="display:none"></div>
            </div>
        `;

        container.appendChild(el);
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    });

    document.getElementById('youtube-results').style.display = 'block';
}

function toggleEmbed(videoId, embedId, event) {
    event.stopPropagation();
    const wrapper = document.getElementById(embedId);
    if (!wrapper) return;
    if (wrapper.style.display === 'none') {
        document.querySelectorAll('.yt-embed-wrapper').forEach(w => {
            if (w.id !== embedId) { w.style.display = 'none'; w.innerHTML = ''; }
        });
        wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>`;
        wrapper.style.display = 'block';
    } else {
        wrapper.style.display = 'none';
        wrapper.innerHTML = '';
    }
}

function displayYouTubeError(error, genre) {
    const container = document.getElementById('youtube-videos');
    const isQuota  = error.message?.includes('403') || error.apiError?.error?.code === 403;
    const noResult = error.message === 'NO_RESULTS';

    container.innerHTML = `
        <div class="yt-error">
            <div style="font-size:2rem">${isQuota ? '🔑' : noResult ? '🎵' : '⚠️'}</div>
            <div style="margin-top:8px;font-weight:600">
                ${isQuota  ? 'Quota API dépassé ou clé invalide'
                : noResult ? `Aucun résultat pour "${genre}"`
                           : 'Erreur lors de la recherche YouTube'}
            </div>
            ${isQuota  ? '<div class="yt-error-code">Vérifiez votre clé API YouTube Data v3</div>' : ''}
            ${noResult ? `<button class="yt-expand-btn" style="margin-top:10px" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(genre)}','_blank')">Chercher sur YouTube ↗</button>` : ''}
        </div>
    `;
    document.getElementById('youtube-results').style.display = 'block';
}

function parseDuration(iso) {
    if (!iso) return null;
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return null;
    const h = parseInt(m[1] || 0), mi = parseInt(m[2] || 0), s = parseInt(m[3] || 0);
    if (h > 0) return `${h}:${String(mi).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${mi}:${String(s).padStart(2,'0')}`;
}

function formatViews(count) {
    if (!count) return null;
    const n = parseInt(count);
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M vues`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k vues`;
    return `${n} vues`;
}

function timeAgo(isoDate) {
    if (!isoDate) return null;
    const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
    if (days < 1)   return "Aujourd'hui";
    if (days < 7)   return `Il y a ${days}j`;
    if (days < 30)  return `Il y a ${Math.floor(days / 7)}sem`;
    if (days < 365) return `Il y a ${Math.floor(days / 30)}mois`;
    return `Il y a ${Math.floor(days / 365)}an${Math.floor(days / 365) > 1 ? 's' : ''}`;
}

function animateVisualizer() {
    const bars = document.querySelectorAll('.bar');
    let time = 0;
    (function loop() {
        bars.forEach((bar, i) => {
            bar.style.height = `${50 + Math.sin(time + i * 0.4) * 40}%`;
        });
        time += 0.08;
        requestAnimationFrame(loop);
    })();
}

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.2 });

document.addEventListener('DOMContentLoaded', () => {
    animateVisualizer();
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.cssText = 'opacity:0;transform:translateY(40px);transition:all 0.6s ease';
        observer.observe(card);
    });
    document.querySelector('.about')        && observer.observe(document.querySelector('.about'));
    document.querySelector('.test-section') && observer.observe(document.querySelector('.test-section'));
});
