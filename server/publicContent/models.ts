/** Real government information types; intentionally independent of demo BaseCivicRecord. */
export type VerificationStatus = 'DRAFT'|'PENDING'|'APPROVED'|'REJECTED'|'SUPERSEDED';
export interface VerifiedSourceEvidence {
  sourceId: string; sourceUrl: string; documentId: string;
  retrievedAt: string; publishedAt: string|null; sha256: string;
}
export interface PublishedContent {
  id: string; code: string; title: string; summary: string;
  version: number; effectiveFrom: string|null; effectiveTo: string|null;
  verificationStatus: 'VERIFIED'; authority: string; officialUrl: string; retrievedAt: string; publishedAt: string|null; evidence: VerifiedSourceEvidence;
}
export interface PublicCatalogResult {
  status: 'AVAILABLE'|'NO_SOURCES'|'ERROR';
  items: PublishedContent[]; total: number; message?: string;
}
