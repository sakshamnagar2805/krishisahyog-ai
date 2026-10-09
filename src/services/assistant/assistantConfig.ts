/**
 * KrishiSahyog AI - Voice Assistant shared configuration
 *
 * Imported by both the browser and the API server so the Live session config,
 * the text fallback and the ephemeral token constraints can never drift apart.
 */
// Type-only SDK import keeps the Gemini SDK out of the initial bundle, so enum values are literals
import type { FunctionDeclaration, Modality, Type } from '@google/genai';
import type { LanguageCode } from '../../types';

export type VoiceLanguage = 'hi' | 'pa' | 'en';

export const VOICE_LANGUAGES: {
  code: VoiceLanguage;
  label: string;
  nativeName: string;
  bcp47: string;
}[] = [
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', bcp47: 'pa-IN' },
  { code: 'en', label: 'English', nativeName: 'English', bcp47: 'en-IN' },
];

export const toVoiceLanguage = (code: LanguageCode | string | undefined): VoiceLanguage =>
  code === 'hi' || code === 'pa' ? code : 'en';

export const getVoiceLanguage = (code: VoiceLanguage) =>
  VOICE_LANGUAGES.find((l) => l.code === code) ?? VOICE_LANGUAGES[2];

/** App pages the assistant may open, keyed by their App tab id */
export const ASSISTANT_PAGES = {
  dashboard: 'Farmer dashboard',
  'pmfby-crop-insurance': 'PMFBY crop insurance claims',
  'document-locker': 'Document locker',
  'government-schemes': 'Government schemes',
  'grievance-redressal': 'Grievances',
  'pacs-services': 'PACS cooperative services',
  'credit-and-financial-assistance': 'KCC credit and loans',
  'agriculture-support': 'Agriculture support',
  notifications: 'Notifications',
} as const;

export type AssistantPage = keyof typeof ASSISTANT_PAGES;

export const DEFAULT_LIVE_MODEL = 'gemini-3.8-live';
export const DEFAULT_TEXT_MODEL = 'gemini-3.8-flash';

export const assistantFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_farmer_profile',
    description:
      "Returns the logged-in farmer's profile: village, district, state, land, crops, PACS membership, Aadhaar seeding, DBT and KCC limits.",
  },
  {
    name: 'get_claims',
    description:
      "Returns the farmer's PMFBY crop insurance claims with status, next action, outstanding documents, required actions and the designated officer.",
  },
  {
    name: 'get_documents',
    description:
      "Returns the farmer's document locker: each document's status (available, missing, expired, pending review), why it is required and where to obtain it.",
  },
  {
    name: 'find_schemes',
    description:
      'Finds government schemes that may be relevant to the farmer, with reasons, missing documents and where to apply. Defaults to the farmer profile when arguments are omitted.',
    parameters: {
      type: 'OBJECT' as Type,
      properties: {
        crop: { type: 'STRING' as Type, description: 'Crop name in English, e.g. Wheat' },
        state: { type: 'STRING' as Type, description: 'Indian state name in English' },
        district: { type: 'STRING' as Type, description: 'District name in English' },
      },
    },
  },
  {
    name: 'get_grievances',
    description: "Returns the farmer's grievances with status, dates, days left and assigned officer.",
  },
  {
    name: 'get_pacs_services',
    description:
      "Returns the farmer's PACS cooperative account: fertilizer quotas, KCC loan limit and dues, renewal date and machinery for hire.",
  },
  {
    name: 'open_app_page',
    description:
      'Opens a page of the KrishiSahyog app on the farmer\'s screen. Use it when the farmer wants to see, upload or act on something.',
    parameters: {
      type: 'OBJECT' as Type,
      properties: {
        page: {
          type: 'STRING' as Type,
          enum: Object.keys(ASSISTANT_PAGES),
          description: Object.entries(ASSISTANT_PAGES)
            .map(([id, label]) => `${id}: ${label}`)
            .join('; '),
        },
      },
      required: ['page'],
    },
  },
];

export const buildSystemInstruction = (language: VoiceLanguage): string => {
  const preferred = getVoiceLanguage(language).label;
  return [
    'You are KrishiSahyog, a friendly voice assistant that guides Indian farmers inside the KrishiSahyog prototype app.',
    'You help with PMFBY crop insurance claims, documents, government schemes, PACS cooperative services, KCC loans and grievances.',
    `The farmer's preferred language is ${preferred}. Always reply in the language the farmer speaks; if unsure, use ${preferred}.`,
    'Speak simply, as to a farmer with little time: two to four short sentences, no lists, no markdown, no English jargon unless the farmer uses it.',
    "For anything about this farmer's own claims, documents, schemes, grievances, PACS account or profile, call the tools first and answer only from their results.",
    'Never invent amounts, dates, IDs, statuses, phone numbers or eligibility. If a tool does not have the answer, say you do not know.',
    'All records in this app are demo data. Mention once in the conversation that the records are demo records.',
    'You only give guidance. You cannot file claims, submit documents, approve schemes or change any record. For official actions, point to the official portal (pmfby.gov.in for crop insurance, pgportal.gov.in for grievances) or the office named in the tool results.',
    'When the farmer wants to see, upload or act on something, call open_app_page and tell them the page is opening.',
    'If the question is outside farming and these services, politely say you can only help with farming services.',
  ].join('\n');
};

/** Live session config shared by the token constraints (server) and connect call (browser) */
export const buildLiveConnectConfig = (language: VoiceLanguage) => ({
  responseModalities: ['AUDIO' as Modality],
  systemInstruction: buildSystemInstruction(language),
  tools: [{ functionDeclarations: assistantFunctionDeclarations }],
  inputAudioTranscription: {},
  outputAudioTranscription: {},
});

export const isVoiceLanguage = (value: unknown): value is VoiceLanguage =>
  value === 'hi' || value === 'pa' || value === 'en';
