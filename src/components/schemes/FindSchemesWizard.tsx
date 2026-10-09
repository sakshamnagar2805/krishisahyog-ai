import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Document, SchemeDiscoveryInputs, User as UserType } from '../../types';
import { StatusBadge } from '../common';
import { Button, Card, KeyValueGrid, Notice, fieldControl, fieldHint, fieldLabel } from '../ui';

interface FindSchemesWizardProps {
  currentUser?: UserType;
  documents: Document[];
  onComplete: (inputs: SchemeDiscoveryInputs) => void;
  onCancel?: () => void;
  initialInputs?: Partial<SchemeDiscoveryInputs>;
}

const DEMO_STATES = [
  'Rajasthan',
  'Punjab',
  'Maharashtra',
  'Gujarat',
  'Telangana',
  'Tamil Nadu',
  'West Bengal',
  'Karnataka',
];

const STATE_DISTRICTS: Record<string, string[]> = {
  Rajasthan: ['Jaipur', 'Alwar', 'Kota', 'Jodhpur', 'Bikaner', 'Sikar', 'Dausa'],
  Punjab: ['Ludhiana', 'Patiala', 'Amritsar', 'Bathinda', 'Jalandhar', 'Sangrur'],
  Maharashtra: ['Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur', 'Kolhapur'],
  Gujarat: ['Ahmedabad', 'Rajkot', 'Surat', 'Vadodara', 'Bhavnagar'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'West Bengal': ['Kolkata', 'Burdwan', 'Midnapore', 'Hooghly', 'Murshidabad'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Belagavi', 'Hubballi', 'Tumakuru'],
};

const DEMO_CROPS = ['Wheat', 'Mustard', 'Bajra', 'Rice', 'Cotton', 'Maize', 'Vegetables', 'Other'];

const LAND_CATEGORIES: { value: SchemeDiscoveryInputs['landCategory']; hint?: string }[] = [
  { value: 'Marginal', hint: 'Less than 1 hectare' },
  { value: 'Small', hint: '1 to 2 hectares' },
  { value: 'Medium' },
  { value: 'Large' },
  { value: 'Not specified' },
];

const LAND_OWNERSHIP: SchemeDiscoveryInputs['landOwnership'][] = ['Owned', 'Leased', 'Other', 'Not specified'];

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  bn: 'বাংলা',
  kn: 'ಕನ್ನಡ',
};

const ROLE_NAMES: Record<string, string> = {
  farmer: 'Farmer',
  pacs: 'PACS operator',
  officer: 'Agriculture officer',
  admin: 'Administrator',
};

/** Document statuses that mean the document cannot be used yet */
const DOCUMENT_PROBLEM: Partial<Record<NonNullable<Document['status']>, string>> = {
  MISSING: 'missing',
  EXPIRED: 'expired',
  INVALID: 'not valid',
  PENDING_REVIEW: 'waiting for review',
};

const STEPS = [
  { num: 1, label: 'State' },
  { num: 2, label: 'District' },
  { num: 3, label: 'Crop' },
  { num: 4, label: 'Land' },
  { num: 5, label: 'Your profile' },
  { num: 6, label: 'Documents' },
  { num: 7, label: 'Review' },
];

/** Large selectable option used for crop, land size and ownership choices */
const OptionButton: React.FC<{
  selected: boolean;
  onClick: () => void;
  id?: string;
  children: React.ReactNode;
}> = ({ selected, onClick, id, children }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    id={id}
    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-[15px] transition-colors ${
      selected ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink hover:bg-offwhite'
    }`}
  >
    <span className="min-w-0">{children}</span>
    {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
  </button>
);

const StepHeading: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mb-5">
    <h3 className="font-display text-xl font-semibold text-navy">{title}</h3>
    <p className="mt-1 text-[15px] text-muted">{description}</p>
  </div>
);

export const FindSchemesWizard: React.FC<FindSchemesWizardProps> = ({
  currentUser,
  documents,
  onComplete,
  onCancel,
  initialInputs,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form state starts from the farmer's last answers (or the demo farmer's defaults)
  const [state, setState] = useState<string>(initialInputs?.state || 'Rajasthan');
  const [district, setDistrict] = useState<string>(initialInputs?.district || 'Jaipur');
  const [crop, setCrop] = useState<string>(initialInputs?.crop || 'Wheat');
  const [landCategory, setLandCategory] = useState<SchemeDiscoveryInputs['landCategory']>(
    initialInputs?.landCategory || 'Small'
  );
  const [landAreaAcres, setLandAreaAcres] = useState<number>(initialInputs?.landAreaAcres ?? 4.5);
  const [landOwnership, setLandOwnership] = useState<SchemeDiscoveryInputs['landOwnership']>(
    initialInputs?.landOwnership || 'Owned'
  );

  // Update district when state changes if current district not in new state
  const handleStateChange = (newState: string) => {
    setState(newState);
    const availableDistricts = STATE_DISTRICTS[newState] || ['All Districts'];
    setDistrict(availableDistricts[0]);
  };

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleFinalSubmit = () => {
    const inputs: SchemeDiscoveryInputs = {
      state,
      district,
      crop,
      landCategory,
      landAreaAcres,
      landOwnership,
      farmerProfile: {
        name: currentUser?.name || 'Ramesh Kumar',
        state,
        district,
        language: currentUser?.preferredLanguage || 'English',
        role: currentUser?.role?.toUpperCase() || 'FARMER',
      },
    };
    onComplete(inputs);
  };

  const docTitle = (doc: Document) => doc.title || doc.name || 'Document';
  const readyDocs = documents.filter((d) => d.status === 'AVAILABLE');
  const problemDocs = documents.filter((d) => d.status && DOCUMENT_PROBLEM[d.status]);
  const progressPercent = Math.round((currentStep / STEPS.length) * 100);

  const renderSummaryHeader = (title: string, step: number) => (
    <div className="flex items-center justify-between gap-2 px-5 py-1.5">
      <h4 className="font-semibold text-navy">{title}</h4>
      <Button
        variant="link"
        className="min-h-11"
        onClick={() => setCurrentStep(step)}
        aria-label={`Change ${title.toLowerCase()}`}
      >
        Change
      </Button>
    </div>
  );

  return (
    <div className="space-y-6" id="find-schemes-wizard">
      {/* Stepper */}
      <Card>
        <div className="px-5 pt-5">
          <h2 className="font-display text-lg font-semibold text-navy">Find schemes for me</h2>
          <p className="mt-1 text-sm text-muted">
            Answer a few short questions. We will show schemes that may be relevant to you.
          </p>
        </div>

        <div className="px-5 pt-4 pb-5">
          <p className="text-[15px]">
            <span className="font-semibold text-navy">
              Step <span className="tabular-nums">{currentStep}</span> of{' '}
              <span className="tabular-nums">{STEPS.length}</span>
            </span>
            <span className="text-muted"> · {STEPS[currentStep - 1].label}</span>
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full border border-line bg-offwhite"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-label={`Step ${currentStep} of ${STEPS.length}`}
          >
            <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>

          <ol className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Steps">
            {STEPS.map((s) => {
              const isCompleted = s.num < currentStep;
              const isCurrent = s.num === currentStep;
              return (
                <li key={s.num} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(s.num)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'border-navy bg-navy font-semibold text-white'
                        : isCompleted
                        ? 'border-brand-light bg-brand-light text-brand-dark hover:border-brand-dark/40'
                        : 'border-line bg-white text-muted hover:bg-offwhite'
                    }`}
                    id={`wizard-step-${s.num}`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <span className="tabular-nums">{s.num}</span>
                    )}
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </Card>

      {/* Step content */}
      <Card className="p-5 sm:p-6">
        {currentStep === 1 && (
          <div className="max-w-xl">
            <StepHeading
              title="Which state is your farm in?"
              description="Schemes and their rules differ from state to state."
            />
            <label htmlFor="select-state" className={fieldLabel}>
              State
            </label>
            <select
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              className={fieldControl}
              id="select-state"
              aria-describedby="select-state-hint"
            >
              {DEMO_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <p id="select-state-hint" className={fieldHint}>
              Sample scheme information is available for a few states only.
            </p>
          </div>
        )}

        {currentStep === 2 && (
          <div className="max-w-xl">
            <StepHeading title="Which district?" description={`Choose your district in ${state}.`} />
            <label htmlFor="select-district" className={fieldLabel}>
              District
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={fieldControl}
              id="select-district"
            >
              {(STATE_DISTRICTS[state] || ['Jaipur']).map((dst) => (
                <option key={dst} value={dst}>
                  {dst}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-2xl">
            <StepHeading
              title="What is your main crop?"
              description="Some schemes are only for certain crops. Your crop alone does not decide whether you can apply."
            />
            <fieldset>
              <legend className={fieldLabel}>Main crop</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DEMO_CROPS.map((crp) => (
                  <OptionButton
                    key={crp}
                    selected={crop === crp}
                    onClick={() => setCrop(crp)}
                    id={`crop-option-${crp.toLowerCase()}`}
                  >
                    {crp}
                  </OptionButton>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {currentStep === 4 && (
          <div className="max-w-2xl">
            <StepHeading
              title="Tell us about your land"
              description="Many schemes give priority to small and marginal farmers."
            />

            <div className="space-y-6">
              <fieldset>
                <legend className={fieldLabel}>Size of your landholding</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {LAND_CATEGORIES.map((cat) => {
                    const selected = landCategory === cat.value;
                    return (
                      <OptionButton key={cat.value} selected={selected} onClick={() => setLandCategory(cat.value)}>
                        <span className="block">{cat.value}</span>
                        {cat.hint && (
                          <span className={`block text-[13px] ${selected ? 'text-white/75' : 'text-muted'}`}>
                            {cat.hint}
                          </span>
                        )}
                      </OptionButton>
                    );
                  })}
                </div>
              </fieldset>

              <div className="max-w-xs">
                <label htmlFor="input-land-area" className={fieldLabel}>
                  Land you farm (acres)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={landAreaAcres}
                  onChange={(e) => setLandAreaAcres(parseFloat(e.target.value) || 0)}
                  className={`${fieldControl} tabular-nums`}
                  id="input-land-area"
                />
              </div>

              <fieldset>
                <legend className={fieldLabel}>Do you own this land?</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {LAND_OWNERSHIP.map((own) => (
                    <OptionButton key={own} selected={landOwnership === own} onClick={() => setLandOwnership(own)}>
                      {own}
                    </OptionButton>
                  ))}
                </div>
              </fieldset>

              <Notice tone="info">
                These answers only help us suggest schemes. They do not change your land records.
              </Notice>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="max-w-2xl">
            <StepHeading
              title="Your profile"
              description="Taken from your account, so you do not need to type it again."
            />
            <div className="overflow-hidden rounded-lg border border-line [&>dl]:border-y-0">
              <KeyValueGrid
                items={[
                  { label: 'Name', value: currentUser?.name || 'Ramesh Kumar' },
                  { label: 'Role', value: ROLE_NAMES[currentUser?.role || 'farmer'] || currentUser?.role },
                  { label: 'State', value: state },
                  { label: 'District', value: district },
                  {
                    label: 'Farmer ID',
                    value: currentUser?.id ? <span className="tabular-nums">{currentUser.id}</span> : 'Not available',
                  },
                  {
                    label: 'Preferred language',
                    value: currentUser?.preferredLanguage
                      ? LANGUAGE_NAMES[currentUser.preferredLanguage] || currentUser.preferredLanguage
                      : 'English',
                  },
                ]}
              />
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="max-w-2xl">
            <StepHeading
              title="Your documents"
              description="Most schemes ask for some of these. Here is what is saved in your document locker."
            />

            {documents.length > 0 ? (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <span className="min-w-0 font-medium text-ink">{docTitle(doc)}</span>
                    <StatusBadge status={doc.status ?? doc.verificationStatus} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-muted">No documents are saved in your locker yet.</p>
            )}

            <div className="mt-4">
              {problemDocs.length > 0 ? (
                <Notice
                  tone="warning"
                  title={`${problemDocs.length} ${problemDocs.length === 1 ? 'document needs' : 'documents need'} attention`}
                >
                  <ul className="list-disc pl-5">
                    {problemDocs.map((doc) => (
                      <li key={doc.id}>
                        {docTitle(doc)}: {DOCUMENT_PROBLEM[doc.status!]}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1">Schemes that ask for these will show them as still needed.</p>
                </Notice>
              ) : documents.length > 0 ? (
                <Notice tone="success">All your saved documents are ready.</Notice>
              ) : (
                <Notice tone="info">Each scheme will list the documents you need to collect.</Notice>
              )}
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div>
            <StepHeading
              title="Check your answers"
              description="Make sure these are right before we look for schemes."
            />

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="min-w-0 overflow-hidden rounded-lg border border-line [&>dl]:border-b-0">
                  {renderSummaryHeader('Place and crop', 1)}
                  <KeyValueGrid
                    items={[
                      { label: 'State', value: state },
                      { label: 'District', value: district },
                      { label: 'Main crop', value: crop },
                    ]}
                  />
                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-line [&>dl]:border-b-0">
                  {renderSummaryHeader('Land', 4)}
                  <KeyValueGrid
                    items={[
                      { label: 'Landholding', value: landCategory },
                      { label: 'Area', value: <span className="tabular-nums">{landAreaAcres} acres</span> },
                      { label: 'Ownership', value: landOwnership },
                    ]}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-line [&>dl]:border-b-0">
                {renderSummaryHeader('Documents', 6)}
                <KeyValueGrid
                  items={[
                    {
                      label: 'Ready',
                      value: readyDocs.length ? readyDocs.map(docTitle).join(', ') : 'None yet',
                    },
                    {
                      label: 'Need attention',
                      value: problemDocs.length
                        ? problemDocs.map((d) => `${docTitle(d)} (${DOCUMENT_PROBLEM[d.status!]})`).join(', ')
                        : 'None',
                    },
                  ]}
                />
              </div>

              <Notice tone="info">
                This only suggests schemes inside this app. Nothing is sent to any government office.
              </Notice>
            </div>
          </div>
        )}

        {/* Back / next */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" onClick={handleBack} id="wizard-btn-back" className="w-full sm:w-auto sm:min-w-32">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <Button onClick={handleNext} id="wizard-btn-next" className="w-full sm:w-auto sm:min-w-44">
            {currentStep === 7 ? 'Show schemes' : `Next: ${STEPS[currentStep]?.label}`}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
