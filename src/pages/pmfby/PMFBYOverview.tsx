import React from 'react';
import { ArrowRight, Calculator, Calendar, Compass, FileText, FolderOpen, HelpCircle, Layers, LucideIcon } from 'lucide-react';
import { PMFBYClaim } from '../../types';
import { StatusBadge } from '../../components/common';
import { Button, Card, CardHeader, KeyValueGrid, Notice, SectionHeading } from '../../components/ui';

interface PMFBYOverviewProps {
  activeClaim: PMFBYClaim;
  onNavigateTab: (tabId: string) => void;
  onSelectClaim: (claimId: string) => void;
}

const CALAMITY_LABEL: Record<PMFBYClaim['calamityType'], string> = {
  HAILSTORM: 'Hailstorm',
  INUNDATION: 'Flooding',
  DROUGHT: 'Drought',
  PEST_ATTACK: 'Pest attack',
};

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const TIME_LIMITS = [
  {
    title: 'Report local crop damage',
    description: 'Tell the insurance company, your bank or the agriculture office after hail, flooding or similar damage.',
    limit: 'Within 72 hours',
  },
  {
    title: 'Field survey',
    description: 'Officials from the agriculture department and the insurance company inspect the field.',
    limit: 'Within 10 days',
  },
  {
    title: 'Last date to enrol for Rabi',
    description: 'Get your crop insured through your bank, PACS or the official portal.',
    limit: '31 Dec (sample date)',
  },
];

export const PMFBYOverview: React.FC<PMFBYOverviewProps> = ({ activeClaim, onNavigateTab, onSelectClaim }) => {
  const needsAction = activeClaim.status === 'ADDITIONAL INFORMATION REQUIRED';
  const docsNeedingAttention = (activeClaim.documents ?? []).filter(
    (doc) => doc.status === 'MISSING' || doc.status === 'INVALID / EXPIRED'
  ).length;
  const governmentShare = activeClaim.premiumSubsidyStateGovt + activeClaim.premiumSubsidyCentralGovt;

  const shortcuts: { tab: string; title: string; description: string; icon: LucideIcon }[] = [
    { tab: 'my-claims', title: 'My claims', description: 'See all your claims and their status', icon: FileText },
    { tab: 'claim-assistance', title: 'Claim help', description: 'How claims work, step by step', icon: HelpCircle },
    {
      tab: 'claim-documents',
      title: 'Claim documents',
      description:
        docsNeedingAttention > 0
          ? `${docsNeedingAttention} ${docsNeedingAttention === 1 ? 'document needs' : 'documents need'} attention`
          : 'Papers needed for your claim',
      icon: FolderOpen,
    },
    { tab: 'enrollment-guidance', title: 'How to enrol', description: 'Steps to get your crop insured', icon: Compass },
    { tab: 'official-resources', title: 'Official links', description: 'Portal, guidelines and helpline', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Selected claim */}
      <Card>
        <CardHeader
          title="Your claim"
          description={
            <>
              Claim <span className="tabular-nums">{activeClaim.claimId}</span> · {activeClaim.crop}, {activeClaim.season}{' '}
              {activeClaim.year}
            </>
          }
          icon={<FileText className="w-5 h-5" aria-hidden="true" />}
          action={<StatusBadge status={activeClaim.status} />}
        />
        <KeyValueGrid
          columns={4}
          items={[
            {
              label: 'Land',
              value: activeClaim.plotKhasra,
            },
            { label: 'Sum insured', value: <span className="tabular-nums">{rupees(activeClaim.sumInsured)}</span> },
            {
              label: 'Crop loss assessed',
              value: (
                <span className="tabular-nums">
                  {activeClaim.assessedLossPercent}% · {CALAMITY_LABEL[activeClaim.calamityType]}
                </span>
              ),
            },
            { label: 'Next step', value: activeClaim.nextAction },
          ]}
        />
        <div className="space-y-4 px-5 py-4">
          {needsAction && (
            <Notice tone="warning" title="Your claim needs more information">
              Check the documents for this claim so the insurance company can continue.
            </Notice>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-muted">
              Damage reported <span className="tabular-nums">{activeClaim.hoursElapsedSinceCalamity}</span> hours after it
              happened ({activeClaim.isWithin72Hours ? 'within' : 'after'} the 72-hour limit) · Updated{' '}
              {activeClaim.lastUpdated}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onNavigateTab('claim-documents')}>
                Check required documents
              </Button>
              <Button
                onClick={() => {
                  onSelectClaim(activeClaim.id);
                  onNavigateTab('claim-detail');
                }}
              >
                View claim details <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Shortcuts */}
      <section>
        <SectionHeading title="What you can do here" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {shortcuts.map(({ tab, title, description, icon: Icon }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigateTab(tab)}
              className="group flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-brand-dark/40 hover:bg-offwhite lg:flex-col"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy group-hover:bg-brand-light group-hover:text-brand-dark">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-navy">{title}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Time limits */}
        <Card className="flex flex-col">
          <CardHeader
            title="Time limits to remember"
            icon={<Calendar className="w-5 h-5" aria-hidden="true" />}
          />
          <ul className="divide-y divide-line border-t border-line">
            {TIME_LIMITS.map((item) => (
              <li key={item.title} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{item.description}</p>
                </div>
                <p className="shrink-0 font-semibold text-navy tabular-nums sm:text-right">{item.limit}</p>
              </li>
            ))}
          </ul>
          <div className="mt-auto border-t border-line px-5 py-3">
            <Button variant="link" onClick={() => onNavigateTab('important-dates')}>
              All important dates <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>

        {/* Premium */}
        <Card className="flex flex-col">
          <CardHeader
            title="Premium you pay"
            icon={<Calculator className="w-5 h-5" aria-hidden="true" />}
          />
          <div className="space-y-4 px-5 pb-4">
            <p className="text-[15px] leading-relaxed text-ink">
              Farmers pay at most <strong className="font-semibold">2%</strong> of the sum insured for Kharif food grain and oilseed crops,{' '}
              <strong className="font-semibold">1.5%</strong> for Rabi food grain and oilseed crops, and{' '}
              <strong className="font-semibold">5%</strong> for commercial and horticulture crops. The government pays the
              rest.
            </p>
            <dl className="rounded-md border border-line bg-offwhite px-4 py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted">
                  You paid for {activeClaim.crop} ({activeClaim.surveyParcelSizeAcres} acres)
                </dt>
                <dd className="font-semibold text-navy tabular-nums">{rupees(activeClaim.premiumFarmerPaid)}</dd>
              </div>
              <div className="mt-1.5 flex flex-wrap justify-between gap-2">
                <dt className="text-muted">Government paid</dt>
                <dd className="font-semibold text-navy tabular-nums">{rupees(governmentShare)}</dd>
              </div>
              <p className="mt-1.5 text-[13px] text-muted tabular-nums">
                Central {rupees(activeClaim.premiumSubsidyCentralGovt)} + state {rupees(activeClaim.premiumSubsidyStateGovt)}
              </p>
            </dl>
          </div>
          <div className="mt-auto border-t border-line px-5 py-3">
            <Button variant="link" onClick={() => onNavigateTab('premium-info')}>
              Premium calculator <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
