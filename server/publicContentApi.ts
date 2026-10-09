import express from 'express';
import { getPool } from './db/pool';
import { PublicContentRepository } from './publicContent/repository';
export function createPublicContentApi(){
 const api=express.Router();const repository=()=>new PublicContentRepository(getPool());
 api.get('/api/v1/public/status',async(_req,res)=>{try {const s=await repository().getStatus();res.json({status:'AVAILABLE',sourceCount:s.source_count,publishedSchemeVersions:s.approved_scheme_versions,publishedPolicyVersions:s.approved_policy_versions});}catch{res.status(503).json({status:'NOT_CONFIGURED',message:'Government data repository unavailable.'});}});
 for(const kind of ['schemes','policies'] as const){api.get(`/api/v1/public/${kind}`,async(req,res)=>{
  const limit=Number(req.query.limit??50),offset=Number(req.query.offset??0);
  const search=typeof req.query.search==='string'?req.query.search:'',state=typeof req.query.state==='string'?req.query.state:'',district=typeof req.query.district==='string'?req.query.district:'';
  if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||search.length>120||state.length>30||district.length>30)return res.status(400).json({error:'INVALID_FILTER'});
  try{return res.json(await repository().listPublished(kind,new Date(),limit,offset,{search,state,district}));}
  catch{return res.status(503).json({status:'SOURCE_ERROR',items:[],total:0,message:'Verified government information is temporarily unavailable.'});}
 });}
 api.use('/api/v1/admin',(_req,res)=>res.status(401).json({error:'AUTHENTICATION_REQUIRED'}));
 api.use('/api/v1/private',(_req,res)=>res.status(401).json({error:'AUTHENTICATION_REQUIRED'}));
 return api;
}
