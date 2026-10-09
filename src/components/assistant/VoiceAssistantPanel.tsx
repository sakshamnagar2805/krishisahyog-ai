import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Send, Loader2, Headphones, ChevronRight, RotateCcw } from 'lucide-react';
import { useVoiceAssistant, VoicePhase } from './VoiceAssistantContext';
import { VOICE_LANGUAGES, VoiceLanguage } from '../../services/assistant/assistantConfig';
import { Button, Chip, Notice, fieldControl } from '../ui';

const UI_TEXT: Record<
  VoiceLanguage,
  {
    title: string;
    phase: Record<VoicePhase, string>;
    tapToStop: string;
    placeholder: string;
    send: string;
    tryAsking: string;
    newChat: string;
    headphones: string;
    guidanceOnly: string;
    suggestions: string[];
  }
> = {
  en: {
    title: 'KrishiSahyog Voice Assistant',
    phase: {
      idle: 'Tap the microphone and ask your question',
      connecting: 'Connecting…',
      listening: 'Listening… speak now',
      thinking: 'Finding your answer…',
      speaking: 'Speaking… you can interrupt anytime',
    },
    tapToStop: 'Tap to stop',
    placeholder: 'Or type your question…',
    send: 'Ask',
    tryAsking: 'Try asking',
    newChat: 'New conversation',
    headphones: 'Use earphones for the best experience',
    guidanceOnly: 'Guidance only — not an official government transaction.',
    suggestions: [
      'What is the status of my crop insurance claim?',
      'Which documents are still missing?',
      'How much urea can I collect from my PACS?',
      'Which government schemes can help me?',
    ],
  },
  hi: {
    title: 'कृषिसहयोग आवाज़ सहायक',
    phase: {
      idle: 'माइक दबाएँ और अपना सवाल पूछें',
      connecting: 'जुड़ रहा है…',
      listening: 'सुन रहा है… अब बोलिए',
      thinking: 'जवाब ढूँढ रहा है…',
      speaking: 'बोल रहा है… आप कभी भी बीच में बोल सकते हैं',
    },
    tapToStop: 'रोकने के लिए दबाएँ',
    placeholder: 'या अपना सवाल लिखें…',
    send: 'पूछें',
    tryAsking: 'ऐसे पूछें',
    newChat: 'नई बातचीत',
    headphones: 'बेहतर अनुभव के लिए ईयरफ़ोन लगाएँ',
    guidanceOnly: 'केवल मार्गदर्शन — यह आधिकारिक सरकारी लेन-देन नहीं है।',
    suggestions: [
      'मेरे फसल बीमा दावे की स्थिति क्या है?',
      'कौन से दस्तावेज़ अभी भी बाकी हैं?',
      'मैं अपनी पैक्स से कितना यूरिया ले सकता हूँ?',
      'कौन सी सरकारी योजनाएँ मेरी मदद कर सकती हैं?',
    ],
  },
  pa: {
    title: 'ਕ੍ਰਿਸ਼ੀਸਹਿਯੋਗ ਆਵਾਜ਼ ਸਹਾਇਕ',
    phase: {
      idle: 'ਮਾਈਕ ਦਬਾਓ ਅਤੇ ਆਪਣਾ ਸਵਾਲ ਪੁੱਛੋ',
      connecting: 'ਜੁੜ ਰਿਹਾ ਹੈ…',
      listening: 'ਸੁਣ ਰਿਹਾ ਹੈ… ਹੁਣ ਬੋਲੋ',
      thinking: 'ਜਵਾਬ ਲੱਭ ਰਿਹਾ ਹੈ…',
      speaking: 'ਬੋਲ ਰਿਹਾ ਹੈ… ਤੁਸੀਂ ਕਦੇ ਵੀ ਵਿੱਚ ਬੋਲ ਸਕਦੇ ਹੋ',
    },
    tapToStop: 'ਰੋਕਣ ਲਈ ਦਬਾਓ',
    placeholder: 'ਜਾਂ ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ…',
    send: 'ਪੁੱਛੋ',
    tryAsking: 'ਇੰਝ ਪੁੱਛੋ',
    newChat: 'ਨਵੀਂ ਗੱਲਬਾਤ',
    headphones: 'ਵਧੀਆ ਤਜਰਬੇ ਲਈ ਈਅਰਫ਼ੋਨ ਲਗਾਓ',
    guidanceOnly: 'ਸਿਰਫ਼ ਮਾਰਗਦਰਸ਼ਨ — ਇਹ ਸਰਕਾਰੀ ਲੈਣ-ਦੇਣ ਨਹੀਂ ਹੈ।',
    suggestions: [
      'ਮੇਰੇ ਫ਼ਸਲ ਬੀਮਾ ਦਾਅਵੇ ਦੀ ਸਥਿਤੀ ਕੀ ਹੈ?',
      'ਕਿਹੜੇ ਦਸਤਾਵੇਜ਼ ਅਜੇ ਬਾਕੀ ਹਨ?',
      'ਮੈਂ ਆਪਣੀ ਪੈਕਸ ਤੋਂ ਕਿੰਨਾ ਯੂਰੀਆ ਲੈ ਸਕਦਾ ਹਾਂ?',
      'ਕਿਹੜੀਆਂ ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਮੇਰੀ ਮਦਦ ਕਰ ਸਕਦੀਆਂ ਹਨ?',
    ],
  },
};

interface VoiceAssistantPanelProps {
  variant: 'drawer' | 'page';
}

export const VoiceAssistantPanel: React.FC<VoiceAssistantPanelProps> = ({ variant }) => {
  const assistant = useVoiceAssistant();
  const {
    language,
    setLanguage,
    status,
    mode,
    phase,
    isVoiceActive,
    messages,
    interimText,
    inputLevel,
    notice,
    startVoice,
    stopVoice,
    ask,
    clearConversation,
    navigate,
  } = assistant;
  const t = UI_TEXT[language];
  const [draft, setDraft] = useState('');
  const conversationEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, interimText]);

  const modeLabel =
    status === null
      ? 'Checking voice service…'
      : mode === 'live'
      ? 'Live voice · Gemini'
      : `${mode === 'browser' ? 'Standard voice' : 'Text only'} · ${
          status.configured
            ? 'Gemini answers'
            : status.reason === 'invalid_key'
            ? 'Demo answers (API key rejected)'
            : 'Demo answers (no API key)'
        }`;

  const busy = phase === 'connecting' || phase === 'thinking';
  const bars = [0.5, 0.8, 1, 0.7, 0.9, 0.6, 0.85];

  return (
    <div className={`flex flex-col ${variant === 'drawer' ? 'h-full' : ''}`} id={`voice-assistant-${variant}`}>
      {/* Mode + language */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
        <span className="inline-flex items-center gap-2 text-sm text-muted" id="voice-assistant-mode">
          <span
            className={`h-2 w-2 rounded-full ${mode === 'live' ? 'bg-brand' : status?.configured ? 'bg-navy/60' : 'bg-warning'}`}
            aria-hidden="true"
          />
          {modeLabel}
        </span>
        <div className="flex items-center gap-1" role="group" aria-label="Voice language">
          {VOICE_LANGUAGES.map((l) => (
            <Chip key={l.code} active={language === l.code} onClick={() => setLanguage(l.code)}>
              {l.nativeName}
            </Chip>
          ))}
        </div>
      </div>

      {/* Microphone */}
      <div className="flex flex-col items-center text-center py-6 gap-3">
        <button
          type="button"
          onClick={isVoiceActive ? stopVoice : startVoice}
          disabled={status === null}
          aria-label={isVoiceActive ? t.tapToStop : t.phase.idle}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 ${
            phase === 'listening'
              ? 'bg-danger ring-8 ring-danger/15'
              : phase === 'speaking'
              ? 'bg-brand-dark ring-8 ring-brand-light'
              : isVoiceActive
              ? 'bg-navy ring-8 ring-blue-soft'
              : 'bg-brand-dark hover:bg-brand-dark/90'
          }`}
          id="voice-assistant-mic"
        >
          {busy ? (
            <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
          ) : isVoiceActive ? (
            <Square className="w-7 h-7" aria-hidden="true" />
          ) : (
            <Mic className="w-8 h-8" aria-hidden="true" />
          )}
        </button>

        <div className="h-6 flex items-end gap-1" aria-hidden="true">
          {phase === 'listening' &&
            bars.map((b, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-danger transition-all duration-100"
                style={{ height: `${Math.max(15, (mode === 'live' ? inputLevel : 0.6) * b * 100)}%` }}
              />
            ))}
        </div>

        <p className="font-semibold text-navy" aria-live="polite" id="voice-assistant-phase">
          {t.phase[phase]}
        </p>
        {mode === 'live' && (
          <span className="text-[13px] text-muted flex items-center gap-1.5">
            <Headphones className="w-4 h-4" aria-hidden="true" /> {t.headphones}
          </span>
        )}
      </div>

      {notice && (
        <Notice tone="warning" className="mb-4">
          {notice}
        </Notice>
      )}

      {/* Conversation */}
      <div
        className={`space-y-3 overflow-y-auto ${variant === 'drawer' ? 'flex-1 min-h-0' : 'max-h-[420px]'}`}
        id="voice-assistant-conversation"
      >
        {messages.length === 0 && !interimText ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">{t.tryAsking}</p>
            {t.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="w-full flex items-center justify-between gap-2 rounded-md border border-line bg-white px-3.5 py-3 text-left text-[15px] text-ink hover:bg-offwhite"
              >
                {s}
                <ChevronRight className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'farmer' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-[15px] leading-relaxed ${
                    m.role === 'farmer'
                      ? 'bg-navy text-white rounded-br-sm'
                      : 'bg-offwhite text-ink border border-line rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.role === 'assistant' && (
                    <div className="mt-2 space-y-2">
                      {m.citations?.slice(0, 1).map((c, i) => (
                        <p key={i} className="text-[13px] text-muted">
                          Source: {c.documentTitle}
                        </p>
                      ))}
                      {m.suggestedRoute && (
                        <Button variant="secondary" size="sm" onClick={() => navigate(m.suggestedRoute!)}>
                          {m.suggestedLabel || 'Open page'} <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      )}
                      {m.source && (
                        <span className="block text-[13px] text-muted">
                          {m.source === 'gemini' ? 'Answered by Gemini from your records' : 'Built-in answer'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {interimText && (
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-lg px-3.5 py-2.5 text-[15px] italic bg-blue-soft text-muted">
                  {interimText}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={conversationEnd} />
      </div>

      {/* Typed input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
          setDraft('');
        }}
        className="pt-4 mt-4 border-t border-line flex items-center gap-2"
      >
        <label htmlFor={`voice-assistant-input-${variant}`} className="sr-only">
          {t.placeholder}
        </label>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.placeholder}
          className={`${fieldControl} flex-1 min-w-0`}
          id={`voice-assistant-input-${variant}`}
        />
        <Button type="submit" disabled={!draft.trim() || phase === 'thinking'} className="shrink-0">
          <Send className="w-4 h-4" aria-hidden="true" /> {t.send}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-[13px] text-muted">
        <span>{t.guidanceOnly}</span>
        {messages.length > 0 && (
          <Button variant="link" onClick={clearConversation}>
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {t.newChat}
          </Button>
        )}
      </div>
    </div>
  );
};
