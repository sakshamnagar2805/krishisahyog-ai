import React, { useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import { VoiceAssistantPanel } from '../assistant/VoiceAssistantPanel';
import { useVoiceAssistant } from '../assistant/VoiceAssistantContext';

interface VoiceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Side drawer hosting the voice assistant. It leaves the page visible so the
 * farmer can see pages the assistant opens while the conversation continues.
 */
export const VoiceGuideModal: React.FC<VoiceGuideModalProps> = ({ isOpen, onClose }) => {
  const { stopVoice } = useVoiceAssistant();

  const handleClose = () => {
    stopVoice();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div className="absolute inset-0 bg-navy/25 pointer-events-auto" onClick={handleClose} aria-hidden="true" />
      <aside
        className="relative pointer-events-auto h-full w-full sm:w-[440px] bg-white border-l border-line shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-drawer-title"
      >
        <div className="flex items-center justify-between gap-3 px-5 h-16 bg-navy text-white shadow-[inset_0_-3px_0_var(--color-brand)]">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark">
              <Mic className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="voice-drawer-title" className="font-display text-lg font-semibold leading-none">
                Voice assistant
              </h2>
              <span className="block text-xs text-white/65 mt-1">Ask in Hindi, Punjabi or English</span>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 -mr-2 rounded-md hover:bg-white/10" aria-label="Close voice assistant">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 p-5">
          <VoiceAssistantPanel variant="drawer" />
        </div>
      </aside>
    </div>
  );
};
