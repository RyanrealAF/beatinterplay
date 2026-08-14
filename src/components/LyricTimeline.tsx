import React from 'react';
import { LyricItem, WordTiming } from '../types';
import { Clock, Zap } from 'lucide-react';

interface LyricTimelineProps {
  lyrics: LyricItem[];
  currentTime: number;
  duration?: number;
  bpm?: number;
  onSeek: (timeSec: number) => void;
}

export const LyricTimeline: React.FC<LyricTimelineProps> = ({
  lyrics,
  currentTime,
  onSeek,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`;
  };

  // Find active line
  let activeId: string | null = null;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].timestamp <= currentTime + 0.15) {
      activeId = lyrics[i].id;
    } else {
      break;
    }
  }

  // Count total words and stressed count for header badge
  let totalWordsCount = 0;
  let totalStressedCount = 0;
  lyrics.forEach((item) => {
    if (item.words) {
      totalWordsCount += item.words.length;
      totalStressedCount += item.words.filter((w) => w.stressed).length;
    }
  });

  return (
    <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 flex flex-col h-full font-mono text-xs shadow-xl space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-200 tracking-[0.12em] text-[11px] uppercase flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00E5FF]" />
            LYRIC & MICRO-SYNC TIMELINE
          </span>
        </div>
        {totalWordsCount > 0 && (
          <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 font-bold">
            {totalWordsCount} WORDS • {totalStressedCount} STRESSED
          </span>
        )}
      </div>

      {/* Lyric List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[460px]">
        {lyrics.map((item) => {
          const isActive = activeId === item.id;

          if (item.type === 'cue') {
            return (
              <div
                key={item.id}
                onClick={() => onSeek(item.timestamp)}
                className="cursor-pointer text-center py-1.5 bg-transparent border-b border-white/10 text-gray-500 hover:text-[#00E5FF] transition-colors text-[9px] tracking-widest uppercase font-bold"
              >
                — {item.text} —
              </div>
            );
          }

          const badgeClass =
            item.pocket === 'on'
              ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30'
              : item.pocket === 'ahead' || item.pocket === 'pushing'
              ? 'bg-[#FFB300]/10 text-[#FFB300] border-[#FFB300]/30'
              : 'bg-[#FF2A55]/10 text-[#FF2A55] border-[#FF2A55]/30';

          return (
            <div
              key={item.id}
              onClick={() => onSeek(item.timestamp)}
              className={`p-2.5 rounded border transition-all cursor-pointer flex flex-col gap-2 ${
                isActive
                  ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-sm'
                  : 'bg-black/50 border-white/10 hover:border-gray-700 hover:bg-black/70'
              }`}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] text-[#00E5FF] font-bold min-w-[45px] font-mono">
                    {formatTime(item.timestamp)}
                  </span>
                  {item.line_id && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 uppercase">
                      L{item.line_id}
                    </span>
                  )}
                  {!item.words && (
                    <div
                      className="text-gray-200 text-xs font-sans truncate"
                      dangerouslySetInnerHTML={{ __html: item.text }}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}
                  >
                    {item.pocket} ({item.offsetMs > 0 ? `+${item.offsetMs}` : item.offsetMs}ms)
                  </span>
                </div>
              </div>

              {/* Word-level chip layout when words array exists */}
              {item.words && item.words.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {item.words.map((w: WordTiming, wIdx: number) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end;
                    return (
                      <span
                        key={wIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeek(w.start);
                        }}
                        className={`text-[10px] px-2 py-1 rounded transition-all flex items-center gap-1.5 select-none ${
                          isWordActive
                            ? 'bg-[#00E5FF] text-black font-bold shadow-md shadow-[#00E5FF]/40 scale-105'
                            : w.stressed
                            ? 'bg-[#FF2A55]/20 text-white border border-[#FF2A55]/50 font-bold'
                            : 'bg-black/60 text-gray-300 border border-white/10 hover:border-gray-500'
                        }`}
                      >
                        {w.stressed && !isWordActive && (
                          <Zap className="w-2.5 h-2.5 text-[#FF2A55]" />
                        )}
                        <span>{w.text}</span>
                        <span
                          className={`text-[8px] font-mono px-1 rounded ${
                            isWordActive
                              ? 'bg-black/20 text-black'
                              : w.micro_ms > 0
                              ? 'text-amber-400 bg-amber-950/40'
                              : 'text-cyan-400 bg-cyan-950/40'
                          }`}
                        >
                          {w.micro_ms > 0 ? `+${w.micro_ms.toFixed(0)}` : w.micro_ms.toFixed(0)}ms
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
