export enum CallState {
  IDLE = 'IDLE',
  INCOMING = 'INCOMING',
  ACTIVE = 'ACTIVE',
  SUMMARY = 'SUMMARY',
}

export enum LearningMode {
  CASUAL = 'CASUAL',
  TUTOR = 'TUTOR',
  DRILL = 'DRILL',
}

export enum VoiceName {
  KORE = 'Kore',     // Female, Calm
  PUCK = 'Puck',     // Male, Playful
  FENRIR = 'Fenrir', // Male, Deep
  AOEDE = 'Aoede',   // Female, Expressive
  CHARON = 'Charon', // Male, Authoritative
}

export interface AppSettings {
  userName: string;
  voice: VoiceName;
  learningMode: LearningMode;
  is18Plus: boolean;
  saveRecordings: boolean;
}

export interface TranscriptItem {
  speaker: 'user' | 'model';
  text: string;
  timestamp: number;
  isCorrection?: boolean;
}

export interface CallSummaryData {
  durationSeconds: number;
  transcripts: TranscriptItem[];
  corrections: string[];
}