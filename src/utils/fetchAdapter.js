import { CapacitorHttp } from '@capacitor/core';

/**
 * Adaptador de red universal para DeporteLibre.
 * - En navegador (Dev): Usa fetch estándar (con proxy de Vite).
 * - En Android (APK): Usa CapacitorHttp para saltar bloqueos de CORS.
 */
export async function universalFetch(url, options = {}) {
  const isNative = window.Capacitor && window.Capacitor.platform !== 'web';

  // Si estamos en desarrollo, mapear URLs para usar el proxy local
  let requestUrl = url;
  if (!isNative) {
    if (url.includes('stremio.io')) {
       requestUrl = url.replace('https://v3-cinemeta.strem.io/', '/stremio-api/');
    } else if (url.includes('strem.io/stream')) {
       requestUrl = url.replace('https://torrentio.strem.io/', '/torrentio-api/');
    }
    // Nota: El proxy de HLS se maneja directamente en Player.jsx
    return fetch(requestUrl, options);
  }

  // Lógica para Android (APK nativo)
  try {
    const response = await CapacitorHttp.request({
      url: url,
      method: options.method || 'GET',
      headers: { ...options.headers, 'User-Agent': 'DeporteLibre/1.0' },
      data: options.body,
      params: options.params || {}
    });
    
    // Simular API de Response de fetch para compatibilidad
    return {
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
      json: async () => {
        if (typeof response.data === 'string') {
          try { return JSON.parse(response.data); } catch { return response.data; }
        }
        return response.data;
      },
      text: async () => {
        if (typeof response.data === 'object') return JSON.stringify(response.data);
        return response.data || "";
      }
    };
  } catch (error) {
    console.error("🛑 Native Network Error:", error);
    // Silent fallback to standard fetch if native fails for some reason
    return fetch(url, options);
  }
}
