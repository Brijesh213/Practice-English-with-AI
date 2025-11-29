import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { pcmToAudioBuffer, createPcmBlob, decodeBase64 } from './audioUtils';
import { AppSettings, VoiceName } from '../types';
import { SYSTEM_INSTRUCTION_BASE, MODE_INSTRUCTIONS } from '../constants';

// Live API Configuration
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000; // Gemini 2.5 usually outputs at 24kHz

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private sessionPromise: Promise<any> | null = null;
  private onTranscriptUpdate: (text: string, isUser: boolean, isFinal: boolean) => void;
  private onAudioLevel: (level: number) => void;
  private isConnected = false;

  constructor(
    apiKey: string,
    onTranscriptUpdate: (text: string, isUser: boolean, isFinal: boolean) => void,
    onAudioLevel: (level: number) => void
  ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onAudioLevel = onAudioLevel;
  }

  async connect(settings: AppSettings) {
    if (this.isConnected) return;

    // Initialize Audio Contexts
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: INPUT_SAMPLE_RATE,
    });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: OUTPUT_SAMPLE_RATE,
    });

    // Get Microphone Stream with noise suppression
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    // Build System Prompt based on Settings
    const systemInstruction = `
      ${SYSTEM_INSTRUCTION_BASE}
      ${MODE_INSTRUCTIONS[settings.learningMode]}
      ${settings.is18Plus ? "User is over 18. Romantic (but PG-13) tone allowed if requested." : "User is under 18. Keep tone strictly friendly."}
      User's name is ${settings.userName}.
    `;

    // Connect to Gemini Live
    this.sessionPromise = this.ai.live.connect({
      model: MODEL_NAME,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voice } },
        },
        systemInstruction: systemInstruction,
        inputAudioTranscription: {}, // Enable user transcription
        outputAudioTranscription: {}, // Enable model transcription
      },
      callbacks: {
        onopen: this.handleOpen.bind(this),
        onmessage: this.handleMessage.bind(this),
        onerror: (e) => console.error('Gemini Live Error:', e),
        onclose: () => {
          console.log('Gemini Live Closed');
          this.isConnected = false;
        },
      },
    });

    this.isConnected = true;
  }

  private handleOpen() {
    console.log('Session Opened');
    if (!this.inputContext || !this.stream || !this.sessionPromise) return;

    // Set up audio input processing
    this.source = this.inputContext.createMediaStreamSource(this.stream);
    // 4096 buffer size is standard for ScriptProcessor (approx 250ms at 16kHz)
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate simplistic audio level for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      this.onAudioLevel(rms * 5); // Scale up a bit

      const pcmBlob = createPcmBlob(inputData);
      
      this.sessionPromise?.then((session: any) => {
        session.sendRealtimeInput({ media: pcmBlob });
      }).catch(err => console.error("Error sending audio", err));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    if (!this.isConnected) return;

    // Handle Interruption
    const interrupted = message.serverContent?.interrupted;
    if (interrupted) {
      console.log("Model interrupted");
      this.activeSources.forEach((source) => {
        try { source.stop(); } catch (e) { /* ignore already stopped */ }
      });
      this.activeSources.clear();
      this.nextStartTime = 0; // Reset scheduling cursor
      this.onAudioLevel(0);
    }

    // 1. Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio && this.outputContext) {
      // Update visualizer for model speech (mocking level based on presence of data)
      this.onAudioLevel(0.4); 

      this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
      
      try {
        const audioBuffer = await pcmToAudioBuffer(
          decodeBase64(base64Audio),
          this.outputContext,
          OUTPUT_SAMPLE_RATE
        );

        const source = this.outputContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputContext.destination);
        
        source.addEventListener('ended', () => {
          this.activeSources.delete(source);
          // Reset level when audio ends
          if (this.activeSources.size === 0) this.onAudioLevel(0);
        });

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.activeSources.add(source);
      } catch (e) {
        console.error("Error decoding/playing audio chunk", e);
      }
    }

    // 2. Handle Transcription (User & Model)
    const serverContent = message.serverContent;
    if (serverContent) {
      if (serverContent.outputTranscription) {
        this.onTranscriptUpdate(serverContent.outputTranscription.text, false, !!serverContent.turnComplete);
      }
      if (serverContent.inputTranscription) {
         this.onTranscriptUpdate(serverContent.inputTranscription.text, true, !!serverContent.turnComplete);
      }
    }
  }

  async disconnect() {
    this.isConnected = false;
    
    // Stop Microphone
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Disconnect Nodes
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    // Stop output audio
    this.activeSources.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    this.activeSources.clear();

    // Close contexts safely
    if (this.inputContext && this.inputContext.state !== 'closed') {
        try {
            await this.inputContext.close();
        } catch (e) {
            console.error("Error closing input context", e);
        }
    }
    this.inputContext = null;

    if (this.outputContext && this.outputContext.state !== 'closed') {
        try {
            await this.outputContext.close();
        } catch (e) {
             console.error("Error closing output context", e);
        }
    }
    this.outputContext = null;

    // Note: No explicit 'close' method on the session object in the SDK snippet provided,
    // usually closing the client or just letting it GC is enough, 
    // but typically we'd send a close signal if the protocol supports it.
    // We rely on the websocket closing when the object is destroyed or page unloads.
  }
}