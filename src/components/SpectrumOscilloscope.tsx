import React, { useRef, useEffect } from 'react';
import { globalAudioEngine } from '../utils/audioEngine';

export const SpectrumOscilloscope: React.FC = () => {
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      // 1. Render FFT Frequency Spectrum
      const specCanvas = spectrumCanvasRef.current;
      if (specCanvas) {
        const ctx = specCanvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = specCanvas.parentElement?.getBoundingClientRect();
          if (rect) {
            specCanvas.width = rect.width * dpr;
            specCanvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            const w = rect.width;
            const h = rect.height;

            ctx.fillStyle = '#08080C';
            ctx.fillRect(0, 0, w, h);

            const vocalAnalyser = globalAudioEngine.getAnalyser('vocals');
            const bassAnalyser = globalAudioEngine.getAnalyser('bass');
            const drumAnalyser = globalAudioEngine.getAnalyser('drums');

            if (vocalAnalyser && drumAnalyser && bassAnalyser) {
              const binCount = vocalAnalyser.frequencyBinCount;
              const vocalFreq = new Uint8Array(binCount);
              const bassFreq = new Uint8Array(binCount);
              const drumFreq = new Uint8Array(binCount);

              vocalAnalyser.getByteFrequencyData(vocalFreq);
              bassAnalyser.getByteFrequencyData(bassFreq);
              drumAnalyser.getByteFrequencyData(drumFreq);

              const barWidth = (w / binCount) * 2.5;
              let x = 0;

              for (let i = 0; i < binCount; i++) {
                const drumBarH = (drumFreq[i] / 255) * h * 0.85;
                const bassBarH = (bassFreq[i] / 255) * h * 0.85;
                const vocalBarH = (vocalFreq[i] / 255) * h * 0.85;

                // Drum bars (Cyan)
                ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
                ctx.fillRect(x, h - drumBarH, barWidth, drumBarH);

                // Bass bars (Purple)
                ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
                ctx.fillRect(x, h - bassBarH, barWidth, bassBarH);

                // Vocal bars overlay (Coral Red)
                ctx.fillStyle = 'rgba(255, 42, 85, 0.5)';
                ctx.fillRect(x, h - vocalBarH, barWidth, vocalBarH);

                x += barWidth + 1;
                if (x >= w) break;
              }

              // Highlight Bass Formant Band (40-400Hz)
              ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
              ctx.lineWidth = 1;
              ctx.strokeRect(w * 0.02, 10, w * 0.15, h - 20);

              ctx.fillStyle = '#A855F7';
              ctx.font = '9px "JetBrains Mono", monospace';
              ctx.fillText('BASS (40-400Hz)', w * 0.02 + 4, 22);

              // Highlight Vocal Formant Band (1.5k-4.8kHz)
              ctx.strokeStyle = 'rgba(255, 42, 85, 0.8)';
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(w * 0.18, 10, w * 0.32, h - 20);

              ctx.fillStyle = '#FF2A55';
              ctx.fillText('VOCAL (1.5k-4.8kHz)', w * 0.18 + 4, 22);

              // Highlight Drum Transient Band (2.0k-7.5kHz)
              ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
              ctx.strokeRect(w * 0.22, 10, w * 0.45, h - 20);
              ctx.setLineDash([]);

              ctx.fillStyle = '#00E5FF';
              ctx.fillText('DRUM (2k-7.5kHz)', w * 0.22 + 4, 34);
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
              ctx.font = '12px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText('START PLAYBACK FOR LIVE FFT SPECTRUM', w / 2, h / 2);
            }
          }
        }
      }

      // 2. Render Oscilloscope
      const scopeCanvas = scopeCanvasRef.current;
      if (scopeCanvas) {
        const ctx = scopeCanvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = scopeCanvas.parentElement?.getBoundingClientRect();
          if (rect) {
            scopeCanvas.width = rect.width * dpr;
            scopeCanvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            const w = rect.width;
            const h = rect.height;
            const midY = h / 2;

            ctx.fillStyle = '#08080C';
            ctx.fillRect(0, 0, w, h);

            const vocalAnalyser = globalAudioEngine.getAnalyser('vocals');
            const bassAnalyser = globalAudioEngine.getAnalyser('bass');
            const drumAnalyser = globalAudioEngine.getAnalyser('drums');

            if (vocalAnalyser && drumAnalyser && bassAnalyser) {
              const binCount = vocalAnalyser.fftSize;
              const vocalTime = new Uint8Array(binCount);
              const bassTime = new Uint8Array(binCount);
              const drumTime = new Uint8Array(binCount);

              vocalAnalyser.getByteTimeDomainData(vocalTime);
              bassAnalyser.getByteTimeDomainData(bassTime);
              drumAnalyser.getByteTimeDomainData(drumTime);

              const sliceW = w / binCount;

              // Draw Drum Waveform (Cyan)
              ctx.lineWidth = 1.2;
              ctx.strokeStyle = '#00E5FF';
              ctx.beginPath();
              let x = 0;
              for (let i = 0; i < binCount; i++) {
                const v = drumTime[i] / 128.0;
                const y = (v * h) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceW;
              }
              ctx.stroke();

              // Draw Bass Waveform (Purple)
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = '#A855F7';
              ctx.beginPath();
              x = 0;
              for (let i = 0; i < binCount; i++) {
                const v = bassTime[i] / 128.0;
                const y = (v * h) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceW;
              }
              ctx.stroke();

              // Draw Vocal Waveform (Coral Red)
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = '#FF2A55';
              ctx.beginPath();
              x = 0;
              for (let i = 0; i < binCount; i++) {
                const v = vocalTime[i] / 128.0;
                const y = (v * h) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceW;
              }
              ctx.stroke();
            } else {
              ctx.strokeStyle = '#1F1F2C';
              ctx.beginPath();
              ctx.moveTo(0, midY);
              ctx.lineTo(w, midY);
              ctx.stroke();

              ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
              ctx.font = '12px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText('LIVE TRIPLE OSCILLOSCOPE DISCONNECTED', w / 2, midY + 4);
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
      {/* Spectrum */}
      <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 flex flex-col h-[340px] shadow-xl">
        <div className="pb-2.5 border-b border-white/10 flex justify-between items-center text-gray-200">
          <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full" />
            3-INPUT FFT FREQUENCY SPECTRUM
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">0 Hz - 22.05 kHz</span>
        </div>
        <div className="flex-1 mt-2 relative overflow-hidden rounded bg-black/80 border border-white/10">
          <canvas ref={spectrumCanvasRef} className="w-full h-full block" />
        </div>
      </div>

      {/* Scope */}
      <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 flex flex-col h-[340px] shadow-xl">
        <div className="pb-2.5 border-b border-white/10 flex justify-between items-center text-gray-200">
          <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF2A55] rounded-full" />
            TRIPLE-CHANNEL OSCILLOSCOPE
          </span>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
            <span className="text-[#FF2A55]">VOCAL</span>
            <span className="text-[#A855F7]">BASS</span>
            <span className="text-[#00E5FF]">DRUMS</span>
          </div>
        </div>
        <div className="flex-1 mt-2 relative overflow-hidden rounded bg-black/80 border border-white/10">
          <canvas ref={scopeCanvasRef} className="w-full h-full block" />
        </div>
      </div>
    </div>
  );
};
