import React, { useEffect, useRef } from 'react';
import { Camera, ChevronRight } from 'lucide-react';
import { VoiceAssistantPanel } from '../components/assistant/VoiceAssistantPanel';
import { useVoiceAssistant } from '../components/assistant/VoiceAssistantContext';
import { Button, Card, CardHeader, PageHeader } from '../components/ui';

interface AIAssistantPageProps {
  onNavigate: (route: string) => void;
  initialQuery?: string;
}

const TOPICS = [
  {
    title: 'Crop damage and insurance claims',
    description: 'Reporting a loss within 72 hours, field inspection and what your claim still needs.',
    prompt: 'How do I claim crop damage insurance for hailstorm loss on my wheat field?',
  },
  {
    title: 'KCC loan and interest',
    description: 'Your credit limit, the 4% on-time interest rate and the renewal date.',
    prompt: 'What is the interest rate and renewal deadline for my PACS KCC loan?',
  },
  {
    title: 'Fertilizer from your PACS',
    description: 'How much subsidized urea and DAP you can still collect, and the price per bag.',
    prompt: 'How much subsidized urea can I collect from my PACS right now?',
  },
  {
    title: 'Grievances',
    description: 'What to do if your complaint is not resolved in time.',
    prompt: 'What happens if the Block Agriculture Officer does not resolve my grievance in 7 days?',
  },
];

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ onNavigate, initialQuery }) => {
  const { ask } = useVoiceAssistant();

  // Questions handed over from other pages are asked once when the page opens
  const askedInitialQuery = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (initialQuery && askedInitialQuery.current !== initialQuery) {
      askedInitialQuery.current = initialQuery;
      ask(initialQuery);
    }
  }, [initialQuery, ask]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice and AI assistant"
        description="Talk or type in Hindi, Punjabi or English. It can check your claim, documents, schemes and PACS account, and open the right page for you."
      />

      <Card className="p-5">
        <VoiceAssistantPanel variant="page" />
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Ask about a topic" description="Tap a topic to ask the assistant." />
          <ul className="border-t border-line divide-y divide-line">
            {TOPICS.map((topic) => (
              <li key={topic.title}>
                <button
                  onClick={() => ask(topic.prompt)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-offwhite"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy">{topic.title}</span>
                    <span className="block text-sm text-muted mt-0.5">{topic.description}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Photos of crop damage"
            description="Good photos help the field inspection."
            icon={<Camera className="w-5 h-5" />}
          />
          <ol className="px-5 space-y-2.5 text-[15px] text-ink list-decimal list-inside marker:text-muted">
            <li>Take one wide photo that shows the whole damaged area and a landmark such as a boundary stone or road.</li>
            <li>Take close photos of the damaged plants, such as broken stems or fallen wheat ears.</li>
            <li>Turn on location in your phone camera so the photo shows where it was taken.</li>
            <li>Report the damage within 72 hours and keep the photos for the inspection.</li>
          </ol>
          <div className="px-5 py-4">
            <Button variant="link" onClick={() => onNavigate('pmfby-crop-insurance')}>
              Go to my claim <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
