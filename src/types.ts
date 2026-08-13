export type PocketState = 'on' | 'ahead' | 'behind' | 'laid-back' | 'pushing';

export interface LyricItem {
  id: string;
  type: 'cue' | 'line';
  text: string;
  timestamp: number; // in seconds
  pocket: PocketState;
  offsetMs: number; // e.g. -12 to +12 ms
  subdivision: 0 | 1 | 2 | 3; // 16th note subdivision index (.0, .1, .2, .3)
  note?: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  bpm: number;
  genre: string;
  description: string;
  lyrics: LyricItem[];
}

export type PresetTrack = AudioTrack;

export interface DSPFrameData {
  vocalFlux: number;
  bassFlux: number;
  drumFlux: number;
  isBeat: boolean;
  timestamp: number;
  offsetMs: number;
  instantDrift: number;
}

export interface TelemetryMetrics {
  syncScore: number; // 0 to 100%
  avgDriftMs: number;
  vocalPeak: number;
  bassPeak: number;
  drumPeak: number;
  instantDriftMs: number;
  fps: number;
  grooveType: string;
  subdivisionCounts: [number, number, number, number];
  totalOnsets: number;
}

export type ViewMode = 'spectral' | 'bounce' | 'spectrum-scope' | 'full-dashboard';
