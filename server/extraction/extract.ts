import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

export type DocumentKind='SCHEME'|'POLICY'|'GUIDELINE'|'NOTIFICATION'|'CIRCULAR'|'GAZETTE'|'FAQ'|'PRESS_RELEASE'|'ADVISORY'|'UNKNOWN';
export type ExtractionState='EXTRACTED'|'NO_TEXT'|'SCANNED_OR_IMAGE_ONLY'|'PARSER_ERROR'|'AMBIGUOUS';
export type Evidence={location:string;startOffset:number;endOffset:number;originalText:string};
export type Candidate={field:'benefit'|'eligibility'|'exclusion'|'documents'|'application'|'effective_date'|'publication_date'|'amendment'|'region';value:string;evidenceIndex:number;confidence:'LOW';};
export type Extraction={state:ExtractionState;kind:DocumentKind;title:string|null;language:'hi'|'en'|'mixed'|'unknown';passages:Evidence[];candidates:Candidate[];error?:string};
const clean=(s:string)=>s.replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();
const decode=(s:string)=>s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#(\d+)|#x([0-9a-f]+));/gi,(m,d,h)=> {const v=m.toLowerCase();if(d||h){const n=parseInt(d||h,d?10:16);return n>0&&n<=0x10ffff?String.fromCodePoint(n):m;}return ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '} as Record<string,string>)[v]??m;});
function classify(text:string):DocumentKind {const s=text.slice(0,5000).toLowerCase();if(/gazette of india|राजपत्र/.test(s))return 'GAZETTE';if(/amendment|संशोधन/.test(s))return 'NOTIFICATION';if(/press release|press information bureau|प्रेस विज्ञप्ति/.test(s))return 'PRESS_RELEASE';if(/circular|परिपत्र/.test(s))return 'CIRCULAR';if(/notification|अधिसूचना/.test(s))return 'NOTIFICATION';if(/guideline|दिशानिर्देश/.test(s))return 'GUIDELINE';if(/frequently asked questions|faq/.test(s))return 'FAQ';if(/advisory|परामर्श/.test(s))return 'ADVISORY';if(/scheme|योजना/.test(s))return 'SCHEME';if(/policy|नीति/.test(s))return 'POLICY';return 'UNKNOWN';}
function parseTextPages(pages:string[]):Extraction {
 const passages:Evidence[]=[];const candidates:Candidate[]=[];let hi=false,en=false;
 for(let p=0;p<pages.length;p++){
  let offset=0;
  for(const raw of pages[p].split(/\r?\n/)){
   const line=clean(raw);const start=offset;offset+=raw.length+1;
   if(!line||line.length<4)continue;
   if(/[\u0900-\u097f]/.test(line))hi=true;if(/[a-zA-Z]/.test(line))en=true;
   const idx=passages.push({location:`page:${p+1}/line:${passages.filter(x=>x.location.startsWith(`page:${p+1}/`)).length+1}`,startOffset:start,endOffset:start+raw.length,originalText:raw})-1;
   if(line.length>1200)continue;
   const matchers:[Candidate['field'],RegExp][]=[['benefit',/\b(?:benefit|subsidy|assistance|financial support)\b|लाभ|सब्सिडी/i],['eligibility',/\b(?:eligibility|eligible)\b|पात्रता/i],['exclusion',/\b(?:exclusion|ineligible)\b|अपात्र/i],['documents',/\b(?:documents? required|required documents?)\b|आवश्यक दस्तावेज/i],['application',/\b(?:how to apply|apply online|application process)\b|आवेदन प्रक्रिया/i],['effective_date',/\b(?:effective from|with effect from)\b|प्रभावी तिथि/i],['publication_date',/\b(?:dated|date of issue)\b|जारी दिनांक/i],['amendment',/\b(?:amendment|supersede|revised guidelines)\b|संशोधन/i],['region',/\b(?:applicable in|state of|district of)\b|राज्य में लागू/i]];
   for(const [field,re] of matchers)if(re.test(line))candidates.push({field,value:line,evidenceIndex:idx,confidence:'LOW'});
  }
 }
 const title=passages.find(x=>x.originalText.trim().length>=7)?.originalText.trim().slice(0,300)??null;
 return {state:passages.length?'EXTRACTED':'NO_TEXT',kind:classify(pages.join('\n')),title,language:hi?(en?'mixed':'hi'):(en?'en':'unknown'),passages,candidates};
}
export function extractDocument(bytes:Uint8Array,mime:string):Extraction {
 try {
  if(mime==='text/html'||mime==='application/xhtml+xml'){
   const html=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   const plain=decode(html.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ').replace(/<\/(?:p|div|li|h[1-6]|tr|section|article)>/gi,'\n').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,' '));
   return parseTextPages([plain]);
  }
  if(mime==='text/plain')return parseTextPages([new TextDecoder('utf-8',{fatal:true}).decode(bytes)]);
  if(mime==='application/pdf'){
   if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return {state:'PARSER_ERROR',kind:'UNKNOWN',title:null,language:'unknown',passages:[],candidates:[],error:'INVALID_PDF_HEADER'};
   const dir=mkdtempSync(join(tmpdir(),'ks-pdf-'));
   try{const path=join(dir,'document.pdf');writeFileSync(path,bytes);const output=execFileSync('pdftotext',['-layout',path,'-'],{timeout:15000,maxBuffer:8*1024*1024,encoding:'utf8'});const result=parseTextPages(output.split('\f').filter((p,i,a)=>p.trim()||i<a.length-1));return result.state==='NO_TEXT'?{...result,state:'SCANNED_OR_IMAGE_ONLY'}:result;}finally{rmSync(dir,{recursive:true,force:true});}
  }
  return {state:'PARSER_ERROR',kind:'UNKNOWN',title:null,language:'unknown',passages:[],candidates:[],error:'UNSUPPORTED_MIME'};
 }catch(e){return {state:'PARSER_ERROR',kind:'UNKNOWN',title:null,language:'unknown',passages:[],candidates:[],error:e instanceof Error?e.message:'EXTRACTION_FAILED'};}
}
