import React from 'react';
import { Sparkles, Music2, Volume2, VolumeX } from 'lucide-react';
import { AudioTrack } from '../types';
import { DEFAULT_AUDIO_TRACKS } from '../data/presetTracks';

interface ControlPanelProps {
  selectedTrack: AudioTrack;
  onSelectTrack: (track: AudioTrack) => void;
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
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedTrack,
  onSelectTrack,
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
          <span className="text-[10px] text-gray-400 font-normal">88 BPM DEDICATED</span>
        </h2>

        {/* Provided Audio Track Switcher */}
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 flex items-center justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-[#00E5FF]" />
              PROVIDED AUDIO FILES
            </span>
            <span className="text-[9px] text-[#00E5FF] font-bold">{bpm} BPM</span>
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {DEFAULT_AUDIO_TRACKS.map((t) => {
              const isSelected = selectedTrack.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTrack(t)}
                  className={`text-left p-2 rounded border transition-all text-[11px] ${
                    isSelected
                      ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-white shadow-sm'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">{t.name}</span>
                    {isSelected && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00E5FF] text-black font-bold uppercase tracking-wider">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5 truncate">{t.genre}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Channel Stem Volume & Mute Mixer */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex justify-between items-center">
            <span>3-CHANNEL DSP MIXER</span>
            <span className="text-[9px] text-gray-500">STEM BUS</span>
          </div>

          {/* Vocals Bus */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                VOCALS (CADENCE)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleVocalMute}
                  className={`p-1 rounded transition-colors ${
                    vocalMuted ? 'text-[#FF2A55] bg-[#FF2A55]/10' : 'text-gray-400 hover:text-white'
                  }`}
                  title={vocalMuted ? 'Unmute Vocals' : 'Mute Vocals'}
                >
                  {vocalMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <span className="text-[10px] text-gray-400 w-8 text-right font-bold">
                  {vocalMuted ? 'MUTE' : `${Math.round(vocalVolume * 100)}%`}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vocalMuted ? 0 : vocalVolume}
              onChange={(e) => onVocalVolChange(parseFloat(e.target.value))}
              disabled={vocalMuted}
              className="w-full accent-[#00E5FF] bg-gray-800 rounded h-1 cursor-pointer disabled:opacity-40"
            />
          </div>

          {/* Bass Bus */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF2A55]" />
                BASS (808 SUB)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleBassMute}
                  className={`p-1 rounded transition-colors ${
                    bassMuted ? 'text-[#FF2A55] bg-[#FF2A55]/10' : 'text-gray-400 hover:text-white'
                  }`}
                  title={bassMuted ? 'Unmute Bass' : 'Mute Bass'}
                >
                  {bassMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <span className="text-[10px] text-gray-400 w-8 text-right font-bold">
                  {bassMuted ? 'MUTE' : `${Math.round(bassVolume * 100)}%`}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bassMuted ? 0 : bassVolume}
              onChange={(e) => onBassVolChange(parseFloat(e.target.value))}
              disabled={bassMuted}
              className="w-full accent-[#FF2A55] bg-gray-800 rounded h-1 cursor-pointer disabled:opacity-40"
            />
          </div>

          {/* Drums Bus */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FFB300]" />
                DRUMS (BEAT & TRANSIENTS)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleDrumMute}
                  className={`p-1 rounded transition-colors ${
                    drumMuted ? 'text-[#FF2A55] bg-[#FF2A55]/10' : 'text-gray-400 hover:text-white'
                  }`}
                  title={drumMuted ? 'Unmute Drums' : 'Mute Drums'}
                >
                  {drumMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <span className="text-[10px] text-gray-400 w-8 text-right font-bold">
                  {drumMuted ? 'MUTE' : `${Math.round(drumVolume * 100)}%`}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={drumMuted ? 0 : drumVolume}
              onChange={(e) => onDrumVolChange(parseFloat(e.target.value))}
              disabled={drumMuted}
              className="w-full accent-[#FFB300] bg-gray-800 rounded h-1 cursor-pointer disabled:opacity-40"
            />
          </div>
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
