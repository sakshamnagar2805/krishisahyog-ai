import React, { useState, useMemo } from 'react';
import { Bot, CheckCircle2, ChevronRight, Search, X } from 'lucide-react';
import { MatchedSchemeResult, Scheme, SchemeDiscoveryInputs } from '../../types';
import { StatusBadge, EmptyState, LoadingState } from '../common';
import { Button, Card, Chip, Notice, SectionHeading, fieldControl, fieldLabel } from '../ui';

interface SchemeResultsViewProps {
  results: MatchedSchemeResult[];
  inputs: SchemeDiscoveryInputs;
  onSelectScheme: (schemeId: string) => void;
  onModifyInformation: () => void;
  onAskAI?: (prompt?: string) => void;
  onNavigateToDocuments?: () => void;
  isLoading?: boolean;
}

/** Plain-language names for scheme categories */
export const SCHEME_CATEGORY_LABELS: Record<Scheme['category'], string> = {
  FINANCIAL: 'Income support',
  SUBSIDY: 'Equipment subsidy',
  CREDIT: 'Loans and credit',
  INPUT_SUBSIDY: 'Seeds and inputs',
  INFRASTRUCTURE: 'Farm infrastructure',
  INSURANCE: 'Insurance',
  SOLAR: 'Solar',
  EQUIPMENT: 'Equipment',
};

/** Shows whether scheme information is still current. Current schemes can hide the badge. */
export const SchemeValidityBadge: React.FC<{ status: Scheme['validityStatus']; hideWhenCurrent?: boolean }> = ({
  status,
  hideWhenCurrent = false,
}) => {
  switch (status) {
    case 'CURRENT':
      return hideWhenCurrent ? null : <StatusBadge status="ACTIVE" label="Current" />;
    case 'SUPERSEDED':
      return <StatusBadge status="EXPIRED" label="Outdated" />;
    case 'EXPIRED':
      return <StatusBadge status="EXPIRED" label="Expired" />;
    case 'DRAFT':
      return <StatusBadge status="UNKNOWN" label="Draft" />;
    default:
      return <StatusBadge status="UNKNOWN" label="Not confirmed" />;
  }
};

export const SchemeResultsView: React.FC<SchemeResultsViewProps> = ({
  results,
  inputs,
  onSelectScheme,
  onModifyInformation,
  onAskAI,
  onNavigateToDocuments,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCrop] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDocReadiness, setSelectedDocReadiness] = useState<string>('ALL');

  // Categories present in the results, in a stable order
  const categoryOptions = useMemo(() => {
    const present = new Set(results.map((r) => r.scheme.category));
    return (Object.keys(SCHEME_CATEGORY_LABELS) as Scheme['category'][]).filter((c) => present.has(c));
  }, [results]);

  // Filter matched schemes
  const filteredResults = useMemo(() => {
    return results.filter((res) => {
      const scheme = res.scheme;

      // 1. Category Filter
      if (selectedCategory !== 'ALL' && scheme.category !== selectedCategory) {
        return false;
      }

      // 2. Crop Filter
      if (selectedCrop !== 'ALL') {
        const hasCrop =
          scheme.applicableCrops.includes(selectedCrop) ||
          scheme.applicableCrops.includes('All crops') ||
          scheme.applicableCrops.includes('Other');
        if (!hasCrop) return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'ALL' && scheme.validityStatus !== selectedStatus) {
        return false;
      }

      // 4. Document Readiness Filter
      if (selectedDocReadiness === 'HAS_MISSING') {
        if (res.documentReadiness.missing.length === 0) return false;
      } else if (selectedDocReadiness === 'ALL_AVAILABLE') {
        if (res.documentReadiness.missing.length > 0) return false;
      }

      // 5. Search Text Filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const nameMatch = scheme.name.toLowerCase().includes(query);
        const catMatch =
          scheme.category.toLowerCase().includes(query) ||
          (SCHEME_CATEGORY_LABELS[scheme.category] || '').toLowerCase().includes(query);
        const descMatch = (scheme.shortDescription || scheme.summary).toLowerCase().includes(query);
        const authMatch = scheme.authority.toLowerCase().includes(query);
        const cropMatch = scheme.applicableCrops.some((c) => c.toLowerCase().includes(query));

        return nameMatch || catMatch || descMatch || authMatch || cropMatch;
      }

      return true;
    });
  }, [results, selectedCategory, selectedCrop, selectedStatus, selectedDocReadiness, searchTerm]);

  const filtersActive =
    searchTerm.trim() !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedDocReadiness !== 'ALL';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedDocReadiness('ALL');
  };

  if (isLoading) {
    return (
      <Card>
        <LoadingState message="Finding schemes that may be relevant to you…" />
      </Card>
    );
  }

  // Not enough information to suggest schemes
  const isInsufficient = !inputs.state || !inputs.district || !inputs.crop;
  if (isInsufficient) {
    return (
      <Card className="space-y-4 p-5">
        <Notice tone="warning" title="We need a few more details">
          <p>Tell us the following so we can suggest schemes:</p>
          <ul className="mt-1 list-disc pl-5">
            {!inputs.state && <li>Your state</li>}
            {!inputs.district && <li>Your district</li>}
            {!inputs.crop && <li>Your main crop</li>}
          </ul>
        </Notice>
        <Button onClick={onModifyInformation}>Add my details</Button>
      </Card>
    );
  }

  const missingInfo = Array.from(
    new Set(results.flatMap((r) => r.missingInfoForFullAssessment || []))
  ).map((item) => item.toLowerCase());

  return (
    <div className="space-y-6" id="scheme-results-container">
      {/* Answers used + filters */}
      <Card>
        <div className="flex flex-col gap-3 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] text-muted">Suggestions based on your answers</p>
            <p className="mt-0.5 text-[15px] text-ink">
              {inputs.district}, {inputs.state} · {inputs.crop} ·{' '}
              <span className="tabular-nums">
                {inputs.landCategory} land, {inputs.landAreaAcres} acres
              </span>
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onModifyInformation} id="btn-modify-criteria" className="self-start sm:self-auto">
            Change my answers
          </Button>
        </div>

        <div className="space-y-4 border-t border-line px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="min-w-0 md:col-span-2">
              <label htmlFor="search-schemes-input" className={fieldLabel}>
                Search schemes
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Scheme name, department or crop"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${fieldControl} pr-11 pl-9`}
                  id="search-schemes-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-offwhite hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <label htmlFor="filter-scheme-category" className={fieldLabel}>
                Type of scheme
              </label>
              <select
                id="filter-scheme-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={fieldControl}
              >
                <option value="ALL">All types</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {SCHEME_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label htmlFor="filter-scheme-status" className={fieldLabel}>
                Information
              </label>
              <select
                id="filter-scheme-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={fieldControl}
              >
                <option value="ALL">All</option>
                <option value="CURRENT">Current only</option>
                <option value="SUPERSEDED">Outdated</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by documents">
            <span className="text-sm text-muted">Documents:</span>
            <Chip active={selectedDocReadiness === 'ALL'} onClick={() => setSelectedDocReadiness('ALL')}>
              Any
            </Chip>
            <Chip active={selectedDocReadiness === 'ALL_AVAILABLE'} onClick={() => setSelectedDocReadiness('ALL_AVAILABLE')}>
              Nothing missing
            </Chip>
            <Chip active={selectedDocReadiness === 'HAS_MISSING'} onClick={() => setSelectedDocReadiness('HAS_MISSING')}>
              Some documents missing
            </Chip>
            {filtersActive && (
              <Button variant="link" className="ml-1 min-h-9" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {missingInfo.length > 0 && (
        <Notice tone="info">
          Add your {missingInfo.join(', ')} to get better suggestions.{' '}
          <Button variant="link" onClick={onModifyInformation}>
            Add details
          </Button>
        </Notice>
      )}

      {filteredResults.length > 0 ? (
        <section>
          <SectionHeading
            title={`${filteredResults.length} ${filteredResults.length === 1 ? 'scheme' : 'schemes'} may be relevant to you`}
            description="Based on what you told us. The department decides final eligibility when you apply."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredResults.map((result) => {
              const scheme = result.scheme;
              const stillNeeded = [...result.documentReadiness.missing, ...result.documentReadiness.invalidOrExpired];

              return (
                <Card as="article" key={scheme.id} className="flex min-w-0 flex-col p-5" id={`scheme-card-${scheme.id.toLowerCase()}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[13px] text-muted">{scheme.authority}</p>
                    <SchemeValidityBadge status={scheme.validityStatus} hideWhenCurrent />
                  </div>
                  <h3 className="mt-1 font-display text-lg leading-snug font-semibold text-navy">{scheme.name}</h3>
                  <p className="mt-1 line-clamp-3 text-[15px] text-ink">{scheme.shortDescription || scheme.summary}</p>

                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="font-semibold text-navy">Why it may fit</dt>
                      <dd className="mt-1">
                        <ul className="list-disc space-y-0.5 pl-5 text-ink">
                          {result.relevanceReasons.slice(0, 3).map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-navy">Documents still needed</dt>
                      <dd className="mt-1 text-ink">
                        {stillNeeded.length > 0 ? (
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span>{stillNeeded.map((d) => d.title).join(', ')}</span>
                            {onNavigateToDocuments && (
                              <Button variant="link" onClick={() => onNavigateToDocuments()}>
                                Go to documents
                              </Button>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-brand-dark" aria-hidden="true" />
                            None. Your documents are ready.
                          </span>
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-navy">Where to apply</dt>
                      <dd className="mt-1 text-ink">{scheme.whereToApply.channel}</dd>
                    </div>
                  </dl>

                  <div className="mt-auto pt-5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectScheme(scheme.id)}
                      id={`btn-view-scheme-${scheme.id.toLowerCase()}`}
                    >
                      View details <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : (
        <Card>
          <EmptyState
            title="No schemes found"
            description={
              filtersActive
                ? 'No schemes match these filters. Try clearing the filters or changing your answers.'
                : 'We could not find schemes for your state and crop in this app. Try changing your answers.'
            }
            actionLabel="Change my answers"
            onAction={onModifyInformation}
          />
          {(filtersActive || onAskAI) && (
            <div className="-mt-4 flex flex-wrap justify-center gap-2 px-5 pb-8">
              {filtersActive && (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
              {onAskAI && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onAskAI(`Which agricultural schemes are potentially available for ${inputs.crop} farmers in ${inputs.state}?`)
                  }
                >
                  <Bot className="h-4 w-4" aria-hidden="true" /> Ask the assistant about schemes
                </Button>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
