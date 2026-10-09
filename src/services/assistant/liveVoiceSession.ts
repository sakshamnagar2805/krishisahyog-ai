/**
 * Real-time voice conversation with Gemini Live.
 *
 * Microphone audio is streamed as 16 kHz PCM; the model's 24 kHz PCM reply is
 * played back as it arrives and cut off when the farmer interrupts. Tool calls
 * are answered in the browser from the app's own data.
 */
import { FunctionResponse, GoogleGenAI, LiveServerMessage, Session } from '@google/genai';
import { buildLiveConnectConfig, VoiceLanguage } from './assistantConfig';
import { AssistantToolContext, executeAssistantTool } from './assistantTools';
import { fetchLiveToken } from './assistantApi';

export type LivePhase = 'connecting' | 'listening' | 'speaking' | 'closed';

export interface LiveVoiceCallbacks {
  onPhase: (phase: LivePhase) => void;
  onTranscript: (role: 'farmer' | 'assistant', textChunk: string) => void;
  onTurnComplete: () => void;
  onInputLevel: (level: number) => void;
  onError: (message: string) => void;
}

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const CHUNK_SAMPLES = INPUT_SAMPLE_RATE / 10; // 100 ms

const CAPTURE_WORKLET = `
class PcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) this.port.postMessage(channel.slice(0));
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`;

const encodePcm16Base64 = (samples: Float32Array) => {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const decodePcm16Base64 = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
  const samples = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) samples[i] = pcm[i] / 0x8000;
  return samples;
};

/** Linear-interpolation resample to 16 kHz */
const resample = (input: Float32Array, fromRate: number) => {
  if (fromRate === INPUT_SAMPLE_RATE) return input;
  const ratio = fromRate / INPUT_SAMPLE_RATE;
  const output = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < output.length; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    output[i] = input[idx] * (1 - frac) + (input[idx + 1] ?? input[idx]) * frac;
  }
  return output;
};

export class LiveVoiceSession {
  private session: Session | null = null;
  private stream: MediaStream | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private pending = new Float32Array(0);
  private playbackCursor = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private closed = false;

  constructor(
    private readonly language: VoiceLanguage,
    private readonly toolContext: AssistantToolContext,
    private readonly callbacks: LiveVoiceCallbacks
  ) {}

  /** Opens the Live session and starts streaming the microphone. Throws if either fails. */
  async start() {
    this.callbacks.onPhase('connecting');

    // Ask for the microphone first so a denied permission fails fast
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });

    if (this.closed) return this.stop();

    const { token, model } = await fetchLiveToken(this.language);
    if (this.closed) return this.stop();
    const ai = new GoogleGenAI({ apiKey: token });

    this.outputContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });

    this.session = await ai.live.connect({
      model,
      config: buildLiveConnectConfig(this.language),
      callbacks: {
        onmessage: (message) => this.handleMessage(message),
        onerror: () => this.fail('Live voice connection error.'),
        onclose: (event) => {
          if (!this.closed) {
            this.fail(event.reason ? `Live voice closed: ${event.reason}` : 'Live voice connection closed.');
          }
        },
      },
    });

    if (this.closed) return this.stop();
    await this.startMicrophone();
    this.callbacks.onPhase('listening');
  }

  sendText(text: string) {
    this.session?.sendRealtimeInput({ text });
  }

  stop() {
    if (this.closed && !this.session && !this.stream) return;
    this.closed = true;
    this.stopPlayback();
    try {
      this.session?.close();
    } catch {
      // already closed
    }
    this.session = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.inputContext?.close().catch(() => undefined);
    this.outputContext?.close().catch(() => undefined);
    this.inputContext = null;
    this.outputContext = null;
    this.callbacks.onInputLevel(0);
    this.callbacks.onPhase('closed');
  }

  private fail(message: string) {
    if (this.closed) return;
    this.callbacks.onError(message);
    this.stop();
  }

  private async startMicrophone() {
    if (!this.stream) return;
    this.inputContext = new AudioContext();
    const workletUrl = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }));
    try {
      await this.inputContext.audioWorklet.addModule(workletUrl);
    } finally {
      URL.revokeObjectURL(workletUrl);
    }

    const source = this.inputContext.createMediaStreamSource(this.stream);
    const capture = new AudioWorkletNode(this.inputContext, 'pcm-capture');
    const inputRate = this.inputContext.sampleRate;

    capture.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (!this.session) return;
      const resampled = resample(event.data, inputRate);
      const merged = new Float32Array(this.pending.length + resampled.length);
      merged.set(this.pending);
      merged.set(resampled, this.pending.length);

      let offset = 0;
      while (merged.length - offset >= CHUNK_SAMPLES) {
        const chunk = merged.subarray(offset, offset + CHUNK_SAMPLES);
        offset += CHUNK_SAMPLES;

        let sum = 0;
        for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
        this.callbacks.onInputLevel(Math.min(1, Math.sqrt(sum / chunk.length) * 4));

        this.session.sendRealtimeInput({
          audio: { data: encodePcm16Base64(chunk), mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` },
        });
      }
      this.pending = merged.slice(offset);
    };

    source.connect(capture);
  }

  private handleMessage(message: LiveServerMessage) {
    const content = message.serverContent;

    if (content?.interrupted) {
      this.stopPlayback();
      this.callbacks.onPhase('listening');
    }

    for (const part of content?.modelTurn?.parts ?? []) {
      if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/pcm')) {
        this.playChunk(part.inlineData.data);
      }
    }

    if (content?.inputTranscription?.text) {
      this.callbacks.onTranscript('farmer', content.inputTranscription.text);
    }
    if (content?.outputTranscription?.text) {
      this.callbacks.onTranscript('assistant', content.outputTranscription.text);
    }
    if (content?.turnComplete) {
      this.callbacks.onTurnComplete();
    }

    if (message.toolCall?.functionCalls?.length) {
      void this.answerToolCalls(message.toolCall.functionCalls);
    }
  }

  private async answerToolCalls(calls: NonNullable<LiveServerMessage['toolCall']>['functionCalls']) {
    const functionResponses: FunctionResponse[] = await Promise.all(
      (calls ?? []).map(async (call) => ({
        id: call.id,
        name: call.name,
        response: { output: await executeAssistantTool(call.name, call.args, this.toolContext) },
      }))
    );
    this.session?.sendToolResponse({ functionResponses });
  }

  private playChunk(base64: string) {
    const ctx = this.outputContext;
    if (!ctx) return;
    const samples = decodePcm16Base64(base64);
    const buffer = ctx.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(samples, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(ctx.currentTime, this.playbackCursor);
    source.start(startAt);
    this.playbackCursor = startAt + buffer.duration;
    this.activeSources.add(source);
    this.callbacks.onPhase('speaking');

    source.onended = () => {
      this.activeSources.delete(source);
      if (this.activeSources.size === 0 && !this.closed) this.callbacks.onPhase('listening');
    };
  }

  private stopPlayback() {
    this.activeSources.forEach((source) => {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // not started yet
      }
    });
    this.activeSources.clear();
    this.playbackCursor = 0;
  }
}
