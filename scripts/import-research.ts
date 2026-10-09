/** CLI for the previously researched official-source metadata, never an authorization or approval. */
import '../server/config/loadEnv';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateResearchDataset} from '../server/research/model';
import {closePool,getPool} from '../server/db/pool';
import {importResearchDataset} from '../server/research/import';

async function main(){
 const args=process.argv.slice(2);
 const dryRun=args.includes('--dry-run');
 const file=args.find(x=>!x.startsWith('--'))??'data/research/government_scheme_research.json';
 const data=validateResearchDataset(JSON.parse(await readFile(resolve(file),'utf8')));
 if(dryRun){console.log(JSON.stringify({status:'VALID_RESEARCH_ONLY',records:data.records.length,approved:0,schemeCodes:data.records.map(x=>x.code)},null,2));return;}
 console.log(JSON.stringify(await importResearchDataset(getPool(),data),null,2));
}
main().catch(err=>{console.error('RESEARCH_IMPORT_FAILED:',err instanceof Error?err.message:String(err));process.exitCode=1;}).finally(closePool);
