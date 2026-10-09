/**
 * Shared local configuration for CLI, dev server and production server.
 * A value already provided by the process environment always wins.
 * Local .env.local overrides .env when neither has been loaded by the shell.
 * No credentials are logged or sent to the browser.
 */
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
dotenv.config({path:resolve(root,'.env.local'),quiet:true});
dotenv.config({path:resolve(root,'.env'),quiet:true});
