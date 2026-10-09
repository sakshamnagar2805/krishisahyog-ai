/** Public government content. No demo-provider fallback. */
export interface GovernmentContentRecord {
 id:string;code:string;title:string;summary:string;authority:string;officialUrl:string;
 verificationStatus:'VERIFIED';retrievedAt:string;publishedAt?:string|null;version:number;
 effectiveFrom?:string|null;effectiveTo?:string|null;
 evidence:{sourceId:string;sourceUrl:string;documentId:string;retrievedAt:string;publishedAt:string|null;sha256:string};
}
export interface PublicCatalogResponse {
 status:'AVAILABLE'|'NO_SOURCES'|'SOURCE_ERROR'|'RESTRICTED';items:GovernmentContentRecord[];total:number;message?:string;
}
export interface PublicCatalogQuery {search?:string;state?:string;district?:string;limit?:number;offset?:number}
export async function loadPublicCatalog(kind:'schemes'|'policies',query:PublicCatalogQuery={}):Promise<PublicCatalogResponse>{
 const params=new URLSearchParams();for(const [key,value] of Object.entries(query))if(value!==undefined&&String(value).trim())params.set(key,String(value));
 const response=await fetch(`/api/v1/public/${kind}?${params}`,{headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error(`The ${kind} service is unavailable (HTTP ${response.status}).`);
 const body:unknown=await response.json();if(!body||typeof body!=='object')throw new Error('Invalid government source response.');
 const data=body as Partial<PublicCatalogResponse>;
 if(!Array.isArray(data.items)||typeof data.total!=='number'||!['AVAILABLE','NO_SOURCES','SOURCE_ERROR','RESTRICTED'].includes(data.status??''))throw new Error('Invalid government source response.');
 if(data.items.some(item=>!item||item.verificationStatus!=='VERIFIED'||!item.officialUrl?.startsWith('https://')||!item.retrievedAt||!item.evidence?.sourceUrl?.startsWith('https://')||!item.evidence?.sha256))throw new Error('Unverified government information was rejected.');
 return data as PublicCatalogResponse;
}
