import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import dotenv from 'dotenv';
import {createApiApp,toConnectMiddleware} from './server/http/apiApp';

const publicApiPlugin = (): Plugin => {
  // Phase 14: express routers must run inside an express application; mounting them
  // directly in Vite's connect stack left req.query/res.json undefined and crashed the server.
  const options = {apiKey:process.env.GEMINI_API_KEY,model:process.env.GEMINI_TEXT_MODEL};
  const devApi = toConnectMiddleware(createApiApp({...options,includeResearchPreview:true}));
  const previewApi = toConnectMiddleware(createApiApp({...options,includeResearchPreview:false}));
  return {
    name: 'krishisahyog-public-api',
    configureServer(server) { server.middlewares.use(devApi); },
    configurePreviewServer(server) { server.middlewares.use(previewApi); },
  };
};

export default defineConfig(() => {
  dotenv.config({path:'.env.local',quiet:true});
  dotenv.config({path:'.env',quiet:true});
  return {
    plugins: [react(), tailwindcss(), publicApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
