import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Languages, Loader2, RotateCcw } from 'lucide-react';
import { LanguageCode, UserRole } from '../types';
import { getTranslations, LANGUAGE_CATALOG } from '../utils/translations';
import { Button, Card, Notice, fieldLabel } from '../components/ui';
import { AuthLayout } from '../components/layout/AuthLayout';

interface OtpVerificationPageProps {
  currentLanguage: LanguageCode;
  mobileNumber: string;
  targetRole: UserRole;
  onBackToLogin: () => void;
  onVerificationSuccess: (role: UserRole) => void;
}

const textLinkClass =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-brand-dark hover:text-navy hover:underline underline-offset-4';

const formatMobile = (value: string) => (value.length === 10 ? `${value.slice(0, 5)} ${value.slice(5)}` : value);

export const OtpVerificationPage: React.FC<OtpVerificationPageProps> = ({
  currentLanguage,
  mobileNumber,
  targetRole,
  onBackToLogin,
  onVerificationSuccess,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => verifyTimers.current.forEach(clearTimeout);
  }, []);

  const t = getTranslations(
    currentLanguage === 'hi' || currentLanguage === 'pa' ? currentLanguage : 'en'
  );
  const activeLang = LANGUAGE_CATALOG.find((l) => l.code === currentLanguage);

  // Auto-focus on the first field on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleVerify = (otpCode: string) => {
    setErrorMessage(null);
    setIsVerifying(true);

    const verifyTimer = setTimeout(() => {
      if (otpCode === '123456') {
        setIsVerifying(false);
        setIsSuccess(true);
        const successTimer = setTimeout(() => {
          onVerificationSuccess(targetRole);
        }, 800);
        verifyTimers.current.push(successTimer);
      } else {
        setIsVerifying(false);
        setErrorMessage(t.invalidOtp);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 700);
    verifyTimers.current.push(verifyTimer);
  };

  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1); // Take only the last entered character
    if (char && !/^\d$/.test(char)) return; // Only accept digits

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMessage(null);

    // If a digit was entered, jump to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are provided
    const completeCode = newDigits.join('');
    if (completeCode.length === 6 && !newDigits.includes('')) {
      handleVerify(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box is empty, jump to previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const numbersOnly = pastedData.replace(/\D/g, '').slice(0, 6);

    if (numbersOnly.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < numbersOnly.length; i++) {
        newDigits[i] = numbersOnly[i];
      }
      setDigits(newDigits);

      if (numbersOnly.length === 6) {
        handleVerify(numbersOnly);
      } else {
        inputRefs.current[Math.min(numbersOnly.length, 5)]?.focus();
      }
    }
  };

  const handleQuickFill = () => {
    const demoCode = ['1', '2', '3', '4', '5', '6'];
    setDigits(demoCode);
    handleVerify('123456');
  };

  const codeComplete = digits.join('').length === 6;
  const quickFillLabel = t.quickFillOtp.replace(/^\u26A1\s*/u, '');

  return (
    <AuthLayout>
      <Card className="p-5 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-3 -mt-2 pb-2 border-b border-line">
          <button type="button" onClick={onBackToLogin} className={textLinkClass}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{t.backToLogin}</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Languages className="w-4 h-4" aria-hidden="true" />
            {activeLang?.nativeName}
          </span>
        </div>

        <div>
          <h1 className="font-display text-2xl font-semibold text-navy tracking-tight">{t.otpTitle}</h1>
          <p className="text-[15px] text-muted mt-1.5 leading-relaxed">{t.otpSubtitle}</p>
          <p className="text-[15px] text-ink mt-2">
            Mobile number:{' '}
            <span className="font-semibold text-navy tabular-nums">+91 {formatMobile(mobileNumber) || '98765 43210'}</span>
          </p>
        </div>

        <Notice tone="info">
          This is a demo, so no SMS is sent. Use the code <span className="font-semibold tabular-nums">123456</span>.
        </Notice>

        <div className="space-y-4">
          <fieldset>
            <legend className={fieldLabel}>{t.enterOtpInstructions}</legend>
            <div className="grid grid-cols-6 gap-2">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  disabled={isVerifying || isSuccess}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  aria-invalid={errorMessage ? true : undefined}
                  className={`w-full min-w-0 h-12 sm:h-14 rounded-md border bg-white text-center text-xl font-semibold text-navy tabular-nums transition-colors focus:border-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-dark/20 disabled:bg-offwhite ${
                    errorMessage ? 'border-danger' : digit ? 'border-navy' : 'border-line'
                  }`}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>
          </fieldset>

          {errorMessage && <Notice tone="danger">{errorMessage}</Notice>}

          {isVerifying && (
            <p role="status" className="flex items-center justify-center gap-2 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{t.verifying}</span>
            </p>
          )}

          {isSuccess && <Notice tone="success">{t.verificationSuccess}</Notice>}

          <Button
            className="w-full"
            disabled={isVerifying || isSuccess || !codeComplete}
            onClick={() => handleVerify(digits.join(''))}
          >
            {t.verifyBtn}
          </Button>

          <Button variant="secondary" className="w-full" disabled={isVerifying || isSuccess} onClick={handleQuickFill}>
            {quickFillLabel}
          </Button>
        </div>

        <div className="text-center -mb-2 pt-2 border-t border-line">
          <button
            type="button"
            onClick={() => {
              setDigits(['', '', '', '', '', '']);
              setErrorMessage(null);
              inputRefs.current[0]?.focus();
            }}
            className={textLinkClass}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>{t.resendOtp}</span>
          </button>
        </div>
      </Card>
    </AuthLayout>
  );
};
