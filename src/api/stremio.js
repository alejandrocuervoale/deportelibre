import { universalFetch } from '../utils/fetchAdapter';

// Integración con el ecosistema de APIs de Stremio (Cinemeta + Torrentio)

// Fetch popular movies - multiple pages for more content
export async function getPopularMovies(skip = 0) {
    try {
        const pages = [0, 100, 200];
        const promises = pages.map(s =>
            universalFetch(`https://v3-cinemeta.strem.io/catalog/movie/top/skip=${s}.json`)
                .then(r => r.ok ? r.json() : { metas: [] })
                .catch(() => ({ metas: [] }))
        );
        const results = await Promise.all(promises);
        const allMovies = results.flatMap(r => r.metas || []);
        
        const seen = new Set();
        return allMovies.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });
    } catch (e) {
        console.error("Cinemeta fetch error:", e);
        return [];
    }
}

// Fetch popular series (TV Shows)
export async function getPopularSeries(skip = 0) {
    try {
        const pages = [0, 100];
        const promises = pages.map(s =>
            universalFetch(`https://v3-cinemeta.strem.io/catalog/series/top/skip=${s}.json`)
                .then(r => r.ok ? r.json() : { metas: [] })
                .catch(() => ({ metas: [] }))
        );
        const results = await Promise.all(promises);
        const allSeries = results.flatMap(r => r.metas || []);
        
        const seen = new Set();
        return allSeries.filter(s => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
        });
    } catch (e) {
        console.error("Cinemeta series fetch error:", e);
        return [];
    }
}

// Fetch series metadata (episodes, seasons)
export async function getSeriesMeta(id) {
    try {
        const response = await universalFetch(`https://v3-cinemeta.strem.io/meta/series/${id}.json`);
        if (!response.ok) throw new Error("Error fetching Series Meta");
        const data = await response.json();
        return data.meta || null;
    } catch (e) {
        console.error("Cinemeta series meta error:", e);
        return null;
    }
}

// Fetch search results
export async function searchMovies(query) {
    try {
        const response = await fetch(`/stremio-api/catalog/movie/top/search=${encodeURIComponent(query)}.json`);
        if (!response.ok) throw new Error("Error fetching Cinemeta search");
        const data = await response.json();
        return data.metas || [];
    } catch (e) {
        console.error("Cinemeta search error:", e);
        return [];
    }
}

// Fetch available torrent streams for a specific movie or series (P2P Support)
export async function getTorrentMagnets(type, id) {
    try {
        // Torrentio is the community standard for magnet resolution
        const response = await universalFetch(`https://torrentio.strem.io/stream/${type}/${id}.json`);
        if (!response.ok) throw new Error("Error fetching Torrentio Magnets");
        const data = await response.json();
        
        if (!data.streams || data.streams.length === 0) return [];
        
        // Map and extract relevant P2P info
        return data.streams
            .filter(s => s.infoHash)
            .map(s => ({
                name: s.name,
                title: s.title,
                infoHash: s.infoHash,
                magnet: `magnet:?xt=urn:btih:${s.infoHash}&dn=${encodeURIComponent(s.title || 'AniFlix_Stream')}&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://tracker.leechers-paradise.org:6969/announce`
            }))
            .sort((a, b) => {
                const aLow = a.title.toLowerCase();
                const bLow = b.title.toLowerCase();
                if (aLow.includes('1080p') && !bLow.includes('1080p')) return -1;
                return 0;
            });
    } catch (e) {
        console.error("Torrentio fetch error:", e);
        return [];
    }
}

// Fetch available torrent streams for a specific movie (IMDB ID) - Legacy fallback
export async function getMovieStreams(imdbId) {
    return getTorrentMagnets('movie', imdbId);
}
