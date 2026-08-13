import React from 'react';
import { TelemetryMetrics } from '../types';

interface TelemetryStatsProps {
  metrics: TelemetryMetrics;
  bpm: number;
}

export const TelemetryStats: React.FC<TelemetryStatsProps> = ({ metrics, bpm }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
      <div className="bg-[#0d0d10] border border-white/10 p-3 rounded-lg flex flex-col justify-between shadow-lg space-y-1">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">VOCAL FLUX PEAK</span>
        <p className="text-xl font-bold text-[#FF2A55] tracking-tight">{metrics.vocalPeak.toFixed(2)}</p>
      </div>

      <div className="bg-[#0d0d10] border border-white/10 p-3 rounded-lg flex flex-col justify-between shadow-lg space-y-1">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">BASS FLUX PEAK</span>
        <p className="text-xl font-bold text-[#A855F7] tracking-tight">{metrics.bassPeak.toFixed(2)}</p>
      </div>

      <div className="bg-[#0d0d10] border border-white/10 p-3 rounded-lg flex flex-col justify-between shadow-lg space-y-1">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">DRUM FLUX PEAK</span>
        <p className="text-xl font-bold text-[#00E5FF] tracking-tight">{metrics.drumPeak.toFixed(2)}</p>
      </div>

      <div className="bg-[#0d0d10] border border-white/10 p-3 rounded-lg flex flex-col justify-between shadow-lg space-y-1">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">INSTANT DRIFT</span>
        <p className="text-xl font-bold text-[#FFB300] tracking-tight">
          {metrics.instantDriftMs > 0 ? `+${metrics.instantDriftMs}` : metrics.instantDriftMs} <span className="text-xs font-normal">ms</span>
        </p>
      </div>

      <div className="bg-[#0d0d10] border border-white/10 p-3 rounded-lg flex flex-col justify-between shadow-lg space-y-1">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">GROOVE STATE</span>
        <p className="text-[11px] font-bold text-[#00E5FF] truncate mt-1 tracking-wider uppercase">{metrics.grooveType}</p>
      </div>

      <div className="bg-[#0d0d10] border border-white/10 p-3 rounded-lg flex flex-col justify-between shadow-lg space-y-1">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">DSP ENGINE RATE</span>
        <p className="text-xl font-bold text-gray-200 tracking-tight">{metrics.fps} <span className="text-xs font-normal text-gray-500">FPS</span></p>
      </div>
    </div>
  );
};
