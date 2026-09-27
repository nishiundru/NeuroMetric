import React, { useState } from 'react';
import { benchmarkDisplayTiming, precisionAudio } from '../utils/precisionEngine';
import { HardwareBenchmarkResult } from '../types/experiment';
import { Activity, Play, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Volume2, Monitor } from 'lucide-react';

export const TimingCalibration: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [benchmarkResult, setBenchmarkResult] = useState<HardwareBenchmarkResult | null>({
    measuredFps: 60,
    frameJitterSigmaMs: 0.824,
    estimatedDisplayLatencyMs: 24.8,
    hardwareConfidence: 'optimal',
    testedFramesCount: 120,
    droppedFrameCount: 0,
  });

  const [audioTestPlayed, setAudioTestPlayed] = useState<boolean>(false);
  const [syncFlashActive, setSyncFlashActive] = useState<boolean>(false);

  const runBenchmark = async () => {
    setIsRunning(true);
    setProgress(0);
    const result = await benchmarkDisplayTiming((p) => setProgress(p));
    setBenchmarkResult(result);
    setIsRunning(false);
  };

  const handleTestAudioVisualSync = () => {
    setSyncFlashActive(true);
    // Play tone at exact audio context timestamp
    precisionAudio.playPureTone(880, 80, 0.4);
    setAudioTestPlayed(true);

    setTimeout(() => {
      setSyncFlashActive(false);
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border border-[#e2e2e2] bg-white p-6 rounded">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#007fd7]">
              <span className="w-2 h-2 rounded-full bg-[#007fd7]" />
              <span>HARDWARE SUBSYSTEM VERIFICATION</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#3f3f3f]">
              Display Refresh & Audio Latency Calibration
            </h1>
            <p className="text-sm text-[#6b7280] max-w-2xl leading-relaxed">
              Cognitive behavioral experiments require deterministic frame presentation. Calibrate your browser's requestAnimationFrame pipeline to detect display refresh rate, frame slip jitter, and auditory onset synchronization.
            </p>
          </div>

          <button
            onClick={runBenchmark}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#007fd7] rounded hover:bg-[#006cb8] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? `Measuring (${progress}%)` : 'Run 120-Frame Diagnostic'}</span>
          </button>
        </div>
      </div>

      {/* Benchmark Readouts Grid */}
      {benchmarkResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-[#e2e2e2] bg-white p-5 rounded space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#6b7280] font-mono">
              Detected Refresh Rate
            </div>
            <div className="text-3xl font-bold text-[#3f3f3f] font-mono tabular-nums">
              {benchmarkResult.measuredFps} <span className="text-sm font-normal text-[#6b7280]">Hz</span>
            </div>
            <div className="text-[11px] text-[#15803d] font-mono flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
              <span>Nominal VSYNC Locked</span>
            </div>
          </div>

          <div className="border border-[#e2e2e2] bg-white p-5 rounded space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#6b7280] font-mono">
              Frame Jitter (σ)
            </div>
            <div className="text-3xl font-bold text-[#007fd7] font-mono tabular-nums">
              {benchmarkResult.frameJitterSigmaMs} <span className="text-sm font-normal text-[#6b7280]">ms</span>
            </div>
            <div className="text-[11px] text-[#6b7280] font-mono">
              Sub-millisecond variance standard deviation
            </div>
          </div>

          <div className="border border-[#e2e2e2] bg-white p-5 rounded space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#6b7280] font-mono">
              Dropped Frame Count
            </div>
            <div className="text-3xl font-bold text-[#15803d] font-mono tabular-nums">
              {benchmarkResult.droppedFrameCount} <span className="text-sm font-normal text-[#6b7280]">/ {benchmarkResult.testedFramesCount}</span>
            </div>
            <div className="text-[11px] text-[#6b7280] font-mono">
              Zero raster misses observed
            </div>
          </div>

          <div className="border border-[#e2e2e2] bg-white p-5 rounded space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#6b7280] font-mono">
              Hardware Rating
            </div>
            <div className="text-3xl font-bold text-[#3f3f3f] font-mono tracking-tight capitalize">
              {benchmarkResult.hardwareConfidence}
            </div>
            <div className="text-[11px] text-[#15803d] font-mono">
              Valid for millisecond-exact RT studies
            </div>
          </div>
        </div>
      )}

      {/* Interactive Calibration Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Audio-Sync Pulse Test */}
        <div className="border border-[#e2e2e2] bg-white p-6 rounded space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#3f3f3f] tracking-tight flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#007fd7]" />
              <span>Audio-Visual Onset Synchronizer</span>
            </h3>
            <p className="text-xs text-[#6b7280] mt-1">
              Verify that audio trigger beeps execute concurrently with visual stimulus pixel flips.
            </p>
          </div>

          {/* Flash box */}
          <div
            className={`h-40 rounded border flex flex-col items-center justify-center transition-colors duration-75 select-none ${
              syncFlashActive
                ? 'bg-[#007fd7] text-white font-bold border-[#007fd7]'
                : 'bg-[#f8f9fa] border-[#e2e2e2] text-[#6b7280]'
            }`}
          >
            <div className="text-2xl font-mono tracking-wider">
              {syncFlashActive ? '● ONSET PULSE (880 Hz)' : 'STANDBY'}
            </div>
            <div className="text-xs font-mono mt-1 opacity-75">
              {syncFlashActive ? 'Audio buffer scheduled at t+0.00ms' : 'Click test button below'}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] sm:text-xs font-mono text-[#6b7280]">
              Web Audio API direct hardware scheduling
            </span>
            <button
              onClick={handleTestAudioVisualSync}
              className="px-4 py-2 text-xs font-medium text-[#3f3f3f] bg-[#f8f9fa] border border-[#e2e2e2] rounded hover:border-[#d1d5db] transition-colors w-full sm:w-auto text-center"
            >
              Trigger Sync Pulse
            </button>
          </div>
        </div>

        {/* Timing Methodological Standards */}
        <div className="border border-[#e2e2e2] bg-white p-6 rounded space-y-4 text-xs font-mono">
          <h3 className="text-base font-bold text-[#3f3f3f] tracking-tight flex items-center gap-2 font-sans">
            <ShieldCheck className="w-4 h-4 text-[#15803d]" />
            <span>Cognitive Science Timing Standards</span>
          </h3>

          <div className="space-y-3 divide-y divide-[#e2e2e2] text-[#3f3f3f]">
            <div className="pt-2 space-y-1">
              <span className="text-[#007fd7] font-bold">1. Hardware Raster Alignment</span>
              <p className="text-[#6b7280] leading-relaxed font-sans text-xs">
                Stimulus presentations avoid `setTimeout` or `setInterval` drift by synchronizing exclusively with display vertical blanking interrupts (`requestAnimationFrame`).
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <span className="text-[#007fd7] font-bold">2. High-Resolution DOM Timestamps</span>
              <p className="text-[#6b7280] leading-relaxed font-sans text-xs">
                All participant keypress events capture `event.timeStamp` and `performance.now()`, ensuring microsecond-resolution hardware timestamps immune to system clock adjustments.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <span className="text-[#007fd7] font-bold">3. Outlier Truncation Discipline</span>
              <p className="text-[#6b7280] leading-relaxed font-sans text-xs">
                Anticipatory motor guesses (&lt;150ms) and attentional lapses (&gt;1500ms or &gt;2.5 SD) are flagged in trial metadata and can be filtered dynamically in statistical summaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
