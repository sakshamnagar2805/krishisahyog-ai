import React, { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { PMFBYClaim } from '../../types';
import { EmptyState, StatusBadge } from '../../components/common';
import { Button, Card, Chip, KeyValueGrid, SectionHeading, fieldControl, fieldLabel } from '../../components/ui';

interface MyClaimsListProps {
  claims: PMFBYClaim[];
  onSelectClaim: (claimId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

const CALAMITY_LABEL: Record<PMFBYClaim['calamityType'], string> = {
  HAILSTORM: 'Hailstorm',
  INUNDATION: 'Flooding',
  DROUGHT: 'Drought',
  PEST_ATTACK: 'Pest attack',
};

const needsAction = (claim: PMFBYClaim) => claim.status === 'ADDITIONAL INFORMATION REQUIRED';
const isResolved = (claim: PMFBYClaim) => claim.status === 'RESOLVED' || claim.status === 'CLOSED';

export const MyClaimsList: React.FC<MyClaimsListProps> = ({ claims, onSelectClaim, onNavigateTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'RESOLVED'>('ALL');

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.policyId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTION_REQUIRED') {
      return needsAction(claim);
    }
    if (statusFilter === 'RESOLVED') {
      return isResolved(claim);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="My claims"
        description={`Showing ${filteredClaims.length} of ${claims.length} ${claims.length === 1 ? 'claim' : 'claims'}`}
      />

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-80">
          <label htmlFor="pmfby-claim-search" className={fieldLabel}>
            Search claims
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="pmfby-claim-search"
              type="search"
              placeholder="Claim number, policy or crop"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${fieldControl} pl-9`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter claims by status">
          <Chip active={statusFilter === 'ALL'} count={claims.length} onClick={() => setStatusFilter('ALL')}>
            All
          </Chip>
          <Chip
            active={statusFilter === 'ACTION_REQUIRED'}
            count={claims.filter(needsAction).length}
            onClick={() => setStatusFilter('ACTION_REQUIRED')}
          >
            Needs action
          </Chip>
          <Chip
            active={statusFilter === 'RESOLVED'}
            count={claims.filter(isResolved).length}
            onClick={() => setStatusFilter('RESOLVED')}
          >
            Resolved
          </Chip>
        </div>
      </div>

      {filteredClaims.length === 0 ? (
        <Card>
          <EmptyState
            title="No claims match"
            description="Try a different search or clear the filters."
            actionLabel="Clear search and filters"
            onAction={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
          />
        </Card>
      ) : (
        <ul className="space-y-4">
          {filteredClaims.map((claim) => (
            <li key={claim.id}>
              <Card as="article">
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold leading-tight text-navy tabular-nums">
                      Claim {claim.claimId}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {claim.season} {claim.year} · {claim.district}, {claim.state} · Policy{' '}
                      <span className="tabular-nums">{claim.policyId}</span>
                    </p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>

                <KeyValueGrid
                  columns={4}
                  items={[
                    {
                      label: 'Crop',
                      value: (
                        <>
                          {claim.crop}
                          <span className="block text-[13px] font-normal text-muted">{claim.variety}</span>
                        </>
                      ),
                    },
                    {
                      label: 'Sum insured',
                      value: (
                        <>
                          <span className="tabular-nums">₹{claim.sumInsured.toLocaleString('en-IN')}</span>
                          <span className="block text-[13px] font-normal text-muted tabular-nums">
                            {claim.surveyParcelSizeAcres} acres
                          </span>
                        </>
                      ),
                    },
                    {
                      label: 'Damage',
                      value: (
                        <>
                          {CALAMITY_LABEL[claim.calamityType]}
                          <span className="block text-[13px] font-normal text-muted tabular-nums">
                            {claim.assessedLossPercent}% crop loss assessed
                          </span>
                        </>
                      ),
                    },
                    {
                      label: 'Next step',
                      value: (
                        <>
                          {claim.nextAction}
                          <span className="block text-[13px] font-normal text-muted">Updated {claim.lastUpdated}</span>
                        </>
                      ),
                    },
                  ]}
                />

                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">
                    Submitted <span className="font-medium text-ink">{claim.submissionDate}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {needsAction(claim) && (
                      <Button
                        size="md"
                        onClick={() => {
                          onSelectClaim(claim.id);
                          onNavigateTab('claim-documents');
                        }}
                      >
                        Check documents
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => {
                        onSelectClaim(claim.id);
                        onNavigateTab('claim-detail');
                      }}
                    >
                      View claim <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
