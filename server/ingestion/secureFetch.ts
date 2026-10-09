import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';

export type FetchMode = 'HTML' | 'DOCUMENT' | 'DATASET';
export type FetchResult = { outcome:'CHANGED'|'NOT_MODIFIED'; status:number; bytes?:Uint8Array; sha256?:string; etag?:string|null; lastModified?:string|null; contentType?:string|null };

function publicAddress(ip:string): boolean {
  if (isIP(ip)===4) {
    const p=ip.split('.').map(Number);
    return !(p[0]===0||p[0]===10||p[0]===127||p[0]>=224||p[0]===169&&p[1]===254||p[0]===172&&p[1]>=16&&p[1]<=31||p[0]===192&&p[1]===168||p[0]===100&&p[1]>=64&&p[1]<=127||p[0]===192&&p[1]===0||p[0]===198&&[18,19].includes(p[1])||p[0]===198&&p[1]===51&&p[2]===100||p[0]===203&&p[1]===0&&p[2]===113);
  }
  if (isIP(ip)===6) {
    const v=ip.toLowerCase();
    return !(v==='::'||v==='::1'||v.startsWith('fc')||v.startsWith('fd')||v.startsWith('fe8')||v.startsWith('fe9')||v.startsWith('fea')||v.startsWith('feb')||v.startsWith('ff')||v.startsWith('2001:db8')||v.startsWith('::ffff:'));
  }
  return false;
}

export async function validateOfficialUrl(raw:string, expectedHostname:string, resolver:typeof lookup=lookup):Promise<URL> {
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash) throw new Error('INVALID_OFFICIAL_URL');
  if(u.hostname.toLowerCase()!==expectedHostname.toLowerCase()||isIP(u.hostname)||!u.hostname.includes('.')) throw new Error('HOST_NOT_ALLOWLISTED');
  const results=await resolver(u.hostname,{all:true,verbatim:true}) as Array<{address:string}>;
  if(!results.length||results.some(x=>!publicAddress(x.address))) throw new Error('UNSAFE_DNS_RESULT');
  return u;
}

// redirect:'error' prevents redirecting to an unreviewed domain. Public production fetching
// must additionally be routed via egress controls / a DNS-pinned proxy against rebinding.
export async function secureFetch(raw:string, host:string, mode:FetchMode, options:{maxBytes:number;etag?:string|null;lastModified?:string|null;timeoutMs?:number}, deps:{fetcher?:typeof fetch;resolver?:typeof lookup}={}):Promise<FetchResult> {
  const url=await validateOfficialUrl(raw,host,deps.resolver);
  const accept=mode==='HTML'?'text/html,application/xhtml+xml':mode==='DOCUMENT'?'application/pdf,text/plain':'text/csv,application/json,application/xml,text/xml';
  const headers:Record<string,string>={Accept:accept,'User-Agent':'KrishiSahyogSourceBot/1.0 (+contact required in deployment config)'};
  if(options.etag) headers['If-None-Match']=options.etag;
  if(options.lastModified) headers['If-Modified-Since']=options.lastModified;
  const response=await (deps.fetcher??fetch)(url,{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(options.timeoutMs??12000)});
  if(response.status===304) return {outcome:'NOT_MODIFIED',status:304};
  if(!response.ok) throw new Error(`HTTP_${response.status}`);
  const mime=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  const allowed=mode==='HTML'?['text/html','application/xhtml+xml']:mode==='DOCUMENT'?['application/pdf','text/plain']:['text/csv','application/json','application/xml','text/xml'];
  if(!allowed.includes(mime)) {await response.body?.cancel();throw new Error('UNEXPECTED_CONTENT_TYPE');}
  const stated=Number(response.headers.get('content-length')||0);
  if(stated>options.maxBytes){await response.body?.cancel();throw new Error('OVERSIZE_CONTENT');}
  if(!response.body) throw new Error('EMPTY_RESPONSE_BODY');
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let length=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>options.maxBytes)throw new Error('OVERSIZE_CONTENT');chunks.push(value);}} finally {await reader.cancel().catch(()=>{});}
  const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
  if(!length) throw new Error('EMPTY_RESPONSE_BODY');
  if(mode==='DOCUMENT'&&mime==='application/pdf'&&new TextDecoder('ascii').decode(bytes.subarray(0,5))!=='%PDF-')throw new Error('MALFORMED_PDF');
  return {outcome:'CHANGED',status:response.status,bytes,sha256:createHash('sha256').update(bytes).digest('hex'),etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified'),contentType:mime};
}
