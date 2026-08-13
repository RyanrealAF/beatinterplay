import { PresetTrack } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private buffers: { drums?: AudioBuffer; bass?: AudioBuffer; vocals?: AudioBuffer } = {};
  private sources: { drums?: AudioBufferSourceNode; bass?: AudioBufferSourceNode; vocals?: AudioBufferSourceNode } = {};
  private gainNodes: { drums?: GainNode; bass?: GainNode; vocals?: GainNode; master?: GainNode } = {};
  private analyserNodes: { drums?: AnalyserNode; bass?: AnalyserNode; vocals?: AnalyserNode } = {};
  private muteState = { drums: false, bass: false, vocals: false };
  private volumeState = { drums: 0.85, bass: 0.85, vocals: 0.85, master: 1.0 };

  private isPlayingState = false;
  private startTime = 0;
  private pauseOffset = 0;
  private durationSec = 16.0;

  // Live Microphone Input State
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private isMicActive = false;

  private onTimeUpdateCallback?: (timeSec: number, durationSec: number) => void;
  private animationFrameId: number | null = null;

  public async initialize(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.gainNodes.master) {
      const masterGain = this.ctx.createGain();
      masterGain.gain.value = this.volumeState.master;
      masterGain.connect(this.ctx.destination);
      this.gainNodes.master = masterGain;
    }

    if (!this.analyserNodes.vocals) {
      const vocalAnalyser = this.ctx.createAnalyser();
      vocalAnalyser.fftSize = 2048;
      vocalAnalyser.smoothingTimeConstant = 0.3;
      this.analyserNodes.vocals = vocalAnalyser;
    }

    if (!this.analyserNodes.bass) {
      const bassAnalyser = this.ctx.createAnalyser();
      bassAnalyser.fftSize = 2048;
      bassAnalyser.smoothingTimeConstant = 0.3;
      this.analyserNodes.bass = bassAnalyser;
    }

    if (!this.analyserNodes.drums) {
      const drumAnalyser = this.ctx.createAnalyser();
      drumAnalyser.fftSize = 2048;
      drumAnalyser.smoothingTimeConstant = 0.3;
      this.analyserNodes.drums = drumAnalyser;
    }

    return this.ctx;
  }

  public setTimeUpdateCallback(cb: (timeSec: number, durationSec: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public isMicrophoneActive(): boolean {
    return this.isMicActive;
  }

  public getCurrentTime(): number {
    if (!this.isPlayingState || !this.ctx) return this.pauseOffset;
    return (this.ctx.currentTime - this.startTime) % this.durationSec;
  }

  public getDuration(): number {
    return this.durationSec;
  }

  // Live Microphone Input Pipeline
  public async enableMicrophone(): Promise<boolean> {
    try {
      const ctx = await this.initialize();
      if (!this.analyserNodes.vocals) return false;

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.micSourceNode = ctx.createMediaStreamSource(this.micStream);
      this.micSourceNode.connect(this.analyserNodes.vocals);
      this.isMicActive = true;
      return true;
    } catch (err) {
      console.error('Microphone access error:', err);
      this.isMicActive = false;
      return false;
    }
  }

  public disableMicrophone(): void {
    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch {}
      this.micSourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.isMicActive = false;
  }

  // Generate Precision Audio Buffer for Rhythmic Beat, Bass & Cadence Test Stems
  public async generateReferenceBeat(bpm: number = 120): Promise<void> {
    const ctx = await this.initialize();
    const sampleRate = ctx.sampleRate;
    const beatSec = 60 / bpm;
    const bars = 8;
    const duration = beatSec * 4 * bars;
    this.durationSec = duration;
    const length = Math.floor(sampleRate * duration);

    // 1. Drum Stem Buffer
    const drumBuf = ctx.createBuffer(2, length, sampleRate);
    const dL = drumBuf.getChannelData(0);
    const dR = drumBuf.getChannelData(1);

    // 2. Bass Stem Buffer
    const bassBuf = ctx.createBuffer(2, length, sampleRate);
    const bL = bassBuf.getChannelData(0);
    const bR = bassBuf.getChannelData(1);

    // 3. Vocal Stem Buffer
    const vocalBuf = ctx.createBuffer(2, length, sampleRate);
    const vL = vocalBuf.getChannelData(0);
    const vR = vocalBuf.getChannelData(1);

    const subBeat = beatSec / 4;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const rawSubBeat = Math.floor(t / subBeat);
      const subIndex = rawSubBeat % 16;

      // Kick Drum on downbeats
      const kickBeats = [0, 8, 14, 16, 24, 28, 32, 40, 46, 48, 56, 60];
      if (kickBeats.includes(rawSubBeat % 64)) {
        const kickT = t % subBeat;
        if (kickT >= 0) {
          const freq = Math.max(35, 140 * Math.exp(-kickT * 38));
          const env = Math.exp(-kickT * 22);
          const kickVal = Math.sin(2 * Math.PI * freq * kickT) * env * 0.9;
          dL[i] += kickVal;
          dR[i] += kickVal;
        }
      }

      // Snare on 2 and 4
      const snareBeats = [4, 12, 20, 28, 36, 44, 52, 60];
      if (snareBeats.includes(rawSubBeat % 64)) {
        const snareT = t % subBeat;
        if (snareT >= 0 && snareT < 0.2) {
          const noise = (Math.random() * 2 - 1) * Math.exp(-snareT * 25);
          const tone = Math.sin(2 * Math.PI * 180 * snareT) * Math.exp(-snareT * 35) * 0.3;
          const snareVal = noise * 0.7 + tone * 0.3;
          dL[i] += snareVal * 0.6;
          dR[i] += snareVal * 0.6;
        }
      }

      // Hi-Hat
      const hatT = t % subBeat;
      if (hatT >= 0) {
        const hatVol = subIndex % 4 === 0 ? 0.3 : subIndex % 2 === 0 ? 0.2 : 0.15;
        const hatVal = (Math.random() * 2 - 1) * Math.exp(-hatT * 80) * hatVol;
        dL[i] += hatVal;
        dR[i] += hatVal;
      }

      // 808 Sub-Bass Line
      const bassBeats = [0, 6, 12, 16, 22, 28, 32, 38, 44, 48, 54, 60];
      if (bassBeats.includes(rawSubBeat % 64)) {
        const bassT = (t % (subBeat * 2));
        if (bassT >= 0 && bassT < subBeat * 1.8) {
          const freq = 55.0 + (rawSubBeat % 4) * 12.0; // Sub-bass frequency around A1 (55Hz)
          const env = Math.exp(-bassT * 4.5);
          const val = (Math.sin(2 * Math.PI * freq * bassT) + 0.3 * Math.sin(4 * Math.PI * freq * bassT)) * env * 0.7;
          bL[i] += val;
          bR[i] += val;
        }
      }

      // Reference Vocal Rhythm
      const vocalRhythmBeats = [2, 5, 9, 11, 15, 18, 21, 26, 29, 34, 37, 42, 45, 50, 53, 58];
      if (vocalRhythmBeats.includes(rawSubBeat % 64) && !this.isMicActive) {
        const vocalT = t % subBeat;
        if (vocalT >= 0 && vocalT < subBeat * 1.2) {
          const noteFreq = 330.0 + (rawSubBeat % 5) * 40;
          const env = Math.exp(-vocalT * 16) * Math.sin(Math.PI * Math.min(1, vocalT * 40));
          const val = Math.sin(2 * Math.PI * noteFreq * vocalT) * env * 0.5;
          vL[i] += val;
          vR[i] += val;
        }
      }
    }

    this.buffers.drums = drumBuf;
    this.buffers.bass = bassBuf;
    this.buffers.vocals = vocalBuf;
  }

  // Load user custom audio files
  public async loadUserAudioFiles(files: FileList | File[]): Promise<void> {
    const ctx = await this.initialize();
    this.stopPlayback();

    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const arrayBuffer = await file.arrayBuffer();
      const decodedData = await ctx.decodeAudioData(arrayBuffer);
      const nameLower = file.name.toLowerCase();

      if (nameLower.includes('drum') || nameLower.includes('beat') || nameLower.includes('percussion') || nameLower.includes('inst')) {
        this.buffers.drums = decodedData;
      } else if (nameLower.includes('bass') || nameLower.includes('sub') || nameLower.includes('808') || nameLower.includes('low')) {
        this.buffers.bass = decodedData;
      } else if (nameLower.includes('vocal') || nameLower.includes('voice') || nameLower.includes('lead') || nameLower.includes('acapella')) {
        this.buffers.vocals = decodedData;
      } else {
        if (!this.buffers.drums) {
          this.buffers.drums = decodedData;
        } else if (!this.buffers.bass) {
          this.buffers.bass = decodedData;
        } else {
          this.buffers.vocals = decodedData;
        }
      }
    }

    const durDrums = this.buffers.drums?.duration || 0;
    const durBass = this.buffers.bass?.duration || 0;
    const durVocals = this.buffers.vocals?.duration || 0;
    this.durationSec = Math.max(durDrums, durBass, durVocals, 10.0);
  }

  public async startPlayback(offset: number = 0, bpm: number = 120): Promise<void> {
    const ctx = await this.initialize();
    if (this.isPlayingState) return;

    if (!this.buffers.drums && !this.buffers.bass && !this.buffers.vocals) {
      await this.generateReferenceBeat(bpm);
    }

    const syncTime = ctx.currentTime + 0.05;
    this.pauseOffset = offset % this.durationSec;
    this.startTime = syncTime - this.pauseOffset;

    (['drums', 'bass', 'vocals'] as const).forEach((key) => {
      // If live microphone is active for vocals, skip playback buffer for vocals
      if (key === 'vocals' && this.isMicActive) return;

      const buf = this.buffers[key];
      if (!buf) return;

      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.value = this.muteState[key] ? 0 : this.volumeState[key];

      const analyser = this.analyserNodes[key] || ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;

      source.connect(gainNode);
      gainNode.connect(analyser);

      if (this.gainNodes.master) {
        analyser.connect(this.gainNodes.master);
      }

      this.sources[key] = source;
      this.gainNodes[key] = gainNode;
      this.analyserNodes[key] = analyser;

      source.start(syncTime, this.pauseOffset);
    });

    this.isPlayingState = true;
    this.startProgressLoop();
  }

  public stopPlayback(): void {
    if (this.isPlayingState && this.ctx) {
      this.pauseOffset = (this.ctx.currentTime - this.startTime) % this.durationSec;
    }

    (['drums', 'bass', 'vocals'] as const).forEach((key) => {
      const source = this.sources[key];
      if (source) {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      }
      delete this.sources[key];
    });

    this.isPlayingState = false;
    this.stopProgressLoop();
  }

  public seek(seconds: number, bpm: number = 120): void {
    const wasPlaying = this.isPlayingState;
    if (wasPlaying) {
      this.stopPlayback();
    }
    this.pauseOffset = Math.max(0, Math.min(seconds, this.durationSec));
    if (wasPlaying) {
      this.startPlayback(this.pauseOffset, bpm);
    } else {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.pauseOffset, this.durationSec);
      }
    }
  }

  public setVolume(stem: 'drums' | 'bass' | 'vocals', value: number): void {
    this.volumeState[stem] = value;
    const gainNode = this.gainNodes[stem];
    if (gainNode && this.ctx && !this.muteState[stem]) {
      gainNode.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  public toggleMute(stem: 'drums' | 'bass' | 'vocals'): boolean {
    this.muteState[stem] = !this.muteState[stem];
    const gainNode = this.gainNodes[stem];
    if (gainNode && this.ctx) {
      const targetVal = this.muteState[stem] ? 0 : this.volumeState[stem];
      gainNode.gain.setTargetAtTime(targetVal, this.ctx.currentTime, 0.02);
    }
    return this.muteState[stem];
  }

  public getMuteState(): { drums: boolean; bass: boolean; vocals: boolean } {
    return { ...this.muteState };
  }

  public getAnalyser(stem: 'drums' | 'bass' | 'vocals'): AnalyserNode | undefined {
    return this.analyserNodes[stem];
  }

  private startProgressLoop(): void {
    const update = () => {
      if (this.isPlayingState) {
        const cur = this.getCurrentTime();
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(cur, this.durationSec);
        }
        this.animationFrameId = requestAnimationFrame(update);
      }
    };
    this.stopProgressLoop();
    this.animationFrameId = requestAnimationFrame(update);
  }

  private stopProgressLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export const globalAudioEngine = new AudioEngine();
