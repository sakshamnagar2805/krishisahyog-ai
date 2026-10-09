import {Router} from 'express';
import {getPool} from '../db/pool';
import {PublicContentRepository} from '../publicContent/repository';
import {rankCandidates,validateDiscoveryQuery,type DiscoveryQuery,type SchemeCandidate} from './engine';
export function createDiscoveryApi(){
 const router=Router();
 router.get('/api/v1/public/scheme-discovery',async(req,res)=>{
  const query:DiscoveryQuery={};
  for(const key of ['search','state','district','crop','need'] as const){const v=req.query[key];if(v!==undefined){if(typeof v!=='string')return res.status(400).json({error:'INVALID_FILTER'});query[key]=v;}}
  if(req.query.landAreaHectares!==undefined){if(typeof req.query.landAreaHectares!=='string'||req.query.landAreaHectares.trim()==='')return res.status(400).json({error:'INVALID_LAND_AREA'});query.landAreaHectares=Number(req.query.landAreaHectares);}
  try{validateDiscoveryQuery(query);}catch(err){return res.status(400).json({error:(err as Error).message});}
  const limit=Number(req.query.limit??20);const offset=Number(req.query.offset??0);
  if(!Number.isInteger(limit)||limit<1||limit>50||!Number.isInteger(offset)||offset<0)return res.status(400).json({error:'INVALID_PAGINATION'});
  try{
   const repo=new PublicContentRepository(getPool());
   // Fetch approved scheme records in bounded batches. NEVER broaden geographic scope after a filter fails.
   const matches: ReturnType<typeof rankCandidates>=[];
   let cursor=0;const batchSize=100;const maxScan=1000;
   while(cursor<maxScan){
    const page=await repo.listPublished('schemes',new Date(),batchSize,cursor,{state:query.state,district:query.district});
    const converted:SchemeCandidate[]=page.items.map(item=>({id:item.id,code:item.code,title:item.title,summary:item.summary,officialUrl:item.officialUrl,verificationStatus:item.verificationStatus,evidence:item.evidence,effectiveFrom:item.effectiveFrom,effectiveTo:item.effectiveTo}));
    matches.push(...rankCandidates(converted,query));
    cursor+=page.items.length;
    if(page.items.length<batchSize)break;
   }
   matches.sort((a,b)=>b.relevance.score-a.relevance.score||a.title.localeCompare(b.title));
   return res.json({status:matches.length?'AVAILABLE':'NO_MATCHES',items:matches.slice(offset,offset+limit),total:matches.length,searchTruncated:cursor>=maxScan,assessmentType:'RELEVANCE_ONLY',message:'Only approved public scheme information is shown. Eligibility has not been certified.'});
  }catch{return res.status(503).json({status:'SOURCE_ERROR',items:[],total:0,message:'Verified scheme information is unavailable. No demo results are used.'});}
 });
 return router;
}
