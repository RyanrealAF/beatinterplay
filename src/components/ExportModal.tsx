import React, { useState } from 'react';
import { X, Copy, Download, Check } from 'lucide-react';
import { TelemetryMetrics, LyricItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: TelemetryMetrics;
  lyrics: LyricItem[];
  bpm: number;
  trackName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  lyrics,
  bpm,
  trackName,
}) => {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  if (!isOpen) return null;

  const exportData = {
    timestamp: new Date().toISOString(),
    track: trackName,
    bpm: bpm,
    synchronicityScore: `${metrics.syncScore.toFixed(1)}%`,
    averageDriftMs: `${metrics.avgDriftMs.toFixed(1)} ms`,
    grooveClassification: metrics.grooveType,
    subdivisionDistribution: {
      sub_0: metrics.subdivisionCounts[0],
      sub_1: metrics.subdivisionCounts[1],
      sub_2: metrics.subdivisionCounts[2],
      sub_3: metrics.subdivisionCounts[3],
    },
    lyricsCadence: lyrics.map((l) => ({
      time: l.timestamp,
      text: l.text.replace(/<[^>]*>?/gm, ''),
      pocket: l.pocket,
      offsetMs: l.offsetMs,
      subdivision: `.${l.subdivision}`,
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const csvRows = [
    ['Timestamp', 'Track', 'BPM', 'SyncScore', 'AvgDriftMs', 'Groove'],
    [
      exportData.timestamp,
      exportData.track,
      exportData.bpm,
      exportData.synchronicityScore,
      exportData.averageDriftMs,
      exportData.grooveClassification,
    ],
    [],
    ['LyricTimestamp', 'Text', 'Pocket', 'OffsetMs', 'Subdivision'],
    ...exportData.lyricsCadence.map((l) => [
      l.time,
      `"${l.text.replace(/"/g, '""')}"`,
      l.pocket,
      l.offsetMs,
      l.subdivision,
    ]),
  ];

  const csvString = csvRows.map((r) => r.join(',')).join('\n');

  const contentToCopy = format === 'json' ? jsonString : csvString;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([contentToCopy], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence_telemetry_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-[#0d0d10] border border-white/10 rounded-lg w-full max-w-2xl p-5 space-y-4 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full" />
            EXPORT MICRO-TIMING TELEMETRY
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex bg-black/60 p-1 rounded border border-white/10 gap-1">
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                format === 'json' ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setFormat('csv')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                format === 'csv' ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-200 px-3 py-1.5 rounded transition-all border border-white/10 text-[10px] font-bold uppercase tracking-wider"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00E5FF]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-[#00E5FF] hover:bg-[#00c4dc] text-black font-bold px-3 py-1.5 rounded transition-all shadow-md text-[10px] uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </button>
          </div>
        </div>

        <div className="bg-black/80 border border-white/10 rounded p-3 max-h-[300px] overflow-y-auto font-mono text-[11px] text-gray-300">
          <pre className="whitespace-pre-wrap">{contentToCopy}</pre>
        </div>
      </div>
    </div>
  );
};
