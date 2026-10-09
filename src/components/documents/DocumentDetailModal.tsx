import React, { useState } from 'react';
import { ArrowRight, Building, ChevronDown, HelpCircle, Upload } from 'lucide-react';
import { Document } from '../../types';
import { OfficialPortalButton, StatusBadge } from '../common';
import { Button, Modal } from '../ui';
import { SourceVerificationCard } from './SourceVerificationCard';

interface DocumentDetailModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToClaim?: (claimId: string) => void;
  onOpenUpload?: (docType: Document['docType']) => void;
  onCreateGrievance?: (doc: Document) => void;
}

/** "LAND_REVENUE" -> "Land revenue" */
const formatCategory = (category?: string) =>
  category ? category.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Document';

const STATUS_MEANING: Record<string, string> = {
  AVAILABLE: 'This document is in your locker.',
  MISSING: 'This document is not in your locker yet.',
  INVALID: 'There is a problem with this document. Get a correct copy and upload it again.',
  EXPIRED: 'This document has expired. Get a new copy and upload it.',
  PENDING_REVIEW: 'You have uploaded this document. It is waiting for review.',
  NOT_REQUIRED: 'You do not need this document right now.',
};

interface SectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<SectionProps> = ({ id, title, icon, expanded, onToggle, children }) => (
  <div className="rounded-lg border border-line">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={id}
      className="flex w-full min-h-11 items-center justify-between gap-3 rounded-lg px-4 py-3 text-left hover:bg-offwhite"
    >
      <span className="flex items-center gap-2 font-semibold text-navy">
        <span className="text-muted" aria-hidden="true">
          {icon}
        </span>
        {title}
      </span>
      <ChevronDown
        className={`w-5 h-5 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>
    {expanded && (
      <div id={id} className="border-t border-line px-4 py-3 text-[15px] text-ink leading-relaxed">
        {children}
      </div>
    )}
  </div>
);

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  isOpen,
  onClose,
  onNavigateToClaim,
  onOpenUpload,
  onCreateGrievance,
}) => {
  const [whyExpanded, setWhyExpanded] = useState(true);
  const [whereExpanded, setWhereExpanded] = useState(true);

  if (!isOpen || !document) return null;

  const isMissing = document.status === 'MISSING';
  const isInvalidOrExpired = document.status === 'INVALID' || document.status === 'EXPIRED';
  const statusMeaning = (document.status && STATUS_MEANING[document.status]) || 'Status not known.';
  const issuer = document.issuingAuthority || document.issuer;

  const facts = [
    { label: 'Reference', value: document.docReferenceMasked },
    { label: 'Issued on', value: document.issueDate },
    { label: 'Valid until', value: document.expiryDate },
    { label: 'Last checked', value: document.lastChecked },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.title || document.name || 'Document'}
      description={formatCategory(document.category)}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {(isMissing || isInvalidOrExpired) && onOpenUpload && (
            <Button
              onClick={() => {
                onClose();
                onOpenUpload(document.docType);
              }}
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              {isMissing ? 'Upload document' : 'Upload new copy'}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Status */}
        <section aria-label="Status">
          <StatusBadge status={document.status ?? document.verificationStatus} />
          <p className="mt-2 text-[15px] text-ink">{statusMeaning}</p>
          {facts.length > 0 && (
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {facts.map(({ label, value }) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[13px] text-muted">{label}</dt>
                  <dd className="font-semibold text-navy tabular-nums break-words">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* Related claim */}
        {document.relatedClaimId && (
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-offwhite px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[13px] text-muted">Needed for your crop insurance claim</p>
              <p className="font-semibold text-navy tabular-nums">{document.relatedClaimId}</p>
            </div>
            {onNavigateToClaim && (
              <Button
                variant="secondary"
                className="self-start sm:self-auto"
                onClick={() => {
                  onClose();
                  onNavigateToClaim(document.relatedClaimId!);
                }}
              >
                Go to claim <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}

        <CollapsibleSection
          id="document-why-required"
          title="Why you need this"
          icon={<HelpCircle className="w-4 h-4" />}
          expanded={whyExpanded}
          onToggle={() => setWhyExpanded(!whyExpanded)}
        >
          {document.whyRequired || 'No details are available yet.'}
        </CollapsibleSection>

        <CollapsibleSection
          id="document-where-to-get"
          title="Where to get it"
          icon={<Building className="w-4 h-4" />}
          expanded={whereExpanded}
          onToggle={() => setWhereExpanded(!whereExpanded)}
        >
          <dl className="space-y-3">
            <div>
              <dt className="text-[13px] text-muted">Issued by</dt>
              <dd className="font-semibold text-navy">{issuer || 'Not known yet.'}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted">How to get it</dt>
              <dd>{document.whereToObtain || 'No details are available yet.'}</dd>
            </div>
            {document.submissionProcess && (
              <div>
                <dt className="text-[13px] text-muted">How it is submitted</dt>
                <dd>{document.submissionProcess}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4">
            {document.officialPortalUrl ? (
              <OfficialPortalButton
                href={document.officialPortalUrl}
                portalName={document.officialPortalName || 'Open official portal'}
              />
            ) : (
              <p className="text-sm text-muted">No official website is listed for this document.</p>
            )}
          </div>
        </CollapsibleSection>

        {/* Grievance */}
        <div className="flex flex-col gap-3 rounded-lg border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-navy">Having trouble with this document?</p>
            <p className="text-sm text-muted mt-0.5">
              If the office is not issuing or correcting it, you can raise a grievance.
            </p>
          </div>
          <Button
            variant="secondary"
            className="self-start sm:self-auto shrink-0"
            onClick={() => {
              onClose();
              if (onCreateGrievance) onCreateGrievance(document);
            }}
            id="doc-create-grievance-btn"
          >
            Raise a grievance
          </Button>
        </div>

        <SourceVerificationCard
          authority={document.sourceAuthority || document.issuingAuthority}
          source={document.source}
          document={document.sourceDocument}
          section={document.sourceSection}
          version={document.sourceVersion}
          lastVerified={document.sourceLastVerified || document.lastChecked}
          verificationStatus={document.isDemo ? 'DEMO' : document.sourceStatus || 'UNKNOWN'}
        />
      </div>
    </Modal>
  );
};
