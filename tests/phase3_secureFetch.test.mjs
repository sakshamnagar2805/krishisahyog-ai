import test from 'node:test';
import assert from 'node:assert/strict';
import {secureFetch,validateOfficialUrl} from '../server/ingestion/secureFetch.ts';
const resolve=async()=>[{address:'8.8.8.8',family:4}];
const opts={maxBytes:20};
const html=(s='hello',headers={'content-type':'text/html'})=>new Response(s,{status:200,headers});
test('only approved https host permitted',async()=>{
 await assert.rejects(validateOfficialUrl('http://www.example.gov.in/','www.example.gov.in',resolve),/INVALID_OFFICIAL_URL/);
 await assert.rejects(validateOfficialUrl('https://other.gov.in/','www.example.gov.in',resolve),/HOST_NOT_ALLOWLISTED/);
 await assert.rejects(validateOfficialUrl('https://www.example.gov.in:8080/','www.example.gov.in',resolve),/INVALID_OFFICIAL_URL/);
});
test('blocks DNS private, loopback, metadata and reserved addresses',async()=>{
 for(const ip of ['127.0.0.1','10.1.2.3','192.168.1.1','169.254.169.254','172.16.0.1','::1','fc00::1'])
   await assert.rejects(validateOfficialUrl('https://www.example.gov.in/','www.example.gov.in',async()=>[{address:ip}]),/UNSAFE_DNS_RESULT/);
});
test('accepts valid HTML response and hashes real bytes',async()=>{
 const r=await secureFetch('https://www.example.gov.in/','www.example.gov.in','HTML',opts,{resolver:resolve,fetcher:async()=>html()});
 assert.equal(r.outcome,'CHANGED');assert.equal(r.bytes.length,5);assert.equal(r.sha256.length,64);
});
test('304 is unchanged',async()=>{
 const r=await secureFetch('https://www.example.gov.in/','www.example.gov.in','HTML',opts,{resolver:resolve,fetcher:async()=>new Response(null,{status:304})});
 assert.equal(r.outcome,'NOT_MODIFIED');
});
test('blocks disallowed MIME and excessive streamed bytes',async()=>{
 await assert.rejects(secureFetch('https://www.example.gov.in/','www.example.gov.in','HTML',opts,{resolver:resolve,fetcher:async()=>new Response('{}',{headers:{'content-type':'application/json'}})}),/UNEXPECTED_CONTENT_TYPE/);
 await assert.rejects(secureFetch('https://www.example.gov.in/','www.example.gov.in','HTML',opts,{resolver:resolve,fetcher:async()=>html('A'.repeat(21))}),/OVERSIZE_CONTENT/);
});
test('does not follow redirects',async()=>{
 let redirectMode;
 await assert.rejects(secureFetch('https://www.example.gov.in/','www.example.gov.in','HTML',opts,{resolver:resolve,fetcher:async(_url,init)=>{redirectMode=init.redirect;throw Error('REDIRECT_BLOCKED');}}),/REDIRECT_BLOCKED/);
 assert.equal(redirectMode,'error');
});
test('rejects malformed PDF',async()=>{
 await assert.rejects(secureFetch('https://www.example.gov.in/doc','www.example.gov.in','DOCUMENT',opts,{resolver:resolve,fetcher:async()=>new Response('not pdf',{headers:{'content-type':'application/pdf'}})}),/MALFORMED_PDF/);
});
