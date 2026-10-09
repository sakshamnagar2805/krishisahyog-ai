/**
 * Offline answers used when Gemini is not configured or unreachable.
 *
 * Recognises the most common farmer questions in Hindi, Punjabi and English and
 * answers them from the same records the tools use, so the demo stays grounded
 * without a network connection. Returns null for anything it does not recognise.
 */
import { dataProvider } from '../index';
import { SchemeMatchingService } from '../schemeMatchingService';
import { VoiceLanguage } from './assistantConfig';
import type { AssistantAnswer } from './assistantApi';

type Intent = 'claim' | 'documents' | 'fertilizer' | 'loan' | 'schemes' | 'grievance';

const INTENT_KEYWORDS: [Intent, string[]][] = [
  ['documents', ['document', 'missing', 'paper', 'दस्तावेज', 'दस्तावेज़', 'कागज', 'ਦਸਤਾਵੇਜ਼', 'ਕਾਗ਼ਜ਼', 'ਕਾਗਜ਼']],
  ['fertilizer', ['urea', 'fertiliser', 'fertilizer', 'dap', 'यूरिया', 'खाद', 'ਯੂਰੀਆ', 'ਖਾਦ']],
  ['loan', ['loan', 'kcc', 'credit', 'ऋण', 'कर्ज', 'लोन', 'केसीसी', 'ਕਰਜ਼', 'ਲੋਨ', 'ਕੇਸੀਸੀ']],
  ['grievance', ['grievance', 'complaint', 'शिकायत', 'ਸ਼ਿਕਾਇਤ']],
  ['schemes', ['scheme', 'yojana', 'subsidy', 'योजना', 'सब्सिडी', 'ਯੋਜਨਾ', 'ਸਬਸਿਡੀ']],
  ['claim', ['claim', 'insurance', 'pmfby', 'बीमा', 'दावा', 'दावे', 'ਬੀਮਾ', 'ਦਾਅਵ']],
];

const detectIntent = (question: string): Intent | null => {
  const q = question.toLowerCase();
  return INTENT_KEYWORDS.find(([, words]) => words.some((w) => q.includes(w)))?.[0] ?? null;
};

const list = (items: string[], language: VoiceLanguage) => {
  if (items.length <= 1) return items.join('');
  const and = language === 'hi' ? ' और ' : language === 'pa' ? ' ਅਤੇ ' : ' and ';
  return `${items.slice(0, -1).join(', ')}${and}${items[items.length - 1]}`;
};

const rupees = (value: number | undefined) => `₹${(value ?? 0).toLocaleString('en-IN')}`;

const displayDate = (value: string | undefined) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : value ?? '';
};

export const answerOffline = async (
  question: string,
  language: VoiceLanguage
): Promise<AssistantAnswer | null> => {
  const intent = detectIntent(question);
  if (!intent) return null;

  const demoNote = { en: '(Demo records.)', hi: '(डेमो रिकॉर्ड।)', pa: '(ਡੈਮੋ ਰਿਕਾਰਡ।)' }[language];
  const answer = (text: string, suggestedRoute: string, suggestedLabel: string): AssistantAnswer => ({
    text: `${text} ${demoNote}`,
    source: 'demo',
    suggestedRoute,
    suggestedLabel,
  });

  switch (intent) {
    case 'claim': {
      const claims = await dataProvider.getClaims();
      const claim = claims.find((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED') ?? claims[0];
      if (!claim) return null;
      const pending = (claim.documents || []).filter((d) => d.status !== 'AVAILABLE').map((d) => d.name);
      const text = {
        en: `The status of your ${claim.crop} claim ${claim.claimId} is "${claim.status}". Next step: ${claim.nextAction}.${
          pending.length ? ` Documents not yet complete: ${list(pending, 'en')}.` : ''
        }`,
        hi: `आपका ${claim.crop} फसल बीमा दावा ${claim.claimId} अभी "${claim.status}" स्थिति में है। अगला कदम: ${claim.nextAction}।${
          pending.length ? ` ये दस्तावेज़ अभी पूरे नहीं हैं: ${list(pending, 'hi')}।` : ''
        }`,
        pa: `ਤੁਹਾਡਾ ${claim.crop} ਫ਼ਸਲ ਬੀਮਾ ਦਾਅਵਾ ${claim.claimId} ਹੁਣ "${claim.status}" ਸਥਿਤੀ ਵਿੱਚ ਹੈ। ਅਗਲਾ ਕਦਮ: ${claim.nextAction}।${
          pending.length ? ` ਇਹ ਦਸਤਾਵੇਜ਼ ਅਜੇ ਪੂਰੇ ਨਹੀਂ ਹਨ: ${list(pending, 'pa')}।` : ''
        }`,
      }[language];
      return answer(text, 'pmfby-crop-insurance', { en: 'Open my claim', hi: 'मेरा दावा खोलें', pa: 'ਮੇਰਾ ਦਾਅਵਾ ਖੋਲ੍ਹੋ' }[language]);
    }

    case 'documents': {
      const documents = await dataProvider.getDocuments();
      const needAction = documents.filter((d) => d.status === 'MISSING' || d.status === 'EXPIRED' || d.status === 'INVALID');
      const pending = documents.filter((d) => d.status === 'PENDING_REVIEW');
      const text = {
        en: needAction.length
          ? `You still need to arrange: ${list(needAction.map((d) => `${d.title} (${d.status?.toLowerCase()})`), 'en')}.${
              needAction[0].whereToObtain ? ` ${needAction[0].title}: ${needAction[0].whereToObtain}` : ''
            }`
          : `No documents are missing.${pending.length ? ` Waiting for review: ${list(pending.map((d) => d.title), 'en')}.` : ''}`,
        hi: needAction.length
          ? `अभी ये दस्तावेज़ चाहिए: ${list(needAction.map((d) => d.title), 'hi')}। इन्हें दस्तावेज़ लॉकर में अपलोड करें।`
          : `कोई दस्तावेज़ बाकी नहीं है।${pending.length ? ` ${list(pending.map((d) => d.title), 'hi')} की जाँच चल रही है।` : ''}`,
        pa: needAction.length
          ? `ਅਜੇ ਇਹ ਦਸਤਾਵੇਜ਼ ਚਾਹੀਦੇ ਹਨ: ${list(needAction.map((d) => d.title), 'pa')}। ਇਹਨਾਂ ਨੂੰ ਦਸਤਾਵੇਜ਼ ਲਾਕਰ ਵਿੱਚ ਅਪਲੋਡ ਕਰੋ।`
          : `ਕੋਈ ਦਸਤਾਵੇਜ਼ ਬਾਕੀ ਨਹੀਂ ਹੈ।${pending.length ? ` ${list(pending.map((d) => d.title), 'pa')} ਦੀ ਜਾਂਚ ਚੱਲ ਰਹੀ ਹੈ।` : ''}`,
      }[language];
      return answer(text, 'document-locker', { en: 'Open document locker', hi: 'दस्तावेज़ लॉकर खोलें', pa: 'ਦਸਤਾਵੇਜ਼ ਲਾਕਰ ਖੋਲ੍ਹੋ' }[language]);
    }

    case 'fertilizer': {
      const pacs = await dataProvider.getPACSService();
      const items = (pacs.fertilizers || []).filter((f) => f.bagsAvailable > 0).map((f) => ({
        name: f.name.split(' (')[0],
        bags: f.bagsAvailable,
        price: rupees(f.pricePerBagSubsidized),
      }));
      if (!items.length) return null;
      const text = {
        en: `At ${pacs.societyName} you can still collect ${list(items.map((i) => `${i.bags} bags of ${i.name} at ${i.price} per bag`), 'en')}.`,
        hi: `${pacs.societyName} से आप अभी ${list(items.map((i) => `${i.name} के ${i.bags} बैग (${i.price} प्रति बैग)`), 'hi')} ले सकते हैं।`,
        pa: `${pacs.societyName} ਤੋਂ ਤੁਸੀਂ ਹੁਣ ${list(items.map((i) => `${i.name} ਦੇ ${i.bags} ਬੈਗ (${i.price} ਪ੍ਰਤੀ ਬੈਗ)`), 'pa')} ਲੈ ਸਕਦੇ ਹੋ।`,
      }[language];
      return answer(text, 'pacs-services', { en: 'Open PACS services', hi: 'पैक्स सेवाएँ खोलें', pa: 'ਪੈਕਸ ਸੇਵਾਵਾਂ ਖੋਲ੍ਹੋ' }[language]);
    }

    case 'loan': {
      const pacs = await dataProvider.getPACSService();
      const available = rupees((pacs.kccLimitRupees ?? 0) - (pacs.kccDrawnRupees ?? 0));
      const text = {
        en: `Your KCC limit is ${rupees(pacs.kccLimitRupees)}, you have used ${rupees(pacs.kccDrawnRupees)}, so ${available} is available. Renewal is due on ${displayDate(pacs.kccRenewalDueDate)}; repaying on time keeps the ${pacs.kccSubventionPercent}% interest rate.`,
        hi: `आपकी केसीसी सीमा ${rupees(pacs.kccLimitRupees)} है, जिसमें से ${rupees(pacs.kccDrawnRupees)} इस्तेमाल हो चुके हैं, यानी ${available} बाकी हैं। नवीनीकरण की तारीख ${displayDate(pacs.kccRenewalDueDate)} है; समय पर चुकाने से ब्याज ${pacs.kccSubventionPercent}% रहता है।`,
        pa: `ਤੁਹਾਡੀ ਕੇਸੀਸੀ ਹੱਦ ${rupees(pacs.kccLimitRupees)} ਹੈ, ਜਿਸ ਵਿੱਚੋਂ ${rupees(pacs.kccDrawnRupees)} ਵਰਤੇ ਜਾ ਚੁੱਕੇ ਹਨ, ਯਾਨੀ ${available} ਬਾਕੀ ਹਨ। ਨਵੀਨੀਕਰਨ ਦੀ ਤਾਰੀਖ਼ ${displayDate(pacs.kccRenewalDueDate)} ਹੈ; ਸਮੇਂ ਸਿਰ ਮੋੜਨ ਨਾਲ ਵਿਆਜ ${pacs.kccSubventionPercent}% ਰਹਿੰਦਾ ਹੈ।`,
      }[language];
      return answer(text, 'credit-and-financial-assistance', { en: 'Open credit details', hi: 'ऋण विवरण खोलें', pa: 'ਕਰਜ਼ਾ ਵੇਰਵਾ ਖੋਲ੍ਹੋ' }[language]);
    }

    case 'schemes': {
      const [farmer, schemes, documents] = await Promise.all([
        dataProvider.getFarmerProfile(),
        dataProvider.getSchemes(),
        dataProvider.getDocuments(),
      ]);
      const matches = SchemeMatchingService.matchSchemes(
        schemes,
        {
          crop: farmer.primaryCrop || 'Wheat',
          state: farmer.state,
          district: farmer.district,
          landCategory: 'Small',
          landAreaAcres: farmer.totalLandAcres,
          landOwnership: 'Owned',
        },
        documents
      ).slice(0, 3);
      if (!matches.length) return null;
      const names = matches.map((m) => m.scheme.name);
      const text = {
        en: `Schemes that may help you: ${list(names, 'en')}. Final eligibility is decided by the agriculture department.`,
        hi: `ये योजनाएँ आपके काम आ सकती हैं: ${list(names, 'hi')}। अंतिम पात्रता कृषि विभाग तय करता है।`,
        pa: `ਇਹ ਯੋਜਨਾਵਾਂ ਤੁਹਾਡੇ ਕੰਮ ਆ ਸਕਦੀਆਂ ਹਨ: ${list(names, 'pa')}। ਅੰਤਿਮ ਯੋਗਤਾ ਖੇਤੀਬਾੜੀ ਵਿਭਾਗ ਤੈਅ ਕਰਦਾ ਹੈ।`,
      }[language];
      return answer(text, 'government-schemes', { en: 'See schemes', hi: 'योजनाएँ देखें', pa: 'ਯੋਜਨਾਵਾਂ ਵੇਖੋ' }[language]);
    }

    case 'grievance': {
      const farmer = await dataProvider.getFarmerProfile();
      const [latest] = await dataProvider.getGrievances(farmer.id);
      if (!latest) return null;
      const text = {
        en: `The status of your latest grievance ${latest.grievanceId}, "${latest.subject}", is "${latest.status}". It is assigned to ${latest.assignedTo}.`,
        hi: `आपकी नई शिकायत ${latest.grievanceId} ("${latest.subject}") अभी "${latest.status}" स्थिति में है। यह ${latest.assignedTo} को सौंपी गई है।`,
        pa: `ਤੁਹਾਡੀ ਨਵੀਂ ਸ਼ਿਕਾਇਤ ${latest.grievanceId} ("${latest.subject}") ਹੁਣ "${latest.status}" ਸਥਿਤੀ ਵਿੱਚ ਹੈ। ਇਹ ${latest.assignedTo} ਨੂੰ ਸੌਂਪੀ ਗਈ ਹੈ।`,
      }[language];
      return answer(text, 'grievance-redressal', { en: 'Open grievances', hi: 'शिकायतें खोलें', pa: 'ਸ਼ਿਕਾਇਤਾਂ ਖੋਲ੍ਹੋ' }[language]);
    }
  }
};
