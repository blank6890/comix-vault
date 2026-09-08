import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { CONFIG } from './config.js';
import mangaRoutes from './routes/manga.js';
import readerRoutes from './routes/reader.js';
import libraryRoutes from './routes/library.js';
import proxyRoutes from './routes/proxy.js';
import systemRoutes from './routes/system.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Performance and security middleware
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (CONFIG.ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/manga', mangaRoutes);
app.use('/api/reader', readerRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/system', systemRoutes);

// Serve built frontend assets in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>NEO-COMIX - Development Mode</title>
            <style>
              body { background: #08090d; color: #f43f5e; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
              a { color: #06b6d4; text-decoration: none; padding: 10px 20px; border: 1px solid #06b6d4; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div>
              <h1>⚡ NEO-COMIX SERVER RUNNING</h1>
              <p>For development with live reload, run: <code>npm run dev</code></p>
              <p>For production on Raspberry Pi, run: <code>npm run build && npm start</code></p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log(`
    =============================================================
    🌸 NEO-COMIX / ネオ・コミックス
    ⚡ Raspberry Pi Manga & Manhwa Streaming Server Active!
    -------------------------------------------------------------
    🌐 Local Server:   http://localhost:${CONFIG.PORT}
    📡 Network Access:  http://${CONFIG.HOST}:${CONFIG.PORT}
    🛠️ Environment:     ${CONFIG.ENV}
    =============================================================
    `);
  });
}

export { app };

