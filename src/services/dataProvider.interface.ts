import {
  Farmer,
  PMFBYClaim,
  Grievance,
  PACSService,
  PACSServiceRequest,
  PACSServiceRequestStatus,
  Document,
  Scheme,
  Notification,
  GovernmentSource,
  Policy,
  AuditLog,
  AdminMetric,
  AIResponse,
  LanguageCode,
} from '../types';

/**
 * Civic Data Provider Interface
 * Clean architectural abstraction enabling seamless transition from
 * controlled demo data to authenticated government APIs when available.
 */
export interface IDataProvider {
  getFarmerProfile(farmerId?: string): Promise<Farmer>;
  getClaims(farmerId?: string): Promise<PMFBYClaim[]>;
  getClaimById(claimId: string): Promise<PMFBYClaim | null>;
  getGrievances(farmerId?: string): Promise<Grievance[]>;
  getGrievanceById(grievanceId: string): Promise<Grievance | null>;
  createDemoGrievance(data: Partial<Grievance>): Promise<Grievance>;
  getPACSService(societyId?: string): Promise<PACSService>;
  getPACSServices(): Promise<PACSService[]>;
  getPACSServiceById(serviceId: string): Promise<PACSService | null>;
  getPACSRequests(farmerId?: string): Promise<PACSServiceRequest[]>;
  getPACSRequestById(requestId: string): Promise<PACSServiceRequest | null>;
  createDemoPACSRequest(data: Partial<PACSServiceRequest>): Promise<PACSServiceRequest>;
  updateDemoPACSRequestStatus(
    requestId: string,
    status: PACSServiceRequestStatus,
    notes?: string
  ): Promise<PACSServiceRequest>;
  getDocuments(farmerId?: string): Promise<Document[]>;
  getSchemes(): Promise<Scheme[]>;
  getNotifications(): Promise<Notification[]>;
  getGovernmentSources(): Promise<GovernmentSource[]>;
  getPolicies(): Promise<Policy[]>;
  getAuditLogs(): Promise<AuditLog[]>;
  getAdminMetrics(): Promise<AdminMetric>;
  queryAI(query: string, language: LanguageCode): Promise<AIResponse>;
  uploadDocument(
    farmerId: string,
    docType: Document['docType'],
    file: { name: string; size: number; type?: string; sha256?: string }
  ): Promise<Document>;
  resolveClaimAction(claimId: string, actionId: string): Promise<PMFBYClaim>;
}
