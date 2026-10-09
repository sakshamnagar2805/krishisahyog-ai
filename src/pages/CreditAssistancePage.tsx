import React from 'react';
import { ArrowRight, Mic, Percent, Wallet } from 'lucide-react';
import { PACSService } from '../types';
import { Button, Card, CardHeader, Notice, PageHeader } from '../components/ui';

interface CreditAssistancePageProps {
  pacs: PACSService;
  onNavigate: (route: string) => void;
  onOpenVoiceGuide: () => void;
}

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const formatDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const CreditAssistancePage: React.FC<CreditAssistancePageProps> = ({
  pacs,
  onNavigate,
  onOpenVoiceGuide,
}) => {
  const limit = pacs.kccLimitRupees ?? 0;
  const drawn = pacs.kccDrawnRupees ?? 0;
  const headroom = Math.max(limit - drawn, 0);
  const usedPercent = limit ? Math.min(100, Math.round((drawn / limit) * 100)) : 0;
  const renewalDate = formatDate(pacs.kccRenewalDueDate);
  const societyName = pacs.societyName || pacs.name;

  const summary = [
    { label: 'Credit limit', value: rupees(limit), note: 'The most you can borrow on your card' },
    { label: 'Amount used', value: rupees(drawn), note: 'Loan you have taken and not yet repaid' },
    { label: 'Still available', value: rupees(headroom), note: `You can draw this at ${societyName}` },
  ];

  return (
    <div className="space-y-6" id="credit-assistance-page-root">
      <PageHeader
        title="Credit and KCC loans"
        description="Your Kisan Credit Card limit, what you owe, and how to keep your interest low."
        actions={
          <Button variant="secondary" onClick={onOpenVoiceGuide}>
            <Mic className="w-4 h-4" aria-hidden="true" /> Ask the voice assistant
          </Button>
        }
      />

      {/* KCC summary */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Your Kisan Credit Card"
          description={societyName}
          icon={<Wallet className="w-5 h-5" />}
        />
        <dl className="grid grid-cols-1 gap-px bg-line border-y border-line sm:grid-cols-3">
          {summary.map((item) => (
            <div key={item.label} className="bg-white px-5 py-4 min-w-0">
              <dt className="text-[13px] text-muted">{item.label}</dt>
              <dd className="font-display text-2xl font-semibold text-navy tabular-nums mt-0.5">{item.value}</dd>
              <dd className="text-[13px] text-muted mt-0.5">{item.note}</dd>
            </div>
          ))}
        </dl>
        <div className="px-5 py-4">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-ink">Limit used</span>
            <span className="font-semibold text-navy tabular-nums">{usedPercent}%</span>
          </div>
          <div
            className="mt-2 h-2 rounded-full bg-offwhite border border-line overflow-hidden"
            role="progressbar"
            aria-valuenow={usedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Credit limit used"
          >
            <div className="h-full bg-brand transition-all duration-500" style={{ width: `${usedPercent}%` }} />
          </div>
        </div>
      </Card>

      {/* Interest */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Interest on your crop loan"
          description="Repay on time to pay less interest"
          icon={<Percent className="w-5 h-5" />}
        />
        <dl className="grid grid-cols-1 gap-px bg-line border-y border-line sm:grid-cols-3">
          <div className="bg-white px-5 py-4 min-w-0">
            <dt className="text-[13px] text-muted">Usual interest rate</dt>
            <dd className="font-semibold text-navy tabular-nums mt-0.5">7% a year</dd>
            <dd className="text-[13px] text-muted mt-0.5">On short-term crop loans up to ₹3,00,000</dd>
          </div>
          <div className="bg-white px-5 py-4 min-w-0">
            <dt className="text-[13px] text-muted">Reward for repaying on time</dt>
            <dd className="font-semibold text-navy tabular-nums mt-0.5">3% less</dd>
            <dd className="text-[13px] text-muted mt-0.5">Given by the central government</dd>
          </div>
          <div className="bg-white px-5 py-4 min-w-0">
            <dt className="text-[13px] text-muted">What you pay if you repay on time</dt>
            <dd className="font-semibold text-navy tabular-nums mt-0.5">
              {pacs.kccSubventionPercent !== undefined ? `${pacs.kccSubventionPercent}% a year` : 'Ask your society'}
            </dd>
            <dd className="text-[13px] text-muted mt-0.5">
              {renewalDate ? `If repaid on or before ${renewalDate}` : 'If repaid before the due date'}
            </dd>
          </div>
        </dl>
        <p className="px-5 py-3 text-[13px] text-muted">
          These rates come from the central government&apos;s interest support scheme for crop loans. Confirm current rates
          with your society or bank.
        </p>
      </Card>

      {/* Renewal */}
      <Notice
        tone="info"
        title={renewalDate ? `Renewal due on ${renewalDate}` : 'Renewal date not available'}
        action={
          <Button variant="secondary" size="sm" onClick={() => onNavigate('pacs-services')}>
            Go to PACS services <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        }
      >
        {renewalDate
          ? `Repay or renew your card at ${societyName} by this date to keep the lower interest rate.`
          : `Ask ${societyName} when your card is due for renewal.`}
      </Notice>
    </div>
  );
};
