import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { LanguageCode } from '../types';
import { LANGUAGE_CATALOG, LanguageDefinition, getTranslations } from '../utils/translations';
import { DemoVideoGuideModal } from '../components/modals/DemoVideoGuideModal';
import { Button, Card, Notice } from '../components/ui';
import { AuthLayout } from '../components/layout/AuthLayout';

interface LanguageSelectionPageProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onContinue: () => void;
}

export const LanguageSelectionPage: React.FC<LanguageSelectionPageProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
}) => {
  const [isVideoGuideOpen, setIsVideoGuideOpen] = useState(false);
  const [comingSoonLanguage, setComingSoonLanguage] = useState<LanguageDefinition | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const t = getTranslations(
    selectedLanguage === 'hi' || selectedLanguage === 'pa' ? selectedLanguage : 'en'
  );

  const handleCardClick = (lang: LanguageDefinition) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);

    if (!lang.isAvailable) {
      setComingSoonLanguage(lang);
      noticeTimer.current = setTimeout(() => setComingSoonLanguage(null), 5000);
      return;
    }

    setComingSoonLanguage(null);
    onSelectLanguage(lang.code);
  };

  const selectedDef = LANGUAGE_CATALOG.find((l) => l.code === selectedLanguage);
  const isSelectionValid = selectedDef?.isAvailable ?? false;

  return (
    <AuthLayout width="wide">
      <Card className="p-5 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy tracking-tight">
            {t.selectLanguageTitle}
          </h1>
          <p className="text-[15px] text-muted mt-1.5 max-w-2xl leading-relaxed">{t.selectLanguageSubtitle}</p>
        </div>

        {/* Step-by-step guide */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border border-line bg-offwhite p-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-navy">{t.watchVideoGuide}</p>
              <p className="text-sm text-muted mt-0.5 leading-relaxed">{t.videoGuideDescription}</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto shrink-0" onClick={() => setIsVideoGuideOpen(true)}>
            {t.visualGuideBadge}
          </Button>
        </div>

        {comingSoonLanguage && (
          <Notice
            tone="info"
            title={`${comingSoonLanguage.nativeName} (${comingSoonLanguage.englishName}) is coming soon`}
          >
            For now, please choose English, हिन्दी or ਪੰਜਾਬੀ.
          </Notice>
        )}

        {/* Language cards */}
        <div
          role="radiogroup"
          aria-label="Select application language"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
        >
          {LANGUAGE_CATALOG.map((item) => {
            const isSelected = selectedLanguage === item.code;
            const isAvailable = item.isAvailable;

            return (
              <div
                key={item.code}
                role="radio"
                aria-checked={isSelected}
                aria-disabled={!isAvailable}
                tabIndex={isAvailable ? 0 : -1}
                onClick={() => handleCardClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(item);
                  }
                }}
                className={`min-w-0 rounded-md border p-4 text-left select-none transition-colors ${
                  isSelected
                    ? 'border-navy bg-blue-soft ring-1 ring-navy cursor-pointer'
                    : isAvailable
                    ? 'border-line bg-white hover:border-brand-dark/40 hover:bg-offwhite cursor-pointer'
                    : 'border-line bg-offwhite cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-xl font-semibold leading-tight ${isAvailable ? 'text-navy' : 'text-muted'}`}>
                      {item.nativeName}
                    </p>
                    <p className="text-sm text-muted">{item.englishName}</p>
                  </div>

                  {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0 text-brand-dark" aria-hidden="true" />}

                  {!isAvailable && (
                    <span className="shrink-0 rounded-full border border-line bg-white px-2.5 py-0.5 text-[13px] text-muted">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-3 pt-2 border-t border-line text-[13px] text-muted truncate">{item.region}</p>
              </div>
            );
          })}
        </div>

        <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-line">
          <p className="text-sm text-muted">
            Selected language:{' '}
            <span className="font-semibold text-navy">
              {selectedDef?.nativeName} ({selectedDef?.englishName})
            </span>
          </p>

          <Button disabled={!isSelectionValid} onClick={onContinue} className="w-full sm:w-auto sm:px-8">
            {t.continueBtn}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>

      <DemoVideoGuideModal
        isOpen={isVideoGuideOpen}
        onClose={() => setIsVideoGuideOpen(false)}
        currentLanguage={selectedLanguage}
      />
    </AuthLayout>
  );
};
