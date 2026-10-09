import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Languages, UserCheck } from 'lucide-react';
import { LanguageCode, UserRole } from '../types';
import { getTranslations, LANGUAGE_CATALOG } from '../utils/translations';
import { Button, Card, Notice, fieldControl, fieldLabel } from '../components/ui';
import { AuthLayout } from '../components/layout/AuthLayout';

interface LoginPageProps {
  currentLanguage: LanguageCode;
  onBackToLanguage: () => void;
  onProceedToOtp: (mobileNumber: string, targetRole: UserRole) => void;
}

const DEMO_PERSONAS: { role: UserRole; label: string; person: string; mobile: string }[] = [
  { role: 'farmer', label: 'Farmer', person: 'Ramesh Kumar, Jaipur', mobile: '9876543210' },
  { role: 'pacs', label: 'PACS operator', person: 'Sukhdev Singh, PACS secretary', mobile: '9876543211' },
  { role: 'officer', label: 'Agriculture officer', person: 'Ravinder Sharma, block officer', mobile: '9876543212' },
  { role: 'admin', label: 'Administrator', person: 'Sample administrator', mobile: '9876543213' },
];

const textLinkClass =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-brand-dark hover:text-navy hover:underline underline-offset-4';

export const LoginPage: React.FC<LoginPageProps> = ({
  currentLanguage,
  onBackToLanguage,
  onProceedToOtp,
}) => {
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [error, setError] = useState<string | null>(null);

  const t = getTranslations(
    currentLanguage === 'hi' || currentLanguage === 'pa' ? currentLanguage : 'en'
  );
  const activeLanguageDef = LANGUAGE_CATALOG.find((l) => l.code === currentLanguage);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    onProceedToOtp(cleanNumber, selectedRole);
  };

  const handleSelectQuickPersona = (role: UserRole, demoNum: string) => {
    setSelectedRole(role);
    setMobileNumber(demoNum);
    setError(null);
  };

  return (
    <AuthLayout>
      <Card className="p-5 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-3 -mt-2 pb-2 border-b border-line">
          <button type="button" onClick={onBackToLanguage} className={textLinkClass}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{t.backToLanguage}</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Languages className="w-4 h-4" aria-hidden="true" />
            {activeLanguageDef?.nativeName}
          </span>
        </div>

        <div>
          <h1 className="font-display text-2xl font-semibold text-navy tracking-tight">{t.loginTitle}</h1>
          <p className="text-[15px] text-muted mt-1.5 leading-relaxed">{t.loginSubtitle}</p>
        </div>

        <Notice tone="info">{t.demoNotice}</Notice>

        {/* Demo persona */}
        <fieldset>
          <legend className={fieldLabel}>Demo persona</legend>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
            {DEMO_PERSONAS.map((persona) => {
              const isSelected = selectedRole === persona.role;
              return (
                <button
                  key={persona.role}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectQuickPersona(persona.role, persona.mobile)}
                  className={`min-w-0 min-h-11 rounded-md border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'border-navy bg-blue-soft ring-1 ring-navy'
                      : 'border-line bg-white hover:bg-offwhite'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1.5">
                    <span className={`text-sm ${isSelected ? 'font-semibold text-navy' : 'font-medium text-ink'}`}>
                      {persona.label}
                    </span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-brand-dark" aria-hidden="true" />}
                  </span>
                  <span className="block text-[13px] text-muted leading-snug">{persona.person}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Mobile number */}
        <form onSubmit={handleContinue} className="space-y-4" noValidate>
          <div>
            <label htmlFor="mobile-input" className={fieldLabel}>
              {t.mobileNumberLabel}
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[15px] text-muted"
                aria-hidden="true"
              >
                +91
              </span>
              <input
                id="mobile-input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobileNumber(clean);
                  if (error) setError(null);
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'mobile-input-error' : undefined}
                className={`${fieldControl} pl-12 tabular-nums ${error ? 'border-danger' : ''}`}
                placeholder="98765 43210"
              />
            </div>
            {error && (
              <p id="mobile-input-error" className="text-sm text-danger mt-1.5">
                {error}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            {t.continueToOtp}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </form>

        <div className="text-center -mb-2">
          <button
            type="button"
            onClick={() => handleSelectQuickPersona('farmer', '9876543210')}
            className={textLinkClass}
          >
            <UserCheck className="w-4 h-4" aria-hidden="true" />
            <span>{t.demoFarmerQuick}</span>
          </button>
        </div>
      </Card>
    </AuthLayout>
  );
};
