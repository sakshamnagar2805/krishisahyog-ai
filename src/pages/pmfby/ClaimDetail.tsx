import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FolderOpen,
  MessageSquareWarning,
  Phone,
  ShieldCheck,
  Sprout,
  UserRound,
} from 'lucide-react';
import { PMFBYClaim, RequiredAction } from '../../types';
import { SourceVerificationCard, StatusBadge } from '../../components/common';
import { Button, Card, CardHeader, KeyValueGrid, Notice } from '../../components/ui';

interface ClaimDetailProps {
  claim: PMFBYClaim;
  onBackToClaims: () => void;
  onNavigateTab: (tabId: string) => void;
  /** Opens the Document Locker, highlighting a document by locker id or docType */
  onNavigateToDocuments?: (docIdOrType?: string) => void;
  onSelectDocumentForAssistance?: (claimDocId: string) => void;
  onCreateGrievance?: (claim: PMFBYClaim) => void;
}

const CALAMITY_LABEL: Record<PMFBYClaim['calamityType'], string> = {
  HAILSTORM: 'Hailstorm',
  INUNDATION: 'Flooding',
  DROUGHT: 'Drought',
  PEST_ATTACK: 'Pest attack',
};

const ACTION_TYPE_LABEL: Record<RequiredAction['actionType'], string> = {
  UPLOAD: 'Get and upload a document',
  VISIT_PORTAL: 'Check on an official website',
  VISIT_OFFICE: 'Visit an office',
  VERIFY_IDENTITY: 'Verify your identity',
};

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Timeline titles arrive in capitals ("UNDER REVIEW"); show them in sentence case */
const stageLabel = (title: string) => title.charAt(0) + title.slice(1).toLowerCase();

export const ClaimDetail: React.FC<ClaimDetailProps> = ({
  claim,
  onBackToClaims,
  onNavigateTab,
  onNavigateToDocuments,
  onSelectDocumentForAssistance,
  onCreateGrievance,
}) => {
  const [expandedAction, setExpandedAction] = useState<string | null>(claim.requiredActions[0]?.id ?? null);

  const toggleAction = (id: string) => {
    setExpandedAction(expandedAction === id ? null : id);
  };

  const firstOutstandingDocType = claim.documents?.find(
    (doc) => doc.status === 'MISSING' || doc.status === 'INVALID / EXPIRED'
  )?.docType;

  const needsAction = claim.status === 'ADDITIONAL INFORMATION REQUIRED';
  const isClosed = claim.status === 'RESOLVED' || claim.status === 'CLOSED';
  const farmerPremiumPercent = claim.sumInsured ? (claim.premiumFarmerPaid / claim.sumInsured) * 100 : 0;
  const governmentShare = claim.premiumSubsidyStateGovt + claim.premiumSubsidyCentralGovt;
  const surveyStep = claim.timeline.find((step) => step.title === 'UNDER REVIEW');
  const lossPercent = Math.min(Math.max(claim.assessedLossPercent, 0), 100);

  return (
    <div className="space-y-6">
      <Button variant="link" className="min-h-11" onClick={onBackToClaims}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All my claims
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Claim facts */}
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader
            title={`Claim ${claim.claimId}`}
            description={
              <>
                {claim.crop} ({claim.variety}) · {claim.season} {claim.year} · {claim.district}, {claim.state} · Updated{' '}
                {claim.lastUpdated}
              </>
            }
            icon={<ShieldCheck className="w-5 h-5" aria-hidden="true" />}
            action={<StatusBadge status={claim.status} />}
          />
          <KeyValueGrid
            items={[
              { label: 'Policy number', value: <span className="tabular-nums">{claim.policyId}</span> },
              { label: 'Sum insured', value: <span className="tabular-nums">{rupees(claim.sumInsured)}</span> },
              {
                label: 'Premium you paid',
                value: (
                  <>
                    <span className="tabular-nums">{rupees(claim.premiumFarmerPaid)}</span>
                    <span className="block text-[13px] font-normal text-muted tabular-nums">
                      {farmerPremiumPercent.toFixed(1)}% of the sum insured
                    </span>
                  </>
                ),
              },
              {
                label: 'Premium paid by government',
                value: (
                  <>
                    <span className="tabular-nums">{rupees(governmentShare)}</span>
                    <span className="block text-[13px] font-normal text-muted tabular-nums">
                      State {rupees(claim.premiumSubsidyStateGovt)} + central {rupees(claim.premiumSubsidyCentralGovt)}
                    </span>
                  </>
                ),
              },
              {
                label: 'Land',
                value: claim.plotKhasra,
              },
              {
                label: 'Damage',
                value: (
                  <>
                    {CALAMITY_LABEL[claim.calamityType]}
                    <span className="block text-[13px] font-normal text-muted">on {formatDate(claim.calamityDate)}</span>
                  </>
                ),
              },
              {
                label: 'Damage reported',
                value: (
                  <>
                    <span className="tabular-nums">{formatDate(claim.intimationDate)}</span>
                    <span className="block text-[13px] font-normal text-muted tabular-nums">
                      {claim.hoursElapsedSinceCalamity} hours after the damage ·{' '}
                      {claim.isWithin72Hours ? 'within' : 'after'} the 72-hour limit
                    </span>
                  </>
                ),
              },
              { label: 'Claim submitted', value: claim.submissionDate },
            ]}
          />
        </Card>

        {/* Loss and payout */}
        <Card className="flex min-w-0 flex-col">
          <CardHeader title="Crop loss and payout" icon={<Sprout className="w-5 h-5" aria-hidden="true" />} />
          <div className="flex-1 space-y-5 px-5 pb-5">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm text-muted">Crop loss assessed</p>
                <p className="font-display text-2xl font-semibold text-navy tabular-nums">{claim.assessedLossPercent}%</p>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full border border-line bg-offwhite"
                role="progressbar"
                aria-valuenow={lossPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Crop loss assessed"
              >
                <div className="h-full bg-navy" style={{ width: `${lossPercent}%` }} />
              </div>
              {surveyStep?.status === 'COMPLETED' && (
                <p className="mt-2 text-[13px] text-muted">Assessed in the field survey on {surveyStep.date}</p>
              )}
            </div>

            <div className="border-t border-line pt-4">
              <p className="text-sm text-muted">Estimated payout</p>
              <p className="font-display text-3xl font-semibold text-navy tabular-nums">
                {rupees(claim.indicativeEntitlementRupees)}
              </p>
              <p className="mt-1 text-[13px] text-muted tabular-nums">
                Based on {claim.assessedLossPercent}% loss and a sum insured of {rupees(claim.sumInsured)}. The insurance
                company decides the final amount.
              </p>
            </div>

            {needsAction && (
              <Notice tone="warning">Payment is on hold until the steps below are done.</Notice>
            )}
            {isClosed && <p className="text-sm text-ink">This claim is closed. See the timeline for payment details.</p>}
          </div>
        </Card>
      </div>

      {/* What the farmer needs to do */}
      {needsAction && (
        <Card>
          <CardHeader
            title="What you need to do"
            description="Finish these steps so the insurance company can continue with your claim."
            icon={<AlertCircle className="w-5 h-5 text-danger" aria-hidden="true" />}
            action={
              <Button
                onClick={() =>
                  onNavigateToDocuments ? onNavigateToDocuments(firstOutstandingDocType) : onNavigateTab('claim-documents')
                }
                id="btn-check-required-docs"
              >
                Check required documents
              </Button>
            }
          />

          <ol className="divide-y divide-line border-t border-line">
            {claim.requiredActions.map((action, index) => {
              const isExpanded = expandedAction === action.id;
              const guideId = `pmfby-action-guide-${action.id}`;

              return (
                <li key={action.id} className="space-y-3 px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger/10 text-sm font-semibold text-danger"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy">{action.title}</p>
                        <p className="mt-0.5 text-[15px] leading-relaxed text-ink">{action.description}</p>
                        <p className="mt-1 text-[13px] text-muted">{ACTION_TYPE_LABEL[action.actionType]}</p>
                      </div>
                    </div>
                    <div className="pl-10 sm:pl-0">
                      <StatusBadge status={action.status} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pl-10">
                    {action.patwariStepGuide && action.patwariStepGuide.length > 0 && (
                      <Button
                        variant="link"
                        className="min-h-11"
                        onClick={() => toggleAction(action.id)}
                        aria-expanded={isExpanded}
                        aria-controls={guideId}
                      >
                        {isExpanded ? 'Hide steps' : 'Show steps'}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        )}
                      </Button>
                    )}
                    {onNavigateToDocuments && (
                      <Button
                        variant="link"
                        className="min-h-11"
                        onClick={() => onNavigateToDocuments(firstOutstandingDocType)}
                      >
                        Open document locker
                      </Button>
                    )}
                    <Button variant="link" className="min-h-11" onClick={() => onNavigateTab('claim-documents')}>
                      Document help <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                    {action.portalUrl && (
                      <a
                        href={action.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-dark underline-offset-4 hover:text-navy hover:underline"
                      >
                        Open official website <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    )}
                  </div>

                  {isExpanded && action.patwariStepGuide && (
                    <div id={guideId} className="ml-10 rounded-md border border-line bg-offwhite px-4 py-3">
                      <p className="text-sm font-semibold text-navy">Steps to follow</p>
                      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink">
                        {action.patwariStepGuide.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader
          title="Claim progress"
          icon={<Clock className="w-5 h-5" aria-hidden="true" />}
          action={
            <Button variant="link" onClick={() => onNavigateTab('claim-timeline')}>
              Full timeline <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          }
        />
        <ol className="divide-y divide-line border-t border-line">
          {claim.timeline.map((step) => {
            const isCurrent = step.title === claim.status;
            const isCompleted = step.status === 'COMPLETED';

            return (
              <li
                key={step.step}
                className={`flex items-start gap-3 px-5 py-3 ${isCurrent ? 'bg-offwhite' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isCompleted
                      ? 'bg-brand-light text-brand-dark'
                      : isCurrent
                        ? 'bg-navy text-white'
                        : 'border border-line bg-white text-muted'
                  }`}
                  aria-hidden="true"
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.step}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className={`font-semibold ${isCompleted || isCurrent ? 'text-navy' : 'text-muted'}`}>
                      {stageLabel(step.title)}
                      {isCurrent && <span className="ml-2 text-[13px] font-medium text-muted">Current step</span>}
                    </p>
                    <p className="text-[13px] text-muted tabular-nums">{step.date}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-ink">{step.description}</p>
                  {step.officerNotes && <p className="mt-1 text-[13px] text-muted">Office note: {step.officerNotes}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader
          title="Documents for this claim"
          description="Papers the insurance company and the agriculture office check before paying"
          icon={<FolderOpen className="w-5 h-5" aria-hidden="true" />}
          action={
            <Button variant="link" onClick={() => onNavigateTab('claim-documents')}>
              All claim documents <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          }
        />
        {claim.documents && claim.documents.length > 0 ? (
          <ul className="divide-y divide-line border-t border-line">
            {claim.documents.map((doc) => (
              <li key={doc.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">{doc.name}</p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink">{doc.whyRequired}</p>
                  {doc.issueAuthority && <p className="mt-0.5 text-[13px] text-muted">Issued by {doc.issueAuthority}</p>}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0 self-start"
                  onClick={() => {
                    if (onSelectDocumentForAssistance) {
                      onSelectDocumentForAssistance(doc.id);
                    }
                    onNavigateTab('claim-documents');
                  }}
                >
                  How to get it
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-line px-5 py-4 text-sm text-muted">No documents are listed for this claim.</p>
        )}
      </Card>

      {/* Field inspection photos */}
      {claim.inspectionEvidencePhotos && claim.inspectionEvidencePhotos.length > 0 && (
        <Card>
          <CardHeader
            title="Field inspection photos"
            description="Taken during the field survey"
            icon={<Camera className="w-5 h-5" aria-hidden="true" />}
          />
          <ul className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
            {claim.inspectionEvidencePhotos.map((photo) => (
              <li key={photo.id} className="min-w-0 overflow-hidden rounded-md border border-line">
                <div className="h-40 bg-offwhite">
                  <img src={photo.url} alt={photo.caption} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-ink">{photo.caption}</p>
                  <p className="mt-0.5 text-[13px] text-muted tabular-nums">
                    {photo.timestamp} · {photo.gpsCoordinates}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Grievance */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy">
            <MessageSquareWarning className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold leading-tight text-navy">Problem with this claim?</h2>
            <p className="mt-1 text-sm text-muted">
              If your claim <span className="tabular-nums">{claim.claimId || claim.id}</span> is delayed or something is
              wrong, you can raise a grievance and track the reply.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="shrink-0 self-start sm:self-auto"
          onClick={() => onCreateGrievance && onCreateGrievance(claim)}
          id="claim-create-grievance-btn"
        >
          Raise a grievance <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </Card>

      {/* Officer and source */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Officer for this claim"
            description={claim.designatedOfficer.block}
            icon={<UserRound className="w-5 h-5" aria-hidden="true" />}
          />
          <dl className="space-y-3 border-t border-line px-5 py-4">
            <div>
              <dt className="text-[13px] text-muted">Name</dt>
              <dd className="font-semibold text-navy">{claim.designatedOfficer.name}</dd>
              <dd className="text-sm text-ink">{claim.designatedOfficer.designation}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted">Office address</dt>
              <dd className="text-[15px] text-ink">{claim.designatedOfficer.officeAddress}</dd>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-3">
              <div>
                <dt className="text-[13px] text-muted">Office phone</dt>
                <dd>
                  <a
                    href={`tel:${claim.designatedOfficer.helplinePhone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-dark tabular-nums hover:underline underline-offset-4"
                  >
                    <Phone className="w-4 h-4" aria-hidden="true" /> {claim.designatedOfficer.helplinePhone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted">Kisan Call Centre (free)</dt>
                <dd>
                  <a
                    href="tel:18001801551"
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-dark tabular-nums hover:underline underline-offset-4"
                  >
                    <Phone className="w-4 h-4" aria-hidden="true" /> 1800-180-1551
                  </a>
                </dd>
              </div>
            </div>
          </dl>
        </Card>

        <SourceVerificationCard
          authority={claim.authority || 'Ministry of Agriculture & Farmers Welfare'}
          documentTitle={claim.statutoryClause}
          officialGazetteUrl="https://pmfby.gov.in"
          lastVerified={claim.lastVerified}
        />
      </div>
    </div>
  );
};
