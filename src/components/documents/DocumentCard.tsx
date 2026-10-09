import React, { useEffect, useRef } from 'react';
import { ArrowRight, Compass, FileText, Upload } from 'lucide-react';
import { Document } from '../../types';
import { StatusBadge } from '../common';
import { Button } from '../ui';

interface DocumentCardProps {
  document: Document;
  isHighlighted?: boolean;
  onSelectDocument: (document: Document) => void;
  onNavigateToClaim?: (claimId: string) => void;
  onOpenUpload?: (docType: Document['docType']) => void;
  onFindRelatedSchemes?: (document: Document) => void;
}

/** "LAND_REVENUE" -> "Land revenue" */
const formatCategory = (category?: string) =>
  category ? category.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Document';

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isHighlighted = false,
  onSelectDocument,
  onNavigateToClaim,
  onOpenUpload,
  onFindRelatedSchemes,
}) => {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  const isMissing = document.status === 'MISSING';
  const isAvailable = document.status === 'AVAILABLE';
  const isInvalidOrExpired = document.status === 'INVALID' || document.status === 'EXPIRED';
  const issuer = document.issuingAuthority || document.issuer;

  return (
    <article
      ref={cardRef}
      id={`document-card-${document.id}`}
      className={`flex flex-col rounded-lg bg-white p-5 min-w-0 ${
        isHighlighted ? 'border-2 border-navy' : 'border border-line'
      }`}
      aria-current={isHighlighted ? 'true' : undefined}
    >
      {isHighlighted && <p className="mb-3 text-[13px] font-semibold text-navy">Selected document</p>}

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy">
          <FileText className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted">{formatCategory(document.category)}</p>
          <h3 className="font-display text-lg font-semibold leading-snug text-navy break-words">
            {document.title || document.name}
          </h3>
        </div>
        <StatusBadge status={document.status ?? document.verificationStatus} className="shrink-0" />
      </div>

      {document.description && <p className="mt-3 text-sm text-muted line-clamp-2">{document.description}</p>}

      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        {issuer && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted shrink-0">Issued by</dt>
            <dd className="text-ink sm:text-right min-w-0 break-words">{issuer}</dd>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted shrink-0">Reference</dt>
          <dd className="text-ink sm:text-right tabular-nums">{document.docReferenceMasked || 'Not added yet'}</dd>
        </div>
        {document.relatedClaimId && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-muted shrink-0">Needed for claim</dt>
            <dd className="flex flex-wrap items-center gap-x-3 sm:justify-end">
              <span className="text-ink tabular-nums">{document.relatedClaimId}</span>
              {onNavigateToClaim && (
                <Button variant="link" className="!min-h-11" onClick={() => onNavigateToClaim(document.relatedClaimId!)}>
                  View claim <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              )}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Button variant="secondary" onClick={() => onSelectDocument(document)} id={`btn-view-guidance-${document.id}`}>
          {isAvailable ? 'View details' : 'How to get it'}
        </Button>

        {(isMissing || isInvalidOrExpired) && onOpenUpload && (
          <Button variant="secondary" onClick={() => onOpenUpload(document.docType)}>
            <Upload className="w-4 h-4" aria-hidden="true" />
            {isMissing ? 'Upload' : 'Replace'}
          </Button>
        )}

        {onFindRelatedSchemes && (
          <Button
            variant="link"
            className="!min-h-11"
            onClick={() => onFindRelatedSchemes(document)}
            title="Find schemes that may need this document"
            id={`btn-find-schemes-${document.id.toLowerCase()}`}
          >
            <Compass className="w-4 h-4" aria-hidden="true" /> Related schemes
          </Button>
        )}
      </div>
    </article>
  );
};
