/**
 * Psychometric & Behavioral Statistics Utility for Cognitive Science
 */

import { TrialLog } from '../types/experiment';

// Approximation of inverse cumulative standard normal distribution (probit)
export function probit(p: number): number {
  if (p <= 0) p = 0.0001;
  if (p >= 1) p = 0.9999;

  // Abramowitz and Stegun approximation
  const a1 = -3.969683028665376e+01;
  const a2 = 2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 = 1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 = 2.506628277459239e+00;

  const b1 = -5.447609879822406e+01;
  const b2 = 1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 = 6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;

  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 = 4.374664141464968e+00;
  const c6 = 2.938163982698783e+00;

  const d1 = 7.784695709041462e-03;
  const d2 = 3.224671290700398e-01;
  const d3 = 2.445134137142996e+00;
  const d4 = 3.754408661907416e+00;

  const p_low = 0.02425;
  const p_high = 1 - p_low;

  let q: number, r: number;

  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= p_high) {
    q = p - 0.5;
    r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
           (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
}

/**
 * Computes Signal Detection Theory sensitivity (d') and criterion (c)
 * with Hautus (1995) log-linear correction
 */
export function calculateSignalDetection(hits: number, totalTargets: number, falseAlarms: number, totalLures: number) {
  // Apply Hautus 0.5 correction
  const hitRate = (hits + 0.5) / (totalTargets + 1);
  const faRate = (falseAlarms + 0.5) / (totalLures + 1);

  const zHit = probit(hitRate);
  const zFA = probit(faRate);

  const dPrime = zHit - zFA;
  const criterion = -0.5 * (zHit + zFA);

  return {
    hitRate: Number((hits / (totalTargets || 1)).toFixed(3)),
    faRate: Number((falseAlarms / (totalLures || 1)).toFixed(3)),
    dPrime: Number(dPrime.toFixed(2)),
    criterion: Number(criterion.toFixed(2)),
  };
}

export function computeMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function computeMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeStandardDeviation(arr: number[], mean?: number): number {
  if (arr.length <= 1) return 0;
  const m = mean ?? computeMean(arr);
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function computeSEM(arr: number[]): number {
  if (arr.length <= 1) return 0;
  return computeStandardDeviation(arr) / Math.sqrt(arr.length);
}

/**
 * Groups reaction times into histogram bins for distribution visualization
 */
export function computeRTHistogram(rts: number[], binCount: number = 18, minVal: number = 150, maxVal: number = 1200) {
  const binWidth = (maxVal - minVal) / binCount;
  const bins: { binStart: number; binEnd: number; binCenter: number; count: number; density: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const binStart = minVal + i * binWidth;
    const binEnd = binStart + binWidth;
    bins.push({
      binStart: Math.round(binStart),
      binEnd: Math.round(binEnd),
      binCenter: Math.round(binStart + binWidth / 2),
      count: 0,
      density: 0,
    });
  }

  const validRts = rts.filter(rt => rt >= minVal && rt <= maxVal);
  validRts.forEach(rt => {
    const idx = Math.min(Math.floor((rt - minVal) / binWidth), binCount - 1);
    if (idx >= 0 && idx < binCount) {
      bins[idx].count++;
    }
  });

  const total = validRts.length || 1;
  bins.forEach(b => {
    b.density = Number((b.count / total).toFixed(4));
  });

  return bins;
}

/**
 * Exports trial logs to a formatted scientific CSV file
 */
export function exportToCSV(logs: TrialLog[], experimentTitle: string): void {
  if (logs.length === 0) return;

  const headers = [
    'trial_uid',
    'session_id',
    'participant_id',
    'experiment_id',
    'block_id',
    'block_type',
    'trial_index',
    'condition',
    'stimulus_type',
    'stimulus_label',
    'stimulus_onset_perf',
    'response_perf',
    'rt_ms',
    'key_expected',
    'key_pressed',
    'is_correct',
    'is_timeout',
    'is_outlier',
    'dropped_frames',
    'focus_lost',
    'timestamp_iso',
  ];

  const rows = logs.map(l => [
    l.trialUid,
    l.sessionId,
    l.participantId,
    l.experimentId,
    l.blockId,
    l.blockType,
    l.trialIndex,
    l.condition,
    l.stimulusType,
    `"${l.stimulusLabel.replace(/"/g, '""')}"`,
    l.stimulusOnsetPerf.toFixed(3),
    l.responsePerf.toFixed(3),
    l.rtMs.toFixed(3),
    l.keyExpected,
    l.keyPressed,
    l.isCorrect ? 1 : 0,
    l.isTimeout ? 1 : 0,
    l.isOutlier ? 1 : 0,
    l.droppedFrames,
    l.focusLost ? 1 : 0,
    l.timestampIso,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanTitle = experimentTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute('download', `${cleanTitle}_raw_trials_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
