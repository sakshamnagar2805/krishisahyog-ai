/**
 * Phase 14: single construction point for the HTTP API used by
 *  - the production Express server (server/index.ts), and
 *  - the Vite dev / preview servers (vite.config.ts).
 *
 * Why: the API routers are express.Router instances. When they were mounted
 * directly into Vite's connect middleware stack, `req.query`, `res.status()`
 * and `res.json()` did not exist (those are added by an express *application*),
 * so the first catalog request crashed the whole dev server process.
 * Wrapping them in an express application fixes that, and gives every API
 * response consistent JSON error semantics without leaking stack traces.
 */
import express, {type ErrorRequestHandler, type Express} from 'express';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {createPublicContentApi} from '../publicContentApi';
import {createDiscoveryApi} from '../discovery/api';
import {createGroundedAssistantApi} from '../assistant/groundedApi';
import {createResearchPreviewApi} from '../research/previewApi';

export interface ApiAppOptions {
  apiKey?: string;
  model?: string;
  /** Mount the local research preview router. It remains independently gated by isLocalPreviewAllowed. */
  includeResearchPreview: boolean;
}

const apiErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);
  const type = (err as {type?: string} | undefined)?.type;
  if (type === 'entity.parse.failed') return res.status(400).json({error: 'INVALID_JSON'});
  if (type === 'entity.too.large') return res.status(413).json({error: 'PAYLOAD_TOO_LARGE'});
  if (type === 'encoding.unsupported' || type === 'charset.unsupported') return res.status(415).json({error: 'UNSUPPORTED_ENCODING'});
  console.error('[api] unhandled request error:', (err as Error | undefined)?.message ?? 'unknown');
  return res.status(500).json({error: 'INTERNAL_ERROR'});
};

export function createApiApp(options: ApiAppOptions): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  app.use(createPublicContentApi());
  if (options.includeResearchPreview) app.use(createResearchPreviewApi());
  app.use(createDiscoveryApi());
  app.use(createGroundedAssistantApi({apiKey: options.apiKey, model: options.model}));
  // Unknown API paths must not fall through to the SPA index.html (HTTP 200 HTML).
  app.use('/api', (_req, res) => res.status(404).json({error: 'NOT_FOUND'}));
  app.use(apiErrorHandler);
  return app;
}

type Next = (err?: unknown) => void;

/**
 * Adapts the express application to a plain connect middleware (Vite).
 * Requests that are not handled by the API fall through to Vite with their
 * original prototypes restored, mirroring how express mounts sub-apps.
 */
export function toConnectMiddleware(app: Express) {
  return (req: IncomingMessage, res: ServerResponse, next: Next) => {
    const reqProto = Object.getPrototypeOf(req);
    const resProto = Object.getPrototypeOf(res);
    app(req as express.Request, res as express.Response, (err?: unknown) => {
      Object.setPrototypeOf(req, reqProto);
      Object.setPrototypeOf(res, resProto);
      next(err);
    });
  };
}
