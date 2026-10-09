import React, { useState } from 'react';
import { Download, ExternalLink, FileClock, Globe, Search } from 'lucide-react';
import { GovernmentSource, AuditLog, AdminMetric, UserRole } from '../types';
import { EmptyState } from '../components/common';
import { Button, Card, CardHeader, Chip, PageHeader, fieldControl, fieldLabel } from '../components/ui';

interface AdminGovernancePageProps {
  sources: GovernmentSource[];
  auditLogs: AuditLog[];
  metrics: AdminMetric;
}

type CategoryFilter = 'ALL' | GovernmentSource['category'];

const CATEGORY_LABELS: Record<GovernmentSource['category'], string> = {
  CROP_INSURANCE: 'Crop insurance',
  INPUT_SUBSIDY: 'Input subsidy',
  COOPERATIVE_CREDIT: 'Cooperative credit',
  GRIEVANCE_PORTAL: 'Grievance portal',
};

const JURISDICTION_LABELS: Record<GovernmentSource['jurisdiction'], string> = {
  CENTRAL: 'Central',
  STATE_RAJASTHAN: 'Rajasthan',
  STATE_PUNJAB: 'Punjab',
  STATE_HARYANA: 'Haryana',
  INTER_STATE: 'Inter-state',
};

const ACTION_LABELS: Record<AuditLog['actionType'], string> = {
  SOURCE_INGESTION: 'Source updated',
  OFFICER_SIGN_OFF: 'Officer sign-off',
  CLAIM_VERIFICATION: 'Claim check',
  SOWING_PROOF_RECONCILE: 'Sowing proof check',
  SYSTEM_FAILSAFE: 'System safeguard',
  GRIEVANCE_LODGED: 'Grievance filed',
  PACS_REQUEST_CREATED: 'PACS request created',
  PACS_STATUS_UPDATED: 'PACS request updated',
};

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: 'Farmer',
  pacs: 'PACS operator',
  officer: 'Agriculture officer',
  admin: 'Administrator',
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/** Builds a CSV of the audit log in the browser and downloads it */
const downloadAuditLogCsv = (logs: AuditLog[]) => {
  const header = ['Log ID', 'Time', 'Action', 'Recorded by (role)', 'Recorded by (ID)', 'Description'];
  const rows = logs.map((log) => [
    log.id,
    log.timestamp,
    ACTION_LABELS[log.actionType] ?? log.actionType,
    ROLE_LABELS[log.initiatorRole] ?? log.initiatorRole,
    log.initiatorBadge,
    log.description,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');

  // The byte-order mark lets spreadsheet apps read Hindi and Punjabi text correctly
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `krishisahyog-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const AdminGovernancePage: React.FC<AdminGovernancePageProps> = ({
  sources,
  auditLogs,
  metrics,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  const query = searchTerm.trim().toLowerCase();
  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.authorityName.toLowerCase().includes(query) ||
      s.domainUrl.toLowerCase().includes(query) ||
      s.gazetteNoticeRef.toLowerCase().includes(query);
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const kpis: { label: string; value: string }[] = [
    { label: 'Sources tracked', value: metrics.sourcesTracked.toLocaleString('en-IN') },
    { label: 'Schemes indexed', value: metrics.schemesIndexed.toLocaleString('en-IN') },
    { label: 'Rules up to date', value: `${metrics.policyFreshnessPercent}%` },
    { label: 'Citations not yet checked', value: metrics.unverifiedCitationsCount.toLocaleString('en-IN') },
    { label: 'Actions logged', value: metrics.totalAuditEvents.toLocaleString('en-IN') },
  ];

  const categories = Object.keys(CATEGORY_LABELS) as GovernmentSource['category'][];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin and governance"
        description="The official sources the assistant uses for its answers, and a record of actions taken in the app."
      />

      {/* Key figures */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.label}
            className={`min-w-0 rounded-lg border border-line bg-white p-4 ${
              idx === kpis.length - 1 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <dt className="text-[13px] text-muted leading-snug">{kpi.label}</dt>
            <dd className="font-display text-3xl font-semibold text-navy tabular-nums mt-1">{kpi.value}</dd>
          </div>
        ))}
      </dl>

      {/* Sources */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader
          title="Official sources"
          description="Government websites the assistant takes its answers from. Automatic syncing is not connected in this prototype."
          icon={<Globe className="w-5 h-5" />}
        />

        <div className="px-5 pb-4 space-y-3">
          <div className="max-w-sm">
            <label htmlFor="admin-source-search" className={fieldLabel}>
              Search sources
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                aria-hidden="true"
              />
              <input
                id="admin-source-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Authority, website or reference"
                className={`${fieldControl} pl-9`}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <Chip active={categoryFilter === 'ALL'} count={sources.length} onClick={() => setCategoryFilter('ALL')}>
              All
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category}
                active={categoryFilter === category}
                count={sources.filter((s) => s.category === category).length}
                onClick={() => setCategoryFilter(category)}
              >
                {CATEGORY_LABELS[category]}
              </Chip>
            ))}
          </div>
        </div>

        {filteredSources.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState title="No sources found" description="Try a different search or choose another category." />
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full text-sm">
              <thead className="bg-offwhite text-muted text-left">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Authority</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Level</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Category</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Reference</th>
                  <th scope="col" className="px-5 py-2.5 font-medium text-right">Policies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredSources.map((source) => (
                  <tr key={source.id} className="align-top">
                    <td className="px-5 py-3 min-w-56">
                      <p className="font-medium text-ink">{source.authorityName}</p>
                      <a
                        href={`https://${source.domainUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-brand-dark hover:text-navy hover:underline underline-offset-4"
                      >
                        {source.domainUrl}
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </td>
                    <td className="px-5 py-3 text-ink whitespace-nowrap">{JURISDICTION_LABELS[source.jurisdiction]}</td>
                    <td className="px-5 py-3 text-ink whitespace-nowrap">{CATEGORY_LABELS[source.category]}</td>
                    <td className="px-5 py-3 text-muted min-w-48">{source.gazetteNoticeRef}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-navy">{source.policyCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Audit log */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader
          title="Audit log"
          description="Actions recorded in the app."
          icon={<FileClock className="w-5 h-5" />}
          action={
            <Button variant="secondary" disabled={auditLogs.length === 0} onClick={() => downloadAuditLogCsv(auditLogs)}>
              <Download className="w-4 h-4" aria-hidden="true" /> Download CSV
            </Button>
          }
        />

        {auditLogs.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState title="No actions recorded yet" description="Actions taken in the app will be listed here." />
          </div>
        ) : (
          <ul className="border-t border-line divide-y divide-line">
            {auditLogs.map((log) => (
              <li key={log.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-ink leading-snug break-words">{log.description}</p>
                  <p className="text-[13px] text-muted mt-1">
                    {ACTION_LABELS[log.actionType] ?? log.actionType} · <span className="tabular-nums">{log.id}</span>
                  </p>
                </div>
                <div className="shrink-0 text-[13px] text-muted sm:text-right">
                  <p>
                    Recorded by <span className="text-ink">{ROLE_LABELS[log.initiatorRole] ?? log.initiatorRole}</span>{' '}
                    <span className="tabular-nums">({log.initiatorBadge})</span>
                  </p>
                  <p className="tabular-nums mt-0.5">
                    <time dateTime={log.timestamp}>{formatTime(log.timestamp)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
