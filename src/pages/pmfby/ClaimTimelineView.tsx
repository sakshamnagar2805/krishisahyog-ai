import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { PMFBYClaim } from '../../types';
import { StatusBadge } from '../../components/common';
import { Button, Card, CardHeader } from '../../components/ui';

interface ClaimTimelineViewProps {
  claim: PMFBYClaim;
  onBackToClaim: () => void;
  onNavigateTab: (tabId: string) => void;
}

/** Timeline titles arrive in capitals ("UNDER REVIEW"); show them in sentence case */
const stageLabel = (title: string) => title.charAt(0) + title.slice(1).toLowerCase();

export const ClaimTimelineView: React.FC<ClaimTimelineViewProps> = ({ claim, onBackToClaim, onNavigateTab }) => {
  const needsAction = claim.status === 'ADDITIONAL INFORMATION REQUIRED';

  return (
    <div className="space-y-6">
      <Button variant="link" className="min-h-11" onClick={onBackToClaim}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to claim details
      </Button>

      <Card>
        <CardHeader
          title={`Timeline for claim ${claim.claimId}`}
          description={
            <>
              {claim.crop}, {claim.season} {claim.year} · Policy <span className="tabular-nums">{claim.policyId}</span>
            </>
          }
          icon={<Clock className="w-5 h-5" aria-hidden="true" />}
          action={<StatusBadge status={claim.status} />}
        />

        <ol className="border-t border-line px-5 py-5">
          {claim.timeline.map((step, index) => {
            const isCurrent = step.title === claim.status;
            const isCompleted = step.status === 'COMPLETED';
            const isLast = index === claim.timeline.length - 1;

            return (
              <li key={step.step} className="relative flex gap-4 pb-6 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
                {!isLast && (
                  <span
                    className={`absolute left-4 top-9 bottom-0 w-0.5 -translate-x-1/2 ${isCompleted ? 'bg-brand' : 'bg-line'}`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
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

                <div
                  className={`min-w-0 flex-1 rounded-md border px-4 py-3 ${
                    isCurrent ? 'border-navy/40 bg-offwhite' : 'border-line bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <h3 className={`font-semibold ${isCompleted || isCurrent ? 'text-navy' : 'text-muted'}`}>
                      Step {step.step}: {stageLabel(step.title)}
                      {isCurrent && <span className="ml-2 text-[13px] font-medium text-muted">Current step</span>}
                    </h3>
                    <p className="text-[13px] text-muted tabular-nums">{step.date}</p>
                  </div>

                  <p className="mt-1 text-[15px] leading-relaxed text-ink">{step.description}</p>

                  {step.officerNotes && (
                    <p className="mt-2 border-t border-line pt-2 text-sm text-muted">
                      <span className="font-medium text-ink">Office note: </span>
                      {step.officerNotes}
                    </p>
                  )}

                  {isCurrent && needsAction && (
                    <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-ink">You need to act before your claim can move to the next step.</p>
                      <Button className="shrink-0 self-start sm:self-auto" onClick={() => onNavigateTab('claim-documents')}>
                        See what to fix <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
};
