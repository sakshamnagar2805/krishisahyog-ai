import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, FileText, FolderOpen } from 'lucide-react';
import { PMFBYClaim, PMFBYClaimDocument } from '../../types';
import { EmptyState, OfficialPortalButton, StatusBadge } from '../../components/common';
import { Button, Card, Notice, SectionHeading } from '../../components/ui';

interface ClaimDocumentsViewProps {
  claim: PMFBYClaim;
  onBackToClaim: () => void;
  onNavigateTab: (tabId: string) => void;
  onNavigateToDocuments?: (docIdOrType?: string) => void;
  initialSelectedDoc?: string;
}

interface AssistanceGuide {
  title: string;
  steps: string[];
  portal?: string;
  portalName?: string;
}

/** Step-by-step help for a claim document, filled in from this claim's own details */
const getAssistanceGuide = (claim: PMFBYClaim, doc: PMFBYClaimDocument): AssistanceGuide | null => {
  switch (doc.docType) {
    case 'JAMABANDI':
      return {
        title: 'How to get your land record (Jamabandi)',
        steps: [
          "Open your state's land records website, or visit your Halqa Patwari's office.",
          `Choose ${claim.district} district, then your tehsil and village.`,
          `Enter the khasra number from your land papers (${claim.plotKhasra}) to get your record of rights.`,
          `Check that ${claim.farmerName} is shown as the owner and that the area matches ${claim.surveyParcelSizeAcres} acres.`,
          'Take a printed copy to the Block Agriculture Officer, or show it during the field inspection.',
        ],
        ...(claim.state === 'Rajasthan'
          ? { portal: 'https://apnakhata.rajasthan.gov.in', portalName: 'Apna Khata (Rajasthan land records)' }
          : {}),
      };
    case 'BANK_PASSBOOK':
      return {
        title: 'How to check that Aadhaar is linked to your bank account',
        steps: [
          'Check whether your Aadhaar is linked to your bank account on the UIDAI website.',
          `Make sure direct benefit transfer (DBT) is active on the account your claim will be paid into${
            doc.referenceNo ? ` (account ending ${doc.referenceNo.replace(/[^0-9]/g, '')})` : ''
          }.`,
          'If it is not linked, visit your bank branch with your Aadhaar card and passbook and ask for Aadhaar seeding for DBT.',
          'The bank may confirm your identity with your fingerprint.',
        ],
        portal: 'https://myaadhaar.uidai.gov.in/check-aadhaar-bank-seeding-status',
        portalName: 'Check Aadhaar bank linking (UIDAI)',
      };
    case 'SOWING_CERTIFICATE':
      return {
        title: 'How to get a corrected sowing certificate',
        steps: [
          doc.issueAuthority
            ? `Visit the office that issues it: ${doc.issueAuthority}.`
            : "Visit your Halqa Patwari's office.",
          `Ask for an updated crop record (Girdawari) for ${claim.season} ${claim.year} that shows ${claim.crop} (${claim.variety}).`,
          "Make sure it has the official seal, the date and the Kanungo's signature.",
          `Write your claim number ${claim.claimId} on the copy.`,
        ],
      };
    default:
      return null;
  }
};

export const ClaimDocumentsView: React.FC<ClaimDocumentsViewProps> = ({
  claim,
  onBackToClaim,
  onNavigateTab,
  onNavigateToDocuments,
  initialSelectedDoc,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    initialSelectedDoc || (claim.documents && claim.documents.length > 0 ? claim.documents[0].id : null)
  );

  const documents = claim.documents || [];

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];
  const currentGuide = currentDoc ? getAssistanceGuide(claim, currentDoc) : null;

  return (
    <div className="space-y-6">
      <Button variant="link" className="min-h-11" onClick={onBackToClaim}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to claim details
      </Button>

      <SectionHeading
        title={`Documents for claim ${claim.claimId}`}
        description={`${claim.crop}, ${claim.season} ${claim.year} · ${claim.plotKhasra}`}
        action={
          onNavigateToDocuments && (
            <Button onClick={() => onNavigateToDocuments(currentDoc?.docType)}>
              <FolderOpen className="w-4 h-4" aria-hidden="true" /> Open document locker
            </Button>
          )
        }
      />

      {documents.length === 0 ? (
        <Card>
          <EmptyState
            title="No documents listed"
            description="This claim does not list any documents yet."
            actionLabel="Get help with claims"
            onAction={() => onNavigateTab('claim-assistance')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Document list */}
          <section className="min-w-0 lg:col-span-2" aria-labelledby="pmfby-claim-docs-heading">
            <h3 id="pmfby-claim-docs-heading" className="mb-3 text-sm font-semibold text-navy">
              Documents needed ({documents.length})
            </h3>
            <ul className="space-y-3">
              {documents.map((doc) => {
                const isSelected = doc.id === currentDoc?.id;

                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      aria-pressed={isSelected}
                      className={`w-full rounded-lg border bg-white p-4 text-left transition-colors ${
                        isSelected ? 'border-navy ring-1 ring-navy' : 'border-line hover:border-muted/40 hover:bg-offwhite'
                      }`}
                    >
                      <span className="flex flex-wrap items-start justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-navy' : 'text-muted'}`} aria-hidden="true" />
                          <span className="font-semibold text-navy">{doc.name}</span>
                        </span>
                        <StatusBadge status={doc.status} />
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-ink">{doc.whyRequired}</span>
                      <span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
                        <span>{doc.issueAuthority ? `Issued by ${doc.issueAuthority}` : 'Issued by the state authority'}</span>
                        {!isSelected && (
                          <span className="inline-flex items-center font-semibold text-brand-dark">
                            How to get it <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Help for the selected document */}
          <Card className="min-w-0 lg:col-span-3" aria-live="polite">
            {currentDoc && (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 pb-4 pt-5">
                  <div className="min-w-0">
                    <p className="text-sm text-muted">Help with</p>
                    <h3 className="font-display text-lg font-semibold leading-tight text-navy">{currentDoc.name}</h3>
                  </div>
                  <StatusBadge status={currentDoc.status} />
                </div>

                <div className="space-y-5 px-5 py-5">
                  <div>
                    <h4 className="text-sm font-semibold text-navy">Why it is needed</h4>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink">{currentDoc.whyRequired}</p>
                    {currentDoc.referenceNo && (
                      <p className="mt-1 text-[13px] text-muted tabular-nums">Reference on file: {currentDoc.referenceNo}</p>
                    )}
                  </div>

                  {currentGuide && (
                    <div>
                      <h4 className="text-sm font-semibold text-navy">{currentGuide.title}</h4>
                      <ol className="mt-3 space-y-3">
                        {currentGuide.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-soft text-[13px] font-semibold text-navy"
                              aria-hidden="true"
                            >
                              {idx + 1}
                            </span>
                            <span className="text-[15px] leading-relaxed text-ink">{step}</span>
                          </li>
                        ))}
                      </ol>

                      {currentGuide.portal && (
                        <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-muted">Download or check it on the official website</p>
                          <OfficialPortalButton href={currentGuide.portal} portalName={currentGuide.portalName} />
                        </div>
                      )}
                    </div>
                  )}

                  <Notice tone="info">
                    Keep the original papers safe. The insurance company continues with your claim only after your documents
                    are checked.
                  </Notice>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
