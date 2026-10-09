import React from 'react';
import { ArrowLeft, Bot, ChevronRight, ClipboardList, FileText, Gift, ListOrdered, MapPin, Users } from 'lucide-react';
import { Scheme, Document, SchemeDiscoveryInputs } from '../../types';
import { SchemeMatchingService } from '../../services/schemeMatchingService';
import { StatusBadge, OfficialPortalButton } from '../common';
import { Button, Card, CardHeader, KeyValueGrid, Notice } from '../ui';
import { SourceVerificationCard } from '../documents/SourceVerificationCard';
import { SCHEME_CATEGORY_LABELS, SchemeValidityBadge } from './SchemeResultsView';

interface SchemeDetailViewProps {
  scheme: Scheme;
  documents: Document[];
  inputs?: SchemeDiscoveryInputs;
  onBack: () => void;
  onNavigateToDocuments?: (docIdOrType?: string) => void;
  onAskAI?: (prompt: string, schemeContext?: Scheme) => void;
}

export const SchemeDetailView: React.FC<SchemeDetailViewProps> = ({
  scheme,
  documents,
  inputs,
  onBack,
  onNavigateToDocuments,
  onAskAI,
}) => {
  // Evaluate document readiness for this specific scheme against the farmer's locker
  const documentReadiness = SchemeMatchingService.evaluateDocumentReadiness(scheme.requiredDocuments, documents);

  const isSuperseded = scheme.validityStatus === 'SUPERSEDED';
  const isExpired = scheme.validityStatus === 'EXPIRED';
  const isUnknown = scheme.validityStatus === 'UNKNOWN';

  const readyCount = documentReadiness.available.length;
  const totalDocs = scheme.requiredDocuments.length;

  const questions = [
    `Why is ${scheme.name} potentially relevant?`,
    `What documents are missing for ${scheme.name}?`,
    `What is the application process for ${scheme.name}?`,
  ];

  return (
    <div className="space-y-6" id={`scheme-detail-${scheme.id.toLowerCase()}`}>
      <Button variant="secondary" onClick={onBack} id="btn-back-to-schemes">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to schemes
      </Button>

      {/* Overview */}
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-muted">{scheme.authority}</p>
              <h2 className="mt-1 font-display text-2xl leading-tight font-semibold text-navy">{scheme.name}</h2>
            </div>
            <SchemeValidityBadge status={scheme.validityStatus} />
          </div>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink">{scheme.shortDescription || scheme.summary}</p>
        </div>

        <KeyValueGrid
          columns={2}
          items={[
            { label: 'Type of scheme', value: SCHEME_CATEGORY_LABELS[scheme.category] || scheme.category },
            { label: 'Run by', value: scheme.authority },
            { label: 'States', value: scheme.applicableStates.join(', ') },
            { label: 'Crops', value: scheme.applicableCrops.join(', ') },
          ]}
        />
        <p className="px-5 py-3 text-[13px] text-muted">Information last checked {scheme.lastVerified}</p>
      </Card>

      {isSuperseded && (
        <Notice tone="warning" title="This information is outdated">
          Newer guidelines have replaced it. Check the official portal or your agriculture office for the current rules.
        </Notice>
      )}
      {isExpired && (
        <Notice tone="danger" title="This scheme information has expired">
          Check the official portal or your agriculture office before you apply.
        </Notice>
      )}
      {isUnknown && (
        <Notice tone="info" title="We could not confirm this information is current">
          Check with your agriculture office before you apply.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Eligibility guidance */}
          <Card>
            <CardHeader title="Who this scheme is for" icon={<Users className="h-5 w-5" aria-hidden="true" />} />
            <div className="space-y-4 px-5 pb-5">
              <p className="text-[15px] leading-relaxed text-ink">{scheme.eligibilityGuidance}</p>

              {scheme.eligibilityCriteria && scheme.eligibilityCriteria.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-navy">The guidelines mention</h3>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[15px] text-ink">
                    {scheme.eligibilityCriteria.map((crit, idx) => (
                      <li key={idx}>{crit}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Notice tone="info">
                {inputs
                  ? `Based on what you entered (${inputs.district}, ${inputs.state}, ${inputs.crop}), this scheme may be relevant to you.`
                  : 'This scheme may be relevant to you.'}{' '}
                The department decides final eligibility when you apply.
              </Notice>
            </div>
          </Card>

          {/* Benefits */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Benefits"
              description="Amounts shown are examples. The department confirms the actual benefit."
              icon={<Gift className="h-5 w-5" aria-hidden="true" />}
            />
            {scheme.benefits.length > 0 ? (
              <div className="[&>dl]:border-b-0">
                <KeyValueGrid items={scheme.benefits.map((b) => ({ label: b.label, value: b.value }))} />
              </div>
            ) : (
              <p className="px-5 pb-5 text-[15px] text-muted">No benefit details are available for this scheme.</p>
            )}
          </Card>

          {/* Required documents */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Documents you need"
              description={
                <span className="tabular-nums">
                  {readyCount} of {totalDocs} ready
                </span>
              }
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              action={
                onNavigateToDocuments && (
                  <Button variant="link" className="min-h-11" onClick={() => onNavigateToDocuments()} id="btn-nav-to-documents">
                    Open documents <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )
              }
            />
            <ul className="divide-y divide-line border-t border-line">
              {scheme.requiredDocuments.map((req, idx) => {
                const missingEntry = documentReadiness.missing.find((d) => d.docType === req.docType);
                const isAvail = documentReadiness.available.some((d) => d.docType === req.docType);
                const isInvalid = documentReadiness.invalidOrExpired.some((d) => d.docType === req.docType);

                return (
                  <li key={idx} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy">{req.title}</p>
                      <p className="mt-0.5 text-sm text-muted">{req.whyRequired}</p>
                      {missingEntry && onNavigateToDocuments && (
                        <Button
                          variant="link"
                          className="mt-2 min-h-9"
                          onClick={() => onNavigateToDocuments(missingEntry.documentId)}
                          id={`btn-view-doc-guidance-${req.docType.toLowerCase()}`}
                        >
                          View document guidance <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                    <StatusBadge
                      className="self-start"
                      status={isAvail ? 'AVAILABLE' : isInvalid ? 'INVALID / EXPIRED' : 'MISSING'}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Application steps */}
          <Card>
            <CardHeader
              title="How to apply"
              description="Follow these steps at the office or on the official portal. This app does not submit anything for you."
              icon={<ListOrdered className="h-5 w-5" aria-hidden="true" />}
            />
            <ol className="space-y-3 px-5 pb-5">
              {scheme.applicationProcess.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-soft text-sm font-semibold text-navy tabular-nums"
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <p className="min-w-0 pt-0.5 text-[15px] leading-relaxed text-ink">{step}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          {/* Where to apply */}
          <Card className="overflow-hidden">
            <CardHeader title="Where to apply" icon={<MapPin className="h-5 w-5" aria-hidden="true" />} />
            <dl className="divide-y divide-line border-y border-line">
              <div className="px-5 py-3">
                <dt className="text-[13px] text-muted">Office</dt>
                <dd className="mt-0.5 font-semibold break-words text-navy">{scheme.whereToApply.authority}</dd>
              </div>
              <div className="px-5 py-3">
                <dt className="text-[13px] text-muted">How to apply</dt>
                <dd className="mt-0.5 break-words text-ink">{scheme.whereToApply.channel}</dd>
                {scheme.whereToApply.officeInfo && (
                  <dd className="mt-1 text-sm text-muted">{scheme.whereToApply.officeInfo}</dd>
                )}
              </div>
            </dl>
            <div className="px-5 py-4">
              {scheme.officialPortal?.isConfigured && scheme.officialPortal.url ? (
                <OfficialPortalButton
                  href={scheme.officialPortal.url}
                  portalName={scheme.officialPortal.name || 'Official portal'}
                  className="w-full"
                />
              ) : (
                <p className="text-sm text-muted">No official website link is available for this scheme yet.</p>
              )}
            </div>
          </Card>

          {/* Ask the assistant */}
          <section className="rounded-lg bg-navy p-5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold">Questions about this scheme?</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/75">
              Ask about documents, land rules or where to apply.
            </p>
            <ul className="mt-4 space-y-1.5">
              {questions.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => onAskAI && onAskAI(question, scheme)}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10"
                  >
                    <span className="min-w-0">{question}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/50" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <Button
              variant="inverse"
              className="mt-4 w-full"
              onClick={() =>
                onAskAI && onAskAI(`Explain the eligibility and document requirements for ${scheme.name}.`, scheme)
              }
              id="btn-ask-ai-scheme"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" /> Ask about eligibility and documents
            </Button>
          </section>

          {/* Source */}
          {scheme.sourceInfo ? (
            <SourceVerificationCard
              authority={scheme.sourceInfo.authority}
              document={scheme.sourceInfo.documentTitle}
              section={scheme.sourceInfo.sectionOrPage}
              version={scheme.sourceInfo.version}
              lastVerified={scheme.sourceInfo.lastVerified}
              verificationStatus="DEMO"
            />
          ) : (
            <p className="rounded-lg border border-line bg-offwhite p-4 text-sm text-muted">
              The official source for this scheme is not available yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
