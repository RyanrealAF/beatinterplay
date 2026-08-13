import React, { useState } from 'react';
import { LyricItem } from '../types';
import { Clock, Plus, Trash2, Edit3, Check, FileText } from 'lucide-react';
import { BulkLyricsModal } from './BulkLyricsModal';

interface LyricTimelineProps {
  lyrics: LyricItem[];
  currentTime: number;
  duration?: number;
  bpm?: number;
  onSeek: (timeSec: number) => void;
  onAddLyric: (item: LyricItem) => void;
  onDeleteLyric: (id: string) => void;
  onBulkImportLyrics?: (newLyrics: LyricItem[], append: boolean) => void;
}

export const LyricTimeline: React.FC<LyricTimelineProps> = ({
  lyrics,
  currentTime,
  duration = 16.0,
  bpm = 120,
  onSeek,
  onAddLyric,
  onDeleteLyric,
  onBulkImportLyrics,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTime, setNewTime] = useState(currentTime.toFixed(1));
  const [newPocket, setNewPocket] = useState<'on' | 'ahead' | 'behind' | 'laid-back' | 'pushing'>('on');
  const [newOffset, setNewOffset] = useState('0.0');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newItem: LyricItem = {
      id: Date.now().toString(),
      type: 'line',
      text: newText,
      timestamp: parseFloat(newTime) || currentTime,
      pocket: newPocket,
      offsetMs: parseFloat(newOffset) || 0,
      subdivision: 0,
      note: 'Custom added lyric line',
    };

    onAddLyric(newItem);
    setNewText('');
    setIsAdding(false);
  };

  // Find active row
  let activeId: string | null = null;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].timestamp <= currentTime + 0.1) {
      activeId = lyrics[i].id;
    } else {
      break;
    }
  }

  return (
    <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 flex flex-col h-full font-mono text-xs shadow-xl space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <span className="font-bold text-gray-200 tracking-[0.12em] text-[11px] uppercase flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00E5FF]" />
          LYRIC & CADENCE TIMELINE
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-[#FF2A55]/10 text-[#FF2A55] hover:bg-[#FF2A55]/20 border border-[#FF2A55]/30 px-2.5 py-1 rounded transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            WHOLE LYRICS
          </button>
          <button
            onClick={() => {
              setNewTime(currentTime.toFixed(2));
              setIsAdding(!isAdding);
            }}
            className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 px-2.5 py-1 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            ADD LINE
          </button>
        </div>
      </div>

      {/* Add Lyric Line Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-black/80 p-3 rounded border border-white/10 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter lyric text..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="flex-1 bg-black border border-white/10 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-[#00E5FF]"
            />
            <input
              type="text"
              placeholder="Secs (e.g. 4.5)"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-20 bg-black border border-white/10 rounded px-2.5 py-1 text-white text-xs text-center outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-gray-400 font-bold uppercase tracking-wider">POCKET:</span>
              <select
                value={newPocket}
                onChange={(e) => setNewPocket(e.target.value as any)}
                className="bg-black border border-white/10 rounded px-2 py-1 text-white uppercase"
              >
                <option value="on">On-Grid (0 ms)</option>
                <option value="ahead">Ahead (+ms)</option>
                <option value="behind">Behind (-ms)</option>
                <option value="laid-back">Laid Back (-15ms)</option>
                <option value="pushing">Pushing (+10ms)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-white px-2 py-1 uppercase tracking-wider text-[10px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#00E5FF] text-black font-bold uppercase tracking-wider px-3 py-1 rounded flex items-center gap-1 text-[10px]"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lyric List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[380px]">
        {lyrics.map((item) => {
          const isActive = activeId === item.id;

          if (item.type === 'cue') {
            return (
              <div
                key={item.id}
                onClick={() => onSeek(item.timestamp)}
                className="cursor-pointer text-center py-1 bg-transparent border-b border-white/10 text-gray-500 hover:text-gray-300 transition-colors text-[9px] tracking-widest uppercase font-bold"
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
              className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isActive
                  ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-sm'
                  : 'bg-black/50 border-white/10 hover:border-gray-700 hover:bg-black/70'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-[10px] text-gray-400 min-w-[45px] font-mono">
                  {formatTime(item.timestamp)}
                </span>
                <div
                  className="text-gray-200 text-xs font-sans truncate"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}
                >
                  {item.pocket} ({item.offsetMs > 0 ? `+${item.offsetMs}` : item.offsetMs}ms)
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLyric(item.id);
                  }}
                  className="text-gray-600 hover:text-[#FF2A55] transition-colors p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Whole Lyrics Modal */}
      <BulkLyricsModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        currentLyrics={lyrics}
        duration={duration}
        bpm={bpm}
        onApplyLyrics={(newLyrics, append) => {
          if (onBulkImportLyrics) {
            onBulkImportLyrics(newLyrics, append);
          } else {
            if (append) {
              newLyrics.forEach((item) => onAddLyric(item));
            } else {
              // Replace mode if no handler passed directly
              lyrics.forEach((l) => onDeleteLyric(l.id));
              newLyrics.forEach((item) => onAddLyric(item));
            }
          }
        }}
      />
    </div>
  );
};
