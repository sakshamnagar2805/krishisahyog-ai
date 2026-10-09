import { Policy } from '../../types';

export const demoPolicies: Policy[] = [
  {
    isDemo: true,
    id: 'POL-PMFBY-REV-2025',
    sourceId: 'SRC-01',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) Revised Operational Guidelines 2025',
    documentNumber: 'F.No. 13015/02/2023-Credit-II',
    gazetteVolumeNo: 'Gazette of India Extraordinary Part II Sec 3(i)',
    effectiveDate: '2025-04-01',
    applicableStates: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Madhya Pradesh'],
    keyClauses: [
      {
        clauseNumber: 'Clause 14.2',
        title: 'Intimation Period for Localized Calamities',
        summary: 'Loss intimation must be provided within 72 hours of the occurrence of calamity.',
        officialText: 'The insured farmer shall give intimation within 72 hours of the event through the Kisan Call Centre (1800-180-1551), National Crop Insurance Portal, or nearest Agriculture Office/PACS.',
      },
      {
        clauseNumber: 'Clause 14.3',
        title: 'Joint Field Assessment Protocol',
        summary: 'Joint loss assessment by state agriculture official and insurance representative within 10 days.',
        officialText: 'Joint committee comprising Revenue/Agriculture Officer and Insurance Company Assessor shall complete field damage inspection within 10 days of intimation and upload geotagged findings.',
      },
      {
        clauseNumber: 'Clause 17.1',
        title: 'Aadhaar-Based DBT Disbursement',
        summary: 'All claims settlement strictly disbursed via Aadhaar Payment Bridge (APB) directly to beneficiary account.',
        officialText: 'Indemnity payout shall be credited electronically through Direct Benefit Transfer directly into farmer bank account mapped with Aadhaar on NPCI mapper.',
      },
    ],
    sha256Checksum: '8bfa92c0199f12d8a4109823019842901284a1e948c08129af183204918eeb83',
    downloadUrl: 'https://pmfby.gov.in/pdf/revised_operational_guidelines_2025.pdf',
    source: 'National Crop Insurance Portal (PMFBY)',
    authority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    lastVerified: '2025-11-12T16:00:00Z',
    verificationStatus: 'DEMO',
  },
  {
    isDemo: true,
    id: 'POL-PUNJAB-KCC-2025',
    sourceId: 'SRC-02',
    title: 'Modified Interest Subvention Scheme (MISS) for Short Term Loans Through Cooperative Banks',
    documentNumber: 'COOP-FIN-PB-2025/441',
    effectiveDate: '2025-06-01',
    applicableStates: ['Punjab'],
    keyClauses: [
      {
        clauseNumber: 'Clause 4.1',
        title: 'Effective 4% Interest Subvention Rule',
        summary: 'Farmers repaying promptly receive 3% subvention on top of standard 2% institutional subsidy.',
        officialText: 'An additional prompt repayment incentive of 3% per annum will be extended to farmers paying their dues within the stipulated due date, bringing net borrowing cost to 4% p.a.',
      },
    ],
    sha256Checksum: '3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef01',
    downloadUrl: 'https://agripb.gov.in/schemes/kcc-subvention-guidelines.pdf',
    source: 'agripb.gov.in',
    authority: 'Department of Cooperation, Punjab',
    lastVerified: '2025-11-10T12:00:00Z',
    verificationStatus: 'DEMO',
  },
];
