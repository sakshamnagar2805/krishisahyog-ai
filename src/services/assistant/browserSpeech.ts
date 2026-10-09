/**
 * Fallback voice path using the browser's own speech recognition and synthesis.
 * Used when Gemini Live is not available (no key, blocked connection, unsupported browser).
 */
import { getVoiceLanguage, VoiceLanguage } from './assistantConfig';

// Minimal typing for the (prefixed) Web Speech recognition API
interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

const getRecognitionConstructor = (): RecognitionConstructor | undefined => {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
};

/** Microphone streaming + AudioWorklet + WebSocket, needed for Gemini Live */
export const isLiveVoiceSupported = () =>
  typeof window !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof AudioWorkletNode !== 'undefined' &&
  typeof WebSocket !== 'undefined' &&
  window.isSecureContext;

export const isSpeechRecognitionSupported = () =>
  typeof window !== 'undefined' && !!getRecognitionConstructor();

export interface RecognitionHandlers {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}

/** Listens for one utterance. Returns a stop function. */
export const listenOnce = (language: VoiceLanguage, handlers: RecognitionHandlers) => {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    handlers.onError('Speech recognition is not supported in this browser.');
    handlers.onEnd();
    return () => undefined;
  }

  const recognition = new Recognition();
  recognition.lang = getVoiceLanguage(language).bcp47;
  recognition.interimResults = true;
  recognition.continuous = false;

  let finalText = '';
  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) finalText += result[0].transcript;
      else interim += result[0].transcript;
    }
    handlers.onInterim((finalText + interim).trim());
  };
  recognition.onerror = (event) => {
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      handlers.onError(
        event.error === 'not-allowed'
          ? 'Microphone permission was denied.'
          : `Speech recognition error: ${event.error}`
      );
    }
  };
  recognition.onend = () => {
    if (finalText.trim()) handlers.onFinal(finalText.trim());
    handlers.onEnd();
  };

  recognition.start();
  return () => recognition.stop();
};

export const speak = (text: string, language: VoiceLanguage, onEnd: () => void) => {
  if (!('speechSynthesis' in window) || !text) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const bcp47 = getVoiceLanguage(language).bcp47;
  utterance.lang = bcp47;
  const voice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang === bcp47 || v.lang.startsWith(`${language}-`));
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};
