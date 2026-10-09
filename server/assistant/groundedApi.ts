import express from 'express';
import {GoogleGenAI} from '@google/genai';
import {getPool} from '../db/pool';
import {PublicContentRepository} from '../publicContent/repository';
import {answerGrounded,validateQuestion} from './grounded';

/**
 * Gemini 3.6+ models (e.g. gemini-3.8-flash) deprecate temperature/top_p/top_k: they are ignored today
 * and Google states future generations will reject them with HTTP 400. Only send temperature to 1.x/2.x.
 */
export function supportsSamplingParams(model:string){const m=/^gemini-(\d+)/.exec(model.trim().toLowerCase());return !m||Number(m[1])<3;}
/** Phase 14: bound Gemini latency so a stalled upstream call cannot hang the request indefinitely. */
export const GEMINI_TIMEOUT_MS=20_000;
/**
 * Phase 14: small fixed-window limiter for the anonymous /ask endpoint, protecting the server-side
 * Gemini quota during a demo. Keyed by socket address; behind a reverse proxy this is the proxy's
 * address, so a public deployment still needs an edge rate limit (see PHASE_14_SECURITY_REVIEW.md).
 */
export function createFixedWindowLimiter(limit:number,windowMs:number,now:()=>number=Date.now){
 const hits=new Map<string,{start:number;count:number}>();
 return (key:string):boolean=>{
  const t=now();
  if(hits.size>5000)for(const [k,v] of hits)if(t-v.start>=windowMs)hits.delete(k);
  const entry=hits.get(key);
  if(!entry||t-entry.start>=windowMs){hits.set(key,{start:t,count:1});return true;}
  entry.count++;return entry.count<=limit;
 };
}
/** Anonymous, read-only verified-content assistant. Never accepts research staging. */
export function createGroundedAssistantApi(options:{apiKey?:string,model?:string,askLimitPerMinute?:number}={}){
 const router=express.Router();
 const allowAsk=createFixedWindowLimiter(options.askLimitPerMinute??30,60_000);
 router.use('/api/v1/public/assistant',express.json({limit:'8kb'}));
 router.get('/api/v1/public/assistant/status',(_req,res)=>{
  const key=options.apiKey?.trim();
  res.json({modelConfigured:!!key&&!/^(MY_|YOUR_|<)/i.test(key),mode:'APPROVED_CONTENT_ONLY',voiceAvailable:false});
 });
 router.post('/api/v1/public/assistant/ask',async(req,res)=>{
  if(!allowAsk(req.socket.remoteAddress??'unknown'))return res.status(429).json({error:'RATE_LIMITED',message:'Too many questions in a short time. Please wait a minute.'});
  const {question,language='en',schemeCode}=req.body??{};
  try{validateQuestion(question,language);}catch(e){return res.status(400).json({error:(e as Error).message});}
  if(schemeCode!==undefined&&(typeof schemeCode!=='string'||!/^[A-Z][A-Z0-9_-]{2,79}$/.test(schemeCode)))
   return res.status(400).json({error:'INVALID_SCHEME_CODE'});
  const key=options.apiKey?.trim();
  const configured=!!key&&!/^(MY_|YOUR_|<)/i.test(key);
  try{
   // If there is no approved source, answerGrounded returns a factual empty
   // state even without a Gemini key. Never invoke Gemini for staging records.
   const result=await answerGrounded(new PublicContentRepository(getPool()),question,language,async(instruction,prompt)=>{
    if(!configured)throw new Error('AI_NOT_CONFIGURED');
    const client=new GoogleGenAI({apiKey:key!,httpOptions:{timeout:GEMINI_TIMEOUT_MS}});
    const model=options.model||'gemini-2.5-flash';
    const response=await client.models.generateContent({model,contents:prompt,config:{systemInstruction:instruction,...(supportsSamplingParams(model)?{temperature:0}:{})}});
    return response.text??'';
   },schemeCode);
   return res.json(result);
  }catch(e){
   if((e as Error).message==='AI_NOT_CONFIGURED')return res.status(503).json({error:'AI_NOT_CONFIGURED',message:'Configure a server-side Gemini key to answer questions about verified records.'});
   console.error('[grounded assistant] request failed',(e as Error).message);
   return res.status(503).json({error:'VERIFIED_ASSISTANCE_UNAVAILABLE',message:'Verified assistance is currently unavailable. No research or demo fallback was used.'});
  }
 });
 return router;
}
