/**
 * Executes assistant tool calls in the browser against the active data provider,
 * so voice answers are grounded in the same records the farmer sees on screen.
 */
import { dataProvider } from '../index';
import { SchemeMatchingService } from '../schemeMatchingService';
import { ASSISTANT_PAGES, AssistantPage } from './assistantConfig';

export interface AssistantToolContext {
  navigate: (page: AssistantPage) => void;
}

type ToolArgs = Record<string, unknown> | undefined;

const asString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

export const executeAssistantTool = async (
  name: string | undefined,
  args: ToolArgs,
  context: AssistantToolContext
): Promise<Record<string, unknown>> => {
  try {
    switch (name) {
      case 'get_farmer_profile': {
        const farmer = await dataProvider.getFarmerProfile();
        return {
          isDemoData: true,
          name: farmer.name,
          village: farmer.village,
          district: farmer.district,
          state: farmer.state,
          totalLandAcres: farmer.totalLandAcres,
          plots: farmer.khasraPlots.map((p) => ({
            khasraNo: p.khasraNo,
            areaAcres: p.areaAcres,
            cropSown: p.cropSown,
            irrigation: p.irrigationType,
          })),
          pacsSociety: farmer.pacsSocietyName,
          aadhaarSeededWithBank: farmer.aadhaarSeeded,
          dbtActive: farmer.dbtActive,
          kccLimitRupees: farmer.kccLimit,
          kccAvailableRupees: farmer.kccAvailableBalance,
        };
      }

      case 'get_claims': {
        const claims = await dataProvider.getClaims();
        return {
          isDemoData: true,
          claims: claims.map((c) => ({
            claimId: c.claimId,
            crop: c.crop,
            season: `${c.season} ${c.year}`,
            status: c.status,
            nextAction: c.nextAction,
            lastUpdated: c.lastUpdated,
            calamity: c.calamityType,
            sumInsuredRupees: c.sumInsured,
            indicativeEntitlementRupees: c.indicativeEntitlementRupees,
            documents: (c.documents || []).map((d) => ({ name: d.name, status: d.status })),
            requiredActions: c.requiredActions.map((a) => ({ title: a.title, status: a.status })),
            officer: {
              name: c.designatedOfficer.name,
              designation: c.designatedOfficer.designation,
              office: c.designatedOfficer.officeAddress,
              phone: c.designatedOfficer.helplinePhone,
            },
          })),
          officialPortal: 'https://pmfby.gov.in',
        };
      }

      case 'get_documents': {
        const documents = await dataProvider.getDocuments();
        return {
          isDemoData: true,
          documents: documents.map((d) => ({
            title: d.title,
            status: d.status ?? d.verificationStatus,
            requiredForClaim: d.isBlockerForClaim,
            whyRequired: d.whyRequired,
            whereToObtain: d.whereToObtain,
            issuingAuthority: d.issuingAuthority || d.issuer,
          })),
        };
      }

      case 'find_schemes': {
        const [farmer, schemes, documents] = await Promise.all([
          dataProvider.getFarmerProfile(),
          dataProvider.getSchemes(),
          dataProvider.getDocuments(),
        ]);
        const results = SchemeMatchingService.matchSchemes(
          schemes,
          {
            crop: asString(args?.crop) || farmer.primaryCrop || 'Wheat',
            state: asString(args?.state) || farmer.state,
            district: asString(args?.district) || farmer.district,
            landCategory: 'Small',
            landAreaAcres: farmer.totalLandAcres,
            landOwnership: 'Owned',
          },
          documents
        );
        return {
          isDemoData: true,
          note: 'Potential relevance only. Final eligibility is decided by the official authority.',
          schemes: results.slice(0, 4).map((r) => ({
            name: r.scheme.name,
            summary: r.scheme.shortDescription || r.scheme.summary,
            whyRelevant: r.relevanceReasons.slice(0, 2),
            missingDocuments: r.documentReadiness.missing.map((m) => m.title),
            whereToApply: r.scheme.whereToApply,
            officialPortal: r.scheme.officialPortal?.url || r.scheme.officialPortalUrl,
          })),
        };
      }

      case 'get_grievances': {
        const farmer = await dataProvider.getFarmerProfile();
        const grievances = await dataProvider.getGrievances(farmer.id);
        return {
          isDemoData: true,
          grievances: grievances.map((g) => ({
            grievanceId: g.grievanceId,
            subject: g.subject,
            category: g.category,
            status: g.status,
            lodgedDate: g.lodgedDate,
            daysLeftForResolution: g.slaDaysRemaining,
            assignedTo: g.assignedTo,
          })),
          officialPortal: 'https://pgportal.gov.in',
        };
      }

      case 'get_pacs_services': {
        const pacs = await dataProvider.getPACSService();
        return {
          isDemoData: true,
          society: pacs.societyName,
          block: pacs.block,
          district: pacs.district,
          helpline: pacs.helpline,
          fertilizers: (pacs.fertilizers || []).map((f) => ({
            name: f.name,
            bagsAvailable: f.bagsAvailable,
            seasonalQuotaBags: f.totalSeasonalQuotaBags,
            subsidizedPricePerBagRupees: f.pricePerBagSubsidized,
          })),
          kcc: {
            limitRupees: pacs.kccLimitRupees,
            drawnRupees: pacs.kccDrawnRupees,
            interestSubventionPercent: pacs.kccSubventionPercent,
            renewalDueDate: pacs.kccRenewalDueDate,
          },
          machineryForHire: (pacs.customHiringMachinery || []).map((m) => ({
            name: m.machineryName,
            ratePerHourRupees: m.rentalRatePerHour,
            availability: m.availabilityStatus,
          })),
        };
      }

      case 'open_app_page': {
        const page = asString(args?.page);
        if (!page || !(page in ASSISTANT_PAGES)) {
          return { opened: false, error: `Unknown page. Valid pages: ${Object.keys(ASSISTANT_PAGES).join(', ')}` };
        }
        context.navigate(page as AssistantPage);
        return { opened: true, page: ASSISTANT_PAGES[page as AssistantPage] };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Tool failed' };
  }
};
