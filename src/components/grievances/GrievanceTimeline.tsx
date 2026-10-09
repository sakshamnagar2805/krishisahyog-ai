import React from 'react';
import { GrievanceTimelineStep } from '../../types';

interface GrievanceTimelineProps {
  timeline: GrievanceTimelineStep[];
  currentStatus: string;
}

type StepState = 'completed' | 'current' | 'pending';

const DOT: Record<StepState, string> = {
  completed: 'bg-brand-dark',
  current: 'bg-white border-2 border-navy ring-4 ring-navy/10',
  pending: 'bg-white border-2 border-line',
};

export const GrievanceTimeline: React.FC<GrievanceTimelineProps> = ({ timeline, currentStatus }) => {
  if (timeline.length === 0) {
    return (
      <p className="text-sm text-muted" id="grievance-timeline-container">
        No updates yet.
      </p>
    );
  }

  // Current step: the latest step matching the grievance status, otherwise the latest completed step
  const matchingIndex = timeline.map((step) => step.status as string).lastIndexOf(currentStatus);
  const currentIndex = matchingIndex !== -1 ? matchingIndex : timeline.map((step) => step.completed).lastIndexOf(true);

  return (
    <ol id="grievance-timeline-container">
      {timeline.map((step, idx) => {
        const state: StepState = idx === currentIndex ? 'current' : step.completed ? 'completed' : 'pending';
        const isLast = idx === timeline.length - 1;

        return (
          <li key={idx} className="flex gap-4" aria-current={state === 'current' ? 'step' : undefined}>
            <div className="flex flex-col items-center" aria-hidden="true">
              <span className={`mt-1 h-4 w-4 shrink-0 rounded-full ${DOT[state]}`} />
              {!isLast && <span className="mt-1 w-px flex-1 bg-line" />}
            </div>
            <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-6'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className={`font-semibold ${state === 'pending' ? 'text-muted' : 'text-navy'}`}>
                  {step.stage}
                  {state === 'current' && <span className="ml-2 text-[13px] font-normal text-muted">Current step</span>}
                  {state === 'pending' && <span className="sr-only"> (not reached yet)</span>}
                </p>
                <p className="text-[13px] text-muted tabular-nums">{step.date}</p>
              </div>
              {step.notes && <p className="mt-1 text-sm text-ink leading-relaxed">{step.notes}</p>}
              {step.officer && <p className="mt-1 text-[13px] text-muted">Handled by {step.officer}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
