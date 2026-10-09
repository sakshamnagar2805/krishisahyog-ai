import React from 'react';
import {
  ArrowRight,
  CloudSun,
  FileText,
  Mic,
  Minus,
  Sprout,
  Tractor,
  TrendingDown,
  TrendingUp,
  LucideIcon,
} from 'lucide-react';
import { MANDI_RATES, WEATHER_SNAPSHOT } from '../utils/constants';
import { Button, Card, CardHeader, PageHeader } from '../components/ui';

interface AgricultureSupportPageProps {
  onNavigate: (route: string) => void;
  onOpenVoiceGuide: () => void;
}

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const TREND: Record<string, { label: string; icon: LucideIcon }> = {
  UP: { label: 'Rising', icon: TrendingUp },
  DOWN: { label: 'Falling', icon: TrendingDown },
  STEADY: { label: 'Steady', icon: Minus },
};

const SAMPLE_SOIL_RESULTS: { nutrient: string; level: string; value: string; tone: 'warning' | 'ok' }[] = [
  { nutrient: 'Nitrogen (N)', level: 'Low', value: '182 kg/ha', tone: 'warning' },
  { nutrient: 'Phosphorus (P)', level: 'Medium', value: '24 kg/ha', tone: 'ok' },
  { nutrient: 'Potash (K)', level: 'High', value: '310 kg/ha', tone: 'ok' },
  { nutrient: 'Soil pH', level: 'Neutral', value: '7.4', tone: 'ok' },
];

export const AgricultureSupportPage: React.FC<AgricultureSupportPageProps> = ({ onNavigate, onOpenVoiceGuide }) => {
  return (
    <div className="space-y-6" id="agriculture-support-page-root">
      <PageHeader
        title="Agriculture support"
        description="Weather, mandi prices, soil health and farming advice. Everything on this page is sample data for the demo."
        actions={
          <Button variant="secondary" onClick={onOpenVoiceGuide}>
            <Mic className="w-4 h-4" aria-hidden="true" /> Ask the voice assistant
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weather and advice */}
        <Card className="min-w-0 lg:col-span-2 overflow-hidden">
          <CardHeader
            title="Weather"
            description={`${WEATHER_SNAPSHOT.location} · sample weather, not a live forecast`}
            icon={<CloudSun className="w-5 h-5" />}
          />
          <dl className="grid grid-cols-2 gap-px bg-line border-y border-line sm:grid-cols-4">
            {[
              ['Temperature', `${WEATHER_SNAPSHOT.tempCelsius}°C`],
              ['Humidity', `${WEATHER_SNAPSHOT.humidityPercent}%`],
              ['Wind', `${WEATHER_SNAPSHOT.windSpeedKmh} km/h`],
              ['Sky', WEATHER_SNAPSHOT.condition],
            ].map(([label, value]) => (
              <div key={label} className="bg-white px-5 py-3 min-w-0">
                <dt className="text-[13px] text-muted">{label}</dt>
                <dd className="mt-0.5 font-semibold text-navy tabular-nums break-words">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-[13px] text-muted">Next two days</p>
              <p className="text-[15px] text-ink">{WEATHER_SNAPSHOT.forecast}</p>
            </div>
            <div className="border-t border-line pt-4">
              <p className="flex items-center gap-2 font-semibold text-navy">
                <Sprout className="w-4 h-4 text-brand-dark" aria-hidden="true" /> Advice for wheat
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-ink">
                <li>On sandy-loam soil, give light irrigation about every 12 days.</li>
                <li>If the leaves turn yellow, ask your agriculture officer whether a zinc sulphate spray is needed.</li>
              </ul>
              <p className="text-[13px] text-muted mt-2">Sample advice. Check with your local agriculture office before acting.</p>
            </div>
          </div>
        </Card>

        {/* Soil health card */}
        <Card className="min-w-0 flex flex-col">
          <CardHeader
            title="Soil health card"
            description="Sample test results"
            icon={<FileText className="w-5 h-5" />}
          />
          <dl className="border-t border-line divide-y divide-line">
            {SAMPLE_SOIL_RESULTS.map((row) => (
              <div key={row.nutrient} className="flex items-center justify-between gap-3 px-5 py-3">
                <dt className="text-sm text-muted">{row.nutrient}</dt>
                <dd className="flex items-center gap-2 text-right text-sm text-ink">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${row.tone === 'warning' ? 'bg-warning' : 'bg-brand'}`}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-semibold text-navy">{row.level}</span>{' '}
                    <span className="tabular-nums text-muted">({row.value})</span>
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto border-t border-line px-5 py-4">
            <Button variant="link" onClick={() => onNavigate('document-locker')}>
              Open your documents <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Mandi prices */}
      <Card className="overflow-hidden">
        <CardHeader title="Mandi prices" description="Sample prices for this demo, not live market data" />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full text-sm">
            <thead className="bg-offwhite text-muted text-left">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Crop</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Mandi</th>
                <th scope="col" className="px-5 py-2.5 font-medium text-right">Price per quintal</th>
                <th scope="col" className="px-5 py-2.5 font-medium text-right">MSP</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MANDI_RATES.map((m) => {
                const trend = TREND[m.trend] ?? TREND.STEADY;
                const TrendIcon = trend.icon;
                return (
                  <tr key={m.commodity}>
                    <td className="px-5 py-3 font-medium text-ink">{m.commodity}</td>
                    <td className="px-5 py-3 text-muted">{m.mandi}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-navy whitespace-nowrap">
                      {rupees(m.mandiRate)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted whitespace-nowrap">{rupees(m.msp)}</td>
                    <td className="px-5 py-3 text-ink whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <TrendIcon className="w-4 h-4 text-navy" aria-hidden="true" />
                        {trend.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Machinery */}
      <Card>
        <CardHeader
          title="Farm machines on hire"
          description="Your PACS rents out machines such as seeders and land levellers by the hour."
          icon={<Tractor className="w-5 h-5" />}
          action={
            <Button variant="secondary" size="sm" onClick={() => onNavigate('pacs-services')}>
              See machines and rates <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          }
        />
      </Card>
    </div>
  );
};
