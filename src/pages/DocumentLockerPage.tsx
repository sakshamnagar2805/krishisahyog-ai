import React, { useState, useMemo, useEffect } from 'react';
import { ArrowRight, Search, Upload, X } from 'lucide-react';
import { Document } from '../types';
import { EmptyState, InformationOnlyBanner, OfficialPortalButton } from '../components/common';
import { Button, Card, Chip, Notice, PageHeader, fieldControl } from '../components/ui';
import { DocumentReadinessSummary, DocumentCard, DocumentDetailModal } from '../components/documents';

interface DocumentLockerPageProps {
  documents: Document[];
  highlightedDocId?: string;
  onOpenUpload?: (docType?: Document['docType']) => void;
  onNavigateToClaim?: (claimId: string) => void;
  onNavigate?: (tabId: string) => void;
  onFindRelatedSchemes?: (doc: Document) => void;
  onCreateGrievance?: (doc: Document) => void;
}

type FilterCategory = 'ALL' | 'REQUIRED' | 'AVAILABLE' | 'MISSING' | 'INVALID_EXPIRED';

export const DocumentLockerPage: React.FC<DocumentLockerPageProps> = ({
  documents,
  highlightedDocId,
  onOpenUpload,
  onNavigateToClaim,
  onNavigate,
  onFindRelatedSchemes,
  onCreateGrievance,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHighlightedId, setActiveHighlightedId] = useState<string | undefined>(highlightedDocId);
  const [selectedDocumentForModal, setSelectedDocumentForModal] = useState<Document | null>(null);

  // If highlightedDocId prop changes, update activeHighlightedId
  useEffect(() => {
    if (highlightedDocId) {
      setActiveHighlightedId(highlightedDocId);
    }
  }, [highlightedDocId]);

  const handleLocalUpload = (docType?: Document['docType']) => {
    onOpenUpload?.(docType || 'JAMABANDI');
  };

  const goToClaim = (claimId: string) => {
    if (onNavigateToClaim) {
      onNavigateToClaim(claimId);
    } else if (onNavigate) {
      onNavigate('pmfby-crop-insurance');
    }
  };

  const highlightedDocument = documents.find((d) => d.id === activeHighlightedId);

  // Claim these documents belong to: the highlighted document's claim, else the first linked document's
  const relatedClaimId =
    highlightedDocument?.relatedClaimId ?? documents.find((d) => d.relatedClaimId)?.relatedClaimId;

  const filters: { id: FilterCategory; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: documents.length },
    { id: 'REQUIRED', label: 'Needed for claim', count: documents.filter((d) => d.isBlockerForClaim).length },
    { id: 'AVAILABLE', label: 'Available', count: documents.filter((d) => d.status === 'AVAILABLE').length },
    { id: 'MISSING', label: 'Missing', count: documents.filter((d) => d.status === 'MISSING').length },
    {
      id: 'INVALID_EXPIRED',
      label: 'Invalid or expired',
      count: documents.filter((d) => d.status === 'INVALID' || d.status === 'EXPIRED').length,
    },
  ];

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Status Filter
      if (selectedFilter === 'AVAILABLE' && doc.status !== 'AVAILABLE') return false;
      if (selectedFilter === 'MISSING' && doc.status !== 'MISSING') return false;
      if (selectedFilter === 'INVALID_EXPIRED' && doc.status !== 'INVALID' && doc.status !== 'EXPIRED') return false;
      if (selectedFilter === 'REQUIRED' && !doc.isBlockerForClaim) return false;

      // 2. Search Query Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const titleMatch = (doc.title || doc.name || '').toLowerCase().includes(query);
        const typeMatch = (doc.documentType || doc.docType || '').toLowerCase().includes(query);
        const statusMatch = (doc.status || '').toLowerCase().includes(query);
        const categoryMatch = (doc.category || '').toLowerCase().includes(query);
        const authorityMatch = (doc.issuingAuthority || doc.issuer || '').toLowerCase().includes(query);

        return titleMatch || typeMatch || statusMatch || categoryMatch || authorityMatch;
      }

      return true;
    });
  }, [documents, selectedFilter, searchQuery]);

  return (
    <div className="space-y-6" id="document-assistant-page">
      <PageHeader
        title="Documents"
        description="Keep the papers for your crop insurance claim and schemes ready. See what is missing and where to get it."
        actions={
          <>
            <Button onClick={() => handleLocalUpload('JAMABANDI')} id="btn-upload-prototype-doc">
              <Upload className="w-4 h-4" aria-hidden="true" /> Upload document
            </Button>
            <OfficialPortalButton href="https://digilocker.gov.in" portalName="DigiLocker" />
          </>
        }
      />

      <div id="document-assistant-trust-banner">
        <InformationOnlyBanner message="KrishiSahyog helps you understand which documents you need. Documents are checked and accepted only by the office that issues them or through the official portal." />
      </div>

      {/* Shown when arriving from a claim's required documents */}
      {highlightedDocument && (
        <Notice
          tone={highlightedDocument.isBlockerForClaim ? 'warning' : 'info'}
          title={
            highlightedDocument.isBlockerForClaim
              ? `Action needed${highlightedDocument.relatedClaimId ? ` for claim ${highlightedDocument.relatedClaimId}` : ''}`
              : 'Selected document'
          }
          action={
            <Button variant="secondary" size="sm" onClick={() => setActiveHighlightedId(undefined)}>
              Dismiss
            </Button>
          }
        >
          {highlightedDocument.title}
          {highlightedDocument.isBlockerForClaim
            ? ' is shown below. Open it to see how to get it.'
            : ' is shown below.'}
        </Notice>
      )}

      <DocumentReadinessSummary
        documents={documents}
        activeFilter={selectedFilter}
        onSelectFilter={(f) => setSelectedFilter(f)}
      />

      {/* Filters and search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 overflow-x-auto" role="group" aria-label="Filter documents">
          <div className="flex gap-2 min-w-max">
            {filters.map((filter) => (
              <Chip
                key={filter.id}
                id={`filter-tab-${filter.id.toLowerCase()}`}
                active={selectedFilter === filter.id}
                count={filter.count}
                onClick={() => setSelectedFilter(filter.id)}
              >
                {filter.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <label htmlFor="document-search" className="sr-only">
            Search documents
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="document-search"
            type="text"
            placeholder="Search by name, office or status"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${fieldControl} pl-9 pr-11`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-md text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Documents */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isHighlighted={activeHighlightedId === doc.id}
              onSelectDocument={(d) => setSelectedDocumentForModal(d)}
              onNavigateToClaim={goToClaim}
              onOpenUpload={(docType) => handleLocalUpload(docType)}
              onFindRelatedSchemes={(d) => {
                if (onFindRelatedSchemes) {
                  onFindRelatedSchemes(d);
                } else if (onNavigate) {
                  onNavigate('government-schemes');
                }
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No documents match"
            description="Try another filter or search word."
            actionLabel="Clear filter and search"
            onAction={() => {
              setSelectedFilter('ALL');
              setSearchQuery('');
            }}
          />
        </Card>
      )}

      {/* Link back to the claim these documents are for */}
      {relatedClaimId && (onNavigateToClaim || onNavigate) && (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-navy">Your crop insurance claim</p>
            <p className="text-sm text-muted mt-0.5">
              These documents are used for claim <span className="tabular-nums text-ink">{relatedClaimId}</span>.
            </p>
          </div>
          <Button variant="secondary" className="self-start sm:self-auto" onClick={() => goToClaim(relatedClaimId)}>
            Go to claim <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </Card>
      )}

      <DocumentDetailModal
        document={selectedDocumentForModal}
        isOpen={Boolean(selectedDocumentForModal)}
        onClose={() => setSelectedDocumentForModal(null)}
        onNavigateToClaim={(claimId) => {
          setSelectedDocumentForModal(null);
          goToClaim(claimId);
        }}
        onOpenUpload={(docType) => {
          setSelectedDocumentForModal(null);
          handleLocalUpload(docType);
        }}
        onCreateGrievance={onCreateGrievance}
      />
    </div>
  );
};
