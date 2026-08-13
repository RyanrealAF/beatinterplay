import React, { useRef, useEffect } from 'react';
import { DSPFrameData } from '../types';
import { RefreshCw } from 'lucide-react';

interface SpectralCanvasProps {
  dataBuffer: DSPFrameData[];
  onClear: () => void;
  fps: number;
}

export const SpectralCanvas: React.FC<SpectralCanvasProps> = ({ dataBuffer, onClear, fps }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const centerY = h / 2;

    // 1. Clear with dark obsidian background
    ctx.fillStyle = '#08080C';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Center Zero Baseline
    ctx.strokeStyle = '#1F1F2C';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();

    // 3. Grid overlay lines
    const historyLength = Math.max(120, dataBuffer.length);
    const sliceWidth = w / historyLength;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    for (let i = 0; i < dataBuffer.length; i++) {
      const x = i * sliceWidth;
      if (dataBuffer[i].isBeat) {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }

    if (dataBuffer.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AWAITING AUDIO STREAM ANALYSIS...', w / 2, centerY + 4);
      return;
    }

    // 4. DRAW DRUM TRANSIENTS FLUX (Bottom Half - Neon Cyan)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00E5FF';
    ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < dataBuffer.length; i++) {
      const x = i * sliceWidth;
      const fluxVal = Math.min(1.2, dataBuffer[i].drumFlux);
      const y = centerY + fluxVal * h * 0.38;
      ctx.lineTo(x, y);
    }
    ctx.lineTo((dataBuffer.length - 1) * sliceWidth, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. DRAW BASS SUB-FLUX (Bottom Half - Neon Purple)
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#A855F7';
    ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < dataBuffer.length; i++) {
      const x = i * sliceWidth;
      const fluxVal = Math.min(1.2, dataBuffer[i].bassFlux);
      const y = centerY + fluxVal * h * 0.28;
      ctx.lineTo(x, y);
    }
    ctx.lineTo((dataBuffer.length - 1) * sliceWidth, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Highlight Drum Onset Peaks
    for (let i = 0; i < dataBuffer.length; i++) {
      if (dataBuffer[i].drumFlux > 0.42) {
        const x = i * sliceWidth;
        const y = centerY + Math.min(1.2, dataBuffer[i].drumFlux) * h * 0.38;
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. DRAW VOCAL CADENCE FLUX (Top Half - Coral Red)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF2A55';
    ctx.fillStyle = 'rgba(255, 42, 85, 0.08)';

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < dataBuffer.length; i++) {
      const x = i * sliceWidth;
      const fluxVal = Math.min(1.2, dataBuffer[i].vocalFlux);
      const y = centerY - fluxVal * h * 0.38;
      ctx.lineTo(x, y);
    }
    ctx.lineTo((dataBuffer.length - 1) * sliceWidth, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Highlight Vocal Onset Peaks
    for (let i = 0; i < dataBuffer.length; i++) {
      if (dataBuffer[i].vocalFlux > 0.35) {
        const x = i * sliceWidth;
        const y = centerY - Math.min(1.2, dataBuffer[i].vocalFlux) * h * 0.38;
        ctx.fillStyle = '#FF2A55';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. DRAW SYNC ALIGNMENT VECTORS (Glow connection lines)
    ctx.lineWidth = 1.2;
    for (let i = 0; i < dataBuffer.length; i++) {
      const item = dataBuffer[i];
      if (item.vocalFlux > 0.3 && (item.drumFlux > 0.3 || item.bassFlux > 0.3)) {
        const x = i * sliceWidth;
        const yVocal = centerY - item.vocalFlux * h * 0.38;
        const yDrum = centerY + Math.max(item.drumFlux, item.bassFlux) * h * 0.38;

        const grad = ctx.createLinearGradient(x, yVocal, x, yDrum);
        grad.addColorStop(0, '#FF2A55');
        grad.addColorStop(0.5, '#FFB300');
        grad.addColorStop(1, '#00E5FF');

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, yVocal);
        ctx.lineTo(x, yDrum);
        ctx.stroke();
      }
    }

    // 8. Draw Playhead Line
    const curX = (dataBuffer.length - 1) * sliceWidth;
    ctx.strokeStyle = '#FFB300';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(curX, 0);
    ctx.lineTo(curX, h);
    ctx.stroke();
  }, [dataBuffer]);

  return (
    <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 flex flex-col h-[380px] relative shadow-xl font-mono text-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 text-xs border-b border-white/10 gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#FF2A55] font-bold text-[10px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#FF2A55]" />
            VOCAL CADENCE
          </span>
          <span className="flex items-center gap-1.5 text-[#A855F7] font-bold text-[10px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
            BASS FLUX
          </span>
          <span className="flex items-center gap-1.5 text-[#00E5FF] font-bold text-[10px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
            DRUM TRANSIENTS
          </span>
          <span className="flex items-center gap-1.5 text-[#FFB300] font-bold text-[10px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#FFB300]" />
            SYNC VECTOR
          </span>
        </div>

        <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider">
          <span className="text-gray-400 font-bold">{fps} FPS SPECTRAL FLUX</span>
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-gray-400 hover:text-[#00E5FF] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            RESET VIEW
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative w-full h-full mt-2 overflow-hidden rounded bg-black/80 border border-white/10">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
