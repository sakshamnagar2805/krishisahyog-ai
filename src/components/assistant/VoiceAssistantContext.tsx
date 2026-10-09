import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AICitation, LanguageCode } from '../../types';
import {
  AssistantPage,
  toVoiceLanguage,
  VoiceLanguage,
} from '../../services/assistant/assistantConfig';
import {
  AssistantStatus,
  fetchAssistantStatus,
  TextAssistant,
} from '../../services/assistant/assistantApi';
import type { LiveVoiceSession } from '../../services/assistant/liveVoiceSession';
import {
  isLiveVoiceSupported,
  isSpeechRecognitionSupported,
  listenOnce,
  speak,
  stopSpeaking,
} from '../../services/assistant/browserSpeech';

/** live: Gemini Live audio · browser: browser speech in/out · text: typing only */
export type VoiceMode = 'live' | 'browser' | 'text';
export type VoicePhase = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

export interface AssistantMessage {
  id: number;
  role: 'farmer' | 'assistant';
  text: string;
  /** Live transcripts stream in; a message is open until its turn completes */
  open?: boolean;
  source?: 'gemini' | 'demo';
  citations?: AICitation[];
  suggestedRoute?: string;
  suggestedLabel?: string;
}

interface VoiceAssistantValue {
  language: VoiceLanguage;
  setLanguage: (language: VoiceLanguage) => void;
  status: AssistantStatus | null;
  mode: VoiceMode;
  phase: VoicePhase;
  isVoiceActive: boolean;
  messages: AssistantMessage[];
  interimText: string;
  inputLevel: number;
  notice: string | null;
  startVoice: () => void;
  stopVoice: () => void;
  ask: (question: string) => void;
  clearConversation: () => void;
  navigate: (route: string) => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantValue | null>(null);

export const useVoiceAssistant = () => {
  const value = useContext(VoiceAssistantContext);
  if (!value) throw new Error('useVoiceAssistant must be used inside VoiceAssistantProvider');
  return value;
};

interface VoiceAssistantProviderProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const VoiceAssistantProvider: React.FC<VoiceAssistantProviderProps> = ({
  currentLanguage,
  onLanguageChange,
  onNavigate,
  children,
}) => {
  const language = toVoiceLanguage(currentLanguage);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [liveFailed, setLiveFailed] = useState(false);
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [interimText, setInterimText] = useState('');
  const [inputLevel, setInputLevel] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  // Refs let long-lived sessions and speech callbacks read the latest values
  const languageRef = useRef(language);
  languageRef.current = language;
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;
  const messageId = useRef(0);
  const liveSession = useRef<LiveVoiceSession | null>(null);
  const stopRecognition = useRef<(() => void) | null>(null);
  const browserLoopActive = useRef(false);

  const toolContext = useMemo(
    () => ({ navigate: (page: AssistantPage) => onNavigateRef.current(page) }),
    []
  );
  const textAssistant = useMemo(() => new TextAssistant(toolContext), [toolContext]);

  const mode: VoiceMode =
    status?.liveAvailable && !liveFailed && isLiveVoiceSupported()
      ? 'live'
      : isSpeechRecognitionSupported()
      ? 'browser'
      : 'text';
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const useGeminiRef = useRef(false);
  useGeminiRef.current = !!status?.configured;

  useEffect(() => {
    fetchAssistantStatus().then(setStatus);
  }, []);

  const addMessage = useCallback((message: Omit<AssistantMessage, 'id'>) => {
    messageId.current += 1;
    const id = messageId.current;
    setMessages((prev) => [...prev, { ...message, id }]);
    return id;
  }, []);

  const appendTranscript = useCallback((role: AssistantMessage['role'], chunk: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.open) {
        return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
      }
      messageId.current += 1;
      return [
        ...prev.map((m) => (m.open ? { ...m, open: false } : m)),
        { id: messageId.current, role, text: chunk.trimStart(), open: true, source: role === 'assistant' ? 'gemini' : undefined },
      ];
    });
  }, []);

  const closeOpenMessages = useCallback(() => {
    setMessages((prev) => prev.map((m) => (m.open ? { ...m, open: false } : m)));
  }, []);

  // ---- Browser speech loop: listen → answer → speak → listen again ----

  const answerAloud = useCallback(
    async (question: string) => {
      setPhase('thinking');
      const answer = await textAssistant.ask(question, languageRef.current, useGeminiRef.current);
      addMessage({
        role: 'assistant',
        text: answer.text,
        source: answer.source,
        citations: answer.citations,
        suggestedRoute: answer.suggestedRoute,
        suggestedLabel: answer.suggestedLabel,
      });
      return answer;
    },
    [addMessage, textAssistant]
  );

  const listenInBrowser = useCallback(() => {
    setInterimText('');
    setPhase('listening');
    stopRecognition.current = listenOnce(languageRef.current, {
      onInterim: setInterimText,
      onError: (message) => {
        setNotice(message);
        browserLoopActive.current = false;
      },
      onFinal: (text) => {
        setInterimText('');
        addMessage({ role: 'farmer', text });
        void answerAloud(text).then((answer) => {
          if (!browserLoopActive.current) return setPhase('idle');
          setPhase('speaking');
          speak(answer.text, languageRef.current, () => {
            if (browserLoopActive.current) listenInBrowser();
            else setPhase('idle');
          });
        });
      },
      onEnd: () => {
        stopRecognition.current = null;
        setInterimText('');
        // No speech captured: end the loop quietly
        setPhase((current) => {
          if (current === 'listening') {
            browserLoopActive.current = false;
            setIsVoiceActive(false);
            return 'idle';
          }
          return current;
        });
      },
    });
  }, [addMessage, answerAloud]);

  const startBrowserVoice = useCallback(() => {
    browserLoopActive.current = true;
    setIsVoiceActive(true);
    listenInBrowser();
  }, [listenInBrowser]);

  // ---- Live session ----

  const stopVoice = useCallback(() => {
    browserLoopActive.current = false;
    stopRecognition.current?.();
    stopRecognition.current = null;
    stopSpeaking();
    liveSession.current?.stop();
    liveSession.current = null;
    closeOpenMessages();
    setInterimText('');
    setInputLevel(0);
    setIsVoiceActive(false);
    setPhase('idle');
  }, [closeOpenMessages]);

  const handleLiveStartFailure = useCallback(
    (err: unknown) => {
      const denied = err instanceof DOMException && err.name === 'NotAllowedError';
      if (denied) {
        setNotice('Microphone permission was denied. Allow the microphone, or type your question.');
        setIsVoiceActive(false);
        setPhase('idle');
        return;
      }
      console.warn('[assistant] Live voice unavailable, falling back to browser speech:', err);
      setLiveFailed(true);
      if (isSpeechRecognitionSupported()) {
        setNotice('Live voice is unavailable right now, so standard voice is being used.');
        startBrowserVoice();
      } else {
        setNotice('Live voice is unavailable right now. Please type your question.');
        setIsVoiceActive(false);
        setPhase('idle');
      }
    },
    [startBrowserVoice]
  );

  const startLiveVoice = useCallback(async () => {
    setIsVoiceActive(true);
    setPhase('connecting');

    let session: LiveVoiceSession | null = null;
    try {
      // The Gemini SDK is loaded on first use to keep the initial page light
      const { LiveVoiceSession: Session } = await import('../../services/assistant/liveVoiceSession');
      const created = new Session(languageRef.current, toolContext, {
        onPhase: (livePhase) => {
          if (livePhase === 'closed') {
            if (liveSession.current === created) {
              liveSession.current = null;
              setIsVoiceActive(false);
              setPhase('idle');
              setInputLevel(0);
            }
            return;
          }
          setPhase(livePhase);
        },
        onTranscript: appendTranscript,
        onTurnComplete: closeOpenMessages,
        onInputLevel: setInputLevel,
        onError: (message) => setNotice(`${message} Tap the microphone to reconnect.`),
      });
      session = created;
      liveSession.current = created;
      await created.start();
    } catch (err) {
      session?.stop();
      if (liveSession.current === session) liveSession.current = null;
      handleLiveStartFailure(err);
    }
  }, [appendTranscript, closeOpenMessages, handleLiveStartFailure, toolContext]);

  const startVoice = useCallback(() => {
    setNotice(null);
    if (modeRef.current === 'text') {
      setNotice('Voice input is not supported in this browser. Please type your question, or use Chrome.');
      return;
    }
    if (modeRef.current === 'browser') {
      startBrowserVoice();
      return;
    }
    void startLiveVoice();
  }, [startBrowserVoice, startLiveVoice]);

  const ask = useCallback(
    (question: string) => {
      const text = question.trim();
      if (!text) return;
      setNotice(null);

      if (liveSession.current && phase !== 'connecting') {
        closeOpenMessages();
        addMessage({ role: 'farmer', text });
        liveSession.current.sendText(text);
        return;
      }

      // Typing during browser listening ends that listening turn
      if (browserLoopActive.current) stopVoice();

      addMessage({ role: 'farmer', text });
      void answerAloud(text).then((answer) => {
        setPhase('speaking');
        speak(answer.text, languageRef.current, () => setPhase('idle'));
      });
    },
    [addMessage, answerAloud, closeOpenMessages, phase, stopVoice]
  );

  const setLanguage = useCallback(
    (next: VoiceLanguage) => {
      if (next === languageRef.current) return;
      // A Live session's instructions are fixed at connect time
      if (liveSession.current) {
        stopVoice();
        setNotice('Language changed. Tap the microphone to continue.');
      }
      onLanguageChange(next);
    },
    [onLanguageChange, stopVoice]
  );

  const clearConversation = useCallback(() => {
    stopVoice();
    textAssistant.reset();
    setMessages([]);
    setNotice(null);
  }, [stopVoice, textAssistant]);

  useEffect(() => stopVoice, [stopVoice]);

  const value: VoiceAssistantValue = {
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
    navigate: (route) => onNavigateRef.current(route),
  };

  return <VoiceAssistantContext.Provider value={value}>{children}</VoiceAssistantContext.Provider>;
};
