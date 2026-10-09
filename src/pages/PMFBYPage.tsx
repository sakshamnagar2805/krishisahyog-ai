import React, { useEffect, useState } from 'react';
import { PMFBYClaim } from '../types';
import { InformationOnlyBanner, OfficialPortalButton } from '../components/common';
import { PageHeader, TabBar, TabItem } from '../components/ui';
import {
  PMFBYOverview,
  MyClaimsList,
  ClaimDetail,
  ClaimTimelineView,
  ClaimDocumentsView,
  ClaimAssistanceView,
  CropInformationView,
  PremiumInformationView,
  EnrollmentGuidanceView,
  ImportantDatesView,
  OfficialResourcesView,
} from './pmfby';

export type PMFBYTab =
  | 'overview'
  | 'my-claims'
  | 'claim-detail'
  | 'claim-timeline'
  | 'claim-documents'
  | 'claim-assistance'
  | 'crop-info'
  | 'premium-info'
  | 'enrollment-guidance'
  | 'important-dates'
  | 'official-resources';

interface PMFBYPageProps {
  claim: PMFBYClaim;
  claims?: PMFBYClaim[];
  initialSubTab?: PMFBYTab;
  onSelectClaim?: (claimId: string) => void;
  onNavigateToDocuments?: (docIdOrType?: string) => void;
  onCreateGrievance?: (claim: PMFBYClaim) => void;
}

const NAV_TABS: { id: PMFBYTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'my-claims', label: 'My claims' },
  { id: 'claim-detail', label: 'Claim details' },
  { id: 'claim-timeline', label: 'Claim timeline' },
  { id: 'claim-documents', label: 'Claim documents' },
  { id: 'claim-assistance', label: 'Claim help' },
  { id: 'crop-info', label: 'Crop details' },
  { id: 'premium-info', label: 'Premium' },
  { id: 'enrollment-guidance', label: 'How to enrol' },
  { id: 'important-dates', label: 'Important dates' },
  { id: 'official-resources', label: 'Official links' },
];

export const PMFBYPage: React.FC<PMFBYPageProps> = ({
  claim,
  claims = [],
  initialSubTab = 'overview',
  onSelectClaim,
  onNavigateToDocuments,
  onCreateGrievance,
}) => {
  const [activeTab, setActiveTab] = useState<PMFBYTab>(initialSubTab);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claim.id);
  const [selectedDocForAssistance, setSelectedDocForAssistance] = useState<string | undefined>(undefined);

  // Keep the local selection in step with claim changes made elsewhere (e.g. Document Locker)
  useEffect(() => {
    setSelectedClaimId(claim.id);
  }, [claim.id]);

  // All available claims with fallback to provided claim
  const allClaims = claims.length > 0 ? claims : [claim];
  const activeClaim = allClaims.find((c) => c.id === selectedClaimId) || claim;

  const handleSelectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    if (onSelectClaim) {
      onSelectClaim(claimId);
    }
  };

  const navigateTab = (tab: string) => setActiveTab(tab as PMFBYTab);

  const tabs: TabItem<PMFBYTab>[] = NAV_TABS.map((tab) => ({
    ...tab,
    domId: `pmfby-tab-${tab.id}`,
    count: tab.id === 'my-claims' ? allClaims.length : undefined,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crop insurance (PMFBY)"
        description="Pradhan Mantri Fasal Bima Yojana. Track your claim, see which documents it needs, and learn how the scheme works."
        actions={<OfficialPortalButton href="https://pmfby.gov.in" portalName="pmfby.gov.in" />}
      />

      <InformationOnlyBanner />

      <TabBar<PMFBYTab> tabs={tabs} activeId={activeTab} onChange={setActiveTab} ariaLabel="Crop insurance sections" />

      <div>
        {activeTab === 'overview' && (
          <PMFBYOverview activeClaim={activeClaim} onNavigateTab={navigateTab} onSelectClaim={handleSelectClaim} />
        )}

        {activeTab === 'my-claims' && (
          <MyClaimsList claims={allClaims} onSelectClaim={handleSelectClaim} onNavigateTab={navigateTab} />
        )}

        {activeTab === 'claim-detail' && (
          <ClaimDetail
            claim={activeClaim}
            onBackToClaims={() => setActiveTab('my-claims')}
            onNavigateTab={navigateTab}
            onNavigateToDocuments={onNavigateToDocuments}
            onSelectDocumentForAssistance={(docName) => setSelectedDocForAssistance(docName)}
            onCreateGrievance={onCreateGrievance}
          />
        )}

        {activeTab === 'claim-timeline' && (
          <ClaimTimelineView
            claim={activeClaim}
            onBackToClaim={() => setActiveTab('claim-detail')}
            onNavigateTab={navigateTab}
          />
        )}

        {activeTab === 'claim-documents' && (
          <ClaimDocumentsView
            claim={activeClaim}
            onBackToClaim={() => setActiveTab('claim-detail')}
            onNavigateTab={navigateTab}
            onNavigateToDocuments={onNavigateToDocuments}
            initialSelectedDoc={selectedDocForAssistance}
          />
        )}

        {activeTab === 'claim-assistance' && <ClaimAssistanceView onNavigateTab={navigateTab} />}

        {activeTab === 'crop-info' && <CropInformationView claim={activeClaim} onNavigateTab={navigateTab} />}

        {activeTab === 'premium-info' && <PremiumInformationView onNavigateTab={navigateTab} />}

        {activeTab === 'enrollment-guidance' && <EnrollmentGuidanceView onNavigateTab={navigateTab} />}

        {activeTab === 'important-dates' && <ImportantDatesView onNavigateTab={navigateTab} />}

        {activeTab === 'official-resources' && <OfficialResourcesView />}
      </div>
    </div>
  );
};
