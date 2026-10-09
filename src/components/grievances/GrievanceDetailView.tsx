import React from 'react';
import { ArrowLeft, ChevronRight, FileText, HelpCircle, Link2, ListChecks, Paperclip, Phone } from 'lucide-react';
import { Grievance, GrievanceStatus, PMFBYClaim, Document } from '../../types';
import { StatusBadge, InformationOnlyBanner, OfficialPortalButton } from '../common';
import { Button, Card, CardHeader, Notice, PageHeader } from '../ui';
import { GrievanceTimeline } from './GrievanceTimeline';

interface GrievanceDetailViewProps {
  grievance: Grievance;
  onBack: () => void;
  onNavigateToClaim?: (claimId: string) => void;
  onNavigateToDocument?: (docId?: string) => void;
  onAskAI?: (question: string) => void;
  relatedClaim?: PMFBYClaim | null;
  relatedDocument?: Document | null;
}

interface StatusInfo {
  label: string;
  meaning: string;
  nextStep: string;
}

/** Label/value facts in the KeyValueGrid style; a lone last item spans both columns so no empty cell shows */
const FactList: React.FC<{ items: { label: string; value: React.ReactNode }[] }> = ({ items }) => (
  <dl className="grid grid-cols-1 gap-px border-y border-line bg-line sm:grid-cols-2">
    {items.map(({ label, value }) => (
      <div key={label} className="min-w-0 bg-white px-5 py-3 sm:last:odd:col-span-2">
        <dt className="text-[13px] text-muted">{label}</dt>
        <dd className="mt-0.5 font-semibold text-navy break-words">{value}</dd>
      </div>
    ))}
  </dl>
);

const FINISHED_STATUSES: GrievanceStatus[] = ['RESOLVED', 'REJECTED', 'CLOSED'];

const formatDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Plain-language meaning and next step for each status, filled from the grievance where possible */
const getStatusInfo = (grievance: Grievance): StatusInfo => {
  switch (grievance.status) {
    case 'SUBMITTED':
      return {
        label: 'Submitted',
        meaning: 'Your grievance has been recorded. It is waiting to be picked up for review.',
        nextStep: 'Nothing to do right now. Check back here for updates.',
      };
    case 'ACKNOWLEDGED':
      return {
        label: 'Acknowledged',
        meaning: 'Your grievance has been received and passed to the office that handles it.',
        nextStep: 'Nothing to do right now. Keep your documents ready in case more details are asked for.',
      };
    case 'UNDER REVIEW':
      return {
        label: 'Under review',
        meaning: grievance.relatedClaimId
          ? `An officer is looking into your grievance about claim ${grievance.relatedClaimId}.`
          : 'An officer is looking into your grievance.',
        nextStep: 'Keep your documents ready in case the officer asks for more information.',
      };
    case 'ADDITIONAL INFORMATION REQUIRED':
      return {
        label: 'Information required',
        meaning: 'More information is needed before your grievance can move ahead.',
        nextStep:
          grievance.actionRequiredNotes ||
          'Check what is missing, add it to your documents and keep a copy ready for the office.',
      };
    case 'FORWARDED':
      return {
        label: 'Forwarded',
        meaning: 'Your grievance has been sent to another office that can deal with it.',
        nextStep: 'Nothing to do right now. The new office will review it.',
      };
    case 'RESOLVED':
      return {
        label: 'Resolved',
        meaning: grievance.resolutionNotes || 'Your grievance has been marked as resolved.',
        nextStep: 'If the problem is not fixed, raise a new grievance with the details.',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        meaning: grievance.rejectionReason
          ? `Your grievance was not accepted. Reason: ${grievance.rejectionReason}`
          : 'Your grievance was not accepted.',
        nextStep: 'If you think this is wrong, raise a new grievance and add any missing details or documents.',
      };
    case 'CLOSED':
    default:
      return {
        label: 'Closed',
        meaning: 'This grievance is closed.',
        nextStep: 'No further action is needed. If the problem continues, raise a new grievance.',
      };
  }
};

export const GrievanceDetailView: React.FC<GrievanceDetailViewProps> = ({
  grievance,
  onBack,
  onNavigateToClaim,
  onNavigateToDocument,
  onAskAI,
  relatedClaim,
  relatedDocument,
}) => {
  const statusInfo = getStatusInfo(grievance);
  const displayId = grievance.grievanceId || grievance.ticketId || grievance.id;
  const filedOn = grievance.lodgedDate || formatDate(grievance.createdAt);
  const isFinished = FINISHED_STATUSES.includes(grievance.status);
  const needsInformation = grievance.status === 'ADDITIONAL INFORMATION REQUIRED';
  const hasDocumentLink = Boolean(grievance.relatedDocumentName || grievance.relatedDocumentId);
  const documentTitle = grievance.relatedDocumentName || relatedDocument?.title || grievance.relatedDocumentId;
  const officer = grievance.reviewingOfficer;

  const suggestedAIQuestions = [
    `What does "${statusInfo.label}" mean?`,
    'What should I do next?',
    ...(grievance.relatedClaimId ? ['Which claim is this related to?'] : []),
    'What is my grievance ID?',
  ];

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: 'Grievance ID', value: <span className="tabular-nums">{displayId}</span> },
    { label: 'Category', value: grievance.category },
    { label: 'Filed on', value: <span className="tabular-nums">{filedOn}</span> },
    { label: 'Last updated', value: <span className="tabular-nums">{formatDate(grievance.updatedAt)}</span> },
  ];
  if (grievance.targetResolutionDate && !isFinished) {
    facts.push({ label: 'Response expected by', value: <span className="tabular-nums">{grievance.targetResolutionDate}</span> });
  }
  if (officer) {
    facts.push({
      label: 'Handled by',
      value: (
        <>
          {officer.name}
          {officer.designation && <span className="block text-sm font-normal text-muted">{officer.designation}</span>}
        </>
      ),
    });
    if (officer.office) facts.push({ label: 'Office', value: officer.office });
  } else if (grievance.assignedTo) {
    facts.push({ label: 'Handled by', value: grievance.assignedTo });
  }
  if (grievance.authority) {
    facts.push({ label: 'Department', value: grievance.authority });
  }

  return (
    <div className="space-y-6" id={`grievance-detail-${grievance.id}`}>
      <div>
        <Button variant="link" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to grievances
        </Button>
      </div>

      <PageHeader
        eyebrow={
          <>
            Grievance <span className="tabular-nums">{displayId}</span>
          </>
        }
        title={grievance.subject}
        description={`${grievance.category} · Filed ${filedOn}`}
        actions={
          <OfficialPortalButton
            href={grievance.officialPortalUrl || 'https://pgportal.gov.in'}
            portalName={grievance.officialPortalName || 'CPGRAMS portal (pgportal.gov.in)'}
          />
        }
      />

      {/* Status and next step */}
      <Card id="grievance-detail-status">
        <CardHeader title="Current status" action={<StatusBadge status={grievance.status} />} />
        <div className="px-5 pb-5 space-y-4">
          <p className="text-[15px] text-ink leading-relaxed">{statusInfo.meaning}</p>

          {needsInformation ? (
            <Notice
              tone="danger"
              title="What to do next"
              action={
                hasDocumentLink && (
                  <Button onClick={() => onNavigateToDocument && onNavigateToDocument(grievance.relatedDocumentId)}>
                    Open document
                  </Button>
                )
              }
            >
              {statusInfo.nextStep}
            </Notice>
          ) : (
            <div>
              <p className="text-[13px] text-muted">What to do next</p>
              <p className="font-medium text-ink">{statusInfo.nextStep}</p>
            </div>
          )}

          {!needsInformation && grievance.actionRequiredNotes && (
            <Notice tone="warning" title="Action needed">
              {grievance.actionRequiredNotes}
            </Notice>
          )}

          {grievance.slaDaysRemaining !== undefined && !isFinished && (
            <p className="text-sm text-muted">
              A response is expected within{' '}
              <span className="font-semibold text-navy tabular-nums">{grievance.slaDaysRemaining}</span>{' '}
              {grievance.slaDaysRemaining === 1 ? 'day' : 'days'}.
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2 min-w-0">
          {/* Facts and description */}
          <Card className="overflow-hidden">
            <CardHeader title="Grievance details" />
            <FactList items={facts} />
            <div className="px-5 py-4">
              <p className="text-[13px] text-muted">What you wrote</p>
              <p className="mt-1 text-[15px] text-ink leading-relaxed whitespace-pre-line break-words">
                {grievance.description || 'No description added.'}
              </p>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader
              title="What has happened so far"
              icon={<ListChecks className="w-5 h-5" aria-hidden="true" />}
            />
            <div className="px-5 pb-5">
              <GrievanceTimeline timeline={grievance.timeline} currentStatus={grievance.status} />
            </div>
          </Card>

          {/* Attachments */}
          {grievance.attachments && grievance.attachments.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader
                title="Attachments"
                description={`${grievance.attachments.length} ${grievance.attachments.length === 1 ? 'file' : 'files'}`}
                icon={<Paperclip className="w-5 h-5" aria-hidden="true" />}
              />
              <ul className="border-t border-line divide-y divide-line">
                {grievance.attachments.map((att) => (
                  <li key={att.id} className="flex items-center gap-3 px-5 py-3">
                    <FileText className="w-5 h-5 shrink-0 text-navy" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-ink">{att.name}</p>
                      <p className="text-[13px] text-muted tabular-nums">
                        {Math.max(1, Math.round(att.size / 1024)).toLocaleString('en-IN')} KB · Added {att.uploadDate}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6 min-w-0">
          {/* Related records */}
          {(grievance.relatedClaimId || hasDocumentLink) && (
            <Card className="overflow-hidden">
              <CardHeader title="Linked records" icon={<Link2 className="w-5 h-5" aria-hidden="true" />} />
              <ul className="border-t border-line divide-y divide-line">
                {grievance.relatedClaimId && (
                  <li className="px-5 py-4 space-y-2">
                    <p className="text-[13px] text-muted">
                      Crop insurance claim <span className="tabular-nums">{grievance.relatedClaimId}</span>
                    </p>
                    {relatedClaim ? (
                      <>
                        <p className="font-semibold text-navy">
                          {relatedClaim.crop}, {relatedClaim.season} {relatedClaim.year}
                        </p>
                        <StatusBadge status={relatedClaim.status} />
                      </>
                    ) : (
                      <p className="text-sm text-muted">Claim details are not in your records.</p>
                    )}
                    <div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onNavigateToClaim && onNavigateToClaim(grievance.relatedClaimId!)}
                      >
                        View claim <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                )}

                {hasDocumentLink && (
                  <li className="px-5 py-4 space-y-2">
                    <p className="text-[13px] text-muted">Document</p>
                    <p className="font-semibold text-navy break-words">{documentTitle}</p>
                    {relatedDocument?.status ? (
                      <StatusBadge status={relatedDocument.status} />
                    ) : (
                      <p className="text-sm text-muted">Not found in your document locker.</p>
                    )}
                    <div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onNavigateToDocument && onNavigateToDocument(grievance.relatedDocumentId)}
                      >
                        View document <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                )}
              </ul>
            </Card>
          )}

          {/* Ask the assistant */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Questions about this grievance"
              description="Ask the assistant in Hindi, Punjabi or English."
              icon={<HelpCircle className="w-5 h-5" aria-hidden="true" />}
            />
            <ul className="px-5 space-y-2">
              {suggestedAIQuestions.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => onAskAI && onAskAI(q)}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-left text-sm text-ink hover:bg-offwhite"
                  >
                    <span>{q}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-5 pt-4 pb-5">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => onAskAI && onAskAI('Explain my grievance and what I should do next.')}
              >
                Ask the assistant
              </Button>
              {officer?.phone && (
                <p className="mt-4 flex items-center gap-2 text-sm text-ink">
                  <Phone className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
                  <span>
                    Office phone <span className="font-semibold text-navy tabular-nums">{officer.phone}</span>
                  </span>
                </p>
              )}
              <p className="mt-2 text-[13px] text-muted">
                Kisan Call Centre (free): <span className="tabular-nums">1800-180-1551</span>
              </p>
            </div>
          </Card>

          <InformationOnlyBanner message="KrishiSahyog does not file complaints with the government. This grievance is tracked in this app only. To file an official complaint, use the CPGRAMS portal." />
        </div>
      </div>
    </div>
  );
};
