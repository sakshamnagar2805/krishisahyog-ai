import '../config/loadEnv';
import {getPool,closePool} from '../db/pool';
import {evaluatePilotReadiness} from './pilotReadiness';
async function main(){
 const pool=getPool();
 const migrationRows=await pool.query<{version:string}>('SELECT version FROM schema_migrations ORDER BY version');
 const sourceRows=await pool.query<{id:string;access_policy:string;status:string;permission_reviewed_at:string|null;robots_reviewed_at:string|null;reviewed_by:string|null}>(`SELECT id,access_policy,status,permission_reviewed_at,robots_reviewed_at,reviewed_by FROM government_sources`);
 const result=evaluatePilotReadiness({migrations:migrationRows.rows.map(r=>r.version),sources:sourceRows.rows,secureEgress:process.env.INGESTION_SECURE_EGRESS==='confirmed'});
 console.log(JSON.stringify(result,null,2)); if(!result.ready)process.exitCode=2;
}
main().catch(err=>{console.error('PILOT_PREFLIGHT_FAILED:',err instanceof Error?err.message:String(err));process.exitCode=1;}).finally(closePool);
