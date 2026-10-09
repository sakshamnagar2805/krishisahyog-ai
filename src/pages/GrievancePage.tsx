import React, { useState, useEffect, useMemo } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import {
  Grievance,
  GrievanceCategory,
  Farmer,
  PMFBYClaim,
  Document,
  User,
} from '../types';
import { InformationOnlyBanner, OfficialPortalButton, EmptyState, LoadingState } from '../components/common';
import { Button, Card, Chip, PageHeader, fieldControl, fieldLabel } from '../components/ui';
import { GrievanceCard } from '../components/grievances/GrievanceCard';
import { GrievanceDetailView } from '../components/grievances/GrievanceDetailView';
import { CreateGrievanceView } from '../components/grievances/CreateGrievanceView';
import { dataProvider } from '../services';

interface GrievancePageProps {
  currentUser?: User;
  farmer?: Farmer | null;
  claims?: PMFBYClaim[];
  documents?: Document[];
  initialGrievanceId?: string | null;
  initialPrefill?: {
    category?: GrievanceCategory;
    relatedClaimId?: string;
    relatedDocumentName?: string;
    openCreate?: boolean;
  };
  onNavigateTab?: (tab: string) => void;
  onAskAI?: (question: string) => void;
  onNavigateToClaim?: (claimId: string) => void;
  onNavigateToDocument?: (docIdOrType?: string) => void;
  onGrievanceCreated?: (grievance: Grievance) => void;
}

type TabFilter = 'ALL' | 'SUBMITTED' | 'UNDER REVIEW' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';

export const GrievancePage: React.FC<GrievancePageProps> = ({
  currentUser,
  farmer,
  claims = [],
  documents = [],
  initialGrievanceId,
  initialPrefill,
  onNavigateTab,
  onAskAI,
  onNavigateToClaim,
  onNavigateToDocument,
  onGrievanceCreated,
}) => {
  const farmerId = currentUser?.id || farmer?.id || 'DEMO-FRM-1001';

  // Component state
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'LIST' | 'CREATE' | 'DETAIL'>(
    initialPrefill?.openCreate ? 'CREATE' : initialGrievanceId ? 'DETAIL' : 'LIST'
  );
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(
    initialGrievanceId || null
  );

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [trackInput, setTrackInput] = useState('');
  const [trackError, setTrackError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TabFilter>('ALL');

  // Load grievances for current user
  useEffect(() => {
    const fetchGrievances = async () => {
      setLoading(true);
      try {
        // User data isolation: strictly filter by currentUser.id
        const userGrievances = await dataProvider.getGrievances(farmerId);
        setGrievances(userGrievances);

        if (initialGrievanceId) {
          const found = userGrievances.find(
            (g) => g.id === initialGrievanceId || g.grievanceId === initialGrievanceId
          );
          if (found) {
            setSelectedGrievanceId(found.id);
            setActiveView('DETAIL');
          }
        }
      } catch (err) {
        console.error('Failed to load grievances:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();
  }, [farmerId, initialGrievanceId]);

  // If initialPrefill changes to openCreate, switch view
  useEffect(() => {
    if (initialPrefill?.openCreate) {
      setActiveView('CREATE');
    }
  }, [initialPrefill]);

  // Filtered grievances
  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      // Status filter
      if (activeFilter === 'SUBMITTED' && g.status !== 'SUBMITTED') return false;
      if (activeFilter === 'UNDER REVIEW' && g.status !== 'UNDER REVIEW') return false;
      if (
        activeFilter === 'ACTION_REQUIRED' &&
        g.status !== 'ADDITIONAL INFORMATION REQUIRED'
      )
        return false;
      if (activeFilter === 'RESOLVED' && g.status !== 'RESOLVED') return false;
      if (activeFilter === 'CLOSED' && g.status !== 'CLOSED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (g.grievanceId || g.id).toLowerCase().includes(q);
        const subjectMatch = g.subject.toLowerCase().includes(q);
        const categoryMatch = g.category.toLowerCase().includes(q);
        const claimMatch = g.relatedClaimId?.toLowerCase().includes(q) ?? false;
        return idMatch || subjectMatch || categoryMatch || claimMatch;
      }

      return true;
    });
  }, [grievances, activeFilter, searchQuery]);

  // Selected grievance object
  const activeGrievance = useMemo(() => {
    if (!selectedGrievanceId) return null;
    return (
      grievances.find(
        (g) => g.id === selectedGrievanceId || g.grievanceId === selectedGrievanceId
      ) || null
    );
  }, [grievances, selectedGrievanceId]);

  // Handle Track Grievance lookup
  const handleDirectTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    const cleanId = trackInput.trim().toUpperCase();
    if (!cleanId) {
      setTrackError('Enter a grievance ID to track it.');
      return;
    }

    const found = grievances.find(
      (g) =>
        (g.grievanceId || g.id).toUpperCase() === cleanId ||
        (g.ticketId && g.ticketId.toUpperCase() === cleanId)
    );

    if (found) {
      setSelectedGrievanceId(found.id);
      setActiveView('DETAIL');
      setTrackInput('');
    } else {
      // User isolation security rule: do not disclose other users' existence
      setTrackError('No grievance with this ID was found in your records. Check the ID and try again.');
    }
  };

  // Handle grievance creation
  const handleCreateGrievance = async (data: Partial<Grievance>): Promise<Grievance> => {
    const created = await dataProvider.createDemoGrievance({
      ...data,
      farmerId,
      farmerName: farmer?.name || currentUser?.name || 'Ramesh Kumar',
    });

    // Update local state
    setGrievances((prev) => [created, ...prev]);
    onGrievanceCreated?.(created);
    return created;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Grievances" />
        <LoadingState message="Loading your grievances…" />
      </div>
    );
  }

  // CREATE VIEW
  if (activeView === 'CREATE') {
    return (
      <CreateGrievanceView
        onBack={() => setActiveView('LIST')}
        onSubmit={handleCreateGrievance}
        onGrievanceCreated={(created) => {
          setSelectedGrievanceId(created.id);
          setActiveView('DETAIL');
        }}
        prefillCategory={initialPrefill?.category}
        prefillRelatedClaimId={initialPrefill?.relatedClaimId}
        prefillRelatedDocumentName={initialPrefill?.relatedDocumentName}
        availableClaims={claims}
        availableDocuments={documents}
      />
    );
  }

  // DETAIL VIEW
  if (activeView === 'DETAIL' && activeGrievance) {
    const relatedClaim = claims.find(
      (c) => c.id === activeGrievance.relatedClaimId || c.claimId === activeGrievance.relatedClaimId
    );
    const relatedDoc = documents.find(
      (d) =>
        d.id === activeGrievance.relatedDocumentId ||
        d.title.toLowerCase().includes(activeGrievance.relatedDocumentName?.toLowerCase() || '___')
    );

    return (
      <GrievanceDetailView
        grievance={activeGrievance}
        onBack={() => {
          setSelectedGrievanceId(null);
          setActiveView('LIST');
        }}
        onNavigateToClaim={onNavigateToClaim}
        onNavigateToDocument={onNavigateToDocument}
        onAskAI={onAskAI}
        relatedClaim={relatedClaim}
        relatedDocument={relatedDoc}
      />
    );
  }

  const filterChips: { id: TabFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: grievances.length },
    { id: 'SUBMITTED', label: 'Submitted', count: grievances.filter((g) => g.status === 'SUBMITTED').length },
    { id: 'UNDER REVIEW', label: 'Under review', count: grievances.filter((g) => g.status === 'UNDER REVIEW').length },
    {
      id: 'ACTION_REQUIRED',
      label: 'Information required',
      count: grievances.filter((g) => g.status === 'ADDITIONAL INFORMATION REQUIRED').length,
    },
    { id: 'RESOLVED', label: 'Resolved', count: grievances.filter((g) => g.status === 'RESOLVED').length },
    { id: 'CLOSED', label: 'Closed', count: grievances.filter((g) => g.status === 'CLOSED').length },
  ];

  // LIST / LANDING VIEW
  return (
    <div className="space-y-6" id="grievance-landing-page">
      <PageHeader
        title="Grievances"
        description="Keep a record of a problem with a service, such as a delayed claim or a PACS issue, and follow what happens to it."
        actions={
          <>
            <Button onClick={() => setActiveView('CREATE')} id="header-create-grievance-btn">
              <Plus className="w-4 h-4" aria-hidden="true" /> Raise a grievance
            </Button>
            <OfficialPortalButton href="https://pgportal.gov.in" portalName="CPGRAMS portal (pgportal.gov.in)" />
          </>
        }
      />

      <InformationOnlyBanner message="KrishiSahyog does not file complaints with the government. Grievances here are kept in this app so you can track them. To file an official complaint, use the CPGRAMS portal." />

      {/* Search and track */}
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="grievance-search" className={fieldLabel}>
              Search your grievances
            </label>
            <input
              id="grievance-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Subject, category, claim or grievance ID"
              className={fieldControl}
            />
          </div>

          <form onSubmit={handleDirectTrack} className="min-w-0" noValidate>
            <label htmlFor="grievance-track-id" className={fieldLabel}>
              Track by grievance ID
            </label>
            <div className="flex gap-2">
              <input
                id="grievance-track-id"
                type="text"
                value={trackInput}
                onChange={(e) => {
                  setTrackInput(e.target.value);
                  if (trackError) setTrackError(null);
                }}
                placeholder="For example GRV-DEMO-2026-0001"
                aria-invalid={trackError ? true : undefined}
                aria-describedby={trackError ? 'grievance-track-error' : undefined}
                className={`${trackError ? fieldControl.replace('border-line', 'border-danger') : fieldControl} min-w-0 tabular-nums`}
              />
              <Button type="submit" variant="secondary" className="shrink-0" id="track-id-submit-btn">
                Track
              </Button>
            </div>
            {trackError && (
              <p id="grievance-track-error" className="mt-1.5 flex items-center gap-1.5 text-sm text-danger" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {trackError}
              </p>
            )}
          </form>
        </div>
      </Card>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter grievances by status">
          {filterChips.map((chip) => (
            <Chip
              key={chip.id}
              active={activeFilter === chip.id}
              count={chip.count}
              onClick={() => setActiveFilter(chip.id)}
            >
              {chip.label}
            </Chip>
          ))}
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          Showing <span className="tabular-nums">{filteredGrievances.length}</span>{' '}
          {filteredGrievances.length === 1 ? 'grievance' : 'grievances'}
        </p>
      </div>

      {/* Grievances list */}
      <Card className="overflow-hidden">
        {filteredGrievances.length > 0 ? (
          <ul className="divide-y divide-line">
            {filteredGrievances.map((grv) => (
              <li key={grv.id}>
                <GrievanceCard
                  grievance={grv}
                  onSelect={(id) => {
                    setSelectedGrievanceId(id);
                    setActiveView('DETAIL');
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No grievances found"
            description={
              searchQuery || activeFilter !== 'ALL'
                ? 'No grievances match your search or filter. Try another filter or clear the search.'
                : 'You have not raised a grievance yet.'
            }
            actionLabel="Raise a grievance"
            onAction={() => setActiveView('CREATE')}
          />
        )}
      </Card>
    </div>
  );
};
