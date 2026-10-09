/**
 * Phase 14: cross-platform production build (Windows PowerShell, cmd, Linux, macOS).
 *
 * Why this exists: Vite honours NODE_ENV from .env / .env.local. Phase 13 docs told
 * users to put NODE_ENV=development in .env.local, which made `vite build` emit a
 * DEVELOPMENT bundle (import.meta.env.DEV === true, React dev runtime). Forcing
 * NODE_ENV=production before Vite resolves its config guarantees a real production
 * bundle, and the verifier below fails the build if demo code or the dev runtime leaks in.
 */
import {verifyProductionBundle} from './verify-production-bundle.mjs';

process.env.NODE_ENV = 'production';
const {build} = await import('vite');
await build({mode: 'production'});
const result = verifyProductionBundle('dist');
console.log(JSON.stringify(result, null, 2));
if (!result.ok) {
  console.error('PRODUCTION_BUNDLE_VERIFICATION_FAILED');
  process.exitCode = 1;
}
