import React, { useState, useEffect, useRef, useCallback } from 'react';
import Player from './components/Player';
import Logo from './components/Logo';
import Grid from './components/Grid';
import './App.css';

import { fetchAndParseM3U } from './utils/m3uParser';
import { getPopularMovies, getPopularSeries } from './api/stremio';
import { universalFetch } from './utils/fetchAdapter';

const CATEGORIAS = ["Películas", "Series", "Canales TV", "Deportes"];

const M3U_SOURCES = [
  { url: 'https://gist.githubusercontent.com/frantdse/f6989518c73826ade6734c63c367af4c/raw/', category: 'Deportes' },
  { url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ar.m3u', category: 'Canales TV' },
  { url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/cl.m3u', category: 'Canales TV' },
  { url: 'https://iptv-org.github.io/iptv/languages/spa.m3u', category: 'Latino' },
  { url: 'https://raw.githubusercontent.com/Free-TV-IPTV/Free-TV-IPTV/master/playlist.m3u', category: 'Canales TV' }
];

const VERIFIED_CHANNELS = [
  { name: 'TN (Todo Noticias)', url: 'https://live-01-01-tn.vodgc.net/TN24/index.m3u8', category: 'Canales TV', group: 'Noticias' },
  { name: 'C5N', url: 'https://c5n.strm.pro/c5n/live/playlist.m3u8', category: 'Canales TV', group: 'Noticias' },
  { name: 'Canal 26', url: 'https://live-01-02-canal26.vodgc.net/Canal26/index.m3u8', category: 'Canales TV', group: 'Noticias' },
  { name: 'Telefe Interior', url: 'https://tvp-live.cdn.vrio.one/live/telefe/telefe.m3u8', category: 'Canales TV', group: 'TV Abierta' },
  { name: '5TV Corrientes', url: 'http://www.coninfo.net:1935/tvcinco/live1/playlist.m3u8', category: 'Canales TV', group: 'TV Abierta' },
  { name: 'Canal 13 Salta', url: 'https://panel.host-live.com:443/canal13salta/live/playlist.m3u8', category: 'Canales TV', group: 'TV Abierta' },
  { name: 'Santa Fe TV', url: 'https://videostream.shockmedia.com.ar:19360/santafetv/santafetv.m3u8', category: 'Canales TV', group: 'TV Abierta' },
];

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Películas");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isNavigatingCategories, setIsNavigatingCategories] = useState(false);
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(0);
  const playerRef = useRef(null);

  useEffect(() => {
    async function fetchAllContent() {
      try {
        console.log("🛰️ Sincronizando contenido...");
        setLoading(true);
        let allItems = [];

        // 1. Canales Verificados
        const verifiedItems = VERIFIED_CHANNELS.map((ch, i) => ({
          id: `verified_${i}`,
          equipo_local: ch.name,
          equipo_visitante: '',
          torneo: ch.group,
          categoria: 'Canales TV',
          horario: 'EN VIVO',
          stream_url: ch.url,
          logo_canal: '',
          isVerified: true
        }));
        allItems = [...verifiedItems];

        // 2. M3U Sources - Agregamos más fuentes para mayor variedad de alternativas
        const EXTRA_M3U = [
          'https://iptv-org.github.io/iptv/countries/ar.m3u',
          'https://iptv-org.github.io/iptv/countries/cl.m3u',
          'https://iptv-org.github.io/iptv/categories/sports.m3u'
        ];
        const m3uPromises = [...M3U_SOURCES.map(s => s.url), ...EXTRA_M3U].map(url => 
          fetchAndParseM3U(url, null, universalFetch).catch(() => [])
        );
        const m3uResults = await Promise.all(m3uPromises);
        m3uResults.forEach(channels => {
          const mapped = channels.map(c => {
             let cat = "Canales TV";
             const nameLow = (c.equipo_local || "").toLowerCase();
             if (["Fútbol Argentino", "Deportes 24/7", "Deportes"].includes(c.categoria) || nameLow.includes("espn") || nameLow.includes("fox sports") || nameLow.includes("tnt sports")) {
                cat = "Deportes";
             } else if (c.categoria === "Películas") {
                cat = "Películas";
             }
             return { ...c, categoria: cat };
          });
          allItems = [...allItems, ...mapped];
        });

        // 3. Stremio (Movies/Series)
        console.log("🎬 Sincronizando Catálogo Cinemeta...");
        const [movies, series] = await Promise.all([
          getPopularMovies(0).catch(() => []),
          getPopularSeries(0).catch(() => [])
        ]);

        const movieItems = movies.map(m => ({
          id: `movie_${m.id}`,
          equipo_local: m.name,
          equipo_visitante: m.year || '',
          torneo: 'Cine VOD',
          categoria: 'Películas',
          horario: 'VOD',
          stream_url: `stremio://${m.id}`,
          type: 'movie',
          escudo_local: m.poster,
          logo_canal: m.poster
        }));

        const seriesItems = series.map(s => ({
          id: `series_${s.id}`,
          equipo_local: s.name,
          equipo_visitante: s.year || '',
          torneo: 'Series VOD',
          categoria: 'Series',
          horario: 'VOD',
          stream_url: `stremio://${s.id}`,
          type: 'series',
          escudo_local: s.poster,
          logo_canal: s.poster
        }));

        allItems = [...allItems, ...movieItems, ...seriesItems];

        // 🏆 AGRUPACIÓN POR NOMBRE AGRESIVA
        const grouped = new Map();
        allItems.forEach(item => {
          const name = item.equipo_local || "Canal";
          // Normalización agresiva: quitar HD, FHD, SD, 4K, Argentina, AR, Chile, CL, etc.
          const norm = name.toLowerCase()
            .replace(/\[.*?\]/g, '') // Quitar [tags]
            .replace(/\(.*?\)/g, '') // Quitar (tags)
            .replace(/\b(hd|fhd|sd|4k|ar|arg|argentina|cl|chile|latino|spa|es)\b/g, '') 
            .replace(/\s+/g, ' ')
            .trim();
          
          const key = `${norm || name}_${item.categoria}`;

          if (grouped.has(key)) {
            const existing = grouped.get(key);
            if (!existing.alternatives) existing.alternatives = [existing.stream_url];
            if (!existing.alternatives.includes(item.stream_url)) {
                existing.alternatives.push(item.stream_url);
                // Si el item nuevo tiene logo y el viejo no, actualizar
                if (!existing.logo_canal && item.logo_canal) existing.logo_canal = item.logo_canal;
            }
          } else {
            grouped.set(key, { ...item, id: key, alternatives: [item.stream_url] });
          }
        });

        setMatches(Array.from(grouped.values()));
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllContent();
  }, []);

  // 📺 Navegación por Control Remoto (D-Pad)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Manejo de Navegación por Categorías (Tabs)
      if (isNavigatingCategories) {
        if (e.key === 'ArrowRight') {
          setFocusedCategoryIndex(prev => Math.min(prev + 1, CATEGORIAS.length - 1));
        } else if (e.key === 'ArrowLeft') {
          setFocusedCategoryIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'ArrowDown') {
          setIsNavigatingCategories(false);
          setFocusedIndex(0);
          setActiveCategory(CATEGORIAS[focusedCategoryIndex]);
        } else if (e.key === 'Enter') {
          setActiveCategory(CATEGORIAS[focusedCategoryIndex]);
          setIsNavigatingCategories(false);
          setFocusedIndex(0);
        }
        return;
      }

      // 2. Manejo de Navegación por Grilla
      const filtered = matches.filter(m => m.categoria === activeCategory);
      if (filtered.length === 0) return;

      let newIndex = focusedIndex;
      const columns = 4; // Ajustar según grid-template-columns

      if (e.key === 'ArrowRight') newIndex = Math.min(newIndex + 1, filtered.length - 1);
      if (e.key === 'ArrowLeft') newIndex = Math.max(newIndex - 1, 0);
      if (e.key === 'ArrowDown') newIndex = Math.min(newIndex + columns, filtered.length - 1);
      
      if (e.key === 'ArrowUp') {
        if (focusedIndex < columns) {
          setIsNavigatingCategories(true);
          setFocusedCategoryIndex(CATEGORIAS.indexOf(activeCategory));
          return;
        }
        newIndex = Math.max(newIndex - columns, 0);
      }
      
      if (e.key === 'Enter') {
        handleSelectMatch(filtered[focusedIndex]);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Escape') {
        if (selectedMatch) {
            setSelectedMatch(null);
            e.preventDefault();
        }
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        const focusedEl = document.querySelector(`.match-card:nth-child(${newIndex + 1})`);
        if (focusedEl) focusedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, matches, activeCategory, isNavigatingCategories, focusedCategoryIndex, selectedMatch]);

  const handleSelectMatch = useCallback((match) => {
    setSelectedMatch(match);
    setTimeout(() => {
        if (playerRef.current) playerRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  return (
    <div className="app-container ani-flix-theme">
      <header className="navbar glass">
        <div className="navbar-container">
          <Logo />
          <nav className="navbar-menu">
            <div className="category-tabs">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat}
                  className={`tab-item ${activeCategory === cat ? 'active' : ''} ${isNavigatingCategories && CATEGORIAS[focusedCategoryIndex] === cat ? 'focused' : ''}`}
                  onClick={() => { setActiveCategory(cat); setIsNavigatingCategories(false); setFocusedIndex(0); }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div ref={playerRef}>
           <Player match={selectedMatch} />
        </div>
        <div className="section-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Sincronizando catálogo...</p>
            </div>
          ) : (
            <Grid 
              matches={matches} 
              activeCategory={activeCategory} 
              onSelectMatch={handleSelectMatch} 
              selectedMatch={selectedMatch}
              focusedIndex={focusedIndex}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} AniFlix. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
