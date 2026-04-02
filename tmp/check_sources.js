
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const M3U_SOURCES = [
  { url: 'https://gist.githubusercontent.com/frantdse/f6989518c73826ade6734c63c367af4c/raw/', category: 'Deportes' },
  { url: 'https://raw.githubusercontent.com/json-teles/cl/master/lista.m3u', category: 'Canales TV' },
  { url: 'https://raw.githubusercontent.com/Free-TV-IPTV/Free-TV-IPTV/master/playlist.m3u', category: 'Canales TV' },
  { url: 'http://www.m3u.cl/playlist/AR.m3u', category: 'Canales TV' }
];

async function checkSources() {
  for (const source of M3U_SOURCES) {
    try {
      const res = await fetch(source.url, { method: 'HEAD', timeout: 5000 });
      console.log(`${res.status} - ${source.url} (${res.ok ? 'OK' : 'FAIL'})`);
    } catch (e) {
      console.log(`ERROR - ${source.url} (${e.message})`);
    }
  }
}

checkSources();
