/**
 * High-Precision Behavioral Experiment Timing Engine
 * Sub-millisecond stimulus presentation, requestAnimationFrame raster lock,
 * and Web Audio API synthesized tones.
 */

import { HardwareBenchmarkResult } from '../types/experiment';

class PrecisionAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Schedules a pure sine tone with linear ramp envelope at exact hardware timestamp
   */
  public playPureTone(freqHz: number = 880, durationMs: number = 100, volume: number = 0.3): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqHz, ctx.currentTime);

      const now = ctx.currentTime;
      const attackTime = 0.005; // 5ms attack to prevent acoustic click
      const releaseTime = 0.01; // 10ms release
      const totalDurSec = durationMs / 1000;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + attackTime);
      gain.gain.setValueAtTime(volume, now + totalDurSec - releaseTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + totalDurSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + totalDurSec + 0.05);
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }

  public playFeedbackBeep(isCorrect: boolean): void {
    if (isCorrect) {
      this.playPureTone(1046.5, 90, 0.25); // High C6 crisp beep
    } else {
      this.playPureTone(220, 150, 0.35); // Low A3 alert tone
    }
  }
}

export const precisionAudio = new PrecisionAudioEngine();

/**
 * Calculates randomized Inter-Stimulus Interval (ISI) with jitter
 */
export function calculateJitteredISI(minMs: number, maxMs: number): number {
  if (minMs >= maxMs) return minMs;
  return Math.round(minMs + Math.random() * (maxMs - minMs));
}

/**
 * Runs a 120-frame diagnostic benchmark of the client browser's RAF sync
 */
export function benchmarkDisplayTiming(onProgress?: (percent: number) => void): Promise<HardwareBenchmarkResult> {
  return new Promise((resolve) => {
    const targetFrames = 120;
    const timestamps: number[] = [];
    let frameId: number;

    const measureFrame = (now: DOMHighResTimeStamp) => {
      timestamps.push(now);
      if (onProgress) {
        onProgress(Math.round((timestamps.length / targetFrames) * 100));
      }

      if (timestamps.length < targetFrames) {
        frameId = requestAnimationFrame(measureFrame);
      } else {
        cancelAnimationFrame(frameId);
        // Analyze frame deltas
        const deltas: number[] = [];
        for (let i = 1; i < timestamps.length; i++) {
          deltas.push(timestamps[i] - timestamps[i - 1]);
        }

        const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        const measuredFps = Math.round(1000 / meanDelta);

        // Standard deviation (Jitter sigma)
        const variance = deltas.reduce((acc, d) => acc + Math.pow(d - meanDelta, 2), 0) / deltas.length;
        const jitterSigmaMs = Math.sqrt(variance);

        // Count frames that drifted by more than 4ms from nominal refresh delta
        const droppedCount = deltas.filter(d => Math.abs(d - meanDelta) > 5).length;

        let hardwareConfidence: 'optimal' | 'acceptable' | 'unreliable' = 'optimal';
        if (jitterSigmaMs > 2.5 || droppedCount > 5) {
          hardwareConfidence = 'acceptable';
        }
        if (jitterSigmaMs > 6.0 || droppedCount > 15) {
          hardwareConfidence = 'unreliable';
        }

        resolve({
          measuredFps,
          frameJitterSigmaMs: Number(jitterSigmaMs.toFixed(3)),
          estimatedDisplayLatencyMs: Number((meanDelta * 1.5).toFixed(2)),
          hardwareConfidence,
          testedFramesCount: targetFrames,
          droppedFrameCount: droppedCount,
        });
      }
    };

    frameId = requestAnimationFrame(measureFrame);
  });
}
