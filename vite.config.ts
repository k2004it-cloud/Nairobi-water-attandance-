import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

function parseJsonBody(req: any) {
  return new Promise<void>((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body) {
          req.body = JSON.parse(body);
        }
      } catch {
        req.body = null;
      }
      resolve();
    });
    req.on('error', () => {
      req.body = null;
      resolve();
    });
  });
}

function registerApiMiddleware(server: any) {
  server.middlewares.use(async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/')) {
      return next();
    }

    const [pathname] = req.url.split('?');
    const modulePath = path.resolve(__dirname, `.${pathname}.ts`);
    if (!fs.existsSync(modulePath)) {
      return next();
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      await parseJsonBody(req);
    }

    const enhancedRes = Object.assign(res, {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: any) {
        if (!this.headersSent) {
          this.setHeader('Content-Type', 'application/json');
        }
        this.end(JSON.stringify(payload));
      }
    });

    try {
      const mod = await server.ssrLoadModule(modulePath);
      if (mod && typeof mod.default === 'function') {
        return mod.default(req, enhancedRes);
      }
    } catch (err: any) {
      console.error('API handler error:', err);
      enhancedRes.statusCode = 500;
      enhancedRes.setHeader('Content-Type', 'application/json');
      enhancedRes.end(JSON.stringify({ error: 'API handler error' }));
      return;
    }

    next();
  });
}

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-api-middleware',
      configureServer(server) {
        registerApiMiddleware(server);
      },
      configurePreviewServer(server) {
        registerApiMiddleware(server);
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify: file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {}
  }
}));
