import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, ChevronRight, Compass, RotateCcw } from 'lucide-react';
import { Scheme, Document, User, SchemeDiscoveryInputs, MatchedSchemeResult } from '../types';
import {
  FindSchemesWizard,
  SchemeResultsView,
  SchemeDetailView,
  SchemeValidityBadge,
  SCHEME_CATEGORY_LABELS,
} from '../components/schemes';
import { SchemeMatchingService } from '../services/schemeMatchingService';
import { InformationOnlyBanner } from '../components/common';
import { Button, Card, PageHeader, SectionHeading, TabBar } from '../components/ui';

interface SchemesPageProps {
  schemes: Scheme[];
  documents: Document[];
  currentUser?: User;
  onNavigateToDocuments?: (docIdOrType?: string) => void;
  onAskAI?: (prompt: string, schemeContext?: Scheme) => void;
  selectedSchemeId?: string | null;
  initialInputs?: Partial<SchemeDiscoveryInputs>;
  title?: string;
}

type SchemesTab = 'find' | 'all';

export const SchemesPage: React.FC<SchemesPageProps> = ({
  schemes,
  documents,
  currentUser,
  onNavigateToDocuments,
  onAskAI,
  selectedSchemeId,
  initialInputs,
  title = 'Government schemes',
}) => {
  // Tabs: primary = 'find', secondary = 'all'
  const [activeTab, setActiveTab] = useState<SchemesTab>('find');

  // Discovery sub-view: 'results' | 'wizard' | 'detail'
  const [discoveryStage, setDiscoveryStage] = useState<'results' | 'wizard' | 'detail'>('results');

  // Active scheme for detail view
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(selectedSchemeId || null);

  // Answers used by the matching service
  const [discoveryInputs, setDiscoveryInputs] = useState<SchemeDiscoveryInputs>({
    state: initialInputs?.state || 'Rajasthan',
    district: initialInputs?.district || 'Jaipur',
    crop: initialInputs?.crop || 'Wheat',
    landCategory: initialInputs?.landCategory || 'Small',
    landAreaAcres: initialInputs?.landAreaAcres ?? 4.5,
    landOwnership: initialInputs?.landOwnership || 'Owned',
    farmerProfile: {
      name: currentUser?.name || 'Ramesh Kumar',
      state: initialInputs?.state || 'Rajasthan',
      district: initialInputs?.district || 'Jaipur',
      language: currentUser?.preferredLanguage || 'English',
      role: currentUser?.role?.toUpperCase() || 'FARMER',
    },
  });

  // If selectedSchemeId prop changes externally, switch to detail view
  useEffect(() => {
    if (selectedSchemeId && schemes.some((s) => s.id === selectedSchemeId)) {
      setActiveSchemeId(selectedSchemeId);
      setDiscoveryStage('detail');
      setActiveTab('find');
    }
  }, [selectedSchemeId, schemes]);

  const matchedResults: MatchedSchemeResult[] = useMemo(() => {
    return SchemeMatchingService.matchSchemes(schemes, discoveryInputs, documents);
  }, [schemes, discoveryInputs, documents]);

  const currentDetailScheme = useMemo(() => {
    if (!activeSchemeId) return null;
    return schemes.find((s) => s.id === activeSchemeId) || null;
  }, [schemes, activeSchemeId]);

  // A selected scheme may not exist in this (filtered) list; fall back to results
  useEffect(() => {
    if (discoveryStage === 'detail' && !currentDetailScheme) {
      setDiscoveryStage('results');
    }
  }, [discoveryStage, currentDetailScheme]);

  const handleSelectScheme = (schemeId: string) => {
    setActiveSchemeId(schemeId);
    setDiscoveryStage('detail');
  };

  const handleWizardComplete = (newInputs: SchemeDiscoveryInputs) => {
    setDiscoveryInputs(newInputs);
    setDiscoveryStage('results');
  };

  const handleTabChange = (tab: SchemesTab) => {
    setActiveTab(tab);
    if (tab === 'find' && discoveryStage === 'detail' && !activeSchemeId) {
      setDiscoveryStage('results');
    }
  };

  return (
    <div className="space-y-6" id="government-schemes-page">
      <PageHeader
        title={title}
        description="Find schemes that may help your farm, see which documents you need, and learn where to apply."
        actions={
          activeTab === 'find' &&
          discoveryStage === 'results' && (
            <Button variant="secondary" onClick={() => setDiscoveryStage('wizard')} id="btn-rerun-wizard">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Answer the questions again
            </Button>
          )
        }
      />

      <InformationOnlyBanner />

      <TabBar<SchemesTab>
        ariaLabel="Scheme views"
        activeId={activeTab}
        onChange={handleTabChange}
        tabs={[
          {
            id: 'find',
            domId: 'tab-find-schemes',
            label: 'Find schemes for me',
            icon: <Compass className="h-4 w-4" aria-hidden="true" />,
          },
          {
            id: 'all',
            label: 'All schemes',
            count: schemes.length,
            domId: 'tab-all-schemes',
            icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
          },
        ]}
      />

      {activeTab === 'find' ? (
        <>
          {discoveryStage === 'wizard' && (
            <FindSchemesWizard
              currentUser={currentUser}
              documents={documents}
              initialInputs={discoveryInputs}
              onComplete={handleWizardComplete}
              onCancel={() => setDiscoveryStage('results')}
            />
          )}

          {discoveryStage === 'results' && (
            <SchemeResultsView
              results={matchedResults}
              inputs={discoveryInputs}
              onSelectScheme={handleSelectScheme}
              onModifyInformation={() => setDiscoveryStage('wizard')}
              onAskAI={(prompt) => {
                if (onAskAI) onAskAI(prompt || 'Tell me about agricultural schemes');
              }}
              onNavigateToDocuments={onNavigateToDocuments}
            />
          )}

          {discoveryStage === 'detail' && currentDetailScheme && (
            <SchemeDetailView
              scheme={currentDetailScheme}
              documents={documents}
              inputs={discoveryInputs}
              onBack={() => setDiscoveryStage('results')}
              onNavigateToDocuments={onNavigateToDocuments}
              onAskAI={onAskAI}
            />
          )}
        </>
      ) : (
        <section id="all-schemes-registry">
          <SectionHeading
            title="All schemes"
            description="Every scheme in this app. Open one to see who it is for and how to apply."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {schemes.map((scheme) => (
              <Card as="article" key={scheme.id} className="flex min-w-0 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[13px] text-muted">{scheme.authority}</p>
                  <SchemeValidityBadge status={scheme.validityStatus} hideWhenCurrent />
                </div>
                <h3 className="mt-1 font-display text-lg leading-snug font-semibold text-navy">{scheme.name}</h3>
                <p className="mt-1 line-clamp-3 text-[15px] text-ink">{scheme.shortDescription || scheme.summary}</p>

                <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-muted">Type of scheme</dt>
                    <dd className="font-semibold text-navy">{SCHEME_CATEGORY_LABELS[scheme.category] || scheme.category}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted">States</dt>
                    <dd className="font-semibold text-navy">
                      {scheme.applicableStates.slice(0, 3).join(', ')}
                      {scheme.applicableStates.length > 3 && ` and ${scheme.applicableStates.length - 3} more`}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto pt-5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setActiveSchemeId(scheme.id);
                      setDiscoveryStage('detail');
                      setActiveTab('find');
                    }}
                  >
                    View details <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
