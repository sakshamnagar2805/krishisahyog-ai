/**
 * KrishiSahyog AI - Reusable Civic Constants & Statutory Boundaries
 * SIH 2026 Problem Statement 26088
 */

export const DEMO_DATA = "DEMO DATA — NOT A REAL GOVERNMENT RECORD" as const;
export const VERIFIED_INFORMATION = "VERIFIED STATUTORY INFORMATION" as const;
export const INFORMATION_ONLY = "INFORMATION & GUIDANCE ONLY" as const;
export const OFFICIAL_PORTAL = "OFFICIAL GOVERNMENT PORTAL" as const;
export const NOT_GOVERNMENT_TRANSACTION = "NOT AN OFFICIAL GOVERNMENT TRANSACTION" as const;

export const SYSTEM_DISCLAIMER = 
  "KrishiSahyog AI is an informational guidance system designed to assist farmers and rural cooperative members. It is NOT an official government statutory portal or claims settlement engine. For actual legal filings and dispute resolutions, refer to official portals (pmfby.gov.in, pgportal.gov.in).";

export const DIALECT_OPTIONS = [
  { code: 'pa', name: 'ਪੰਜਾਬੀ', label: 'Punjabi (Gurmukhi)', confidence: '98.4%' },
  { code: 'hi', name: 'हिन्दी', label: 'Hindi (Devanagari)', confidence: '99.1%' },
  { code: 'en', name: 'English', label: 'Indian English', confidence: '99.6%' },
  { code: 'gu', name: 'ગુજરાતી', label: 'Gujarati', confidence: '96.2%' },
  { code: 'te', name: 'తెలుగు', label: 'Telugu', confidence: '95.8%' },
  { code: 'ta', name: 'தமிழ்', label: 'Tamil', confidence: '95.4%' },
  { code: 'bn', name: 'বাংলা', label: 'Bengali', confidence: '96.7%' },
  { code: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada', confidence: '94.9%' },
] as const;

export const ROLE_DEFINITIONS = [
  {
    role: 'farmer',
    label: 'Farmer Kiosk Mode',
    subLabel: 'Ramesh Kumar (Jaipur, Rajasthan)',
    badge: 'DEMO-FRM-1001',
  },
  {
    role: 'pacs',
    label: 'PACS Operator',
    subLabel: 'Sukhdev Singh (PACS Sec)',
    badge: 'DEMO-PACS-412',
  },
  {
    role: 'officer',
    label: 'Agriculture Officer',
    subLabel: 'Inspector Ravinder Sharma (BAO)',
    badge: 'DEMO-OFF-209',
  },
  {
    role: 'admin',
    label: 'Admin & Governance',
    subLabel: 'Anita Verma (State Admin)',
    badge: 'DEMO-ADM-004',
  },
] as const;

export const MANDI_RATES = [
  { commodity: 'Wheat (HD-3086)', msp: 2275, mandiRate: 2320, mandi: 'Muhana Mandi, Jaipur', trend: 'UP' },
  { commodity: 'Bajra (Pearl Millet)', msp: 2625, mandiRate: 2480, mandi: 'Chomu Mandi, Jaipur', trend: 'STEADY' },
  { commodity: 'Mustard (Pusa Bold)', msp: 5650, mandiRate: 5710, mandi: 'Muhana Mandi, Jaipur', trend: 'UP' },
  { commodity: 'Gram (Chana)', msp: 5440, mandiRate: 5380, mandi: 'Chaksu Mandi, Jaipur', trend: 'DOWN' },
] as const;

export const WEATHER_SNAPSHOT = {
  tempCelsius: 24,
  condition: 'Sunny with moderate haze',
  humidityPercent: 58,
  windSpeedKmh: 12,
  forecast: 'Dry spell for next 48 hrs — suitable for field loss inspection',
  location: 'Amber, Jaipur',
} as const;
