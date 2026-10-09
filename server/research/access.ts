/** Hard gate for research preview. Production, remote access, and default installs are denied. */
export function isLocalPreviewAllowed(env:NodeJS.ProcessEnv,remoteAddress?:string,headers?:Record<string,string|string[]|undefined>){
 return env.NODE_ENV!=='production' && env.RESEARCH_PREVIEW_ENABLED==='true'
  && ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remoteAddress??'')
  && (headers===undefined || isDirectLoopbackRequest(headers));
}
const loopbackHosts=new Set(['localhost','127.0.0.1','[::1]']);
/**
 * Phase 14: a loopback socket is not enough on its own. A request relayed by a
 * reverse proxy on the same machine (X-Forwarded-For / Forwarded) or a
 * DNS-rebound browser request (Host is a public name) must not see staging data.
 */
export function isDirectLoopbackRequest(headers:Record<string,string|string[]|undefined>){
 if(headers['x-forwarded-for']!==undefined||headers['forwarded']!==undefined||headers['x-real-ip']!==undefined)return false;
 const host=typeof headers.host==='string'?headers.host.trim().toLowerCase():'';
 const name=host.startsWith('[')?host.slice(0,host.indexOf(']')+1):host.split(':')[0];
 return loopbackHosts.has(name);
}
