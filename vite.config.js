import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Readable } from 'stream'

// Plugin personalizado para evadir bloqueos CORS y proxear APIs de Stremio
function allProxyPlugin() {
  return {
    name: 'all-proxy',
    configureServer(server) {
      // 1. HLS Proxy (CORS evasion)
      server.middlewares.use('/hls-proxy', async (req, res) => {
        try {
          const fullUrl = req.originalUrl || req.url;
          const urlParam = new URL(fullUrl, `http://${req.headers.host}`).searchParams.get('url');
          if (!urlParam) {
             res.statusCode = 400;
             return res.end('Missing url');
          }
          const targetUrl = new URL(urlParam);
          const proxyRes = await fetch(targetUrl.toString(), {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            redirect: 'follow'
          });
          res.setHeader('Access-Control-Allow-Origin', '*');
          const contentType = proxyRes.headers.get('content-type');
          if (contentType) res.setHeader('Content-Type', contentType);
          
          if (proxyRes.body) {
             Readable.fromWeb(proxyRes.body).pipe(res);
          } else {
             const ab = await proxyRes.arrayBuffer();
             res.end(Buffer.from(ab));
          }
        } catch (e) {
          res.statusCode = 502;
          res.end(e.message);
        }
      });

      // 2. Stremio API Proxy
      server.middlewares.use('/stremio-api', async (req, res) => {
        try {
          const targetPath = req.url.replace(/^\//, '');
          const targetUrl = `https://v3-cinemeta.strem.io/${targetPath}`;
          const apiRes = await fetch(targetUrl);
          const data = await apiRes.json();
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      // 3. Torrentio API Proxy
      server.middlewares.use('/torrentio-api', async (req, res) => {
        try {
          const targetPath = req.url.replace(/^\//, '');
          const targetUrl = `https://torrentio.strem.fun/${targetPath}`;
          const apiRes = await fetch(targetUrl);
          const data = await apiRes.json();
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      // 4. Image Proxy (For Metahub posters)
      server.middlewares.use('/img-proxy', async (req, res) => {
        try {
          const fullUrl = req.originalUrl || req.url;
          const urlParam = new URL(fullUrl, `http://${req.headers.host}`).searchParams.get('url');
          if (!urlParam) return res.end('');
          
          const imgRes = await fetch(urlParam);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const contentType = imgRes.headers.get('content-type');
          if (contentType) res.setHeader('Content-Type', contentType);
          
          if (imgRes.body) {
             Readable.fromWeb(imgRes.body).pipe(res);
          } else {
             const ab = await imgRes.arrayBuffer();
             res.end(Buffer.from(ab));
          }
        } catch (e) {
          res.statusCode = 502;
          res.end('');
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), allProxyPlugin()],
  define: {
    global: 'window',
    process: { env: {} }
  },
  server: {
    watch: {
      ignored: ['**/.torrent_cache/**']
    }
  }
})
