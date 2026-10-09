import React from 'react';
import { Accessibility, Bell, Check, Languages, LogOut, UserRound, Users } from 'lucide-react';
import { User as UserType, LanguageCode, UserRole } from '../types';
import { LANGUAGE_CATALOG } from '../utils/translations';
import { Button, Card, CardHeader, KeyValueGrid, PageHeader } from '../components/ui';

interface ProfilePageProps {
  currentUser: UserType;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
}

const DEMO_PERSONAS: { role: UserRole; label: string; person: string }[] = [
  { role: 'farmer', label: 'Farmer', person: 'Ramesh Kumar, Jaipur' },
  { role: 'pacs', label: 'PACS operator', person: 'Sukhdev Singh, PACS secretary' },
  { role: 'officer', label: 'Agriculture officer', person: 'Ravinder Sharma, block officer' },
  { role: 'admin', label: 'Administrator', person: 'Sample administrator' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: 'Farmer',
  pacs: 'PACS operator',
  officer: 'Agriculture officer',
  admin: 'Administrator',
};

const ALERT_SETTINGS = [
  'Updates on my crop insurance claim',
  'Fertilizer arrival at my PACS',
  'Weather warnings for my area',
  'Daily mandi prices by SMS',
];

const ACCESSIBILITY_SETTINGS = ['Larger text', 'High contrast for bright sunlight', 'Slower voice playback'];

const notAdded = <span className="font-normal text-muted">Not added</span>;

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  currentLanguage,
  onLanguageChange,
  onLogout,
  onRoleChange,
}) => {
  const activeLanguageDef = LANGUAGE_CATALOG.find((l) => l.code === currentLanguage);
  const availableLanguages = LANGUAGE_CATALOG.filter((l) => l.isAvailable);
  const upcomingLanguages = LANGUAGE_CATALOG.filter((l) => !l.isAvailable);
  const location = currentUser.location || currentUser.jurisdiction;

  const personalDetails = [
    { label: 'Name', value: currentUser.name },
    { label: 'Role', value: ROLE_LABELS[currentUser.role] },
    { label: 'User ID', value: currentUser.badgeId ? <span className="tabular-nums">{currentUser.badgeId}</span> : notAdded },
    { label: 'Mobile number', value: currentUser.phone ? <span className="tabular-nums">{currentUser.phone}</span> : notAdded },
    { label: 'Location', value: location || notAdded },
    { label: 'Language', value: activeLanguageDef ? `${activeLanguageDef.nativeName} (${activeLanguageDef.englishName})` : notAdded },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile and settings"
        description="Your details, your language, and settings for this demo."
        actions={
          <Button variant="secondary" onClick={onLogout}>
            <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal details */}
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader
            title="Personal details"
            description="Sample profile used in this prototype"
            icon={<UserRound className="w-5 h-5" />}
          />
          <div className="-mb-px">
            <KeyValueGrid columns={3} items={personalDetails} />
          </div>
        </Card>

        {/* Language */}
        <Card className="min-w-0">
          <CardHeader
            title="Language"
            description="The app and voice assistant use this language."
            icon={<Languages className="w-5 h-5" />}
          />
          <div className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2" role="group" aria-label="Choose language">
              {availableLanguages.map((lang) => {
                const isActive = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onLanguageChange(lang.code)}
                    className={`min-h-11 rounded-md border px-3 py-2 text-center transition-colors ${
                      isActive
                        ? 'border-navy bg-navy text-white'
                        : 'border-line bg-white text-ink hover:bg-offwhite'
                    }`}
                  >
                    <span className="block font-semibold">{lang.nativeName}</span>
                    <span className={`block text-[13px] ${isActive ? 'text-white/75' : 'text-muted'}`}>
                      {lang.englishName}
                    </span>
                  </button>
                );
              })}
            </div>
            {upcomingLanguages.length > 0 && (
              <p className="text-[13px] text-muted">
                Coming soon: {upcomingLanguages.map((l) => l.nativeName).join(', ')}
              </p>
            )}
          </div>
        </Card>

        {/* Demo persona */}
        <Card className="min-w-0">
          <CardHeader
            title="Demo persona"
            description="See the app as a different user. For testing only."
            icon={<Users className="w-5 h-5" />}
          />
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Choose demo persona">
              {DEMO_PERSONAS.map((persona) => {
                const isActive = currentUser.role === persona.role;
                return (
                  <button
                    key={persona.role}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onRoleChange(persona.role)}
                    className={`min-w-0 min-h-11 rounded-md border px-3 py-2 text-left transition-colors ${
                      isActive ? 'border-navy bg-blue-soft ring-1 ring-navy' : 'border-line bg-white hover:bg-offwhite'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-1.5">
                      <span className={`text-sm ${isActive ? 'font-semibold text-navy' : 'font-medium text-ink'}`}>
                        {persona.label}
                      </span>
                      {isActive && <Check className="w-4 h-4 shrink-0 text-brand-dark" aria-hidden="true" />}
                    </span>
                    <span className="block text-[13px] text-muted leading-snug">{persona.person}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Alerts (not built yet) */}
        <Card className="min-w-0">
          <CardHeader
            title="Alerts"
            description="Coming soon. These settings do not work in this prototype yet."
            icon={<Bell className="w-5 h-5" />}
          />
          <ul className="px-5 pb-5 space-y-1">
            {ALERT_SETTINGS.map((label, idx) => (
              <li key={label}>
                <label
                  htmlFor={`profile-alert-${idx}`}
                  className="flex min-h-11 items-center justify-between gap-3 text-[15px] text-muted cursor-not-allowed"
                >
                  <span>{label}</span>
                  <input id={`profile-alert-${idx}`} type="checkbox" disabled className="h-4 w-4 shrink-0" />
                </label>
              </li>
            ))}
          </ul>
        </Card>

        {/* Accessibility (not built yet) */}
        <Card className="min-w-0">
          <CardHeader
            title="Accessibility"
            description="Coming soon. These settings do not work in this prototype yet."
            icon={<Accessibility className="w-5 h-5" />}
          />
          <ul className="px-5 pb-5 space-y-1">
            {ACCESSIBILITY_SETTINGS.map((label, idx) => (
              <li key={label}>
                <label
                  htmlFor={`profile-accessibility-${idx}`}
                  className="flex min-h-11 items-center justify-between gap-3 text-[15px] text-muted cursor-not-allowed"
                >
                  <span>{label}</span>
                  <input id={`profile-accessibility-${idx}`} type="checkbox" disabled className="h-4 w-4 shrink-0" />
                </label>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
