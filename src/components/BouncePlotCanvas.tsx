import React, { useRef, useEffect } from 'react';
import { DSPFrameData } from '../types';

interface BouncePlotCanvasProps {
  dataBuffer: DSPFrameData[];
  bpm: number;
}

export const BouncePlotCanvas: React.FC<BouncePlotCanvasProps> = ({ dataBuffer }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const midY = h / 2;

    // Background
    ctx.fillStyle = '#08080C';
    ctx.fillRect(0, 0, w, h);

    // Draw Offset Axis Lines (-15ms, 0ms, +15ms)
    ctx.strokeStyle = '#1C1810';
    ctx.lineWidth = 1;

    // +15ms line
    ctx.beginPath();
    ctx.moveTo(0, midY - h * 0.35);
    ctx.lineTo(w, midY - h * 0.35);
    ctx.stroke();

    ctx.fillStyle = 'rgba(232, 163, 61, 0.4)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('+15 ms (PUSHING / AHEAD)', 10, midY - h * 0.35 - 4);

    // 0ms line
    ctx.strokeStyle = '#2C2519';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(244, 228, 193, 0.6)';
    ctx.fillText('0.0 ms ON-GRID SNAP', 10, midY - 4);

    // -15ms line
    ctx.strokeStyle = '#1C1810';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY + h * 0.35);
    ctx.lineTo(w, midY + h * 0.35);
    ctx.stroke();

    ctx.fillStyle = 'rgba(201, 123, 74, 0.4)';
    ctx.fillText('-15 ms (LAID BACK / BEHIND)', 10, midY + h * 0.35 + 12);

    if (dataBuffer.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AWAITING ONSET TIMING TELEMETRY...', w / 2, midY + 4);
      return;
    }

    const historyLength = Math.max(100, dataBuffer.length);
    const sliceWidth = w / historyLength;

    // Draw bounce plot points & stems
    for (let i = 0; i < dataBuffer.length; i++) {
      const item = dataBuffer[i];
      if (item.vocalFlux > 0.25) {
        const x = i * sliceWidth;
        // Map offsetMs (-20ms to +20ms) to canvas Y
        const offsetMs = item.offsetMs || 0;
        const normalizedOffset = Math.max(-20, Math.min(20, offsetMs)) / 20;
        const y = midY - normalizedOffset * h * 0.38;

        let col = '#f4e4c1'; // On-Grid
        if (offsetMs > 3.0) col = '#e8a33d'; // Ahead
        if (offsetMs < -3.0) col = '#c97b4a'; // Behind

        // Draw vertical stem to zero baseline
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, midY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw node point
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glow ring for significant offset
        if (Math.abs(offsetMs) > 8) {
          ctx.strokeStyle = col;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Playhead line
    const curX = (dataBuffer.length - 1) * sliceWidth;
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(curX, 0);
    ctx.lineTo(curX, h);
    ctx.stroke();
  }, [dataBuffer]);

  return (
    <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 flex flex-col h-[380px] relative shadow-xl font-mono text-xs">
      <div className="flex items-center justify-between pb-3 text-xs border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-[0.12em] text-white uppercase text-[11px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full" />
            MICRO-TIMING BOUNCE PLOT
          </span>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            Y-Axis: Offset Deviation (+/- ms)
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">16TH-NOTE SUBDIVISION SNAP</span>
      </div>

      <div className="flex-1 relative w-full h-full mt-2 overflow-hidden rounded bg-black/80 border border-white/10">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
