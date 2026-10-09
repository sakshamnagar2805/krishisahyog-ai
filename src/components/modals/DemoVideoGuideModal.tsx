import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  House,
  KeyRound,
  Landmark,
  Languages,
  LucideIcon,
  MessageSquareWarning,
  Mic,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { Button, Modal } from '../ui';

interface DemoVideoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: LanguageCode;
}

interface GuideStep {
  title: string;
  description: string;
  whatToDo: string;
  icon: LucideIcon;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Choose your language',
    description: 'The app can be used in English, हिन्दी or ਪੰਜਾਬੀ. More languages are coming soon.',
    whatToDo: 'Tap your language, then tap Continue.',
    icon: Languages,
  },
  {
    title: 'Sign in with your mobile number',
    description: 'Enter your 10-digit mobile number. In this demo you can also pick a sample person, such as a farmer or a PACS operator.',
    whatToDo: 'Type your number, or tap "Use demo farmer", then continue.',
    icon: Smartphone,
  },
  {
    title: 'Enter the code',
    description: 'Type the 6-digit code. In this demo the code is always 123456 and no SMS is sent.',
    whatToDo: 'Type 123456, or tap the button that fills it in for you.',
    icon: KeyRound,
  },
  {
    title: 'Start from the dashboard',
    description: 'The dashboard shows what needs your attention first: claim updates, missing documents and next steps.',
    whatToDo: 'Work through the "Needs your attention" list from the top.',
    icon: House,
  },
  {
    title: 'Check your crop insurance claim',
    description: 'See the status of your PMFBY claim and which documents it still needs.',
    whatToDo: 'Open Crop insurance (PMFBY) and upload anything marked as missing.',
    icon: ShieldCheck,
  },
  {
    title: 'Keep your documents ready',
    description: 'Keep land, bank and crop papers in one place and see which ones are missing or have expired.',
    whatToDo: 'Open Documents and replace any paper that is missing or expired.',
    icon: FolderOpen,
  },
  {
    title: 'Find government schemes',
    description: 'See schemes that may suit your crop, land and district. The department decides final eligibility.',
    whatToDo: 'Open Government schemes and read the documents each scheme needs.',
    icon: Landmark,
  },
  {
    title: 'Ask by voice',
    description: 'Speak or type your question in Hindi, Punjabi or English.',
    whatToDo: 'Tap "Ask by voice" at the top of the screen and ask your question.',
    icon: Mic,
  },
  {
    title: 'Raise or track a grievance',
    description: 'Prepare a complaint and follow its progress. Official complaints are filed on pgportal.gov.in or at the office.',
    whatToDo: 'Open Grievances to raise a new complaint or check one you filed.',
    icon: MessageSquareWarning,
  },
];

export const DemoVideoGuideModal: React.FC<DemoVideoGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Start from the first step every time the guide is opened
  useEffect(() => {
    if (isOpen) setActiveStepIndex(0);
  }, [isOpen]);

  const currentStep = GUIDE_STEPS[activeStepIndex];
  const isFirst = activeStepIndex === 0;
  const isLast = activeStepIndex === GUIDE_STEPS.length - 1;
  const StepIcon = currentStep.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How to use KrishiSahyog"
      description={`Step ${activeStepIndex + 1} of ${GUIDE_STEPS.length}`}
      footer={
        <>
          <Button variant="secondary" disabled={isFirst} onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </Button>
          {isLast ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <Button onClick={() => setActiveStepIndex((i) => Math.min(GUIDE_STEPS.length - 1, i + 1))}>
              Next <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5" aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy">
            <StepIcon className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-navy leading-tight">{currentStep.title}</h3>
            <p className="text-[15px] text-ink mt-1.5 leading-relaxed">{currentStep.description}</p>
          </div>
        </div>

        <div className="rounded-md border border-line bg-offwhite px-4 py-3">
          <p className="text-[13px] text-muted">What to do</p>
          <p className="text-[15px] text-ink mt-0.5">{currentStep.whatToDo}</p>
        </div>

        <nav aria-label="Guide steps" className="flex flex-wrap justify-center">
          {GUIDE_STEPS.map((step, idx) => {
            const isCurrent = idx === activeStepIndex;
            return (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                aria-label={`Step ${idx + 1}: ${step.title}`}
                aria-current={isCurrent ? 'step' : undefined}
                className="flex h-8 w-8 items-center justify-center rounded-full"
              >
                <span
                  className={`block rounded-full transition-all ${
                    isCurrent ? 'h-2.5 w-2.5 bg-brand' : idx < activeStepIndex ? 'h-2 w-2 bg-navy/60' : 'h-2 w-2 bg-muted/40'
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>
      </div>
    </Modal>
  );
};
