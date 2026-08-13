export class FluxDetector {
  private binResolution: number;
  private previousFrame: Float32Array;

  constructor(sampleRate: number = 44100, fftSize: number = 2048) {
    this.binResolution = sampleRate / fftSize;
    this.previousFrame = new Float32Array(fftSize / 2);
  }

  public getOnsetFlux(currentFrame: Uint8Array, lowFreq: number, highFreq: number): number {
    const startBin = Math.floor(lowFreq / this.binResolution);
    const endBin = Math.min(Math.ceil(highFreq / this.binResolution), currentFrame.length - 1);
    let flux = 0;

    for (let i = startBin; i <= endBin; i++) {
      const currentEnergy = currentFrame[i] / 255.0;
      const previousEnergy = this.previousFrame[i] || 0;
      const diff = currentEnergy - previousEnergy;
      if (diff > 0) {
        flux += diff;
      }
      this.previousFrame[i] = currentEnergy;
    }

    return flux;
  }
}

export class SpectralDSPAnalyzer {
  private vocalEngine: FluxDetector;
  private bassEngine: FluxDetector;
  private drumEngine: FluxDetector;
  private sampleRate: number;
  private fftSize: number;

  constructor(sampleRate: number = 44100, fftSize: number = 2048) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
    this.vocalEngine = new FluxDetector(sampleRate, fftSize);
    this.bassEngine = new FluxDetector(sampleRate, fftSize);
    this.drumEngine = new FluxDetector(sampleRate, fftSize);
  }

  public processFrame(
    vocalData: Uint8Array,
    bassData: Uint8Array,
    drumData: Uint8Array,
    sensitivity: number = 1.2
  ): { vocalFlux: number; bassFlux: number; drumFlux: number; isBeat: boolean } {
    const vocalFlux = this.vocalEngine.getOnsetFlux(vocalData, 1500, 4800) * sensitivity;
    const bassFlux = this.bassEngine.getOnsetFlux(bassData, 40, 400) * sensitivity;
    const drumFlux = this.drumEngine.getOnsetFlux(drumData, 2000, 7500) * sensitivity;
    const isBeat = drumFlux > 0.45 || bassFlux > 0.5;

    return {
      vocalFlux,
      bassFlux,
      drumFlux,
      isBeat,
    };
  }

  // Calculate 16th note subdivision index (.0, .1, .2, .3) given current timestamp and BPM
  public calculateSubdivision(currentTimeSec: number, bpm: number): 0 | 1 | 2 | 3 {
    const beatSec = 60 / bpm;
    const subBeatSec = beatSec / 4;
    const subIndex = Math.floor((currentTimeSec % beatSec) / subBeatSec) % 4;
    return (subIndex >= 0 && subIndex <= 3 ? subIndex : 0) as 0 | 1 | 2 | 3;
  }

  // Calculate micro-timing offset in milliseconds relative to closest grid subdivision
  public calculateSubdivisionOffsetMs(currentTimeSec: number, bpm: number): number {
    const beatSec = 60 / bpm;
    const subBeatSec = beatSec / 4;
    const posInSub = (currentTimeSec % subBeatSec) / subBeatSec; // 0.0 to 1.0
    // Centered around closest subdivision (-0.5 to +0.5)
    let offsetFraction = posInSub > 0.5 ? posInSub - 1.0 : posInSub;
    let offsetMs = offsetFraction * subBeatSec * 1000;
    return parseFloat(offsetMs.toFixed(1));
  }
}
