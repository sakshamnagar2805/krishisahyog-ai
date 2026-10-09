import React, { useState } from 'react';
import { ArrowRight, Calculator } from 'lucide-react';
import { Button, Card, CardHeader, KeyValueGrid, SectionHeading, fieldControl, fieldHint, fieldLabel } from '../../components/ui';

interface PremiumInformationViewProps {
  onNavigateTab: (tabId: string) => void;
}

const cropConfigs = {
  WHEAT_RABI: {
    name: 'Wheat (Rabi food grain)',
    season: 'Rabi',
    sumInsuredPerAcre: 70000,
    farmerRatePercent: 1.5,
    actuarialRatePercent: 18.0,
  },
  BAJRA_KHARIF: {
    name: 'Pearl millet / Bajra (Kharif food grain)',
    season: 'Kharif',
    sumInsuredPerAcre: 60000,
    farmerRatePercent: 2.0,
    actuarialRatePercent: 16.0,
  },
  MUSTARD_RABI: {
    name: 'Mustard (Rabi oilseed)',
    season: 'Rabi',
    sumInsuredPerAcre: 65000,
    farmerRatePercent: 1.5,
    actuarialRatePercent: 17.5,
  },
};

type CropKey = keyof typeof cropConfigs;

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export const PremiumInformationView: React.FC<PremiumInformationViewProps> = ({ onNavigateTab }) => {
  const [selectedCrop, setSelectedCrop] = useState<CropKey>('WHEAT_RABI');
  const [acres, setAcres] = useState<number>(2.5);

  const currentCrop = cropConfigs[selectedCrop];
  const totalSumInsured = Math.round(acres * currentCrop.sumInsuredPerAcre);
  const totalFarmerPremium = Math.round(totalSumInsured * (currentCrop.farmerRatePercent / 100));
  const grossActuarialPremium = Math.round(totalSumInsured * (currentCrop.actuarialRatePercent / 100));
  const totalSubsidy = grossActuarialPremium - totalFarmerPremium;
  const centralSubsidy = Math.round(totalSubsidy / 2);
  const stateSubsidy = totalSubsidy - centralSubsidy;
  const governmentSharePercent = grossActuarialPremium ? Math.round((totalSubsidy / grossActuarialPremium) * 100) : 0;

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Premium calculator"
        description="See roughly how much premium you pay and how much the government pays. This is an example, not an official premium quote."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Inputs */}
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader title="Your crop and land" icon={<Calculator className="w-5 h-5" aria-hidden="true" />} />
          <div className="space-y-5 px-5 pb-5">
            <div>
              <label htmlFor="pmfby-premium-crop" className={fieldLabel}>
                Crop
              </label>
              <select
                id="pmfby-premium-crop"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value as CropKey)}
                className={fieldControl}
              >
                <option value="WHEAT_RABI">Wheat (Rabi food grain), you pay 1.5%</option>
                <option value="BAJRA_KHARIF">Pearl millet / Bajra (Kharif), you pay 2%</option>
                <option value="MUSTARD_RABI">Mustard (Rabi oilseed), you pay 1.5%</option>
              </select>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="pmfby-premium-acres" className={fieldLabel}>
                  Land area
                </label>
                <span className="text-[15px] font-semibold text-navy tabular-nums">{acres} acres</span>
              </div>
              <input
                id="pmfby-premium-acres"
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={acres}
                onChange={(e) => setAcres(parseFloat(e.target.value))}
                className="h-11 w-full accent-brand-dark"
              />
              <div className="flex justify-between text-[13px] text-muted tabular-nums" aria-hidden="true">
                <span>0.5</span>
                <span>5</span>
                <span>10 acres</span>
              </div>
            </div>

            <div className="rounded-md border border-line bg-offwhite px-4 py-3">
              <p className="text-sm font-semibold text-navy">The most a farmer pays</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                <li>Kharif food grains and oilseeds: 2% of the sum insured</li>
                <li>Rabi food grains and oilseeds: 1.5% of the sum insured</li>
                <li>Commercial and horticulture crops: 5% of the sum insured</li>
              </ul>
              <p className={fieldHint}>The rest of the premium is shared equally by the central and state governments.</p>
            </div>
          </div>
        </Card>

        {/* Results */}
        <Card className="flex min-w-0 flex-col lg:col-span-3" aria-live="polite">
          <CardHeader
            title="Example premium"
            description={`${currentCrop.name} · sum insured of ${rupees(currentCrop.sumInsuredPerAcre)} per acre in this example`}
          />
          <KeyValueGrid
            columns={3}
            items={[
              {
                label: 'Sum insured',
                value: (
                  <>
                    <span className="tabular-nums">{rupees(totalSumInsured)}</span>
                    <span className="block text-[13px] font-normal text-muted tabular-nums">for {acres} acres</span>
                  </>
                ),
              },
              {
                label: 'You pay',
                value: (
                  <>
                    <span className="tabular-nums">{rupees(totalFarmerPremium)}</span>
                    <span className="block text-[13px] font-normal text-muted tabular-nums">
                      {currentCrop.farmerRatePercent}% of the sum insured
                    </span>
                  </>
                ),
              },
              {
                label: 'Government pays',
                value: (
                  <>
                    <span className="tabular-nums">{rupees(totalSubsidy)}</span>
                    <span className="block text-[13px] font-normal text-muted tabular-nums">
                      {governmentSharePercent}% of the full premium
                    </span>
                  </>
                ),
              },
            ]}
          />

          <dl className="space-y-2 px-5 py-4 text-[15px]">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink">Central government share</dt>
              <dd className="font-semibold text-navy tabular-nums">{rupees(centralSubsidy)}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink">State government share</dt>
              <dd className="font-semibold text-navy tabular-nums">{rupees(stateSubsidy)}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-2">
              <dt className="font-semibold text-navy">Full premium</dt>
              <dd className="font-semibold text-navy tabular-nums">{rupees(grossActuarialPremium)}</dd>
            </div>
          </dl>

          <div className="mt-auto flex flex-col gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Want to insure your crop?</p>
            <Button variant="link" className="min-h-11" onClick={() => onNavigateTab('enrollment-guidance')}>
              How to enrol <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
