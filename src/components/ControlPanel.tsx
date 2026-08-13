import React from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { AudioTrack } from '../types';

interface ControlPanelProps {
  selectedTrack: AudioTrack;
  onSelectTrack: (track: AudioTrack) => void;
  onFileUpload: (files: FileList) => void;
  vocalVolume: number;
  bassVolume: number;
  drumVolume: number;
  onVocalVolChange: (val: number) => void;
  onBassVolChange: (val: number) => void;
  onDrumVolChange: (val: number) => void;
  vocalMuted: boolean;
  bassMuted: boolean;
  drumMuted: boolean;
  onToggleVocalMute: () => void;
  onToggleBassMute: () => void;
  onToggleDrumMute: () => void;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
  syncScore: number;
  avgDriftMs: number;
  bpm: number;
  onBpmChange: (newBpm: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedTrack,
  onSelectTrack,
  onFileUpload,
  vocalVolume,
  bassVolume,
  drumVolume,
  onVocalVolChange,
  onBassVolChange,
  onDrumVolChange,
  vocalMuted,
  bassMuted,
  drumMuted,
  onToggleVocalMute,
  onToggleBassMute,
  onToggleDrumMute,
  sensitivity,
  onSensitivityChange,
  syncScore,
  avgDriftMs,
  bpm,
  onBpmChange,
}) => {
  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Engine Controls Card */}
      <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 space-y-4 shadow-xl">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-[#00E5FF] border-b border-white/10 pb-2.5 flex items-center justify-between uppercase">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full" />
            DSP ENGINE CONTROLS
          </span>
          <span className="text-[10px] text-gray-400 font-normal">3-INPUT AUDIO</span>
        </h2>

        {/* Dynamic BPM Control */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
            <span className="text-[#00E5FF] font-bold">TEMPO (BPM)</span>
            <span className="text-white font-bold text-xs">{bpm} BPM</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="60"
              max="200"
              step="1"
              value={bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
              className="flex-1 accent-[#00E5FF] bg-gray-800 rounded h-1.5 cursor-pointer"
            />
            <input
              type="number"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => onBpmChange(Math.max(60, Math.min(200, parseInt(e.target.value, 10) || 120)))}
              className="w-14 bg-black border border-white/10 rounded px-1.5 py-0.5 text-center text-white text-[11px] font-bold outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>

        {/* Custom Audio File Upload */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <label className="text-[10px] text-gray-400 flex items-center justify-between uppercase tracking-wider">
            <span>CUSTOM AUDIO STEMS</span>
            <span className="text-[9px] text-gray-500">.WAV, .MP3, .FLAC</span>
          </label>

          <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-[#00E5FF] bg-black/40 hover:bg-black/60 px-3 py-2.5 rounded cursor-pointer text-[11px] transition-all text-gray-300 uppercase tracking-wider">
            <Upload className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="truncate">Upload Stem Files</span>
            <input
              type="file"
              multiple
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onFileUpload(e.target.files);
                }
              }}
            />
          </label>
        </div>

        {/* Flux Sensitivity Slider */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
            <span className="text-[#00E5FF]">FLUX SENSITIVITY</span>
            <span className="text-[#00E5FF] font-bold">{sensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={sensitivity}
            onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
            className="w-full accent-[#00E5FF] bg-gray-800 rounded h-1.5 cursor-pointer"
          />
        </div>


      </div>

      {/* Synchronicity Card */}
      <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 space-y-2 shadow-xl">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
          <span>POCKET SYNCHRONICITY</span>
          <Sparkles className="w-3.5 h-3.5 text-[#FFB300]" />
        </h3>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-[#FFB300] tracking-tight">{syncScore.toFixed(1)}%</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            AVG DRIFT: <span className="text-white font-bold">{avgDriftMs > 0 ? `+${avgDriftMs}` : avgDriftMs} ms</span>
          </span>
        </div>
        <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-[#FF2A55] via-[#FFB300] to-[#00E5FF] h-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, syncScore))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
