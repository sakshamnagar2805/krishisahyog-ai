import React from 'react';
import { BookOpen, FileText, Globe, LucideIcon, Phone } from 'lucide-react';
import { OfficialPortalButton } from '../../components/common';
import { Card, SectionHeading } from '../../components/ui';

interface OfficialResource {
  id: string;
  title: string;
  authority: string;
  source: string;
  resourceType: string;
  icon: LucideIcon;
  lastVerified: string;
  url?: string;
  phone?: { display: string; dial: string };
  unavailableNote?: string;
  description: string;
}

const resources: OfficialResource[] = [
  {
    id: 'res-1',
    title: 'PMFBY official website',
    authority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    source: 'pmfby.gov.in',
    resourceType: 'Website',
    icon: Globe,
    lastVerified: '17 Jan 2026',
    url: 'https://pmfby.gov.in',
    description: 'Apply for insurance, track your claim, calculate your premium and raise a complaint.',
  },
  {
    id: 'res-2',
    title: 'PMFBY Operational Guidelines',
    authority: 'Department of Agriculture & Farmers Welfare',
    source: 'Official publication',
    resourceType: 'Guidelines',
    icon: BookOpen,
    lastVerified: '15 Jan 2026',
    url: 'https://pmfby.gov.in',
    description:
      'The official rules for the scheme, including reporting local damage within 72 hours (section 14) and how payouts are made.',
  },
  {
    id: 'res-3',
    title: 'Kisan Call Centre',
    authority: 'Department of Agriculture & Farmers Welfare',
    source: 'Free helpline 1800-180-1551',
    resourceType: 'Helpline',
    icon: Phone,
    lastVerified: '17 Jan 2026',
    phone: { display: '1800-180-1551', dial: '18001801551' },
    description: 'Free phone help from agriculture experts in Indian languages.',
  },
  {
    id: 'res-4',
    title: 'District crop insurance notification',
    authority: 'State Department of Agriculture',
    source: 'State government notification',
    resourceType: 'Notification',
    icon: FileText,
    lastVerified: '10 Jan 2026',
    unavailableNote: 'Ask your bank, PACS or agriculture office for the notification for your district.',
    description:
      'Lists the crops that can be insured in each district and season, and the insurance company for your area.',
  },
];

export const OfficialResourcesView: React.FC = () => (
  <div className="space-y-5">
    <SectionHeading
      title="Official links and helplines"
      description="Government websites, rules and helplines for crop insurance"
    />

    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {resources.map(({ id, title, authority, source, resourceType, icon: Icon, lastVerified, url, phone, unavailableNote, description }) => (
        <li key={id} className="min-w-0">
          <Card as="article" className="flex h-full flex-col">
            <div className="flex items-start gap-3 px-5 pt-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] text-muted">{resourceType}</p>
                <h3 className="font-display text-lg font-semibold leading-snug text-navy">{title}</h3>
              </div>
            </div>

            <p className="px-5 pt-3 text-[15px] leading-relaxed text-ink">{description}</p>

            <dl className="mx-5 mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex flex-wrap justify-between gap-x-4">
                <dt className="text-muted">From</dt>
                <dd className="text-right text-ink">{authority}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-4">
                <dt className="text-muted">Source</dt>
                <dd className="text-right text-ink">{source}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-4">
                <dt className="text-muted">Last checked</dt>
                <dd className="text-right text-ink tabular-nums">{lastVerified}</dd>
              </div>
            </dl>

            <div className="mt-auto px-5 pb-5 pt-4">
              {url ? (
                <OfficialPortalButton href={url} label="Open official website" />
              ) : phone ? (
                <a
                  href={`tel:${phone.dial}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-[15px] font-semibold text-ink hover:bg-offwhite"
                >
                  <Phone className="w-4 h-4 text-muted" aria-hidden="true" /> Call {phone.display}
                </a>
              ) : (
                <p className="text-sm text-muted">{unavailableNote}</p>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  </div>
);
