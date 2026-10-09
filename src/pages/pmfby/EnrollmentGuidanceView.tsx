import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { OfficialPortalButton } from '../../components/common';
import { Button, Card, SectionHeading } from '../../components/ui';

interface EnrollmentGuidanceViewProps {
  onNavigateTab: (tabId: string) => void;
}

const steps = [
  {
    step: 1,
    shortTitle: 'Check your crop',
    title: 'Check that your crop is covered this season',
    description:
      'Find out whether your crop is on the insured list for your tehsil or block. For example: wheat, mustard or gram in Rabi; bajra, paddy or maize in Kharif.',
    tips: [
      'The state agriculture department publishes the list before each season starts.',
      'The list is usually made for each village panchayat or Patwar circle.',
    ],
  },
  {
    step: 2,
    shortTitle: 'Check your details',
    title: 'Check your personal and land details',
    description: 'Your details must match the official records, or your claim can get stuck later.',
    tips: [
      'Your Aadhaar must be linked and verified.',
      'Your bank account and IFSC must be active, with direct benefit transfer (DBT) enabled.',
      'Your Khewat, Khatoni and Khasra numbers must be correct.',
    ],
  },
  {
    step: 3,
    shortTitle: 'Collect documents',
    title: 'Collect your documents',
    description: 'Keep copies ready to show at the bank, PACS or Common Service Centre.',
    tips: [
      'Record of rights (RoR / Jamabandi) from the state land records website or the Patwari.',
      'Sowing certificate or crop sowing declaration (Girdawari) from the Patwari.',
      'Bank passbook copy showing the account holder name and account details.',
      'Tenancy or sharecropping agreement, if you farm leased or shared land.',
    ],
  },
  {
    step: 4,
    shortTitle: 'Choose where to enrol',
    title: 'Choose where to enrol',
    description: 'Where you enrol depends on whether you have a crop loan.',
    tips: [
      'If you have a crop loan (KCC), your bank enrols you automatically. You can opt out before the last date.',
      'If you do not have a crop loan, enrol at your PACS, a Common Service Centre (CSC) or on the official portal.',
      'Always take a receipt with your application number.',
    ],
  },
  {
    step: 5,
    shortTitle: 'Enrol',
    title: 'Enrol through an official channel',
    description: 'Use the official PMFBY portal, or visit your cooperative bank or PACS.',
    tips: [
      'Check that the premium taken is not more than the farmer share (1.5% of the sum insured for Rabi crops, 2% for Kharif crops).',
      'Keep your policy receipt number safe. You will need it if you report crop damage.',
    ],
  },
];

export const EnrollmentGuidanceView: React.FC<EnrollmentGuidanceViewProps> = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const current = steps[activeStep - 1];

  return (
    <div className="space-y-5">
      <SectionHeading
        title="How to enrol for crop insurance"
        description="Five steps to get your crop insured. Enrolment happens at your bank, PACS, a CSC or on the official portal."
      />

      {/* Step picker */}
      <ol className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:grid-cols-5">
        {steps.map((s) => {
          const isActive = activeStep === s.step;
          const isDone = s.step < activeStep;
          return (
            <li key={s.step} className="min-w-0">
              <button
                type="button"
                onClick={() => setActiveStep(s.step)}
                aria-current={isActive ? 'step' : undefined}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink hover:bg-offwhite'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                    isActive ? 'bg-white text-navy' : isDone ? 'bg-brand-light text-brand-dark' : 'bg-blue-soft text-navy'
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </span>
                <span className="min-w-0 text-sm font-semibold leading-snug">{s.shortTitle}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Current step */}
      <Card aria-live="polite">
        <div className="border-b border-line px-5 pb-4 pt-5">
          <p className="text-sm text-muted">
            Step {activeStep} of {steps.length}
          </p>
          <h3 className="font-display text-xl font-semibold leading-tight text-navy">{current.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{current.description}</p>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-navy">Check these</p>
          <ul className="mt-2 space-y-2">
            {current.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-[15px] text-ink">
                <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0 text-brand" aria-hidden="true" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {activeStep === steps.length ? 'Ready to enrol? Open the official portal.' : 'Go to the next step when you are ready.'}
          </p>

          <div className="flex flex-wrap gap-2">
            {activeStep > 1 && (
              <Button variant="secondary" onClick={() => setActiveStep(activeStep - 1)}>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Previous step
              </Button>
            )}

            {activeStep < steps.length ? (
              <Button onClick={() => setActiveStep(activeStep + 1)}>
                Next step <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            ) : (
              <OfficialPortalButton href="https://pmfby.gov.in" portalName="Open pmfby.gov.in" />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
