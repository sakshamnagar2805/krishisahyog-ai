import { IDataProvider } from './dataProvider.interface';
import {
  demoFarmer,
  demoClaims,
  demoGrievances,
  demoPACSService,
  demoPACSServices,
  demoPACSRequests,
  demoDocuments,
  demoSchemes,
  demoNotifications,
  demoGovernmentSources,
  demoPolicies,
  demoAIResponses,
  demoAuditLogs,
  demoAdminMetrics,
} from '../data/demo';
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

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * In-Memory Demo Data Provider
 * Simulates low-latency backend responses using verified statutory dummy data.
 * All records strictly stamped with isDemo: true.
 */
class DemoDataProvider implements IDataProvider {
  private farmer: Farmer = { ...demoFarmer };
  private claims: PMFBYClaim[] = JSON.parse(JSON.stringify(demoClaims));
  private grievances: Grievance[] = JSON.parse(JSON.stringify(demoGrievances));
  private pacs: PACSService = JSON.parse(JSON.stringify(demoPACSService));
  private pacsServices: PACSService[] = JSON.parse(JSON.stringify(demoPACSServices));
  private pacsRequests: PACSServiceRequest[] = JSON.parse(JSON.stringify(demoPACSRequests));
  private documents: Document[] = JSON.parse(JSON.stringify(demoDocuments));
  private schemes: Scheme[] = JSON.parse(JSON.stringify(demoSchemes));
  private notifications: Notification[] = JSON.parse(JSON.stringify(demoNotifications));
  private sources: GovernmentSource[] = JSON.parse(JSON.stringify(demoGovernmentSources));
  private policies: Policy[] = JSON.parse(JSON.stringify(demoPolicies));
  private auditLogs: AuditLog[] = JSON.parse(JSON.stringify(demoAuditLogs));
  private adminMetrics: AdminMetric = { ...demoAdminMetrics };

  async getFarmerProfile(): Promise<Farmer> {
    return { ...this.farmer };
  }

  async getClaims(): Promise<PMFBYClaim[]> {
    return [...this.claims];
  }

  async getClaimById(claimId: string): Promise<PMFBYClaim | null> {
    const found = this.claims.find((c) => c.id === claimId);
    return found ? { ...found } : null;
  }

  async getGrievances(farmerId?: string): Promise<Grievance[]> {
    if (farmerId) {
      const targetId = (farmerId === 'FMR-PB-2026-0881' || farmerId === 'DEMO-FRM-1001') ? 'DEMO-FRM-1001' : farmerId;
      return this.grievances.filter((g) => g.farmerId === targetId || g.farmerId === farmerId).map((g) => ({ ...g }));
    }
    return this.grievances.map((g) => ({ ...g }));
  }

  async getGrievanceById(grievanceId: string): Promise<Grievance | null> {
    const found = this.grievances.find(
      (g) => g.id === grievanceId || g.grievanceId === grievanceId || g.ticketId === grievanceId
    );
    return found ? { ...found } : null;
  }

  async createDemoGrievance(data: Partial<Grievance>): Promise<Grievance> {
    const count = this.grievances.length + 1;
    const formattedCount = String(count).padStart(4, '0');
    const newGrievanceId = `GRV-DEMO-2026-${formattedCount}`;
    const nowIso = new Date().toISOString();
    const dateFormatted = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const newGrievance: Grievance = {
      isDemo: true,
      id: newGrievanceId,
      grievanceId: newGrievanceId,
      ticketId: newGrievanceId,
      farmerId: data.farmerId || this.farmer.id || 'DEMO-FRM-1001',
      farmerName: data.farmerName || this.farmer.name || 'Ramesh Kumar',
      category: data.category || 'Other',
      subject: data.subject || 'Demo Grievance Record',
      description: data.description || '',
      status: 'SUBMITTED',
      createdAt: nowIso,
      updatedAt: nowIso,
      lodgedDate: dateFormatted,
      targetResolutionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      slaDaysRemaining: 30,
      currentTier: 'Helpdesk',
      assignedTo: 'Agriculture helpdesk',
      reviewingOfficer: {
        name: 'Desk Intake Officer',
        designation: 'Sub-Divisional Agriculture Helpdesk',
        office: 'Agriculture Support Cell',
        phone: '1800-180-1551',
        contact: '1800-180-1551',
      },
      attachments: data.attachments || [],
      timeline: [
        {
          date: dateFormatted,
          status: 'SUBMITTED',
          stage: 'Grievance created',
          notes: 'Grievance saved in KrishiSahyog.',
          officer: 'You (in the app)',
          completed: true,
        },
      ],
      relatedClaimId: data.relatedClaimId,
      relatedDocumentId: data.relatedDocumentId,
      relatedDocumentName: data.relatedDocumentName,
      source: 'KrishiSahyog AI Grievance Tracking Engine',
      authority: data.authority || 'Department of Agriculture & Farmers Welfare, Rajasthan',
      officialPortalUrl: 'https://pgportal.gov.in',
      officialPortalName: 'CPGRAMS Portal (pgportal.gov.in)',
      lastVerified: nowIso,
      verificationStatus: 'PENDING',
    };

    this.grievances.unshift(newGrievance);

    // Also add an audit log entry
    this.auditLogs.unshift({
      isDemo: true,
      id: `AUD-${Date.now()}`,
      timestamp: nowIso,
      actionType: 'GRIEVANCE_LODGED',
      initiatorRole: 'farmer',
      initiatorBadge: newGrievance.farmerId,
      description: `Demo grievance created: ${newGrievance.grievanceId} (${newGrievance.category})`,
      documentHashSha256: '9f83cfb9b812a0129bcfe84128fefd9021894bcf9018e21a8f9024bc10984120',
      dscSignatureStatus: 'SYSTEM_AUTOMATED',
    });

    return { ...newGrievance };
  }

  async getPACSService(): Promise<PACSService> {
    return { ...this.pacs };
  }

  async getPACSServices(): Promise<PACSService[]> {
    return [...this.pacsServices];
  }

  async getPACSServiceById(serviceId: string): Promise<PACSService | null> {
    const found = this.pacsServices.find((s) => s.id === serviceId);
    if (found) return { ...found };
    if (this.pacs.id === serviceId) return { ...this.pacs };
    return null;
  }

  async getPACSRequests(): Promise<PACSServiceRequest[]> {
    return [...this.pacsRequests];
  }

  async getPACSRequestById(requestId: string): Promise<PACSServiceRequest | null> {
    const found = this.pacsRequests.find((r) => r.id === requestId);
    return found ? { ...found } : null;
  }

  async createDemoPACSRequest(data: Partial<PACSServiceRequest>): Promise<PACSServiceRequest> {
    const count = this.pacsRequests.length + 1;
    const pad = count < 10 ? `00${count}` : `0${count}`;
    const newId = `DEMO-PACS-REQ-2026-${pad}`;

    const service = this.pacsServices.find((s) => s.id === data.serviceId);
    const serviceName = data.serviceName || service?.name || 'PACS Guidance Service';
    const category = data.category || service?.category || 'GENERAL';
    const requiredDocs = data.requiredDocuments || service?.requiredDocuments || [
      'Aadhaar Identity Card',
      'Bank Account Proof (Passbook & Mandate)',
      'Land Record (Jamabandi / Fard RoR)',
    ];

    // Determine initial status based on document availability
    const hasMissingDocs = this.documents.some(
      (d) => requiredDocs.some((req) => req.toLowerCase().includes(d.docType.toLowerCase()) || d.title.toLowerCase().includes(req.toLowerCase())) &&
        (d.status === 'MISSING' || d.verificationStatus === 'MISSING')
    );

    const initialStatus: PACSServiceRequestStatus = hasMissingDocs
      ? 'INFORMATION_REQUIRED'
      : 'DEMO_REQUEST_CREATED';

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const timeline: PACSServiceRequest['timeline'] = [
      {
        date: formattedDate,
        status: 'DEMO_REQUEST_CREATED',
        title: 'Demo Request Created',
        description: 'Demo request created locally within KrishiSahyog AI prototype.',
        actor: 'Farmer Self-Service Desk',
        isDemoEvent: true,
      },
    ];

    if (initialStatus === 'INFORMATION_REQUIRED') {
      timeline.push({
        date: formattedDate,
        status: 'INFORMATION_REQUIRED',
        title: 'Information Required',
        description: 'Information Required — Demo record indicates Land Record or required documentation is missing. Additional guidance available in Document Locker.',
        actor: 'PACS Cooperative Desk System',
        isDemoEvent: true,
      });
    }

    const newRequest: PACSServiceRequest = {
      isDemo: true,
      id: newId,
      serviceId: data.serviceId || 'DEMO-PACS-SVC-001',
      serviceName,
      farmerId: data.farmerId || this.farmer.id,
      farmerName: data.farmerName || this.farmer.name,
      category,
      subject: data.subject || `Inquiry for ${serviceName}`,
      description: data.description || `Demo request created for ${serviceName}. This is a local simulation record.`,
      status: initialStatus,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      requiredDocuments: requiredDocs,
      relatedDocumentIds: ['DOC-AADHAAR-01', 'DOC-BANK-02', 'DOC-LAND-01'],
      actionRequired: hasMissingDocs ? 'Review required documents' : undefined,
      timeline,
      source: 'KrishiSahyog AI PACS Operations Module',
      authority: service?.authority || 'Demo Primary Agricultural Cooperative Society',
      lastVerified: now.toISOString(),
      verificationStatus: 'DEMO',
    };

    this.pacsRequests.unshift(newRequest);

    // Create Notification
    const newNotif: Notification = {
      isDemo: true,
      id: `NOTIF-${Date.now()}`,
      title: 'PACS Demo Request Created',
      message: `Your demo PACS request ${newId} (${serviceName}) was created locally.`,
      category: 'PACS_REQUEST',
      timestamp: 'Just now',
      isUrgent: hasMissingDocs,
      read: false,
      actionRoute: 'pacs-services',
    };
    this.notifications.unshift(newNotif);

    // Log Audit Entry
    this.auditLogs.unshift({
      isDemo: true,
      id: `AUD-PACS-${Date.now()}`,
      timestamp: now.toISOString(),
      actionType: 'PACS_REQUEST_CREATED',
      initiatorRole: 'farmer',
      initiatorBadge: this.farmer.id,
      description: `Demo PACS request created: ${newId} (${serviceName})`,
      documentHashSha256: '9f83cfb9b812a0129bcfe84128fefd9021894bcf9018e21a8f9024bc10984120',
      dscSignatureStatus: 'SYSTEM_AUTOMATED',
    });

    return { ...newRequest };
  }

  async updateDemoPACSRequestStatus(
    requestId: string,
    status: PACSServiceRequestStatus,
    notes?: string
  ): Promise<PACSServiceRequest> {
    const request = this.pacsRequests.find((r) => r.id === requestId);
    if (!request) throw new Error('PACS Request not found');

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    request.status = status;
    request.updatedAt = now.toISOString();

    const titleMap: Record<PACSServiceRequestStatus, string> = {
      DRAFT: 'Draft Saved',
      DEMO_REQUEST_CREATED: 'Demo Request Created',
      INFORMATION_REQUIRED: 'Information Required',
      GUIDANCE_PROVIDED: 'Guidance Provided',
      CLOSED: 'Request Concluded',
    };

    request.timeline.push({
      date: formattedDate,
      status,
      title: titleMap[status] || status,
      description: notes || `Status updated to ${status} in local demonstration simulation.`,
      actor: 'Cooperative Society Desk Reviewer',
      isDemoEvent: true,
    });

    if (status === 'GUIDANCE_PROVIDED') {
      request.actionRequired = undefined;
    }

    // Add Audit Log
    this.auditLogs.unshift({
      isDemo: true,
      id: `AUD-PACS-${Date.now()}`,
      timestamp: now.toISOString(),
      actionType: 'PACS_STATUS_UPDATED',
      initiatorRole: 'pacs',
      initiatorBadge: 'PACS-OPERATOR-DESK',
      description: `Demo PACS request ${requestId} updated to ${status}`,
      documentHashSha256: '8bfa92c0199f12d8a4109823019842901284a1e948c08129af183204918eeb83',
      dscSignatureStatus: 'OPERATOR_SIMULATION',
    });

    return { ...request };
  }

  async getDocuments(): Promise<Document[]> {
    return [...this.documents];
  }

  async getSchemes(): Promise<Scheme[]> {
    return [...this.schemes];
  }

  async getNotifications(): Promise<Notification[]> {
    return [...this.notifications];
  }

  async getGovernmentSources(): Promise<GovernmentSource[]> {
    return [...this.sources];
  }

  async getPolicies(): Promise<Policy[]> {
    return [...this.policies];
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return [...this.auditLogs];
  }

  async getAdminMetrics(): Promise<AdminMetric> {
    return { ...this.adminMetrics };
  }

  async queryAI(query: string, language: LanguageCode): Promise<AIResponse> {
    const lower = query.toLowerCase();

    if (lower.includes('pacs') && (lower.includes('document') || lower.includes('require') || lower.includes('need'))) {
      return { ...demoAIResponses.pacsDocuments, language, query };
    }
    if (lower.includes('pacs') && (lower.includes('status') || lower.includes('request status') || lower.includes('track'))) {
      return { ...demoAIResponses.pacsRequestStatus, language, query };
    }
    if ((lower.includes('information required') || lower.includes('why is my request')) && (lower.includes('pacs') || lower.includes('request'))) {
      return { ...demoAIResponses.pacsInfoRequired, language, query };
    }
    if (lower.includes('contact') && (lower.includes('pacs') || lower.includes('cooperative') || lower.includes('society'))) {
      return { ...demoAIResponses.pacsContact, language, query };
    }
    if ((lower.includes('what is pacs') || lower.includes('what does pacs') || lower.includes('pacs mean')) || (lower.includes('pacs') && lower.includes('meaning'))) {
      return { ...demoAIResponses.pacsMeaning, language, query };
    }
    if (lower.includes('loan') || lower.includes('kcc') || lower.includes('interest')) {
      return { ...demoAIResponses.kccLoan, language, query };
    }
    if (lower.includes('urea') || lower.includes('fertilizer') || lower.includes('quota')) {
      return { ...demoAIResponses.fertilizerSubsidy, language, query };
    }
    if (lower.includes('under review')) {
      return { ...demoAIResponses.grievanceUnderReview, language, query };
    }
    if ((lower.includes('grievance') || lower.includes('what')) && (lower.includes('do next') || lower.includes('next step') || lower.includes('action'))) {
      return { ...demoAIResponses.grievanceNextSteps, language, query };
    }
    if (lower.includes('grievance id') || lower.includes('my grievance number') || lower.includes('docket id')) {
      return { ...demoAIResponses.grievanceIdentifier, language, query };
    }
    if ((lower.includes('which claim') || lower.includes('related claim')) && (lower.includes('grievance') || lower.includes('this'))) {
      return { ...demoAIResponses.grievanceRelatedClaim, language, query };
    }
    if (lower.includes('grievance') || lower.includes('complaint') || lower.includes('officer') || lower.includes('bao')) {
      return { ...demoAIResponses.grievanceEscalation, language, query };
    }
    if (lower.includes('scheme') && (lower.includes('document') || lower.includes('missing') || lower.includes('require'))) {
      return { ...demoAIResponses.schemeDocuments, language, query };
    }
    if (lower.includes('scheme') && (lower.includes('why') || lower.includes('relevant') || lower.includes('eligib'))) {
      return { ...demoAIResponses.schemeRelevance, language, query };
    }
    if (lower.includes('scheme') && (lower.includes('apply') || lower.includes('process') || lower.includes('step') || lower.includes('how'))) {
      return { ...demoAIResponses.schemeProcess, language, query };
    }
    if (lower.includes('scheme')) {
      return { ...demoAIResponses.schemeRelevance, language, query };
    }

    return { ...demoAIResponses.default, language, query };
  }

  async uploadDocument(
    farmerId: string,
    docType: Document['docType'],
    file: { name: string; size: number; type?: string; sha256?: string }
  ): Promise<Document> {
    const now = new Date();
    const format: Document['format'] = file.type === 'image/png'
      ? 'PNG'
      : file.type?.startsWith('image/')
      ? 'JPG'
      : 'PDF';

    // An upload replaces the locker record of the same type instead of adding a duplicate
    const existing = this.documents.find((d) => d.docType === docType);
    let uploaded: Document;

    if (existing) {
      uploaded = {
        ...existing,
        status: 'PENDING_REVIEW',
        verificationStatus: 'PENDING',
        isBlockerForClaim: false,
        fileSizeBytes: file.size,
        format,
        verificationHashSha256: file.sha256 || existing.verificationHashSha256,
        lastChecked: formatDisplayDate(now),
        lastVerified: now.toISOString(),
      };
      this.documents = this.documents.map((d) => (d.id === existing.id ? uploaded : d));
    } else {
      uploaded = {
        isDemo: true,
        id: `DOC-UPLOAD-${now.getTime()}`,
        farmerId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        docType,
        status: 'PENDING_REVIEW',
        issuer: 'Uploaded via KrishiSahyog kiosk (demo)',
        docReferenceMasked: `UPLOAD-${Math.floor(1000 + Math.random() * 9000)}`,
        issueDate: formatDisplayDate(now),
        fileSizeBytes: file.size,
        format,
        isBlockerForClaim: false,
        verificationHashSha256: file.sha256 || '',
        source: 'Uploaded Document Ledger',
        lastVerified: now.toISOString(),
        verificationStatus: 'PENDING',
      };
      this.documents = [uploaded, ...this.documents];
    }

    this.syncClaimsWithUploadedDocument(uploaded, now);

    this.auditLogs.unshift({
      isDemo: true,
      id: `AUD-${now.getTime()}`,
      timestamp: now.toISOString(),
      actionType: 'SOWING_PROOF_RECONCILE',
      initiatorRole: 'farmer',
      initiatorBadge: farmerId,
      description: `Document submitted for review: ${file.name} (${docType})`,
      documentHashSha256: uploaded.verificationHashSha256,
      dscSignatureStatus: 'SYSTEM_AUTOMATED',
    });

    return { ...uploaded };
  }

  /**
   * Marks matching claim documents as pending review. Once a claim has no missing or
   * invalid documents left, its upload actions move to review and the claim leaves
   * the "additional information required" state.
   */
  private syncClaimsWithUploadedDocument(doc: Document, now: Date) {
    this.claims = this.claims.map((claim) => {
      const claimDocs = claim.documents || [];
      const needsUpdate = claimDocs.some(
        (cd) => cd.docType === doc.docType && cd.status !== 'AVAILABLE'
      );
      if (!needsUpdate) return claim;

      const documents = claimDocs.map((cd) =>
        cd.docType === doc.docType && cd.status !== 'AVAILABLE'
          ? { ...cd, status: 'PENDING_REVIEW' as const }
          : cd
      );
      const hasOutstandingDocs = documents.some(
        (cd) => cd.status === 'MISSING' || cd.status === 'INVALID / EXPIRED'
      );

      if (hasOutstandingDocs) {
        return { ...claim, documents, lastUpdated: formatDisplayDate(now) };
      }

      return {
        ...claim,
        documents,
        requiredActions: claim.requiredActions.map((action) =>
          action.actionType === 'UPLOAD' && action.status === 'ACTION_REQUIRED'
            ? { ...action, status: 'IN_REVIEW' as const }
            : action
        ),
        status:
          claim.status === 'ADDITIONAL INFORMATION REQUIRED' ? 'UNDER REVIEW' : claim.status,
        nextAction:
          claim.status === 'ADDITIONAL INFORMATION REQUIRED'
            ? 'Documents submitted — awaiting officer review'
            : claim.nextAction,
        lastUpdated: formatDisplayDate(now),
      };
    });
  }

  async resolveClaimAction(claimId: string, actionId: string): Promise<PMFBYClaim> {
    const claim = this.claims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Claim not found');

    const updated: PMFBYClaim = {
      ...claim,
      requiredActions: claim.requiredActions.map((action) =>
        action.id === actionId ? { ...action, status: 'IN_REVIEW' as const } : action
      ),
    };
    this.claims = this.claims.map((c) => (c.id === claimId ? updated : c));

    return { ...updated };
  }
}

export const demoDataProvider = new DemoDataProvider();
