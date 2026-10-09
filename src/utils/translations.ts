import { LanguageCode } from '../types';

export interface LanguageDefinition {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  region: string;
  isAvailable: boolean;
  statusText?: string;
}

export const LANGUAGE_CATALOG: LanguageDefinition[] = [
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    region: 'उत्तर एवं मध्य भारत',
    isAvailable: true,
  },
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    region: 'All India',
    isAvailable: true,
  },
  {
    code: 'pa',
    nativeName: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    region: 'ਪੰਜਾਬ / Punjab',
    isAvailable: true,
  },
  {
    code: 'mr',
    nativeName: 'मराठी',
    englishName: 'Marathi',
    region: 'महाराष्ट्र / Maharashtra',
    isAvailable: false,
    statusText: 'COMING SOON',
  },
  {
    code: 'gu',
    nativeName: 'ગુજરાતી',
    englishName: 'Gujarati',
    region: 'ગુજરાત / Gujarat',
    isAvailable: false,
    statusText: 'COMING SOON',
  },
  {
    code: 'te',
    nativeName: 'తెలుగు',
    englishName: 'Telugu',
    region: 'తెలుగు / Telangana / Andhra Pradesh',
    isAvailable: false,
    statusText: 'COMING SOON',
  },
  {
    code: 'ta',
    nativeName: 'தமிழ்',
    englishName: 'Tamil',
    region: 'தமிழ்நாடு / Tamil Nadu',
    isAvailable: false,
    statusText: 'COMING SOON',
  },
  {
    code: 'bn',
    nativeName: 'বাংলা',
    englishName: 'Bengali',
    region: 'পশ্চিমবঙ্গ / West Bengal',
    isAvailable: false,
    statusText: 'COMING SOON',
  },
  {
    code: 'kn',
    nativeName: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    region: 'ಕರ್ನಾಟಕ / Karnataka',
    isAvailable: false,
    statusText: 'COMING SOON',
  },
];

export interface UiTranslations {
  selectLanguageTitle: string;
  selectLanguageSubtitle: string;
  watchVideoGuide: string;
  visualGuideBadge: string;
  videoGuideDescription: string;
  continueBtn: string;
  comingSoonNotice: string;
  loginTitle: string;
  loginSubtitle: string;
  mobileNumberLabel: string;
  mobilePlaceholder: string;
  continueToOtp: string;
  demoNotice: string;
  demoFarmerQuick: string;
  otpTitle: string;
  otpSubtitle: string;
  enterOtpInstructions: string;
  verifyBtn: string;
  verifying: string;
  verificationSuccess: string;
  invalidOtp: string;
  quickFillOtp: string;
  resendOtp: string;
  backToLogin: string;
  backToLanguage: string;
  profileTitle: string;
  demoProfileNotice: string;
  logoutBtn: string;
}

export const UI_TRANSLATIONS: Record<'en' | 'hi' | 'pa', UiTranslations> = {
  en: {
    selectLanguageTitle: 'Choose your language',
    selectLanguageSubtitle: 'Use KrishiSahyog for crop insurance, farming schemes and PACS services in the language you are most comfortable with.',
    watchVideoGuide: 'How to use this app',
    visualGuideBadge: 'Open guide',
    videoGuideDescription: 'Learn in 2 minutes how to change your language, check your crop insurance claim and get fertilizer from your PACS.',
    continueBtn: 'Continue',
    comingSoonNotice: 'This language is coming soon. For now, please choose English, Hindi or Punjabi.',
    loginTitle: 'Sign in to KrishiSahyog',
    loginSubtitle: 'Enter your 10-digit mobile number to see your crop insurance claim, documents and PACS account.',
    mobileNumberLabel: 'Mobile number',
    mobilePlaceholder: '+91 98765 43210',
    continueToOtp: 'Get demo code',
    demoNotice: 'Demo only. No real SMS or Aadhaar check is used.',
    demoFarmerQuick: 'Use demo farmer number (+91 98765 43210)',
    otpTitle: 'Enter the code',
    otpSubtitle: 'Enter the 6-digit code sent to your mobile number.',
    enterOtpInstructions: 'Enter 6-digit code',
    verifyBtn: 'Verify and continue',
    verifying: 'Checking the code…',
    verificationSuccess: 'Code accepted',
    invalidOtp: 'That code is not right. In this demo, enter 123456.',
    quickFillOtp: 'Fill demo code (123456)',
    resendOtp: 'Clear and try again',
    backToLogin: 'Change mobile number',
    backToLanguage: 'Change language',
    profileTitle: 'Your profile',
    demoProfileNotice: 'DEMO PROFILE — Simulated Civic Identity Record',
    logoutBtn: 'Sign Out of Session',
  },
  hi: {
    selectLanguageTitle: 'अपनी भाषा चुनें',
    selectLanguageSubtitle: 'कृषि सब्सिडी, पीएमएफबीवाई फसल दावा एवं सहकारी सेवाओं का लाभ लेने के लिए अपनी पसंदीदा भाषा चुनें।',
    watchVideoGuide: 'ऐप कैसे इस्तेमाल करें',
    visualGuideBadge: 'गाइड खोलें',
    videoGuideDescription: '2 मिनट में जानें कि भाषा कैसे बदलें, फसल बीमा दावा कैसे देखें और पैक्स खाद कैसे प्राप्त करें।',
    continueBtn: 'आगे बढ़ें',
    comingSoonNotice: 'यह भाषा जल्द आ रही है। अभी कृपया English, हिन्दी या ਪੰਜਾਬੀ चुनें।',
    loginTitle: 'कृषिसहयोग में साइन इन करें',
    loginSubtitle: 'फसल बीमा और सहकारी कोटे तक पहुंचने के लिए अपना पंजीकृत मोबाइल नंबर दर्ज करें।',
    mobileNumberLabel: 'पंजीकृत मोबाइल नंबर',
    mobilePlaceholder: '+91 98765 43210',
    continueToOtp: 'डेमो सत्यापन कोड प्राप्त करें',
    demoNotice: 'केवल डेमो। कोई असली एसएमएस या आधार जाँच नहीं होती।',
    demoFarmerQuick: 'डेमो किसान नंबर का उपयोग करें (+91 98765 43210)',
    otpTitle: 'डेमो कोड सत्यापित करें',
    otpSubtitle: 'अपने किसान प्रोफाइल में प्रवेश के लिए 6 अंकों का डेमो कोड दर्ज करें।',
    enterOtpInstructions: '6 अंकों का कोड दर्ज करें',
    verifyBtn: 'सत्यापित करें और आगे बढ़ें',
    verifying: 'सत्यापन किया जा रहा है...',
    verificationSuccess: 'डेमो सत्यापन सफल रहा',
    invalidOtp: 'गलत डेमो कोड। कृपया आगे बढ़ने के लिए 123456 दर्ज करें।',
    quickFillOtp: 'डेमो कोड भरें (123456)',
    resendOtp: 'डेमो कोड पुनः प्राप्त करें',
    backToLogin: 'मोबाइल नंबर बदलें',
    backToLanguage: 'भाषा बदलें',
    profileTitle: 'किसान विवरण एवं नागरिक प्रोफ़ाइल',
    demoProfileNotice: 'डेमो प्रोफ़ाइल — गैर-सांविधिक सिम्युलेटेड रिकॉर्ड',
    logoutBtn: 'सत्र से लॉगआउट करें',
  },
  pa: {
    selectLanguageTitle: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    selectLanguageSubtitle: 'ਖੇਤੀਬਾੜੀ ਸਬਸਿਡੀਆਂ, ਪੀ.ਐੱਮ.ਐੱਫ.ਬੀ.ਵਾਈ. ਫਸਲੀ ਬੀਮਾ ਦਾਅਵੇ ਅਤੇ ਸਹਿਕਾਰੀ ਸੇਵਾਵਾਂ ਲਈ ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ।',
    watchVideoGuide: 'ਐਪ ਕਿਵੇਂ ਵਰਤਣੀ ਹੈ',
    visualGuideBadge: 'ਗਾਈਡ ਖੋਲ੍ਹੋ',
    videoGuideDescription: '2 ਮਿੰਟ ਵਿੱਚ ਜਾਣੋ ਭਾਸ਼ਾ ਕਿਵੇਂ ਬਦਲਣੀ ਹੈ, ਫਸਲ ਨੁਕਸਾਨ ਕਲੇਮ ਕਿਵੇਂ ਦਰਜ ਕਰਨਾ ਹੈ ਅਤੇ ਪੈਕਸ ਖਾਦ ਕਿਵੇਂ ਲੈਣੀ ਹੈ।',
    continueBtn: 'ਅੱਗੇ ਵਧੋ',
    comingSoonNotice: 'ਇਹ ਭਾਸ਼ਾ ਜਲਦੀ ਆ ਰਹੀ ਹੈ। ਹੁਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ English, हिन्दी ਜਾਂ ਪੰਜਾਬੀ ਚੁਣੋ।',
    loginTitle: 'ਕ੍ਰਿਸ਼ੀਸਹਿਯੋਗ ਵਿੱਚ ਸਾਈਨ ਇਨ ਕਰੋ',
    loginSubtitle: 'ਆਪਣੀ ਫਸਲ ਬੀਮਾ ਅਤੇ ਸਹਿਕਾਰੀ ਸੋਸਾਇਟੀ ਕੋਟਾ ਦੇਖਣ ਲਈ ਆਪਣਾ ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ ਭਰੋ।',
    mobileNumberLabel: 'ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ',
    mobilePlaceholder: '+91 98765 43210',
    continueToOtp: 'ਡੈਮੋ ਕੋਡ ਪ੍ਰਾਪਤ ਕਰੋ',
    demoNotice: 'ਸਿਰਫ਼ ਡੈਮੋ। ਕੋਈ ਅਸਲ ਐਸ.ਐਮ.ਐਸ. ਜਾਂ ਆਧਾਰ ਜਾਂਚ ਨਹੀਂ ਹੁੰਦੀ।',
    demoFarmerQuick: 'ਡੈਮੋ ਕਿਸਾਨ ਨੰਬਰ ਵਰਤੋ (+91 98765 43210)',
    otpTitle: 'ਡੈਮੋ ਕੋਡ ਦੀ ਤਸਦੀਕ ਕਰੋ',
    otpSubtitle: 'ਆਪਣੇ ਖੇਤੀਬਾੜੀ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਦਾਖਲੇ ਲਈ 6 ਅੰਕਾਂ ਦਾ ਡੈਮੋ ਕੋਡ ਦਰਜ ਕਰੋ।',
    enterOtpInstructions: '6-ਅੰਕੀ ਕੋਡ ਦਰਜ ਕਰੋ',
    verifyBtn: 'ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਦਾਖਲ ਹੋਵੋ',
    verifying: 'ਕੋਡ ਦੀ ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ…',
    verificationSuccess: 'ਡੈਮੋ ਤਸਦੀਕ ਸਫਲ ਰਹੀ',
    invalidOtp: 'ਗਲਤ ਡੈਮੋ ਕੋਡ। ਕਿਰਪਾ ਕਰਕੇ ਅੱਗੇ ਵਧਣ ਲਈ 123456 ਭਰੋ।',
    quickFillOtp: 'ਡੈਮੋ ਕੋਡ ਭਰੋ (123456)',
    resendOtp: 'ਡੈਮੋ ਕੋਡ ਦੁਬਾਰਾ ਭੇਜੋ',
    backToLogin: 'ਮੋਬਾਈਲ ਨੰਬਰ ਬਦਲੋ',
    backToLanguage: 'ਭਾਸ਼ਾ ਬਦਲੋ',
    profileTitle: 'ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਦਸਤਾਵੇਜ਼',
    demoProfileNotice: 'ਡੈਮੋ ਪ੍ਰੋਫਾਈਲ — ਸਿਮੂਲੇਟਿਡ ਰਿਕਾਰਡ',
    logoutBtn: 'ਸੈਸ਼ਨ ਸਮਾਪਤ ਕਰੋ',
  },
};

export function getTranslations(lang: LanguageCode): UiTranslations {
  if (lang === 'hi') return UI_TRANSLATIONS.hi;
  if (lang === 'pa') return UI_TRANSLATIONS.pa;
  return UI_TRANSLATIONS.en;
}
