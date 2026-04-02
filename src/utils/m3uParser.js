/**
 * M3U Parser — Latino/Argentina focused.
 * Filters out non-Latino content and smartly categorizes channels.
 */

export async function fetchAndParseM3U(url, defaultCategory = "Otros", fetcher = fetch) {
  try {
    console.log(`📡 Fetching M3U from: ${url}`);
    const response = await fetcher(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    return parseM3U(text, defaultCategory);
  } catch (error) {
    console.error(`❌ Error fetching M3U (${url}):`, error);
    return [];
  }
}

function parseM3U(text, defaultCategory) {
  const lines = text.replace(/\r/g, '').split('\n');
  const channels = [];
  let currentChannel = null;
  let idCounter = 1;

  for (let line of lines) {
    line = line.trim();

    // Skip commented-out / asterisk lines
    if (line.startsWith('*')) continue;

    if (line.startsWith('#EXTINF:')) {
      currentChannel = {};

      // Extract logo
      const logoMatch = line.match(/tvg-logo=["'](.*?)["']/i);
      currentChannel.logo = logoMatch ? logoMatch[1] : '';
      if (currentChannel.logo === 'movie' || currentChannel.logo.length < 10) {
        currentChannel.logo = '';
      }

      // Extract Name (after the last comma)
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentChannel.name = line.substring(commaIndex + 1).trim();
      } else {
        const nameMatch = line.match(/tvg-name=["'](.*?)["']/i);
        currentChannel.name = nameMatch ? nameMatch[1] : 'Canal';
      }

      // Extract Group/Category
      const groupMatch = line.match(/group-title=["'](.*?)["']/i);
      currentChannel.group = groupMatch ? groupMatch[1] : defaultCategory;

      // Detect if it's a movie
      currentChannel.isMovie = line.includes('type="movie"');

    } else if (line.startsWith('http') && currentChannel) {
      currentChannel.url = line;

      const nameLower = (currentChannel.name || "Canal").toLowerCase();
      const groupLower = (currentChannel.group || defaultCategory || "").toLowerCase();

      // === CATEGORIZATION ===
      let category = categorizeChannel(nameLower, groupLower, currentChannel.isMovie, defaultCategory);

      // Clean up name
      const cleanName = currentChannel.name
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      channels.push({
        id: `m3u_${Date.now()}_${idCounter++}`,
        equipo_local: cleanName,
        equipo_visitante: '',
        torneo: currentChannel.group,
        categoria: category,
        horario: currentChannel.isMovie ? 'VOD' : 'EN VIVO',
        stream_url: currentChannel.url,
        escudo_local: currentChannel.logo,
        escudo_visitante: '',
        logo_canal: currentChannel.logo
      });

      currentChannel = null;
    }
  }
  return channels;
}

function categorizeChannel(nameLower, groupLower, isMovie, defaultCategory) {
  // 1. MOVIES — only if explicitly marked as VOD type or from VOD source
  if (isMovie) {
    return "Películas";
  }

  // 2. FÚTBOL ARGENTINO — Argentine-specific sports channels
  const arSportPatterns = [
    'tnt sports', 'espn premium', 'fox sports premium', 
    'tyc sports', 'tyc sport', 'tyc sports play',
    'direc tv sport', 'direc tv sport 2', 'dsports',
    'espn (argentina)', 'espn 2 (argentina)', 'espn 3 (argentina)',
    'fox sport (argentina)', 'fox sport 2 (argentina)', 'fox 3 (argentina)',
    'ar: espn', 'ar: tyc', 'ar: fox', 'ar: tnt', 'tnt sports ar', 'tyc sports ar',
    'espn premio', 'espn ar', 'fox sports ar', 'tnt ar'
  ];
  if (arSportPatterns.some(p => nameLower.includes(p))) {
    return "Fútbol Argentino";
  }

  // 3. ARGENTINA — Argentine national/open TV
  const arTvPatterns = ['a24', 'canal 26', ' tn', 'crónica', 'cronica', 'canal e',
    'telefe', 'el trece', 'el nueve', 'américa tv', 'tv pública', 'tv publica',
    'canal de la ciudad', 'ciudad magazine', 'argentinisima', 'net tv',
    'bravo tv', 'unife tv', 'canal 9 multivisión', 'canal de la música',
    'telemax', 'radio la 100', 'latina tv', '24/7 noticias'];
  const arGroups = ['noticias', 'general/abierta', 'temáticos argentinos',
    'otros/extras y radios', 'internacional'];
  if (arTvPatterns.some(p => nameLower.includes(p)) ||
      arGroups.some(g => groupLower.includes(g)) ||
      defaultCategory === 'Argentina') {
    return "Argentina";
  }

  // 4. DEPORTES 24/7 — All other sports channels
  const sportPatterns = [
    'espn', 'fox sport', 'win sport', 'tudn', 'claro sport',
    'tigo sport', 'futbol', 'deportes', 'sky sport', 'contacto deportivo',
    'gol peru', 'liga 1', 'movistar', 'tvc sport', 'td +', 'futv',
    'ser tv', 'cos fc', 'sportv', 'internetv deporte', 'aym sport',
    'caliente tv', 'chiringuito', 'bein sport', 'gol tv', 'depor tv',
    'real madrid', 'barça tv', 'fifa+', 'nba tv', 'f1 channel'
  ];
  const sportGroups = ['deportes', 'liga mx', 'deportes lmb', 'sports', 'sports category'];
  if (sportPatterns.some(p => nameLower.includes(p)) ||
      sportGroups.some(g => groupLower.includes(g)) ||
      defaultCategory === 'Deportes 24/7') {
    return "Deportes 24/7";
  }

  // 5. LATINO — TV abierta latino, mexican channels, etc.
  const latinoGroups = ['bics', 'extra latino'];
  if (latinoGroups.some(g => groupLower.includes(g)) ||
      nameLower.includes('mx:') || nameLower.includes('co:') ||
      nameLower.includes('pe:') || nameLower.includes('ec:') ||
      nameLower.includes('pr:') || nameLower.includes('gt:') ||
      nameLower.includes('sv:') || nameLower.includes('hn:') ||
      nameLower.includes('bo:') || nameLower.includes('pa:') ||
      defaultCategory === 'Latino') {
    return "Latino";
  }

  // Fallback
  return defaultCategory;
}
