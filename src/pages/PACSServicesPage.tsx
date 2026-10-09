import React, { useState } from 'react';
import { Building2, Mic, Package, Phone, Tractor, Wallet } from 'lucide-react';
import { PACSService } from '../types';
import { StatusBadge, InformationOnlyBanner } from '../components/common';
import { Button, Card, CardHeader, KeyValueGrid, Notice, PageHeader } from '../components/ui';

interface PACSServicesPageProps {
  pacs: PACSService;
  onOpenVoiceGuide: () => void;
}

type Machine = NonNullable<PACSService['customHiringMachinery']>[number];

const rupees = (value: number) =>
  `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const MACHINE_STATUS: Record<
  Machine['availabilityStatus'],
  { status: 'AVAILABLE' | 'IN_PROGRESS' | 'CLOSED'; label: string }
> = {
  AVAILABLE: { status: 'AVAILABLE', label: 'Available now' },
  ENGAGED: { status: 'IN_PROGRESS', label: 'Booked' },
  MAINTENANCE: { status: 'CLOSED', label: 'Under maintenance' },
};

export const PACSServicesPage: React.FC<PACSServicesPageProps> = ({ pacs, onOpenVoiceGuide }) => {
  const [slipFertilizerId, setSlipFertilizerId] = useState<string | null>(null);

  const fertilizers = pacs.fertilizers ?? [];
  const machinery = pacs.customHiringMachinery ?? [];
  const kccLimit = pacs.kccLimitRupees ?? 0;
  const kccDrawn = pacs.kccDrawnRupees ?? 0;
  const place = [pacs.block, pacs.district].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <PageHeader
        title="PACS services"
        description="Your cooperative society account: fertilizer quota, Kisan Credit Card and machines on hire."
        actions={
          <Button variant="secondary" onClick={onOpenVoiceGuide}>
            <Mic className="w-4 h-4" aria-hidden="true" /> Ask the voice assistant
          </Button>
        }
      />

      <InformationOnlyBanner message="Fertilizer stock depends on supply to your society and its rules. Check at the society counter before you go to collect." />

      {/* Society summary */}
      <Card className="overflow-hidden">
        <CardHeader
          title={pacs.societyName || pacs.name}
          description={place || undefined}
          icon={<Building2 className="w-5 h-5" />}
        />
        <KeyValueGrid
          columns={4}
          items={[
            {
              label: 'Registration no.',
              value: <span className="tabular-nums">{pacs.societyRegistrationNo || '—'}</span>,
            },
            { label: 'Block and district', value: place || '—' },
            { label: 'Your member ID', value: <span className="tabular-nums">{pacs.memberId || '—'}</span> },
            {
              label: 'Helpline',
              value: pacs.helpline ? (
                <a
                  href={`tel:${pacs.helpline.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-brand-dark underline-offset-4 hover:text-navy hover:underline tabular-nums"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  {pacs.helpline}
                </a>
              ) : (
                '—'
              ),
            },
          ]}
        />
        {pacs.secretaryName && <p className="px-5 py-3 text-sm text-muted">Society secretary: {pacs.secretaryName}</p>}
      </Card>

      {/* Fertilizer quota */}
      <Card>
        <CardHeader
          title="Fertilizer quota this season"
          description="Bags you can still collect at the subsidised price"
          icon={<Package className="w-5 h-5" />}
        />
        {fertilizers.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted">No fertilizer quota is listed for your account.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 px-5 pb-5 md:grid-cols-2 xl:grid-cols-3">
            {fertilizers.map((fert) => {
              const collected = fert.bagsCollected ?? fert.totalSeasonalQuotaBags - fert.bagsAvailable;
              const percent = fert.totalSeasonalQuotaBags
                ? Math.min(100, Math.round((collected / fert.totalSeasonalQuotaBags) * 100))
                : 0;
              const soldOut = fert.bagsAvailable <= 0;

              return (
                <article key={fert.id} className="flex min-w-0 flex-col rounded-lg border border-line p-4">
                  <h3 className="font-semibold text-navy leading-snug">{fert.name}</h3>
                  <p className="text-sm text-muted mt-0.5">
                    <span className="tabular-nums">{rupees(fert.pricePerBagSubsidized)}</span> per bag, subsidised price
                  </p>

                  <p className="mt-4 text-[15px] text-ink">
                    <span className="font-semibold text-navy tabular-nums">{fert.bagsAvailable}</span> of{' '}
                    <span className="tabular-nums">{fert.totalSeasonalQuotaBags}</span> bags left
                  </p>
                  <div
                    className="mt-2 h-2 rounded-full bg-offwhite border border-line overflow-hidden"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${fert.name}: share of quota collected`}
                  >
                    <div className="h-full bg-brand transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-[13px] text-muted mt-1.5 tabular-nums">
                    Collected {collected} {collected === 1 ? 'bag' : 'bags'}
                  </p>

                  <div className="mt-auto pt-4">
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto"
                      disabled={soldOut}
                      onClick={() => setSlipFertilizerId(fert.id)}
                    >
                      Generate collection slip
                    </Button>
                    {soldOut && <p className="text-[13px] text-muted mt-1.5">You have collected your full quota.</p>}
                  </div>

                  {slipFertilizerId === fert.id && (
                    <Notice
                      tone="success"
                      className="mt-4"
                      title={pacs.isDemo ? "Demo collection slip — not valid at any PACS godown" : "Collection slip ready"}
                      action={
                        <Button variant="link" onClick={() => setSlipFertilizerId(null)}>
                          Dismiss
                        </Button>
                      }
                    >
                      {fert.activeTokenNumber ? (
                        <>
                          Token <span className="font-semibold tabular-nums">#{fert.activeTokenNumber}</span>. Show it
                          at the society godown{pacs.block ? ` in ${pacs.block}` : ''}
                          {fert.tokenExpiryHours ? ` within ${fert.tokenExpiryHours} hours` : ''}.
                        </>
                      ) : (
                        <>Show this slip at the society godown{pacs.block ? ` in ${pacs.block}` : ''} to collect your bags.</>
                      )}
                    </Notice>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* KCC summary */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader
            title="Kisan Credit Card"
            description="Your crop loan account with the society"
            icon={<Wallet className="w-5 h-5" />}
          />
          <KeyValueGrid
            items={[
              { label: 'Credit limit', value: <span className="tabular-nums">{rupees(kccLimit)}</span> },
              { label: 'Amount used', value: <span className="tabular-nums">{rupees(kccDrawn)}</span> },
              {
                label: 'Still available',
                value: <span className="tabular-nums">{rupees(Math.max(kccLimit - kccDrawn, 0))}</span>,
              },
              {
                label: 'Interest if repaid on time',
                value:
                  pacs.kccSubventionPercent !== undefined ? (
                    <span className="tabular-nums">{pacs.kccSubventionPercent}% a year</span>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
          <p className="px-5 py-3 text-[15px] text-ink">
            Renewal due:{' '}
            <span className="font-semibold text-navy tabular-nums">{formatDate(pacs.kccRenewalDueDate)}</span>
          </p>
        </Card>

        {/* Machinery for hire */}
        <Card className="min-w-0">
          <CardHeader
            title="Machines on hire"
            description="Book at the society counter"
            icon={<Tractor className="w-5 h-5" />}
          />
          {machinery.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted">No machines are listed for hire.</p>
          ) : (
            <ul className="border-t border-line divide-y divide-line">
              {machinery.map((m) => {
                const status = MACHINE_STATUS[m.availabilityStatus];
                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{m.machineryName}</p>
                      <p className="text-sm text-muted tabular-nums">{rupees(m.rentalRatePerHour)} per hour</p>
                    </div>
                    <StatusBadge status={status.status} label={status.label} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};
