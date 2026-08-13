import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LyricItem,
  AudioTrack,
  DSPFrameData,
  TelemetryMetrics,
  ViewMode,
} from './types';
import { PRESET_TRACKS } from './data/presetTracks';
import { globalAudioEngine } from './utils/audioEngine';
import { SpectralDSPAnalyzer } from './utils/fluxDetector';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { SpectralCanvas } from './components/SpectralCanvas';
import { BouncePlotCanvas } from './components/BouncePlotCanvas';
import { SubdivisionHistogram } from './components/SubdivisionHistogram';
import { SpectrumOscilloscope } from './components/SpectrumOscilloscope';
import { LyricTimeline } from './components/LyricTimeline';
import { TelemetryStats } from './components/TelemetryStats';
import { ExportModal } from './components/ExportModal';
import { AiFlowAnalyzerModal } from './components/AiFlowAnalyzerModal';

export default function App() {
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack>(PRESET_TRACKS[0]);
  const [bpm, setBpm] = useState<number>(PRESET_TRACKS[0].bpm);
  const [lyrics, setLyrics] = useState<LyricItem[]>(PRESET_TRACKS[0].lyrics);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(16.0);
  const [viewMode, setViewMode] = useState<ViewMode>('spectral');

  // Volume & Mute States for 3 inputs (Vocal, Bass, Drums)
  const [vocalVol, setVocalVol] = useState(0.85);
  const [bassVol, setBassVol] = useState(0.85);
  const [drumVol, setDrumVol] = useState(0.85);
  const [vocalMuted, setVocalMuted] = useState(false);
  const [bassMuted, setBassMuted] = useState(false);
  const [drumMuted, setDrumMuted] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.2);

  // Telemetry Data & Buffer
  const [dataBuffer, setDataBuffer] = useState<DSPFrameData[]>([]);
  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    syncScore: 98.2,
    avgDriftMs: 2.1,
    vocalPeak: 0.0,
    bassPeak: 0.0,
    drumPeak: 0.0,
    instantDriftMs: 0.0,
    fps: 60,
    grooveType: 'LOCKED ON-GRID',
    subdivisionCounts: [18, 6, 12, 8],
    totalOnsets: 44,
  });

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // DSP Analyzer instance
  const dspAnalyzerRef = useRef<SpectralDSPAnalyzer>(new SpectralDSPAnalyzer());
  const animFrameRef = useRef<number | null>(null);
  const fpsCounterRef = useRef({ count: 0, lastTime: performance.now(), currentFps: 60 });

  // Initialize track audio engine on load / track change
  useEffect(() => {
    setLyrics(selectedTrack.lyrics);
    setBpm(selectedTrack.bpm);
    globalAudioEngine.generateReferenceBeat(selectedTrack.bpm).catch(console.error);
  }, [selectedTrack]);

  // Audio time update callback
  useEffect(() => {
    globalAudioEngine.setTimeUpdateCallback((cur, dur) => {
      setCurrentTime(cur);
      setDuration(dur);
    });
  }, []);

  // Main Audio & DSP Processing Loop
  const runDSPProcessing = useCallback(() => {
    const vocalAnalyser = globalAudioEngine.getAnalyser('vocals');
    const bassAnalyser = globalAudioEngine.getAnalyser('bass');
    const drumAnalyser = globalAudioEngine.getAnalyser('drums');

    // FPS Counter
    fpsCounterRef.current.count++;
    const now = performance.now();
    if (now - fpsCounterRef.current.lastTime >= 1000) {
      fpsCounterRef.current.currentFps = fpsCounterRef.current.count;
      fpsCounterRef.current.count = 0;
      fpsCounterRef.current.lastTime = now;
    }

    if (vocalAnalyser && bassAnalyser && drumAnalyser && globalAudioEngine.isPlaying()) {
      const binCount = vocalAnalyser.frequencyBinCount;
      const vocalData = new Uint8Array(binCount);
      const bassData = new Uint8Array(binCount);
      const drumData = new Uint8Array(binCount);

      vocalAnalyser.getByteFrequencyData(vocalData);
      bassAnalyser.getByteFrequencyData(bassData);
      drumAnalyser.getByteFrequencyData(drumData);

      // Process Frame via DSP Flux Engine
      const { vocalFlux, bassFlux, drumFlux, isBeat } = dspAnalyzerRef.current.processFrame(
        vocalData,
        bassData,
        drumData,
        sensitivity
      );

      const curTime = globalAudioEngine.getCurrentTime();
      const subIndex = dspAnalyzerRef.current.calculateSubdivision(curTime, bpm);
      const offsetMs = dspAnalyzerRef.current.calculateSubdivisionOffsetMs(
        curTime,
        bpm
      );

      const newFrame: DSPFrameData = {
        vocalFlux,
        bassFlux,
        drumFlux,
        isBeat,
        timestamp: curTime,
        offsetMs,
        instantDrift: offsetMs,
      };

      setDataBuffer((prev) => {
        const updated = [...prev, newFrame];
        return updated.length > 180 ? updated.slice(updated.length - 180) : updated;
      });

      // Update Telemetry Metrics
      if (vocalFlux > 0.2 || bassFlux > 0.2 || drumFlux > 0.2) {
        setMetrics((prev) => {
          const newVocalPeak = Math.max(prev.vocalPeak, vocalFlux);
          const newBassPeak = Math.max(prev.bassPeak, bassFlux);
          const newDrumPeak = Math.max(prev.drumPeak, drumFlux);
          const instantDrift = offsetMs;

          // Rolling avg drift
          const newAvgDrift = parseFloat((prev.avgDriftMs * 0.95 + offsetMs * 0.05).toFixed(1));
          const absDrift = Math.abs(newAvgDrift);

          let groove = 'LOCKED ON-GRID';
          if (absDrift > 12.0) groove = 'DEEP LAID-BACK POCKET';
          else if (offsetMs > 4.0) groove = 'PUSHING TEMPO EDGE';
          else if (offsetMs < -4.0) groove = 'SWING LAID BACK';

          const syncScore = Math.max(70, Math.min(100, 100 - absDrift * 1.5));

          const counts: [number, number, number, number] = [
            prev.subdivisionCounts[0],
            prev.subdivisionCounts[1],
            prev.subdivisionCounts[2],
            prev.subdivisionCounts[3],
          ];
          if (vocalFlux > 0.25) {
            counts[subIndex] += 1;
          }

          return {
            syncScore,
            avgDriftMs: newAvgDrift,
            vocalPeak: newVocalPeak,
            bassPeak: newBassPeak,
            drumPeak: newDrumPeak,
            instantDriftMs: instantDrift,
            fps: fpsCounterRef.current.currentFps,
            grooveType: groove,
            subdivisionCounts: counts,
            totalOnsets: prev.totalOnsets + (vocalFlux > 0.25 ? 1 : 0),
          };
        });
      }
    }

    if (globalAudioEngine.isPlaying()) {
      animFrameRef.current = requestAnimationFrame(runDSPProcessing);
    }
  }, [bpm, sensitivity]);

  // Handle Play/Pause
  const handleTogglePlay = async () => {
    if (isPlaying) {
      globalAudioEngine.stopPlayback();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      await globalAudioEngine.startPlayback(currentTime, bpm);
      setIsPlaying(true);
      animFrameRef.current = requestAnimationFrame(runDSPProcessing);
    }
  };

  // Handle Custom Audio File Upload
  const handleFileUpload = async (files: FileList) => {
    await globalAudioEngine.loadUserAudioFiles(files);
    if (isPlaying) {
      globalAudioEngine.startPlayback(0, bpm);
    }
  };

  // Handle Seek
  const handleSeek = (timeSec: number) => {
    globalAudioEngine.seek(timeSec, bpm);
    setCurrentTime(timeSec);
  };

  // Add & Delete Lyrics
  const handleAddLyric = (item: LyricItem) => {
    setLyrics((prev) => [...prev, item].sort((a, b) => a.timestamp - b.timestamp));
  };

  const handleDeleteLyric = (id: string) => {
    setLyrics((prev) => prev.filter((l) => l.id !== id));
  };

  // Clean canvas data
  const handleClearBuffer = () => {
    setDataBuffer([]);
    setMetrics((prev) => ({
      ...prev,
      vocalPeak: 0,
      bassPeak: 0,
      drumPeak: 0,
      instantDriftMs: 0,
      subdivisionCounts: [0, 0, 0, 0],
      totalOnsets: 0,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-[#040406] text-gray-100 flex flex-col font-mono selection:bg-[#00E5FF] selection:text-black">
      {/* Header HUD */}
      <Header
        isPlaying={isPlaying}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onTogglePlay={handleTogglePlay}
        syncScore={metrics.syncScore}
        instantDriftMs={metrics.instantDriftMs}
        grooveType={metrics.grooveType}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAiAnalysis={() => setIsAiOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Controls & Pocket Telemetry Card */}
        <div className="lg:col-span-1 space-y-4">
          <ControlPanel
            selectedTrack={selectedTrack}
            onSelectTrack={(t) => {
              setSelectedTrack(t);
              setBpm(t.bpm);
              if (isPlaying) {
                globalAudioEngine.stopPlayback();
                setIsPlaying(false);
              }
            }}
            onFileUpload={handleFileUpload}
            vocalVolume={vocalVol}
            bassVolume={bassVol}
            drumVolume={drumVol}
            onVocalVolChange={(val) => {
              setVocalVol(val);
              globalAudioEngine.setVolume('vocals', val);
            }}
            onBassVolChange={(val) => {
              setBassVol(val);
              globalAudioEngine.setVolume('bass', val);
            }}
            onDrumVolChange={(val) => {
              setDrumVol(val);
              globalAudioEngine.setVolume('drums', val);
            }}
            vocalMuted={vocalMuted}
            bassMuted={bassMuted}
            drumMuted={drumMuted}
            onToggleVocalMute={() => {
              const muted = globalAudioEngine.toggleMute('vocals');
              setVocalMuted(muted);
            }}
            onToggleBassMute={() => {
              const muted = globalAudioEngine.toggleMute('bass');
              setBassMuted(muted);
            }}
            onToggleDrumMute={() => {
              const muted = globalAudioEngine.toggleMute('drums');
              setDrumMuted(muted);
            }}
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivity}
            syncScore={metrics.syncScore}
            avgDriftMs={metrics.avgDriftMs}
            bpm={bpm}
            onBpmChange={(newBpm) => setBpm(newBpm)}
          />
        </div>

        {/* Right Columns: Main Visualizers & Lyric Timeline */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Main Visualizer Area based on selected View Mode */}
          {viewMode === 'spectral' && (
            <SpectralCanvas
              dataBuffer={dataBuffer}
              onClear={handleClearBuffer}
              fps={metrics.fps}
            />
          )}

          {viewMode === 'bounce' && (
            <BouncePlotCanvas dataBuffer={dataBuffer} bpm={bpm} />
          )}

          {viewMode === 'spectrum-scope' && <SpectrumOscilloscope />}

          {viewMode === 'full-dashboard' && (
            <div className="space-y-6">
              <SpectralCanvas
                dataBuffer={dataBuffer}
                onClear={handleClearBuffer}
                fps={metrics.fps}
              />
              <BouncePlotCanvas dataBuffer={dataBuffer} bpm={bpm} />
              <SpectrumOscilloscope />
            </div>
          )}

          {/* Real-time Telemetry Stats Row */}
          <TelemetryStats metrics={metrics} bpm={bpm} />

          {/* Bottom Grid: 16th Note Subdivision Histogram & Lyric Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubdivisionHistogram
              counts={metrics.subdivisionCounts}
              totalOnsets={metrics.totalOnsets}
            />

            <LyricTimeline
              lyrics={lyrics}
              currentTime={currentTime}
              onSeek={handleSeek}
              onAddLyric={handleAddLyric}
              onDeleteLyric={handleDeleteLyric}
            />
          </div>
        </div>
      </main>

      {/* High Density Technical HUD Footer */}
      <footer className="h-8 bg-[#0d0d10] border-t border-white/10 px-6 flex items-center justify-between text-[10px] shrink-0 text-gray-500 font-mono uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-gray-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
            ENGINE: ACTIVE (3-CHANNEL)
          </span>
          <span className="hidden sm:inline text-gray-600">|</span>
          <span className="hidden sm:inline text-gray-400">BUFFER: 180 FRAMES</span>
          <span className="hidden md:inline text-gray-600">|</span>
          <span className="hidden md:inline text-gray-400">SAMPLE RATE: 44.1 kHz</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#00E5FF] font-bold">SYNC SCORE: {metrics.syncScore.toFixed(1)}%</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 font-bold">{metrics.fps} FPS</span>
        </div>
      </footer>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        metrics={metrics}
        lyrics={lyrics}
        bpm={bpm}
        trackName={selectedTrack.name}
      />

      <AiFlowAnalyzerModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        metrics={metrics}
        lyrics={lyrics}
        bpm={bpm}
        trackName={selectedTrack.name}
      />
    </div>
  );
}
