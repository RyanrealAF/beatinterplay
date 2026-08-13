import React, { useState, useEffect } from 'react';
import { LyricItem } from '../types';
import { FileText, X, Sparkles, Check, AlignLeft, Clock, Music } from 'lucide-react';

interface BulkLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLyrics: LyricItem[];
  duration: number;
  bpm: number;
  onApplyLyrics: (newLyrics: LyricItem[], append: boolean) => void;
}

export const BulkLyricsModal: React.FC<BulkLyricsModalProps> = ({
  isOpen,
  onClose,
  currentLyrics,
  duration,
  bpm,
  onApplyLyrics,
}) => {
  const [rawText, setRawText] = useState('');
  const [timingMode, setTimingMode] = useState<'even' | 'rhythm' | 'interval' | 'auto'>('auto');
  const [startOffset, setStartOffset] = useState(0.5);
  const [intervalSec, setIntervalSec] = useState(2.0);
  const [barsPerLine, setBarsPerLine] = useState(1);
  const [appendMode, setAppendMode] = useState(false);
  const [previewItems, setPreviewItems] = useState<LyricItem[]>([]);

  // Pre-fill rawText when modal opens or currentLyrics change
  useEffect(() => {
    if (isOpen) {
      if (currentLyrics.length > 0) {
        const textFormatted = currentLyrics
          .map((item) => {
            if (item.type === 'cue') return `[${item.text}]`;
            const mins = Math.floor(item.timestamp / 60);
            const secs = (item.timestamp % 60).toFixed(2);
            const padMins = mins < 10 ? `0${mins}` : `${mins}`;
            const padSecs = parseFloat(secs) < 10 ? `0${secs}` : `${secs}`;
            return `[${padMins}:${padSecs}] ${item.text}`;
          })
          .join('\n');
        setRawText(textFormatted);
      } else {
        setRawText(
          `[Verse 1]\nFirst line of the verse on the rhythm beat\nDropping rhymes on the grid keeping cadence neat\n[Chorus]\nFull lyrics provided in whole with automatic timing\nSyncing every line with the beat and precision rhyming`
        );
      }
    }
  }, [isOpen, currentLyrics]);

  // Parse raw text into LyricItem preview
  useEffect(() => {
    if (!rawText.trim()) {
      setPreviewItems([]);
      return;
    }

    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const result: LyricItem[] = [];

    // Helper regex for LRC timestamps like [00:04.50] or [01:12]
    const lrcRegex = /^\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]\s*(.*)$/;
    const sectionRegex = /^\[(.*)\]$/; // e.g. [Verse 1] or [Chorus]

    let hasLrcTags = false;
    // Check if at least one line has LRC tags
    lines.forEach((line) => {
      if (lrcRegex.test(line)) hasLrcTags = true;
    });

    const secondsPerBar = (60 / bpm) * 4;

    let lineCounter = 0;

    lines.forEach((line, idx) => {
      const lrcMatch = line.match(lrcRegex);
      const sectionMatch = line.match(sectionRegex);

      if (lrcMatch) {
        const mins = parseInt(lrcMatch[1], 10);
        const secs = parseFloat(lrcMatch[2]);
        const timeInSec = mins * 60 + secs;
        const textContent = lrcMatch[3].trim();

        if (textContent) {
          result.push({
            id: `bulk-${idx}-${Date.now()}`,
            type: 'line',
            text: textContent,
            timestamp: parseFloat(timeInSec.toFixed(2)),
            pocket: 'on',
            offsetMs: 0,
            subdivision: 0,
            note: 'Parsed from bulk text LRC',
          });
          lineCounter++;
        }
      } else if (sectionMatch && !line.includes(':')) {
        // Section Cue e.g. [Verse 1]
        let cueTime = startOffset;
        if (timingMode === 'rhythm') {
          cueTime = startOffset + lineCounter * (secondsPerBar * (barsPerLine / 2));
        } else if (timingMode === 'interval') {
          cueTime = startOffset + lineCounter * intervalSec;
        } else if (timingMode === 'even') {
          cueTime = startOffset + (lineCounter / Math.max(1, lines.length)) * Math.max(8, duration - startOffset);
        }

        result.push({
          id: `cue-${idx}-${Date.now()}`,
          type: 'cue',
          text: sectionMatch[1],
          timestamp: parseFloat(cueTime.toFixed(2)),
          pocket: 'on',
          offsetMs: 0,
          subdivision: 0,
        });
      } else {
        // Standard text line
        let calculatedTime = startOffset;

        if (hasLrcTags && timingMode === 'auto') {
          // If LRC tags exist in file, default untagged lines relative to last line
          const lastTime = result.length > 0 ? result[result.length - 1].timestamp : startOffset;
          calculatedTime = lastTime + 2.0;
        } else if (timingMode === 'rhythm') {
          calculatedTime = startOffset + lineCounter * (secondsPerBar * (barsPerLine / 2));
        } else if (timingMode === 'interval') {
          calculatedTime = startOffset + lineCounter * intervalSec;
        } else {
          // Even distribution mode or auto default
          const totalValidLines = lines.filter((l) => !sectionRegex.test(l) || l.includes(':')).length || 1;
          const usableDuration = Math.max(6.0, duration - startOffset - 1.0);
          calculatedTime = startOffset + (lineCounter / Math.max(1, totalValidLines)) * usableDuration;
        }

        result.push({
          id: `bulk-${idx}-${Date.now()}`,
          type: 'line',
          text: line,
          timestamp: parseFloat(calculatedTime.toFixed(2)),
          pocket: 'on',
          offsetMs: 0,
          subdivision: 0,
          note: 'Parsed bulk line',
        });
        lineCounter++;
      }
    });

    setPreviewItems(result);
  }, [rawText, timingMode, startOffset, intervalSec, barsPerLine, duration, bpm]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyLyrics(previewItems, appendMode);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-xs">
      <div className="bg-[#0d0d10] border border-white/10 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <FileText className="w-5 h-5 text-[#FF2A55]" />
            <span>PROVIDE FULL LYRICS</span>
            <span className="text-[10px] text-gray-400 font-normal px-2 py-0.5 bg-white/5 rounded border border-white/10 uppercase">
              WHOLE TEXT IMPORT
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Instructions */}
          <div className="bg-black/50 border border-white/10 rounded-lg p-3 text-gray-300 text-[11px] leading-relaxed space-y-1">
            <p className="font-bold text-[#00E5FF] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
              PASTE FULL LYRICS & SONG TEXT
            </p>
            <p className="text-gray-400">
              Paste your complete song lyrics below. You can include section tags like <code className="text-white bg-white/10 px-1 rounded">[Verse 1]</code> or <code className="text-white bg-white/10 px-1 rounded">[Chorus]</code>. If LRC timestamp tags (e.g. <code className="text-white bg-white/10 px-1 rounded">[00:04.50]</code>) are present, they will be parsed automatically!
            </p>
          </div>

          {/* Timing Mode & Import Options Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/60 p-3 rounded-lg border border-white/10">
            {/* Timing Mode Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#00E5FF]" />
                TIMING GENERATION
              </label>
              <select
                value={timingMode}
                onChange={(e) => setTimingMode(e.target.value as any)}
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-white text-[11px] font-mono outline-none focus:border-[#00E5FF]"
              >
                <option value="auto">Auto / LRC Tags Default</option>
                <option value="even">Evenly Space Across Track ({duration.toFixed(1)}s)</option>
                <option value="rhythm">Beat Rhythm ({bpm} BPM)</option>
                <option value="interval">Fixed Seconds Interval</option>
              </select>
            </div>

            {/* Sub-Option depending on timing mode */}
            {timingMode === 'interval' && (
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
                  INTERVAL (SECONDS PER LINE)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10.0"
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Math.max(0.5, parseFloat(e.target.value) || 2.0))}
                  className="w-full bg-black border border-white/10 rounded px-2.5 py-1 text-white text-[11px] outline-none focus:border-[#00E5FF]"
                />
              </div>
            )}

            {timingMode === 'rhythm' && (
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                  <Music className="w-3 h-3 text-[#A855F7]" />
                  BARS PER LINE ({bpm} BPM)
                </label>
                <select
                  value={barsPerLine}
                  onChange={(e) => setBarsPerLine(parseFloat(e.target.value))}
                  className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-white text-[11px] outline-none focus:border-[#00E5FF]"
                >
                  <option value={0.5}>Half Bar (2 beats)</option>
                  <option value={1}>1 Bar (4 beats)</option>
                  <option value={2}>2 Bars (8 beats)</option>
                  <option value={4}>4 Bars (16 beats)</option>
                </select>
              </div>
            )}

            {(timingMode === 'even' || timingMode === 'auto') && (
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
                  START TIMESTAMP (SECS)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={duration}
                  value={startOffset}
                  onChange={(e) => setStartOffset(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-black border border-white/10 rounded px-2.5 py-1 text-white text-[11px] outline-none focus:border-[#00E5FF]"
                />
              </div>
            )}

            {/* Append / Replace Mode Toggle */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
                IMPORT ACTION
              </label>
              <div className="flex bg-black rounded border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setAppendMode(false)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    !appendMode ? 'bg-[#FF2A55] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Replace All
                </button>
                <button
                  type="button"
                  onClick={() => setAppendMode(true)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    appendMode ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Append
                </button>
              </div>
            </div>
          </div>

          {/* Main Lyrics Text Area */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
              <span className="text-gray-300 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-[#FF2A55]" />
                WHOLE LYRICS TEXT BOX
              </span>
              <span className="text-gray-400">{previewItems.length} PARSED LINES</span>
            </div>
            <textarea
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste entire lyrics here...&#10;e.g.&#10;[Verse 1]&#10;First line of lyrics&#10;Second line of lyrics&#10;[Chorus]&#10;Full lyrics in whole..."
              className="w-full bg-black/90 border border-white/15 rounded-lg p-3 text-gray-100 font-mono text-xs leading-relaxed outline-none focus:border-[#FF2A55] custom-scrollbar shadow-inner"
            />
          </div>

          {/* Live Parsing Preview Card */}
          {previewItems.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
                PARSED TIMELINE PREVIEW ({previewItems.length} ITEMS)
              </span>
              <div className="max-h-[140px] overflow-y-auto bg-black/50 border border-white/10 rounded-lg p-2.5 space-y-1 custom-scrollbar">
                {previewItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[#00E5FF] font-bold min-w-[50px] text-[10px]">
                        {formatTime(item.timestamp)}
                      </span>
                      {item.type === 'cue' ? (
                        <span className="text-[#FF2A55] font-bold uppercase tracking-wider text-[10px]">
                          — {item.text} —
                        </span>
                      ) : (
                        <span className="text-gray-200 truncate">{item.text}</span>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 uppercase">
                      {item.type === 'cue' ? 'SECTION' : 'LINE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setRawText('');
            }}
            className="text-gray-400 hover:text-white text-[10px] uppercase font-bold tracking-wider"
          >
            Clear Text
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-white/10 text-gray-300 hover:text-white uppercase font-bold text-[10px] tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={previewItems.length === 0}
              className="px-5 py-2 rounded bg-[#FF2A55] hover:bg-[#FF2A55]/90 text-white font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#FF2A55]/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {appendMode ? 'APPEND TO LYRICS' : 'IMPORT & REPLACE LYRICS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
