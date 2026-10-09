/**
 * KrishiSahyog AI - Scheme Matching Engine (Phase 7)
 * 
 * Strict architectural guidelines:
 * - Decoupled service layer (not hardcoded in React components)
 * - Transparent demo matching rules
 * - NEVER claims official eligibility or approval
 * - Evaluates document readiness against centralized citizen locker
 */

import {
  Scheme,
  Document,
  SchemeDiscoveryInputs,
  MatchedSchemeResult,
  SchemeRequiredDocument,
} from '../types';

export class SchemeMatchingService {
  /**
   * Match schemes against farmer inputs and evaluate document readiness.
   */
  public static matchSchemes(
    schemes: Scheme[],
    inputs: SchemeDiscoveryInputs,
    documents: Document[]
  ): MatchedSchemeResult[] {
    const results: MatchedSchemeResult[] = [];

    for (const scheme of schemes) {
      const relevanceReasons: string[] = [];
      let isPotentiallyRelevant = false;

      // 1. State Criteria Match
      const stateMatch =
        scheme.applicableStates.includes(inputs.state) ||
        scheme.applicableStates.includes('All States') ||
        scheme.applicableStates.includes('National');

      if (stateMatch) {
        relevanceReasons.push(`Available in ${inputs.state}.`);
        isPotentiallyRelevant = true;
      }

      // 2. District Criteria Match (if specified)
      if (
        inputs.district &&
        scheme.applicableDistricts &&
        (scheme.applicableDistricts.includes(inputs.district) ||
          scheme.applicableDistricts.includes('All Districts'))
      ) {
        relevanceReasons.push(`Available in ${inputs.district} district.`);
      }

      // 3. Crop Criteria Match
      const cropMatch =
        scheme.applicableCrops.includes(inputs.crop) ||
        scheme.applicableCrops.includes('All crops') ||
        scheme.applicableCrops.includes('Other');

      if (cropMatch) {
        relevanceReasons.push(`Covers ${inputs.crop}.`);
        isPotentiallyRelevant = true;
      }

      // 4. Land Category / Area Match
      if (inputs.landCategory && inputs.landCategory !== 'Not specified') {
        if (inputs.landCategory === 'Small' || inputs.landCategory === 'Marginal') {
          relevanceReasons.push(`Gives priority to ${inputs.landCategory.toLowerCase()} farmers.`);
        } else {
          relevanceReasons.push(`Your land (${inputs.landAreaAcres || 0} acres) is within the scheme limit.`);
        }
      }

      // 5. Farmer Profile Match
      if (inputs.farmerProfile?.role === 'FARMER' || inputs.farmerProfile?.role === 'farmer') {
        relevanceReasons.push('Meant for individual farmers.');
      }

      // If neither state nor crop matches, skip scheme in default recommendations
      // unless user selected 'Other' or scheme is nationwide
      if (!isPotentiallyRelevant && !scheme.applicableStates.includes('National')) {
        continue;
      }

      // 6. Document Readiness Evaluation against centralized citizen documents
      const documentReadiness = this.evaluateDocumentReadiness(
        scheme.requiredDocuments,
        documents
      );

      // 7. Check for missing information that prevents full assessment
      const missingInfo: string[] = [];
      if (!inputs.state) missingInfo.push('State');
      if (!inputs.district) missingInfo.push('District');
      if (!inputs.crop) missingInfo.push('Crop');
      if (!inputs.landCategory || inputs.landCategory === 'Not specified') {
        missingInfo.push('Land Category');
      }

      // Eligibility Guidance (strictly avoiding claims of official eligibility)
      const eligibilityGuidance =
        missingInfo.length > 0
          ? 'Add the missing details to see how well this scheme fits. The department decides final eligibility when you apply.'
          : 'May be relevant based on what you entered. The department decides final eligibility when you apply.';

      results.push({
        scheme,
        relevanceReasons:
          relevanceReasons.length > 0
            ? relevanceReasons
            : ['May apply to farmers in general.'],
        eligibilityGuidance,
        documentReadiness,
        missingInfoForFullAssessment: missingInfo.length > 0 ? missingInfo : undefined,
      });
    }

    return results;
  }

  /**
   * Cross-reference scheme required documents with citizen's central document locker.
   */
  public static evaluateDocumentReadiness(
    required: SchemeRequiredDocument[],
    documents: Document[]
  ): MatchedSchemeResult['documentReadiness'] {
    const available: { docType: string; title: string }[] = [];
    const missing: MatchedSchemeResult['documentReadiness']['missing'] = [];
    const invalidOrExpired: { docType: string; title: string }[] = [];

    for (const req of required) {
      // Find matching document in locker by docType or title keywords
      const matchedDoc = documents.find((doc) => {
        if (doc.docType && doc.docType === req.docType) return true;
        const lowerReqType = req.docType.toLowerCase();
        const lowerDocType = (doc.docType || '').toLowerCase();
        const lowerTitle = (doc.title || doc.name || '').toLowerCase();
        const lowerReqTitle = req.title.toLowerCase();

        if (lowerReqType.includes('aadhaar') && (lowerDocType.includes('aadhaar') || lowerTitle.includes('aadhaar'))) {
          return true;
        }
        if (
          (lowerReqType.includes('bank') || lowerReqType.includes('passbook')) &&
          (lowerDocType.includes('bank') || lowerDocType.includes('passbook') || lowerTitle.includes('bank'))
        ) {
          return true;
        }
        if (
          (lowerReqType.includes('land') || lowerReqType.includes('jamabandi') || lowerReqType.includes('ror')) &&
          (lowerDocType.includes('land') || lowerDocType.includes('jamabandi') || lowerTitle.includes('land') || lowerTitle.includes('jamabandi'))
        ) {
          return true;
        }
        if (
          (lowerReqType.includes('crop') || lowerReqType.includes('sowing') || lowerReqType.includes('girdawari')) &&
          (lowerDocType.includes('sowing') || lowerDocType.includes('girdawari') || lowerTitle.includes('crop') || lowerTitle.includes('sowing'))
        ) {
          return true;
        }

        return false;
      });

      if (!matchedDoc) {
        missing.push({
          docType: req.docType,
          title: req.title,
          whyRequired: req.whyRequired,
        });
      } else if (matchedDoc.status === 'AVAILABLE') {
        available.push({
          docType: req.docType,
          title: matchedDoc.title || req.title,
        });
      } else if (matchedDoc.status === 'MISSING') {
        missing.push({
          docType: req.docType,
          title: matchedDoc.title || req.title,
          whyRequired: req.whyRequired,
          documentId: matchedDoc.id,
        });
      } else if (matchedDoc.status === 'INVALID' || matchedDoc.status === 'EXPIRED') {
        invalidOrExpired.push({
          docType: req.docType,
          title: matchedDoc.title || req.title,
        });
      } else {
        // Fallback to missing for unverified/pending
        missing.push({
          docType: req.docType,
          title: matchedDoc.title || req.title,
          whyRequired: req.whyRequired,
          documentId: matchedDoc.id,
        });
      }
    }

    return {
      required,
      available,
      missing,
      invalidOrExpired,
    };
  }
}
