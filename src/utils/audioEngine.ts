import { WordTiming } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private buffers: { drums?: AudioBuffer; bass?: AudioBuffer; vocals?: AudioBuffer } = {};
  private sources: { drums?: AudioBufferSourceNode; bass?: AudioBufferSourceNode; vocals?: AudioBufferSourceNode } = {};
  private gainNodes: { drums?: GainNode; bass?: GainNode; vocals?: GainNode; master?: GainNode } = {};
  private analyserNodes: { drums?: AnalyserNode; bass?: AnalyserNode; vocals?: AnalyserNode } = {};
  private muteState = { drums: false, bass: false, vocals: false };
  private volumeState = { drums: 0.9, bass: 0.9, vocals: 0.95, master: 1.0 };

  private isPlayingState = false;
  private startTime = 0;
  private pauseOffset = 0;
  private durationSec = 16.0;

  private onTimeUpdateCallback?: (timeSec: number, durationSec: number) => void;
  private animationFrameId: number | null = null;

  public async initialize(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume deferred to user interaction:', err);
      }
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

  public getCurrentTime(): number {
    if (!this.isPlayingState || !this.ctx) return this.pauseOffset;
    return (this.ctx.currentTime - this.startTime) % this.durationSec;
  }

  public getDuration(): number {
    return this.durationSec;
  }

  // Generate Precision Audio Buffer for Rhythmic Beat, Bass & Cadence Test Stems
  public async generateReferenceBeat(
    bpm: number = 88,
    words?: WordTiming[],
    beatGrid?: number[],
    downbeats?: number[]
  ): Promise<void> {
    const ctx = await this.initialize();
    const sampleRate = ctx.sampleRate || 44100;
    const beatSec = 60 / bpm;

    // Determine total length
    let duration = (60 / bpm) * 4 * 8; // default 8 bars (~21.8 sec at 88 BPM)
    if (words && words.length > 0) {
      const maxWordEnd = Math.max(...words.map((w) => w.end));
      duration = Math.max(duration, Math.ceil(maxWordEnd + 2.0));
    }
    if (beatGrid && beatGrid.length > 0) {
      const maxBeat = Math.max(...beatGrid);
      duration = Math.max(duration, Math.ceil(maxBeat + 2.0));
    }

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

    const subBeat = beatSec / 4; // 16th note duration

    // Synthesize Drums & Bass Stems
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const rawSubBeat = Math.floor(t / subBeat);
      const subIndex = rawSubBeat % 16;
      const barSubIndex = rawSubBeat % 64;

      // --- KICK DRUM ---
      let isKick = false;
      if (downbeats && downbeats.length > 0) {
        isKick = downbeats.some((db) => Math.abs(t - db) < 0.05);
      } else {
        const kickBeats = [0, 8, 14, 16, 24, 28, 32, 40, 46, 48, 56, 60];
        isKick = kickBeats.includes(barSubIndex);
      }
      // Additional syncopated kick hits for hip-hop bounce
      if ([0, 10, 16, 26, 32, 42, 48, 58].includes(barSubIndex)) {
        isKick = true;
      }

      if (isKick) {
        const kickT = t % subBeat;
        if (kickT >= 0 && kickT < 0.28) {
          const freq = Math.max(42, 160 * Math.exp(-kickT * 40));
          const env = Math.exp(-kickT * 18);
          const click = kickT < 0.008 ? (Math.random() * 2 - 1) * 0.4 : 0;
          const kickVal = (Math.sin(2 * Math.PI * freq * kickT) + click) * env * 0.95;
          dL[i] += kickVal;
          dR[i] += kickVal;
        }
      }

      // --- SNARE & CLAP on beats 2 & 4 (16th indices 4, 12, 20, 28, 36, 44, 52, 60) ---
      const snareBeats = [4, 12, 20, 28, 36, 44, 52, 60];
      if (snareBeats.includes(barSubIndex)) {
        const snareT = t % subBeat;
        if (snareT >= 0 && snareT < 0.24) {
          const noise = (Math.random() * 2 - 1) * Math.exp(-snareT * 28);
          const tone = Math.sin(2 * Math.PI * 195 * snareT) * Math.exp(-snareT * 38) * 0.45;
          const snareVal = (noise * 0.75 + tone) * 0.75;
          dL[i] += snareVal;
          dR[i] += snareVal;
        }
      }

      // --- HI-HATS (Crisp 16th note pattern with velocity dynamics) ---
      const hatT = t % subBeat;
      if (hatT >= 0 && hatT < 0.07) {
        const hatVol = subIndex % 4 === 0 ? 0.35 : subIndex % 2 === 0 ? 0.25 : 0.18;
        const hatVal = (Math.random() * 2 - 1) * Math.exp(-hatT * 90) * hatVol;
        dL[i] += hatVal * 0.85;
        dR[i] += hatVal * 0.85;
      }

      // --- 808 SUB-BASS ---
      const bassBeats = [0, 6, 10, 16, 22, 26, 32, 38, 42, 48, 54, 58];
      if (bassBeats.includes(barSubIndex)) {
        const bassT = t % (subBeat * 2);
        if (bassT >= 0 && bassT < subBeat * 1.85) {
          const rootNote = 48.0 + (Math.floor(barSubIndex / 16) % 3) * 5; // Sub bass frequencies (~48-58Hz)
          const env = Math.exp(-bassT * 3.5);
          // Fundamental + 2nd harmonic + 3rd harmonic saturation for punch
          const f0 = Math.sin(2 * Math.PI * rootNote * bassT);
          const f1 = Math.sin(2 * Math.PI * (rootNote * 2) * bassT) * 0.35;
          const f2 = Math.sin(2 * Math.PI * (rootNote * 3) * bassT) * 0.15;
          const bassVal = Math.tanh((f0 + f1 + f2) * 1.2) * env * 0.85;
          bL[i] += bassVal;
          bR[i] += bassVal;
        }
      }
    }

    // Synthesize Vocal Stem (Word-level rap cadence speech synthesis)
    if (words && words.length > 0) {
      words.forEach((word) => {
        const wordStartSec = word.start;
        const wordEndSec = word.end;
        const wordDur = Math.max(0.1, wordEndSec - wordStartSec);
        const startSample = Math.max(0, Math.floor(wordStartSec * sampleRate));
        const totalWordSamples = Math.floor(wordDur * sampleRate);

        // Word phonetic analysis for formant frequencies
        const text = word.text.toLowerCase();
        let f1 = 500;
        let f2 = 1500;
        let f3 = 2500;

        if (text.includes('ee') || text.includes('me') || text.includes('free')) {
          f1 = 280; f2 = 2250; f3 = 3000;
        } else if (text.includes('oo') || text.includes('do') || text.includes('booth') || text.includes('you')) {
          f1 = 320; f2 = 850; f3 = 2200;
        } else if (text.includes('a') || text.includes('rap') || text.includes('map') || text.includes('can')) {
          f1 = 700; f2 = 1600; f3 = 2450;
        } else if (text.includes('i') || text.includes('rhythm') || text.includes('grid') || text.includes('did')) {
          f1 = 400; f2 = 1900; f3 = 2600;
        } else if (text.includes('o') || text.includes('flow') || text.includes('told')) {
          f1 = 500; f2 = 1000; f3 = 2300;
        }

        const basePitch = word.stressed ? 145 : 125;
        const amplitude = word.stressed ? 0.95 : 0.72;

        for (let j = 0; j < totalWordSamples && startSample + j < length; j++) {
          const idx = startSample + j;
          const wt = j / sampleRate;
          const prog = wt / wordDur;

          // Vocal envelope with snappy onset and smooth release
          let env = 0;
          if (prog < 0.15) {
            env = prog / 0.15;
          } else if (prog < 0.8) {
            env = 1.0 - (prog - 0.15) * 0.15;
          } else {
            env = (1.0 - (prog - 0.8) / 0.2) * 0.85;
          }
          env = Math.max(0, Math.min(1, env));

          // Consonant noise burst (plosives/fricatives for 't', 'k', 'p', 's', 'ch')
          let consonantBurst = 0;
          if (prog < 0.12) {
            const hasPlosive = /[tkpbdgsc]/.test(text[0] || '');
            const noiseIntensity = hasPlosive ? 0.45 : 0.2;
            consonantBurst = (Math.random() * 2 - 1) * Math.exp(-prog * 35) * noiseIntensity;
          }

          // Dynamic pitch contour with subtle vibrato/inflection
          const pitchInflection = word.stressed ? Math.sin(prog * Math.PI) * 12 : 0;
          const currentPitch = basePitch + pitchInflection;

          // Voiced glottal pulse approximation
          const glottal = Math.sin(2 * Math.PI * currentPitch * wt) +
                          0.5 * Math.sin(2 * Math.PI * (currentPitch * 2) * wt) +
                          0.25 * Math.sin(2 * Math.PI * (currentPitch * 3) * wt);

          // Formant resonance filtering
          const form1 = Math.sin(2 * Math.PI * f1 * wt) * 0.45;
          const form2 = Math.sin(2 * Math.PI * f2 * wt) * 0.3;
          const form3 = Math.sin(2 * Math.PI * f3 * wt) * 0.15;

          const vocalSample = (glottal * 0.6 + form1 + form2 + form3 + consonantBurst) * env * amplitude;
          vL[idx] += vocalSample;
          vR[idx] += vocalSample;
        }
      });
    }

    this.buffers.drums = drumBuf;
    this.buffers.bass = bassBuf;
    this.buffers.vocals = vocalBuf;
  }

  public async startPlayback(
    offset: number = 0,
    bpm: number = 88,
    words?: WordTiming[],
    beatGrid?: number[],
    downbeats?: number[]
  ): Promise<void> {
    const ctx = await this.initialize();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (this.isPlayingState) {
      this.stopPlayback();
    }

    // Ensure audio buffers exist
    if (!this.buffers.drums || !this.buffers.bass || !this.buffers.vocals) {
      await this.generateReferenceBeat(bpm, words, beatGrid, downbeats);
    }

    const syncTime = ctx.currentTime + 0.05;
    this.pauseOffset = offset % this.durationSec;
    this.startTime = syncTime - this.pauseOffset;

    (['drums', 'bass', 'vocals'] as const).forEach((key) => {
      const buf = this.buffers[key];
      if (!buf) return;

      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.loopEnd = this.durationSec;

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

  public seek(
    seconds: number,
    bpm: number = 88,
    words?: WordTiming[],
    beatGrid?: number[],
    downbeats?: number[]
  ): void {
    const wasPlaying = this.isPlayingState;
    if (wasPlaying) {
      this.stopPlayback();
    }
    this.pauseOffset = Math.max(0, Math.min(seconds, this.durationSec));
    if (wasPlaying) {
      this.startPlayback(this.pauseOffset, bpm, words, beatGrid, downbeats);
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
