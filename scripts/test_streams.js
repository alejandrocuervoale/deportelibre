
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Canales principales a testear
const CORE_CHANNELS = {
  "TN": "https://live-01-01-tn.vodgc.net/TN24/index.m3u8",
  "C5N": "https://c5n.strm.pro/c5n/live/playlist.m3u8",
  "Canal 26": "https://live-01-02-canal26.vodgc.net/Canal26/index.m3u8",
  "Telefe": "https://tvp-live.cdn.vrio.one/live/telefe/telefe.m3u8",
  "Claro Sports": "https://dai.google.com/linear/hls/event/NHe1sutaROeLlaDlLvF4-g/master.m3u8"
};

async function testStream(name, url) {
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    const duration = Date.now() - start;
    if (res.ok) {
      console.log(`✅ OK [${duration}ms] - ${name}`);
      return true;
    } else {
      console.log(`❌ FAIL [${res.status}] - ${name}`);
      return false;
    }
  } catch (e) {
    console.log(`⚠️ ERROR [${e.name === 'AbortError' ? 'TIMEOUT' : e.message}] - ${name}`);
    return false;
  }
}

async function runAudit() {
  console.log("🔍 Iniciando auditoría de señales maestras...\n");
  let working = 0;
  let total = Object.keys(CORE_CHANNELS).length;

  for (const [name, url] of Object.entries(CORE_CHANNELS)) {
    const ok = await testStream(name, url);
    if (ok) working++;
  }

  console.log(`\n📊 Resumen: ${working}/${total} señales activas.`);
  
  if (working < total) {
    console.log("💡 Sugerencia: Algunas señales principales fallaron. Se recomienda buscar alternativas en GitHub/iptv-org.");
  }
}

runAudit();
