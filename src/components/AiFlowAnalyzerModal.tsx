import React, { useState } from 'react';
import { X, Sparkles, Loader2, Award, Zap, Music2 } from 'lucide-react';
import { TelemetryMetrics, LyricItem } from '../types';

interface AiFlowAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: TelemetryMetrics;
  lyrics: LyricItem[];
  bpm: number;
  trackName: string;
}

export const AiFlowAnalyzerModal: React.FC<AiFlowAnalyzerModalProps> = ({
  isOpen,
  onClose,
  metrics,
  lyrics,
  bpm,
  trackName,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackName,
          bpm,
          metrics,
          lyrics,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server returned an error');
      }

      if (data.text) {
        setAnalysis(data.text);
      } else {
        setError('Unable to retrieve AI analysis response.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error generating AI flow analysis. Ensure GEMINI_API_KEY is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-[#0d0d10] border border-white/10 rounded-lg w-full max-w-2xl p-5 space-y-4 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#FF2A55]" />
            AI CADENCE & FLOW ADVISOR
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!analysis && !loading && !error && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-[#FF2A55]/10 border border-[#FF2A55]/30 flex items-center justify-center mx-auto text-[#FF2A55]">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Generate Real-Time Flow Diagnostics</h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                Gemini AI will evaluate your micro-timing telemetry, 16th-note subdivision spread, and vocal pocket sync to provide custom coaching advice.
              </p>
            </div>
            <button
              onClick={handleAnalyze}
              className="bg-[#FF2A55] hover:bg-[#e02048] text-white font-bold px-5 py-2.5 rounded shadow-lg transition-all inline-flex items-center gap-2 text-[10px] uppercase tracking-wider border border-[#FF2A55]"
            >
              <Zap className="w-4 h-4 fill-current" />
              RUN AI FLOW DIAGNOSTICS
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 text-[#FF2A55] animate-spin mx-auto" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">Processing Micro-Timing Telemetry via Gemini DSP Model...</p>
          </div>
        )}

        {error && (
          <div className="bg-[#FF2A55]/10 border border-[#FF2A55]/40 rounded p-4 text-[#FF2A55] text-xs space-y-2">
            <p className="font-bold uppercase tracking-wider">Diagnostics Error</p>
            <p>{error}</p>
            <button
              onClick={handleAnalyze}
              className="bg-[#FF2A55] text-white font-bold px-3 py-1 rounded text-[10px] mt-2 uppercase tracking-wider"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="bg-black/80 border border-white/10 rounded p-4 max-h-[350px] overflow-y-auto space-y-3 font-sans text-xs text-gray-200 leading-relaxed">
              <div className="flex items-center gap-2 text-[#00E5FF] font-mono font-bold text-xs border-b border-white/10 pb-2 uppercase tracking-wider">
                <Music2 className="w-4 h-4" />
                DSP CADENCE DIAGNOSTIC REPORT
              </div>
              <div className="whitespace-pre-wrap">{analysis}</div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                className="bg-white/5 hover:bg-white/10 text-gray-200 font-bold px-3 py-1.5 rounded transition-all border border-white/10 text-[10px] uppercase tracking-wider flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF2A55]" /> Re-Analyze
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
