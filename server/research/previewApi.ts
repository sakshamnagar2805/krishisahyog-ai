import express from 'express';
import {getPool} from '../db/pool';
import {recordForPreview,type ResearchRecord} from './model';
import {isLocalPreviewAllowed} from './access';

/** Local, opt-in editorial preview, NOT a production/public verified catalog. */
export function createResearchPreviewApi(){
 const api=express.Router();
 api.get('/api/v1/internal/research-preview',async(req,res)=>{
  if(!isLocalPreviewAllowed(process.env,req.socket.remoteAddress,req.headers))return res.status(404).json({error:'NOT_FOUND'});
  try{
   const result=await getPool().query(`SELECT code,name,category,authority,geographic_scope,summary,eligibility_summary,
     farmer_action,official_primary_source,official_secondary_source,research_checked_on,research_status,production_status,
     review_notes,false AS personal_data_included
     FROM research_catalog_records ORDER BY name LIMIT 100`);
   const items=result.rows.map(r=>recordForPreview({...r,research_checked_on:new Date(r.research_checked_on).toISOString().slice(0,10)} as ResearchRecord));
   return res.json({mode:'LOCAL_RESEARCH_PREVIEW',verified:false,officialApproval:false,total:items.length,items,
    disclaimer:'Research summaries only. No verified scheme eligibility, current subsidy, application window, or official approval is established.'});
  }catch{return res.status(503).json({mode:'LOCAL_RESEARCH_PREVIEW',items:[],error:'STAGING_DATABASE_UNAVAILABLE'});}
 });
 return api;
}
