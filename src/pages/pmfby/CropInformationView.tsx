import React from 'react';
import { ArrowRight, CloudHail, LucideIcon, Sprout, Sun, Wheat } from 'lucide-react';
import { PMFBYClaim } from '../../types';
import { Button, Card, CardHeader, KeyValueGrid, Notice, SectionHeading } from '../../components/ui';

interface CropInformationViewProps {
  claim: PMFBYClaim;
  onNavigateTab: (tabId: string) => void;
}

const CALAMITY_LABEL: Record<PMFBYClaim['calamityType'], string> = {
  HAILSTORM: 'Hailstorm',
  INUNDATION: 'Flooding',
  DROUGHT: 'Drought',
  PEST_ATTACK: 'Pest attack',
};

type RiskGroup = 'local' | 'widespread' | 'post-harvest';

const CALAMITY_RISK_GROUP: Record<PMFBYClaim['calamityType'], RiskGroup> = {
  HAILSTORM: 'local',
  INUNDATION: 'local',
  DROUGHT: 'widespread',
  PEST_ATTACK: 'widespread',
};

const COVERED_RISKS: { id: RiskGroup; title: string; description: string; icon: LucideIcon }[] = [
  {
    id: 'local',
    title: 'Local damage: hail, flooding, landslide',
    description: 'Checked field by field. Report it within 72 hours.',
    icon: CloudHail,
  },
  {
    id: 'widespread',
    title: 'Drought, heat, pests and disease',
    description: 'Loss across the whole area, measured through crop cutting experiments.',
    icon: Sun,
  },
  {
    id: 'post-harvest',
    title: 'Damage after harvest',
    description: 'Crops left to dry in the field are covered for up to 14 days after cutting.',
    icon: Wheat,
  },
];

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const CropInformationView: React.FC<CropInformationViewProps> = ({ claim, onNavigateTab }) => {
  const claimRiskGroup = CALAMITY_RISK_GROUP[claim.calamityType];

  return (
    <div className="space-y-5">
      <SectionHeading
        title={`${claim.crop} (${claim.season} ${claim.year})`}
        description={`Insured in ${claim.district} district, ${claim.state} · ${claim.plotKhasra}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Crop and damage */}
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader title="Your insured crop" icon={<Sprout className="w-5 h-5" aria-hidden="true" />} />
          <KeyValueGrid
            items={[
              {
                label: 'Crop',
                value: (
                  <>
                    {claim.crop}
                    <span className="block text-[13px] font-normal text-muted">{claim.variety}</span>
                  </>
                ),
              },
              {
                label: 'Area',
                value: (
                  <>
                    <span className="tabular-nums">{claim.surveyParcelSizeAcres} acres</span>
                    <span className="block text-[13px] font-normal text-muted">{claim.plotKhasra}</span>
                  </>
                ),
              },
              { label: 'Sum insured', value: <span className="tabular-nums">{rupees(claim.sumInsured)}</span> },
              {
                label: 'Damage',
                value: (
                  <>
                    {CALAMITY_LABEL[claim.calamityType]}
                    <span className="block text-[13px] font-normal text-muted">on {formatDate(claim.calamityDate)}</span>
                  </>
                ),
              },
            ]}
          />
          <div className="space-y-4 px-5 py-4">
            <p className="text-[15px] leading-relaxed text-ink">
              {CALAMITY_LABEL[claim.calamityType]} on {formatDate(claim.calamityDate)} damaged your {claim.crop.toLowerCase()}{' '}
              crop. The loss assessed for this claim is{' '}
              <strong className="font-semibold tabular-nums">{claim.assessedLossPercent}%</strong>.
            </p>
            <Notice tone="info">
              Sowing dates, threshold yield and the level of cover are set in your state&apos;s crop insurance notification
              for each district and season. Ask your bank, PACS or agriculture office for the figures for your crop.
            </Notice>
          </div>
        </Card>

        {/* Covered risks */}
        <Card className="flex min-w-0 flex-col lg:col-span-2">
          <CardHeader title="What the insurance covers" />
          <ul className="divide-y divide-line border-t border-line">
            {COVERED_RISKS.map(({ id, title, description, icon: Icon }) => (
              <li key={id} className="flex items-start gap-3 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-navy">
                    {title}
                    {id === claimRiskGroup && (
                      <span className="ml-2 text-[13px] font-medium text-brand-dark">Your claim</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-auto border-t border-line px-5 py-4">
            <Button variant="secondary" className="w-full" onClick={() => onNavigateTab('premium-info')}>
              See premium details <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
