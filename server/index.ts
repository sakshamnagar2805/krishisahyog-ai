/**
 * Production server: serves the built app (dist/) and the assistant API.
 * Run `npm run build` first, then `npm start`.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import './config/loadEnv';
import { createApiApp } from './http/apiApp';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const port = Number(process.env.PORT) || 3000;
const distDir = path.join(rootDir, 'dist');

const app = express();
app.disable('x-powered-by');
// Research preview router stays mounted but is still hard-gated (non-production + flag + loopback).
// Unknown /api paths now return JSON 404 instead of the SPA's index.html.
app.use(createApiApp({apiKey:process.env.GEMINI_API_KEY,model:process.env.GEMINI_TEXT_MODEL,includeResearchPreview:true}));
// Phase 1: previous Gemini proxy is deliberately not mounted; it is not yet source-grounded.
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(port, () => {
  console.log(`KrishiSahyog AI public shell running on http://localhost:${port}; source catalog not yet configured`);
});
