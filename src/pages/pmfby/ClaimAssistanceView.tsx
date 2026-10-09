import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Clock, FileText, FolderOpen, LucideIcon, Phone } from 'lucide-react';
import { StatusBadge } from '../../components/common';
import { Button, Card, SectionHeading } from '../../components/ui';

interface ClaimAssistanceViewProps {
  onNavigateTab: (tabId: string) => void;
}

const CLAIM_STEPS = [
  {
    title: 'Report the damage',
    description: 'Give your application number, khasra number, the crop sown and how much of it was damaged.',
  },
  {
    title: 'Field survey',
    description:
      'Within 10 days, officials from the agriculture department, the Patwari and the insurance company inspect your field and take photos.',
  },
  {
    title: 'Payment',
    description:
      'The amount depends on your sum insured and the assessed loss. It is paid into your Aadhaar-linked bank account.',
  },
];

const STATUS_MEANINGS = [
  { status: 'SUBMITTED', text: 'Your damage report is recorded. A surveyor is being assigned.' },
  { status: 'ACKNOWLEDGED', text: 'The insurance company has assigned a surveyor to inspect your field.' },
  { status: 'UNDER REVIEW', text: 'The field inspection is done. The loss and payout are being worked out.' },
  {
    status: 'ADDITIONAL INFORMATION REQUIRED',
    text: 'There is a problem with your land record, sowing certificate or bank details. You need to act.',
  },
  { status: 'RESOLVED', text: 'The claim is approved and the money is sent to your Aadhaar-linked bank account.' },
] as const;

const CLAIM_DOCUMENTS = [
  { title: 'Land record (Jamabandi / RoR)', description: 'Shows your khasra number, land area and that the land is yours.' },
  { title: 'Sowing certificate', description: 'From the Patwari (Girdawari), showing the insured crop sown on your plot.' },
  { title: 'Bank passbook', description: 'Shows your account number and IFSC. The account must be linked to Aadhaar.' },
  { title: 'Aadhaar card', description: 'Needed so the payout can be sent directly to your bank account.' },
];

export const ClaimAssistanceView: React.FC<ClaimAssistanceViewProps> = ({ onNavigateTab }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('process');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections: { id: string; title: string; description: string; icon: LucideIcon; content: React.ReactNode }[] = [
    {
      id: 'process',
      title: 'How to make a claim',
      description: 'Report damage within 72 hours, then a field survey decides the loss',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed text-ink">
            If hail, flooding, a landslide, a cloudburst or fire damages your crop, you{' '}
            <strong className="font-semibold">must report it within 72 hours</strong>. Tell the insurance company, your
            bank or PACS, the agriculture office, or call the Kisan Call Centre on{' '}
            <a href="tel:18001801551" className="font-semibold text-brand-dark underline underline-offset-4 tabular-nums">
              1800-180-1551
            </a>
            .
          </p>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CLAIM_STEPS.map((step, idx) => (
              <li key={step.title} className="rounded-md border border-line bg-white p-4">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-soft text-sm font-semibold text-navy"
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>
                <p className="mt-2 font-semibold text-navy">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    {
      id: 'status',
      title: 'What your claim status means',
      description: 'What each status tells you and whether you need to do anything',
      icon: FileText,
      content: (
        <dl className="divide-y divide-line rounded-md border border-line bg-white">
          {STATUS_MEANINGS.map((item) => (
            <div key={item.status} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
              <dt className="shrink-0 sm:w-56">
                <StatusBadge status={item.status} />
              </dt>
              <dd className="text-[15px] text-ink">{item.text}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: 'docs',
      title: 'Documents you need',
      description: 'Keep these ready so your claim is not held up',
      icon: FolderOpen,
      content: (
        <div className="space-y-3">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CLAIM_DOCUMENTS.map((doc) => (
              <li key={doc.title} className="rounded-md border border-line bg-white p-4">
                <p className="font-semibold text-navy">{doc.title}</p>
                <p className="mt-1 text-sm text-muted">{doc.description}</p>
              </li>
            ))}
          </ul>
          <Button variant="link" className="min-h-11" onClick={() => onNavigateTab('claim-documents')}>
            Check the documents for your claim <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
    {
      id: 'help',
      title: 'Where to get help',
      description: 'Who to contact about your claim',
      icon: Phone,
      content: (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <li className="rounded-md border border-line bg-white p-4">
            <p className="font-semibold text-navy">Kisan Call Centre</p>
            <a
              href="tel:18001801551"
              className="mt-1 inline-flex min-h-11 items-center font-semibold text-brand-dark tabular-nums hover:underline underline-offset-4"
            >
              1800-180-1551
            </a>
            <p className="text-sm text-muted">Free national helpline for farmers, including crop insurance questions.</p>
          </li>
          <li className="rounded-md border border-line bg-white p-4">
            <p className="font-semibold text-navy">Block Agriculture Officer</p>
            <p className="mt-1 text-sm text-muted">
              Handles field surveys and claim questions for your block. The officer for your claim is listed on the claim
              details page.
            </p>
            <Button variant="link" className="min-h-11" onClick={() => onNavigateTab('claim-detail')}>
              See your claim officer <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </li>
          <li className="rounded-md border border-line bg-white p-4">
            <p className="font-semibold text-navy">PACS society secretary</p>
            <p className="mt-1 text-sm text-muted">Can help you report damage and get your documents certified.</p>
          </li>
        </ul>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Help with your claim"
        description="How claims work, what the status means, and where to get help"
      />

      <div className="space-y-3">
        {sections.map(({ id, title, description, icon: Icon, content }) => {
          const isExpanded = expandedSection === id;
          const panelId = `pmfby-help-${id}`;

          return (
            <Card key={id} className="overflow-hidden">
              <h3>
                <button
                  type="button"
                  onClick={() => toggleSection(id)}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-offwhite"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-lg font-semibold leading-tight text-navy">{title}</span>
                      <span className="mt-0.5 block text-sm text-muted">{description}</span>
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              {isExpanded && (
                <div id={panelId} className="border-t border-line bg-offwhite px-5 py-4">
                  {content}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
