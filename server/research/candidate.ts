/** Enforce a source match before turning a local research row into a draft. Never approves. */
export function validateCandidateSource(params:{researchPrimary:string;researchSecondary:string;documentUrl:string;accessPolicy:string;sourceStatus:string;documentAccess:string;passages:number}){
 const {researchPrimary,researchSecondary,documentUrl,accessPolicy,sourceStatus,documentAccess,passages}=params;
 if(accessPolicy!=='PERMITTED'||sourceStatus!=='ACTIVE'||documentAccess!=='PUBLIC'||passages<1)throw new Error('OFFICIAL_EVIDENCE_NOT_READY');
 const norm=(value:string)=>{const u=new URL(value);if(u.protocol!=='https:')throw new Error('INVALID_OFFICIAL_URL');return u.hostname.toLowerCase();};
 const documentHost=norm(documentUrl);
 if(![researchPrimary,researchSecondary].some(x=>norm(x)===documentHost))throw new Error('DOCUMENT_HOST_DOES_NOT_MATCH_RESEARCH');
 return true;
}
