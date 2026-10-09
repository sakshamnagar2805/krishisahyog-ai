/**
 * KrishiSahyog AI - Core Domain Types
 * SIH 2026 Problem Statement 26088
 * 
 * Strict architectural rule:
 * Every demo record includes `isDemo: true` to clearly distinguish
 * guidance simulation from statutory government registers.
 */

export type UserRole = 'farmer' | 'pacs' | 'officer' | 'admin';

export type LanguageCode = 'en' | 'hi' | 'pa' | 'mr' | 'gu' | 'te' | 'ta' | 'bn' | 'kn';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'ACTION_REQUIRED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'MISSING'
  | 'AVAILABLE'
  | 'DEMO'
  | 'INVALID'
  | 'UNVERIFIED'
  | 'UNKNOWN';

export interface BaseCivicRecord {
  isDemo: true;
  source?: string;
  authority?: string;
  lastVerified?: string;
  verificationStatus?: VerificationStatus;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  badgeId: string;
  jurisdiction: string;
  location?: string;
  preferredLanguage?: LanguageCode;
  avatarUrl?: string;
  designation?: string;
  phone?: string;
  isDemo: boolean;
}

export interface LandHolding {
  khasraNo: string;
  khewatNo: string;
  khatoniNo: string;
  areaAcres: number;
  village: string;
  district: string;
  cropSown: string;
  sowingDate: string;
  irrigationType: string;
}

export interface Farmer extends BaseCivicRecord {
  id: string;
  name: string;
  fatherName: string;
  village: string;
  district: string;
  state: string;
  pacsMembershipId: string;
  pacsSocietyName: string;
  totalLandAcres: number;
  khasraPlots: LandHolding[];
  aadhaarMasked: string;
  aadhaarSeeded: boolean;
  bankAccountMasked: string;
  bankName: string;
  ifscMasked: string;
  dbtActive: boolean;
  kccLimit: number;
  kccAvailableBalance: number;
  primaryCrop?: string;
  activeClaimId?: string;
  activeGrievanceId?: string;
}

export interface ClaimTimelineEvent {
  step: number;
  title: string;
  description: string;
  date: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  officerNotes?: string;
}

export interface RequiredAction {
  id: string;
  title: string;
  description: string;
  status: 'ACTION_REQUIRED' | 'COMPLETED' | 'IN_REVIEW';
  actionType: 'UPLOAD' | 'VISIT_PORTAL' | 'VISIT_OFFICE' | 'VERIFY_IDENTITY';
  portalUrl?: string;
  patwariStepGuide?: string[];
}

export type PMFBYClaimStatus =
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'UNDER REVIEW'
  | 'ADDITIONAL INFORMATION REQUIRED'
  | 'RESOLVED'
  | 'CLOSED';

export interface PMFBYClaimDocument {
  id: string;
  name: string;
  docType: Document['docType'];
  status: 'AVAILABLE' | 'MISSING' | 'INVALID / EXPIRED' | 'PENDING_REVIEW';
  whyRequired: string;
  issueAuthority?: string;
  referenceNo?: string;
}

export interface PMFBYClaim extends BaseCivicRecord {
  id: string;
  claimId: string;
  policyId: string;
  claimApplicationNo: string;
  policyNo: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  variety: string;
  season: string;
  year: number;
  state: string;
  district: string;
  status: PMFBYClaimStatus;
  submissionDate: string;
  lastUpdated: string;
  nextAction: string;
  plotKhasra: string;
  surveyParcelSizeAcres: number;
  sumInsured: number;
  premiumFarmerPaid: number;
  premiumSubsidyStateGovt: number;
  premiumSubsidyCentralGovt: number;
  calamityType: 'HAILSTORM' | 'INUNDATION' | 'DROUGHT' | 'PEST_ATTACK';
  calamityDate: string;
  intimationDate: string;
  hoursElapsedSinceCalamity: number;
  isWithin72Hours: boolean;
  assessedLossPercent: number;
  indicativeEntitlementRupees: number;
  statutoryClause: string;
  documents?: PMFBYClaimDocument[];
  inspectionEvidencePhotos: {
    id: string;
    url: string;
    caption: string;
    gpsCoordinates: string;
    timestamp: string;
  }[];
  timeline: ClaimTimelineEvent[];
  requiredActions: RequiredAction[];
  designatedOfficer: {
    name: string;
    designation: string;
    block: string;
    officeAddress: string;
    helplinePhone: string;
  };
}

export type GrievanceCategory =
  | 'PMFBY / Crop Insurance'
  | 'PACS Service'
  | 'Government Scheme'
  | 'Agriculture Support'
  | 'Credit Assistance'
  | 'Documents'
  | 'Other';

export type GrievanceStatus =
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'UNDER REVIEW'
  | 'ADDITIONAL INFORMATION REQUIRED'
  | 'FORWARDED'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CLOSED';

export interface GrievanceAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  isDemo: true;
}

export interface GrievanceTimelineStep {
  date: string;
  status: GrievanceStatus;
  stage: string;
  notes: string;
  officer?: string;
  completed: boolean;
}

export interface Grievance extends BaseCivicRecord {
  id: string;
  grievanceId: string;
  ticketId?: string;
  farmerId: string;
  farmerName: string;
  category: GrievanceCategory | string;
  subCategory?: string;
  subject: string;
  description: string;
  attachments?: GrievanceAttachment[];
  status: GrievanceStatus;
  createdAt: string;
  updatedAt: string;
  lodgedDate?: string;
  targetResolutionDate?: string;
  slaDaysRemaining?: number;
  currentTier?: string;
  assignedTo?: string;
  reviewingOfficer?: {
    name: string;
    designation: string;
    office: string;
    phone: string;
    contact?: string;
  };
  timeline: GrievanceTimelineStep[];
  relatedClaimId?: string;
  relatedPACSServiceRequestId?: string;
  relatedDocumentId?: string;
  relatedDocumentName?: string;
  actionRequiredNotes?: string;
  resolutionNotes?: string;
  rejectionReason?: string;
  cpramsRefNo?: string;
  resolutionStatus?: 'UNDER_INQUIRY' | 'ACTION_INITIATED' | 'RESOLVED' | 'ESCALATED';
  source: string;
  authority?: string;
  officialPortalUrl?: string;
  officialPortalName?: string;
  lastVerified?: string;
  verificationStatus?: VerificationStatus;
  isDemo: true;
}

export interface SchemeBenefit {
  label: string;
  value: string;
  isIllustrativeDemo?: boolean;
  type?: string;
}

export type SchemeValidityStatus = 'CURRENT' | 'SUPERSEDED' | 'EXPIRED' | 'DRAFT' | 'UNKNOWN';

export interface SchemeRequiredDocument {
  docType: string;
  title: string;
  whyRequired: string;
}

export interface SchemeWhereToApply {
  authority: string;
  channel: string;
  officeInfo?: string;
}

export interface SchemeOfficialPortal {
  name: string;
  url?: string;
  isConfigured: boolean;
}

export interface SchemeSourceInfo {
  authority: string;
  documentTitle: string;
  sectionOrPage?: string;
  version?: string;
  publicationDate?: string;
  effectiveDate?: string;
  lastVerified: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN' | 'DEMO';
}

export interface Scheme extends BaseCivicRecord {
  id: string;
  name: string;
  code?: string;
  shortDescription?: string;
  summary: string;
  category: 'FINANCIAL' | 'SUBSIDY' | 'INFRASTRUCTURE' | 'INSURANCE' | 'SOLAR' | 'CREDIT' | 'INPUT_SUBSIDY' | 'EQUIPMENT';
  authority: string;
  ministry?: string;
  governingMinistry?: string;
  applicableStates: string[];
  applicableDistricts?: string[];
  applicableCrops: string[];
  eligibilityGuidance: string;
  eligibilityDescription?: string;
  eligibilityCriteria?: string[];
  benefits: SchemeBenefit[];
  requiredDocuments: SchemeRequiredDocument[];
  applicationProcess: string[];
  whereToApply: SchemeWhereToApply;
  officialPortal?: SchemeOfficialPortal;
  officialPortalUrl?: string;
  sourceInfo?: SchemeSourceInfo;
  version: string;
  publicationDate?: string;
  effectiveDate?: string;
  lastVerified: string;
  validityStatus: SchemeValidityStatus;
  verificationStatus: VerificationStatus;
  isDemo: true;
  eligibleCriteria?: {
    maxLandAcres?: number;
    requiredCrop?: string[];
    aadhaarSeededMandatory?: boolean;
    dbtMandatory?: boolean;
  };
  isEligibleForCurrentFarmer?: boolean;
  isEligible?: boolean;
  status?: string;
  applicationDeadline?: string;
}

export interface SchemeDiscoveryInputs {
  state: string;
  district: string;
  crop: string;
  landCategory: 'Small' | 'Marginal' | 'Medium' | 'Large' | 'Not specified';
  landAreaAcres: number;
  landOwnership: 'Owned' | 'Leased' | 'Other' | 'Not specified';
  farmerProfile?: {
    name: string;
    state: string;
    district: string;
    language: string;
    role: string;
  };
}

export interface MatchedSchemeResult {
  scheme: Scheme;
  relevanceReasons: string[];
  eligibilityGuidance: string;
  documentReadiness: {
    required: SchemeRequiredDocument[];
    available: { docType: string; title: string }[];
    /** documentId is set when a locker record exists but is not yet usable */
    missing: { docType: string; title: string; whyRequired: string; documentId?: string }[];
    invalidOrExpired: { docType: string; title: string }[];
  };
  missingInfoForFullAssessment?: string[];
}

export type DocumentStatus =
  | 'AVAILABLE'
  | 'MISSING'
  | 'INVALID'
  | 'EXPIRED'
  | 'PENDING_REVIEW'
  | 'NOT_REQUIRED';

export type DocumentCategory =
  | 'IDENTITY'
  | 'FINANCIAL'
  | 'LAND_REVENUE'
  | 'CROP_AFFIDAVIT'
  | 'SOIL_HEALTH'
  | 'GENERAL';

export interface Document extends BaseCivicRecord {
  id: string;
  farmerId: string;
  title: string;
  name?: string;
  category?: DocumentCategory | string;
  status?: DocumentStatus;
  documentType?: string;
  docType: 'AADHAAR' | 'JAMABANDI' | 'SOWING_CERTIFICATE' | 'BANK_PASSBOOK' | 'SOIL_HEALTH_CARD';
  description?: string;
  whyRequired?: string;
  issuingAuthority?: string;
  issuer?: string;
  whereToObtain?: string;
  submissionProcess?: string;
  docReferenceMasked: string;
  issueDate: string;
  expiryDate?: string;
  lastChecked?: string;
  lastVerified?: string;
  relatedClaimId?: string;
  isDemo: true;
  source: string;
  verificationStatus: VerificationStatus;
  officialPortalUrl?: string;
  officialPortalName?: string;
  digiLockerDocId?: string;
  fileSizeBytes: number;
  format: 'PDF' | 'JPG' | 'PNG';
  isBlockerForClaim: boolean;
  verificationHashSha256: string;
  sourceAuthority?: string;
  sourceDocument?: string;
  sourceSection?: string;
  sourceVersion?: string;
  sourceLastVerified?: string;
  sourceStatus?: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN' | 'DEMO';
}

export interface FertilizerItem {
  id: string;
  name: string;
  totalSeasonalQuotaBags: number;
  bagsCollected: number;
  bagsAvailable: number;
  pricePerBagSubsidized: number;
  activeTokenNumber?: string;
  tokenExpiryHours?: number;
}

export type PACSServiceCategory =
  | 'MEMBERSHIP'
  | 'AGRICULTURAL INPUTS'
  | 'CREDIT ASSISTANCE'
  | 'EQUIPMENT'
  | 'STORAGE'
  | 'INFORMATION'
  | string;

export interface PACSService extends BaseCivicRecord {
  id: string;
  name: string;
  shortDescription: string;
  category: PACSServiceCategory;
  description: string;
  authority: string;
  serviceType: string;
  applicableStates?: string[];
  applicableDistricts?: string[];
  requiredDocuments: string[];
  eligibilityGuidance?: string;
  processSteps: string[];
  whereToApply?: string;
  officialPortal?: string;
  officialSource?: string;
  source?: string;
  version?: string;
  publicationDate?: string;
  effectiveDate?: string;
  lastVerified?: string;
  verificationStatus: VerificationStatus;
  isDemo: true;

  // Society-specific and operational fields for backwards compatibility
  societyName?: string;
  societyRegistrationNo?: string;
  block?: string;
  district?: string;
  memberId?: string;
  secretaryName?: string;
  helpline?: string;
  fertilizers?: FertilizerItem[];
  kccSubventionPercent?: number;
  kccLimitRupees?: number;
  kccDrawnRupees?: number;
  kccRenewalDueDate?: string;
  customHiringMachinery?: {
    id: string;
    machineryName: string;
    rentalRatePerHour: number;
    availabilityStatus: 'AVAILABLE' | 'ENGAGED' | 'MAINTENANCE';
  }[];
  announcements?: {
    id: string;
    title: string;
    date: string;
    priority: 'HIGH' | 'NORMAL';
  }[];
}

export type PACSServiceRequestStatus =
  | 'DRAFT'
  | 'DEMO_REQUEST_CREATED'
  | 'INFORMATION_REQUIRED'
  | 'GUIDANCE_PROVIDED'
  | 'CLOSED';

export interface PACSServiceRequestTimelineStep {
  date: string;
  status: PACSServiceRequestStatus;
  title: string;
  description: string;
  actor?: string;
  isDemoEvent: true;
}

export interface PACSServiceRequest extends BaseCivicRecord {
  id: string; // e.g. 'DEMO-PACS-REQ-2026-001'
  serviceId: string;
  serviceName: string;
  farmerId: string;
  farmerName: string;
  category: string;
  subject: string;
  description?: string;
  status: PACSServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
  requiredDocuments: string[];
  relatedDocumentIds?: string[];
  relatedGrievanceId?: string;
  actionRequired?: string;
  timeline: PACSServiceRequestTimelineStep[];
  isDemo: true;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'STATUTORY_ALERT' | 'CLAIM_UPDATE' | 'PACS_QUOTA' | 'PACS_REQUEST' | 'GRIEVANCE_SLA' | 'WEATHER_ADVISORY';
  timestamp: string;
  isUrgent: boolean;
  read: boolean;
  actionRoute?: string;
  isDemo: true;
}

export interface GovernmentSource extends BaseCivicRecord {
  id: string;
  authorityName: string;
  department: string;
  domainUrl: string;
  jurisdiction: 'CENTRAL' | 'STATE_RAJASTHAN' | 'STATE_PUNJAB' | 'STATE_HARYANA' | 'INTER_STATE';
  category: 'CROP_INSURANCE' | 'COOPERATIVE_CREDIT' | 'INPUT_SUBSIDY' | 'GRIEVANCE_PORTAL';
  tlsStatus: 'TLS_1_3_STRICT' | 'TLS_1_2_VALID';
  policyCount: number;
  lastScrapedOrSynced: string;
  syncIntervalMinutes: number;
  syncHealth: 'OPTIMAL' | 'DEGRADED' | 'CHECKING';
  gazetteNoticeRef: string;
}

export interface Policy extends BaseCivicRecord {
  id: string;
  sourceId: string;
  title: string;
  documentNumber: string;
  gazetteVolumeNo?: string;
  effectiveDate: string;
  applicableStates: string[];
  keyClauses: {
    clauseNumber: string;
    title: string;
    summary: string;
    officialText: string;
  }[];
  sha256Checksum: string;
  downloadUrl: string;
}

export interface AICitation {
  governingAuthority: string;
  documentTitle: string;
  clauseReference: string;
  officialGazetteUrl?: string;
  digitalChecksumSha256: string;
  confidenceScore: number;
}

export interface AIResponse {
  id: string;
  query: string;
  language: LanguageCode;
  intent: string;
  verifiedAnswer: string;
  statutoryCitations: AICitation[];
  actionRecommendation?: string;
  suggestedActionRoute?: string;
  suggestedActionLabel?: string;
  audioPlaybackSupported: boolean;
  audioDialectText?: {
    punjabi?: string;
    hindi?: string;
    english?: string;
  };
  isDemo: true;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actionType:
    | 'SOURCE_INGESTION'
    | 'OFFICER_SIGN_OFF'
    | 'CLAIM_VERIFICATION'
    | 'SOWING_PROOF_RECONCILE'
    | 'SYSTEM_FAILSAFE'
    | 'GRIEVANCE_LODGED'
    | 'PACS_REQUEST_CREATED'
    | 'PACS_STATUS_UPDATED';
  initiatorRole: UserRole;
  initiatorBadge: string;
  description: string;
  documentHashSha256: string;
  dscSignatureStatus: 'VALID_DSC' | 'SYSTEM_AUTOMATED' | 'AWAITING_PIN' | 'OPERATOR_SIMULATION';
  isDemo: true;
}

export interface AdminMetric {
  sourcesTracked: number;
  schemesIndexed: number;
  policyFreshnessPercent: number;
  unverifiedCitationsCount: number;
  totalAuditEvents: number;
  pipelineHealth: 'ALL_PIPELINES_OPERATIONAL' | 'DEGRADED_CIRCUIT_ACTIVE';
  vectorDbStatus: 'SYNCED_PB_01' | 'REINDEXING';
  zeroPiiEnforced: boolean;
  isDemo: true;
}
