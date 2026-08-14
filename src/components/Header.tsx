import React from 'react';
import { Activity, Play, Pause, Download, Sparkles, Sliders, Waves, BarChart2, LayoutDashboard, Target } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  isPlaying: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onTogglePlay: () => void;
  syncScore: number;
  instantDriftMs: number;
  grooveType: string;
  onOpenExport: () => void;
  onOpenAiAnalysis: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  viewMode,
  setViewMode,
  onTogglePlay,
  syncScore,
  instantDriftMs,
  grooveType,
  onOpenExport,
  onOpenAiAnalysis,
}) => {
  return (
    <header className="border-b border-white/10 bg-[#0d0d10]/95 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 border border-[#00E5FF]/40 bg-[#00E5FF]/5 rounded-lg flex items-center justify-center text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.15)]">
          <Activity className="w-5 h-5 animate-pulse text-[#00E5FF]" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-[0.18em] text-white uppercase flex items-center gap-2">
            CADENCE & BEAT INTERPLAY
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 tracking-widest">
              DSP v2.4
            </span>
          </h1>
          <p className="text-[10px] text-gray-400 tracking-wider uppercase">Micro-Timing & Vocal Flow Analysis Engine</p>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="flex items-center bg-black/80 p-1 rounded-lg border border-white/10 gap-1 overflow-x-auto">
        <button
          onClick={() => setViewMode('spectral')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[10px] font-bold tracking-wider uppercase ${
            viewMode === 'spectral'
              ? 'bg-[#00E5FF] text-black shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          SPECTRAL FLUX
        </button>

        <button
          onClick={() => setViewMode('bounce')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[10px] font-bold tracking-wider uppercase ${
            viewMode === 'bounce'
              ? 'bg-[#00E5FF] text-black shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          BOUNCE PLOT
        </button>

        <button
          onClick={() => setViewMode('spectrum-scope')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[10px] font-bold tracking-wider uppercase ${
            viewMode === 'spectrum-scope'
              ? 'bg-[#00E5FF] text-black shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          FFT & SCOPE
        </button>

        <button
          onClick={() => setViewMode('syncopation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[10px] font-bold tracking-wider uppercase ${
            viewMode === 'syncopation'
              ? 'bg-[#00E5FF] text-black shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          SYNCOPATION MAP
        </button>

        <button
          onClick={() => setViewMode('full-dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[10px] font-bold tracking-wider uppercase ${
            viewMode === 'full-dashboard'
              ? 'bg-[#00E5FF] text-black shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          FULL DASHBOARD
        </button>
      </div>

      {/* Sync Status Badge & Action Buttons */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 bg-[#040406] border border-white/10 px-3 py-1.5 rounded">
          <span className="text-gray-500 text-[9px] uppercase tracking-wider">POCKET:</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFB300]/15 text-[#FFB300] border border-[#FFB300]/40 tracking-wider">
            {grooveType.toUpperCase()} ({instantDriftMs > 0 ? `+${instantDriftMs}` : instantDriftMs} ms)
          </span>
        </div>

        <button
          onClick={onOpenAiAnalysis}
          className="flex items-center gap-1.5 text-[10px] bg-[#FF2A55]/10 hover:bg-[#FF2A55]/20 text-[#FF2A55] border border-[#FF2A55]/40 px-3 py-1.5 rounded transition-all font-bold tracking-wider uppercase"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI FLOW ADVISOR
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 text-gray-200 px-3 py-1.5 rounded transition-all border border-white/10 font-bold tracking-wider uppercase"
        >
          <Download className="w-3.5 h-3.5" />
          EXPORT
        </button>

        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase px-4 py-2 rounded transition-all border ${
            isPlaying
              ? 'bg-[#FF2A55] text-white border-[#FF2A55] shadow-[0_0_15px_rgba(255,42,85,0.3)] hover:bg-[#e02048]'
              : 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:bg-[#00c4dc]'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              PAUSE DSP
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              START DSP ENGINE
            </>
          )}
        </button>
      </div>
    </header>
  );
};
