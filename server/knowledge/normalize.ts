/** Normalization only, not canonical identity. Never merge schemes by alias alone. */
export function normalizeSchemeQuery(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/[\s._\-–—]+/g, ' ').replace(/\s+/g, ' ');
}
export type AliasResolution = { state:'CONFIRMED'; code:string } | { state:'AMBIGUOUS'; candidates:string[] } | { state:'UNKNOWN' };
/** Suggestions are not government facts; intentionally ambiguous user spellings remain ambiguous. */
const suggestions: Record<string,AliasResolution> = {
  'pm kisan':{state:'CONFIRMED',code:'PM_KISAN'},
  'pm kusum':{state:'CONFIRMED',code:'PM_KUSUM'},
  'pm ksy':{state:'AMBIGUOUS',candidates:['PMKSY']},
  'pm assh':{state:'AMBIGUOUS',candidates:['PM_AASHA']}
};
export function suggestSchemeAlias(query:string):AliasResolution {
  return suggestions[normalizeSchemeQuery(query)] ?? {state:'UNKNOWN'};
}
/** A jurisdiction matches only when a record is explicitly tagged with it or an ancestor. */
export function matchesJurisdiction(allowed:readonly string[], ancestry:readonly string[]):boolean {
  return allowed.some(code=>ancestry.includes(code));
}
export function isEffective(from:string|null,to:string|null,asOf:string):boolean {
  return (!from || from<=asOf) && (!to || to>=asOf);
}
