import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui';

interface ImportantDatesViewProps {
  onNavigateTab: (tabId: string) => void;
}

const dates = [
  {
    title: 'Last date to enrol for Rabi crops',
    timing: '31 December',
    source: 'PMFBY Operational Guidelines, section 6.1',
    description:
      'Last date for banks to deduct the premium for farmers with crop loans, and for other farmers to pay at the bank or PACS.',
    sampleDate: true,
  },
  {
    title: 'Report local crop damage',
    timing: 'Within 72 hours of the damage',
    source: 'PMFBY Operational Guidelines, section 14.2',
    description: 'Report hail, flooding or landslide damage to the insurance company or the helpline. This is required for a local damage claim.',
  },
  {
    title: 'Field survey',
    timing: 'Within 10 days of your report',
    source: 'PMFBY Operational Guidelines, section 14.3',
    description:
      'The Block Agriculture Officer, the Patwari and the insurance company inspect your field and take photos.',
  },
  {
    title: 'Loss report finalised',
    timing: 'Within 15 days of the survey',
    source: 'PMFBY Operational Guidelines, section 14.4',
    description: 'The district committee finalises the loss report and the payout amount.',
  },
  {
    title: 'Payment to your bank account',
    timing: 'Within 3 weeks of the loss report',
    source: 'PMFBY Operational Guidelines, section 14.5',
    description: 'The claim amount is sent to your Aadhaar-linked bank account.',
  },
  {
    title: 'Report damage after harvest',
    timing: 'Within 72 hours, up to 14 days after cutting',
    source: 'PMFBY Operational Guidelines, section 15.1',
    description:
      'Covers cut crops left to dry in the field that are damaged by cyclonic or unseasonal rain.',
  },
];

export const ImportantDatesView: React.FC<ImportantDatesViewProps> = ({ onNavigateTab }) => (
  <div className="space-y-5">
    <SectionHeading
      title="Important dates and time limits"
      description="Report damage on time so your claim is accepted. Calendar dates change by state and season, so check the notification for your area."
      action={
        <Button variant="link" className="min-h-11" onClick={() => onNavigateTab('claim-assistance')}>
          How to make a claim <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      }
    />

    <Card>
      <ul className="divide-y divide-line">
        {dates.map((item) => (
          <li key={item.title} className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-3 sm:gap-6">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-snug text-navy tabular-nums">{item.timing}</p>
              {item.sampleDate && <p className="text-[13px] text-muted">Sample date</p>}
            </div>
            <div className="min-w-0 sm:col-span-2">
              <h3 className="font-semibold text-navy">{item.title}</h3>
              <p className="mt-0.5 text-[15px] leading-relaxed text-ink">{item.description}</p>
              <p className="mt-1 text-[13px] text-muted">Source: {item.source}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  </div>
);
