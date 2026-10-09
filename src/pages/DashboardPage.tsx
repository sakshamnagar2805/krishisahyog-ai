import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  FolderOpen,
  Landmark,
  Mic,
  MessageSquareWarning,
  ShieldCheck,
  Sprout,
  Store,
  Upload,
  Wallet,
  LucideIcon,
} from 'lucide-react';
import { Farmer, PMFBYClaim, Grievance, PACSService, Document, Scheme, Notification } from '../types';
import { MANDI_RATES, WEATHER_SNAPSHOT } from '../utils/constants';
import { StatusBadge } from '../components/common';
import { Button, Card, CardHeader, SectionHeading } from '../components/ui';
import { SchemeMatchingService } from '../services/schemeMatchingService';

interface DashboardPageProps {
  farmer: Farmer;
  claim?: PMFBYClaim | null;
  grievance?: Grievance | null;
  pacs: PACSService;
  documents: Document[];
  schemes: Scheme[];
  notifications?: Notification[];
  onNavigate: (route: string) => void;
  onOpenVoiceGuide: () => void;
  onOpenUpload: (docType?: Document['docType']) => void;
  onAskAIQuestion?: (question: string) => void;
  onSelectScheme?: (schemeId: string) => void;
  onSelectGrievance?: (grievanceId: string) => void;
  onCreateGrievance?: () => void;
}

interface AttentionItem {
  id: string;
  tone: 'danger' | 'warning';
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const riseDelay = (ms: number) => ({ '--rise-delay': `${ms}ms` }) as React.CSSProperties;

const DOCUMENT_PROBLEM: Partial<Record<NonNullable<Document['status']>, string>> = {
  MISSING: 'is missing',
  EXPIRED: 'has expired',
  INVALID: 'is not valid',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  farmer,
  claim,
  grievance,
  documents,
  schemes,
  notifications = [],
  onNavigate,
  onOpenVoiceGuide,
  onOpenUpload,
  onAskAIQuestion,
  onSelectScheme,
  onSelectGrievance,
  onCreateGrievance,
}) => {
  const firstName = farmer.name.split(' ')[0];
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const readyDocs = documents.filter((d) => d.status === 'AVAILABLE');
  const docsNeedingAction = documents.filter((d) => d.status && DOCUMENT_PROBLEM[d.status]);
  const readyPercent = documents.length ? Math.round((readyDocs.length / documents.length) * 100) : 0;

  const attentionItems: AttentionItem[] = [];
  if (claim?.status === 'ADDITIONAL INFORMATION REQUIRED') {
    attentionItems.push({
      id: 'claim',
      tone: 'danger',
      title: 'Your crop insurance claim needs more information',
      description: `${claim.crop}, ${claim.season} ${claim.year} · ${claim.nextAction}`,
      actionLabel: 'View claim',
      onAction: () => onNavigate('pmfby-crop-insurance'),
    });
  }
  docsNeedingAction.forEach((doc) => {
    attentionItems.push({
      id: doc.id,
      tone: doc.status === 'MISSING' ? 'danger' : 'warning',
      title: `${doc.title} ${DOCUMENT_PROBLEM[doc.status!]}`,
      description: doc.whyRequired || 'Needed for your claim and scheme applications.',
      actionLabel: doc.status === 'MISSING' ? 'Upload' : 'Replace',
      onAction: () => onOpenUpload(doc.docType),
    });
  });
  if (!farmer.aadhaarSeeded) {
    attentionItems.push({
      id: 'aadhaar-seeding',
      tone: 'warning',
      title: 'Link your Aadhaar with your bank account',
      description: 'Claim payouts and other direct benefit transfers are paid only into an Aadhaar-linked account.',
      actionLabel: 'See steps',
      onAction: () => onNavigate('pmfby-crop-insurance'),
    });
  }
  if (grievance?.status === 'ADDITIONAL INFORMATION REQUIRED') {
    attentionItems.push({
      id: 'grievance',
      tone: 'danger',
      title: 'Your grievance needs more information',
      description: grievance.subject,
      actionLabel: 'Open',
      onAction: () => onSelectGrievance?.(grievance.id),
    });
  }

  const matchedSchemes = React.useMemo(
    () =>
      SchemeMatchingService.matchSchemes(
        schemes,
        {
          state: farmer.state,
          district: farmer.district,
          crop: farmer.primaryCrop || 'Wheat',
          landCategory: 'Small',
          landAreaAcres: farmer.totalLandAcres,
          landOwnership: 'Owned',
          farmerProfile: {
            name: farmer.name,
            state: farmer.state,
            district: farmer.district,
            language: 'en',
            role: 'FARMER',
          },
        },
        documents
      ).slice(0, 2),
    [schemes, farmer, documents]
  );

  const latestUpdates = [...notifications].sort((a, b) => Number(a.read) - Number(b.read)).slice(0, 3);

  const askQuestion = (question: string) =>
    onAskAIQuestion ? onAskAIQuestion(question) : onNavigate('ai-and-voice-assistant');

  const services: { id: string; title: string; description: string; icon: LucideIcon }[] = [
    { id: 'pmfby-crop-insurance', title: 'Crop insurance', description: 'Check your PMFBY claim and what it needs', icon: ShieldCheck },
    { id: 'document-locker', title: 'Documents', description: 'Keep land, bank and crop papers ready', icon: FolderOpen },
    { id: 'government-schemes', title: 'Government schemes', description: 'Find schemes that may suit your farm', icon: Landmark },
    { id: 'pacs-services', title: 'PACS and fertilizer', description: 'Fertilizer quota, seeds and machines on hire', icon: Store },
    { id: 'credit-and-financial-assistance', title: 'Credit and KCC', description: 'Your Kisan Credit Card limit and dues', icon: Wallet },
    { id: 'grievance-redressal', title: 'Grievances', description: 'Raise a complaint or track one', icon: MessageSquareWarning },
    { id: 'agriculture-support', title: 'Farming support', description: 'Weather, soil and crop advice', icon: Sprout },
    { id: 'ai-and-voice-assistant', title: 'Voice assistant', description: 'Ask your question by speaking', icon: Mic },
  ];

  return (
    <div className="space-y-8 text-ink" id="farmer-dashboard-root">
      {/* Greeting */}
      <section className="rise flex flex-col md:flex-row md:items-end md:justify-between gap-4" id="dashboard-hero-section">
        <div>
          <p className="text-sm text-muted">{today}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy tracking-tight mt-1">
            Namaste, {firstName}
          </h1>
          <p className="text-[15px] text-muted mt-1.5">
            {farmer.village}, {farmer.district}, {farmer.state} · {farmer.totalLandAcres} acres · PACS member{' '}
            <span className="tabular-nums">{farmer.pacsMembershipId}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onOpenUpload()}>
            <Upload className="w-4 h-4" aria-hidden="true" /> Upload document
          </Button>
        </div>
      </section>

      {/* Needs attention */}
      <Card className="rise overflow-hidden" style={riseDelay(60)} id="dashboard-attention">
        <CardHeader
          title={attentionItems.length ? 'Needs your attention' : 'You are all caught up'}
          description={
            attentionItems.length
              ? `${attentionItems.length} ${attentionItems.length === 1 ? 'thing' : 'things'} to do so your claim and benefits are not delayed`
              : 'Nothing needs your action right now.'
          }
          icon={
            attentionItems.length ? (
              <AlertCircle className="w-5 h-5 text-danger" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-brand-dark" />
            )
          }
        />
        {attentionItems.length > 0 && (
          <ol className="border-t border-line divide-y divide-line">
            {attentionItems.map((item, index) => (
              <li key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                <span
                  className={`hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    item.tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warning/15 text-ink'
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy">{item.title}</p>
                  <p className="text-sm text-muted mt-0.5 line-clamp-2">{item.description}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={item.onAction} className="self-start sm:self-auto">
                  {item.actionLabel}
                </Button>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Claim */}
          <Card className="rise" style={riseDelay(120)} id="dashboard-pmfby-claim-card">
            <CardHeader
              title="Crop insurance claim"
              description={claim ? `Claim ${claim.claimId}` : 'PMFBY'}
              icon={<ShieldCheck className="w-5 h-5" />}
              action={claim && <StatusBadge status={claim.status} />}
            />
            {claim ? (
              <>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border-y border-line">
                  {[
                    ['Crop', `${claim.crop}`],
                    ['Season', `${claim.season} ${claim.year}`],
                    ['Sum insured', rupees(claim.sumInsured)],
                    ['Estimated payout', rupees(claim.indicativeEntitlementRupees)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white px-5 py-3">
                      <dt className="text-[13px] text-muted">{label}</dt>
                      <dd className="mt-0.5 font-semibold text-navy tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-muted">Next step</p>
                    <p className="font-medium text-ink">{claim.nextAction}</p>
                    <p className="text-[13px] text-muted mt-0.5">Updated {claim.lastUpdated}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => onNavigate('pmfby-crop-insurance')} id="view-claim-btn">
                    View claim details <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="px-5 pb-5 text-sm text-muted">
                No claims yet.{' '}
                <Button variant="link" onClick={() => onNavigate('pmfby-crop-insurance')}>
                  Learn how to claim
                </Button>
              </div>
            )}
          </Card>

          {/* Documents */}
          <Card className="rise" style={riseDelay(180)} id="dashboard-document-status-card">
            <CardHeader
              title="Documents"
              description={`${readyDocs.length} of ${documents.length} ready`}
              icon={<FolderOpen className="w-5 h-5" />}
              action={
                <Button variant="link" onClick={() => onNavigate('document-locker')} id="view-documents-btn">
                  Open locker <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              }
            />
            <div className="px-5">
              <div
                className="h-2 rounded-full bg-offwhite border border-line overflow-hidden"
                role="progressbar"
                aria-valuenow={readyPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Documents ready"
              >
                <div className="h-full bg-brand transition-all duration-500" style={{ width: `${readyPercent}%` }} />
              </div>
            </div>
            <ul className="mt-4 border-t border-line divide-y divide-line">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    onClick={() => onNavigate('document-locker')}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-offwhite"
                  >
                    <span className="font-medium text-ink truncate">{doc.title}</span>
                    <StatusBadge status={doc.status ?? doc.verificationStatus} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Updates */}
          <Card className="rise" style={riseDelay(260)} id="dashboard-notifications-section">
            <CardHeader
              title="Latest updates"
              action={
                <Button variant="link" onClick={() => onNavigate('notifications')}>
                  All
                </Button>
              }
            />
            <ul className="border-t border-line divide-y divide-line">
              {latestUpdates.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => onNavigate(n.actionRoute || 'notifications')}
                    className="w-full flex gap-3 px-5 py-3 text-left hover:bg-offwhite"
                  >
                    <span
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-line' : n.isUrgent ? 'bg-danger' : 'bg-brand'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink leading-snug">{n.title}</span>
                      <span className="block text-[13px] text-muted mt-0.5">{n.timestamp}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Voice assistant */}
          <section
            className="rise relative overflow-hidden rounded-lg bg-navy text-white p-5"
            style={riseDelay(140)}
            id="dashboard-ai-assistant-card"
          >
            <svg
              className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 text-brand/25"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              {[0, 12, 24, 36, 48, 60].map((offset) => (
                <path key={offset} d={`M${offset} 100 Q ${offset + 30} 55 ${offset + 50} 0`} fill="none" stroke="currentColor" strokeWidth="1.5" />
              ))}
            </svg>
            <div className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark">
                <Mic className="w-5 h-5" aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl font-semibold mt-3">Ask in your language</h2>
              <p className="text-sm text-white/75 mt-1 leading-relaxed">
                Speak or type in Hindi, Punjabi or English. The assistant checks your claim, documents and PACS account.
              </p>
              <ul className="mt-4 space-y-1.5">
                {['What documents do I need?', 'How can I track my claim?', 'Which schemes may be relevant?'].map((q) => (
                  <li key={q}>
                    <button
                      onClick={() => askQuestion(q)}
                      className="w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm bg-white/5 hover:bg-white/10"
                    >
                      <span>{q}</span>
                      <ChevronRight className="w-4 h-4 text-white/50 shrink-0" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button variant="inverse" className="mt-4 w-full" onClick={onOpenVoiceGuide} id="ask-ai-cta-btn">
                <Mic className="w-4 h-4" aria-hidden="true" /> Start speaking
              </Button>
            </div>
          </section>

          {/* Grievance */}
          <Card className="rise" style={riseDelay(200)} id="dashboard-grievance-card">
            <CardHeader
              title="Grievance"
              description={grievance ? <span className="tabular-nums">{grievance.grievanceId}</span> : 'No open grievances'}
              icon={<MessageSquareWarning className="w-5 h-5" />}
            />
            <div className="px-5 pb-5">
              {grievance ? (
                <>
                  <StatusBadge status={grievance.status} />
                  <p className="font-medium text-ink leading-snug mt-2">{grievance.subject}</p>
                  <p className="text-[13px] text-muted mt-1">
                    Filed {grievance.lodgedDate}
                    {grievance.slaDaysRemaining !== undefined && ` · ${grievance.slaDaysRemaining} days left for a response`}
                  </p>
                  <Button
                    variant="link"
                    className="mt-3"
                    onClick={() => (onSelectGrievance ? onSelectGrievance(grievance.id) : onNavigate('grievance-redressal'))}
                    id="track-grievance-btn"
                  >
                    Track grievance <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => (onCreateGrievance ? onCreateGrievance() : onNavigate('grievance-redressal'))}
                >
                  Raise a grievance
                </Button>
              )}
            </div>
          </Card>

        </div>
      </div>

      {/* Services */}
      <section className="rise" style={riseDelay(300)} id="dashboard-primary-service-cards">
        <SectionHeading title="Services" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ id, title, description, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="group flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-brand-dark/40 hover:bg-offwhite"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy group-hover:bg-brand-light group-hover:text-brand-dark">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-navy">{title}</span>
                <span className="block text-sm text-muted mt-0.5 leading-snug">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Schemes */}
      {matchedSchemes.length > 0 && (
        <section className="rise" style={riseDelay(340)} id="dashboard-recommended-schemes-section">
          <SectionHeading
            title="Schemes that may help you"
            description="Based on your crop, land and district. The department decides final eligibility."
            action={
              <Button variant="link" onClick={() => onNavigate('government-schemes')}>
                All schemes <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {matchedSchemes.map(({ scheme, relevanceReasons, documentReadiness }) => (
              <Card as="article" key={scheme.id} className="p-5 flex flex-col" id={`dashboard-scheme-${scheme.id.toLowerCase()}`}>
                <h3 className="font-display text-lg font-semibold text-navy leading-snug">{scheme.name}</h3>
                <p className="text-sm text-muted mt-1 line-clamp-2">{scheme.shortDescription || scheme.summary}</p>
                <p className="text-sm text-ink mt-3">
                  <span className="font-medium">Why it may fit: </span>
                  {relevanceReasons[0]}
                </p>
                {documentReadiness.missing.length > 0 && (
                  <p className="text-sm text-ink mt-1">
                    <span className="font-medium">Still needed: </span>
                    {documentReadiness.missing.map((m) => m.title).join(', ')}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => (onSelectScheme ? onSelectScheme(scheme.id) : onNavigate('government-schemes'))}
                    id={`dashboard-btn-view-${scheme.id.toLowerCase()}`}
                  >
                    View details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Prices and weather */}
      <section className="rise grid grid-cols-1 gap-6 lg:grid-cols-3" style={riseDelay(380)}>
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader title="Mandi prices" description="Sample prices for this demo, not live market data" />
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full text-sm">
              <thead className="bg-offwhite text-muted text-left">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Crop</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Mandi</th>
                  <th scope="col" className="px-5 py-2.5 font-medium text-right">Price per quintal</th>
                  <th scope="col" className="px-5 py-2.5 font-medium text-right">MSP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {MANDI_RATES.map((m) => (
                  <tr key={m.commodity}>
                    <td className="px-5 py-3 font-medium text-ink">{m.commodity}</td>
                    <td className="px-5 py-3 text-muted">{m.mandi}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-navy">{rupees(m.mandiRate)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted">{rupees(m.msp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <CloudSun className="w-5 h-5 text-navy" aria-hidden="true" /> Weather · {WEATHER_SNAPSHOT.location}
          </div>
          <p className="font-display text-4xl font-semibold text-navy mt-3 tabular-nums">{WEATHER_SNAPSHOT.tempCelsius}°C</p>
          <p className="text-ink">{WEATHER_SNAPSHOT.condition}</p>
          <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <dt className="text-muted">Humidity</dt>
              <dd className="font-semibold text-navy tabular-nums">{WEATHER_SNAPSHOT.humidityPercent}%</dd>
            </div>
            <div>
              <dt className="text-muted">Wind</dt>
              <dd className="font-semibold text-navy tabular-nums">{WEATHER_SNAPSHOT.windSpeedKmh} km/h</dd>
            </div>
          </dl>
          <p className="text-sm text-ink mt-4 pt-4 border-t border-line">{WEATHER_SNAPSHOT.forecast}</p>
          <p className="text-[13px] text-muted mt-2">Sample weather for this demo</p>
        </Card>
      </section>
    </div>
  );
};
