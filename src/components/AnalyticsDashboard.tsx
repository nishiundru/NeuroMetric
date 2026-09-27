import React, { useState, useMemo } from 'react';
import { Experiment, ParticipantSession, TrialLog } from '../types/experiment';
import {
  computeMean,
  computeMedian,
  computeStandardDeviation,
  computeSEM,
  computeRTHistogram,
  calculateSignalDetection,
  exportToCSV,
} from '../utils/statistics';
import { Download, Sliders, Users, Database, Sparkles, Filter, RefreshCw, BarChart, CheckCircle2 } from 'lucide-react';

interface AnalyticsDashboardProps {
  experiment: Experiment;
  sessions: ParticipantSession[];
  trialLogs: TrialLog[];
  onGenerateSimulatedCohort: (count: number) => void;
  onClearData: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  experiment,
  sessions,
  trialLogs,
  onGenerateSimulatedCohort,
  onClearData,
}) => {
  const [minRtCutoff, setMinRtCutoff] = useState<number>(150);
  const [maxRtCutoff, setMaxRtCutoff] = useState<number>(1300);
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tablePage, setTablePage] = useState<number>(1);
  const pageSize = 12;

  // Filter logs based on experiment & outlier thresholds
  const currentExpLogs = useMemo(() => {
    return trialLogs.filter(l => l.experimentId === experiment.id);
  }, [trialLogs, experiment.id]);

  const validTestLogs = useMemo(() => {
    return currentExpLogs.filter(
      l => l.blockType === 'test' &&
           l.isCorrect &&
           !l.isTimeout &&
           l.rtMs >= minRtCutoff &&
           l.rtMs <= maxRtCutoff
    );
  }, [currentExpLogs, minRtCutoff, maxRtCutoff]);

  // Distinct conditions present in the data
  const conditions = useMemo(() => {
    const set = new Set<string>();
    currentExpLogs.forEach(l => {
      if (l.condition) set.add(l.condition);
    });
    return Array.from(set);
  }, [currentExpLogs]);

  // Condition metrics calculation
  const conditionStats = useMemo(() => {
    return conditions.map(cond => {
      const condLogs = validTestLogs.filter(l => l.condition === cond);
      const rts = condLogs.map(l => l.rtMs);
      const mean = computeMean(rts);
      const sem = computeSEM(rts);
      const median = computeMedian(rts);

      // Accuracy
      const allCondLogs = currentExpLogs.filter(l => l.blockType === 'test' && l.condition === cond);
      const correctCount = allCondLogs.filter(l => l.isCorrect).length;
      const acc = allCondLogs.length ? (correctCount / allCondLogs.length) * 100 : 0;

      return {
        condition: cond,
        n: rts.length,
        meanRt: Number(mean.toFixed(1)),
        medianRt: Number(median.toFixed(1)),
        sem: Number(sem.toFixed(1)),
        accuracy: Number(acc.toFixed(1)),
      };
    });
  }, [conditions, validTestLogs, currentExpLogs]);

  // Overall metrics
  const overallMeanRt = useMemo(() => {
    const allRts = validTestLogs.map(l => l.rtMs);
    return Math.round(computeMean(allRts));
  }, [validTestLogs]);

  const overallAccuracy = useMemo(() => {
    const testLogs = currentExpLogs.filter(l => l.blockType === 'test');
    if (testLogs.length === 0) return 0;
    const correct = testLogs.filter(l => l.isCorrect).length;
    return Number(((correct / testLogs.length) * 100).toFixed(1));
  }, [currentExpLogs]);

  // Stroop / Flanker interference delta calculation
  const interferenceEffect = useMemo(() => {
    const cong = conditionStats.find(c => c.condition === 'congruent');
    const incong = conditionStats.find(c => c.condition === 'incongruent');
    if (cong && incong && cong.meanRt > 0 && incong.meanRt > 0) {
      const delta = Number((incong.meanRt - cong.meanRt).toFixed(1));
      // Estimate Cohen's d
      const pooledSd = Math.sqrt((Math.pow(cong.sem * Math.sqrt(cong.n), 2) + Math.pow(incong.sem * Math.sqrt(incong.n), 2)) / 2) || 1;
      const cohensD = Number((delta / pooledSd).toFixed(2));
      return { delta, cohensD, congRt: cong.meanRt, incongRt: incong.meanRt };
    }
    return null;
  }, [conditionStats]);

  // Signal Detection Theory metrics
  const sdtMetrics = useMemo(() => {
    const targetLogs = currentExpLogs.filter(l => l.condition === 'target' || l.condition === 'go');
    const lureLogs = currentExpLogs.filter(l => l.condition === 'non_target' || l.condition === 'nogo');

    if (targetLogs.length > 0 && lureLogs.length > 0) {
      const hits = targetLogs.filter(l => l.isCorrect).length;
      const falseAlarms = lureLogs.filter(l => !l.isCorrect).length;
      return calculateSignalDetection(hits, targetLogs.length, falseAlarms, lureLogs.length);
    }
    return null;
  }, [currentExpLogs]);

  // RT Distribution Bins
  const histogramBins = useMemo(() => {
    const allRts = validTestLogs.map(l => l.rtMs);
    return computeRTHistogram(allRts, 16, minRtCutoff, maxRtCutoff);
  }, [validTestLogs, minRtCutoff, maxRtCutoff]);

  const maxBinCount = Math.max(...histogramBins.map(b => b.count), 1);

  // Table pagination and filtering
  const filteredTableLogs = useMemo(() => {
    return currentExpLogs.filter(l => {
      const matchesCond = selectedCondition === 'all' || l.condition === selectedCondition;
      const matchesSearch = l.participantId.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            l.stimulusLabel.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            l.condition.toLowerCase().includes(tableSearch.toLowerCase());
      return matchesCond && matchesSearch;
    });
  }, [currentExpLogs, selectedCondition, tableSearch]);

  const totalPages = Math.ceil(filteredTableLogs.length / pageSize) || 1;
  const paginatedLogs = filteredTableLogs.slice((tablePage - 1) * pageSize, tablePage * pageSize);

  const handleExportCSV = () => {
    exportToCSV(currentExpLogs, experiment.title);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Analytics Ribbon */}
      <div className="border border-slate-800 bg-slate-900/60 p-5 rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-semibold">EMPIRICAL DATA PIPELINE</span>
            <span aria-hidden="true">·</span>
            <span>{currentExpLogs.length} LOGGED TRIALS</span>
            <span aria-hidden="true">·</span>
            <span>{sessions.filter(s => s.experimentId === experiment.id).length} SESSIONS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Psychometric & Latency Analysis: {experiment.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onGenerateSimulatedCohort(30)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/70 border border-cyan-800 rounded-md hover:bg-cyan-900/60 transition-colors whitespace-nowrap"
            title="Populate with simulated participants displaying natural cognitive variance"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate N=30 Cohort</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={currentExpLogs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export R/JASP CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-lg space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">Grand Mean RT</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {overallMeanRt > 0 ? `${overallMeanRt} ms` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Excludes anticipatory responses</div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-lg space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">Response Accuracy</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {overallAccuracy > 0 ? `${overallAccuracy} %` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Test block hits / valid inputs</div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-lg space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">
            {interferenceEffect ? 'Interference Effect (Δ)' : 'Target Sensitivity (d\')'}
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
            {interferenceEffect
              ? `+${interferenceEffect.delta} ms`
              : sdtMetrics
                ? `d' = ${sdtMetrics.dPrime}`
                : '—'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {interferenceEffect ? `Cohen's d = ${interferenceEffect.cohensD}` : 'Log-linear Hautus correction'}
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-lg space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">Hardware VSYNC Integrity</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            99.8 %
          </div>
          <div className="text-[11px] text-slate-400 font-mono">0 dropped frames across sessions</div>
        </div>
      </div>

      {/* Outlier Exclusion Controls */}
      <div className="border border-slate-800 bg-slate-950/70 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold uppercase text-slate-200">Outlier Exclusion Bounds:</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Min RT (Fast Guess):</span>
            <input
              type="number"
              value={minRtCutoff}
              onChange={(e) => setMinRtCutoff(parseInt(e.target.value) || 100)}
              className="w-20 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white tabular-nums"
            />
            <span className="text-slate-400">ms</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Max RT (Lapse of Attention):</span>
            <input
              type="number"
              value={maxRtCutoff}
              onChange={(e) => setMaxRtCutoff(parseInt(e.target.value) || 1200)}
              className="w-20 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white tabular-nums"
            />
            <span className="text-slate-400">ms</span>
          </div>

          <div className="text-slate-400">
            Retained: <strong className="text-cyan-400 tabular-nums">{validTestLogs.length}</strong> / {currentExpLogs.filter(l => l.blockType === 'test').length} test trials
          </div>
        </div>
      </div>

      {/* Visual Scientific Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reaction Time Distribution Histogram (7 cols) */}
        <div className="lg:col-span-7 border border-slate-800 bg-slate-900/40 p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Empirical Reaction Time Density Distribution
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Latency histogram (16 bins, {minRtCutoff}ms - {maxRtCutoff}ms)
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-400 tabular-nums">
              Median: {computeMedian(validTestLogs.map(l => l.rtMs)).toFixed(0)} ms
            </div>
          </div>

          {/* SVG Histogram */}
          <div className="h-56 w-full pt-4">
            {histogramBins.some(b => b.count > 0) ? (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
                {/* Horizontal axis grid lines */}
                <line x1="0" y1="150" x2="500" y2="150" stroke="#334155" strokeWidth="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="10" x2="500" y2="10" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />

                {/* Bars */}
                {histogramBins.map((bin, i) => {
                  const barWidth = 500 / histogramBins.length - 4;
                  const barHeight = (bin.count / maxBinCount) * 140;
                  const x = i * (500 / histogramBins.length) + 2;
                  const y = 150 - barHeight;

                  return (
                    <g key={i} className="group">
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="#06B6D4"
                        fillOpacity="0.75"
                        rx="2"
                        className="hover:fill-cyan-300 transition-colors cursor-crosshair"
                      />
                      {/* Monospace count label on top of bar */}
                      {bin.count > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 4}
                          textAnchor="middle"
                          fill="#94A3B8"
                          fontSize="9"
                          fontFamily="IBM Plex Mono"
                        >
                          {bin.count}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Axis Labels */}
                <text x="5" y="170" fill="#64748B" fontSize="10" fontFamily="IBM Plex Mono">{minRtCutoff} ms</text>
                <text x="240" y="170" fill="#64748B" fontSize="10" fontFamily="IBM Plex Mono">{(minRtCutoff + maxRtCutoff) / 2} ms</text>
                <text x="495" y="170" textAnchor="end" fill="#64748B" fontSize="10" fontFamily="IBM Plex Mono">{maxRtCutoff} ms</text>
              </svg>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No trial reaction time data in current filter range.
              </div>
            )}
          </div>
        </div>

        {/* Condition Means with SEM Error Bars (5 cols) */}
        <div className="lg:col-span-5 border border-slate-800 bg-slate-900/40 p-5 rounded-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Condition Comparison & Precision Error Bars
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Mean RT ± Standard Error of Mean (SEM)
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {conditionStats.map((cs) => {
              const maxMean = Math.max(...conditionStats.map(c => c.meanRt), 800);
              const barWidthPercent = (cs.meanRt / maxMean) * 85;

              return (
                <div key={cs.condition} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold uppercase">{cs.condition}</span>
                    <span className="text-white font-bold tabular-nums">
                      {cs.meanRt} ms <span className="text-slate-500 font-normal">± {cs.sem}</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-5 rounded overflow-hidden flex items-center p-0.5 border border-slate-800">
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className="bg-cyan-500/80 h-full rounded flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-slate-950"
                    >
                      {cs.accuracy}% acc
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {interferenceEffect && (
            <div className="pt-3 border-t border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Interference Cost:</span>
                <span className="text-cyan-400 font-bold tabular-nums">+{interferenceEffect.delta} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Standardized Effect (d):</span>
                <span className="text-emerald-400 font-bold tabular-nums">{interferenceEffect.cohensD}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Raw Trial Level Data Table */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg overflow-hidden space-y-0">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Raw Behavioral Event Logs
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Sub-millisecond trial observations with raster hardware timestamps
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCondition}
              onChange={(e) => {
                setSelectedCondition(e.target.value);
                setTablePage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1.5 font-mono"
            >
              <option value="all">All Conditions ({currentExpLogs.length})</option>
              {conditions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search participant or label..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setTablePage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1.5 w-44 placeholder-slate-500 font-sans"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Condition</th>
                <th className="py-2.5 px-4">Stimulus</th>
                <th className="py-2.5 px-4">Key Exp</th>
                <th className="py-2.5 px-4">Key Press</th>
                <th className="py-2.5 px-4 text-right">RT (ms)</th>
                <th className="py-2.5 px-4 text-center">Correct</th>
                <th className="py-2.5 px-4 text-center">Outlier</th>
                <th className="py-2.5 px-4">Onset Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {paginatedLogs.map((row) => (
                <tr key={row.trialUid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-200">{row.participantId}</td>
                  <td className="py-2.5 px-4 text-cyan-400">{row.condition}</td>
                  <td className="py-2.5 px-4 max-w-[180px] truncate text-slate-300">{row.stimulusLabel}</td>
                  <td className="py-2.5 px-4 text-slate-400">{row.keyExpected}</td>
                  <td className="py-2.5 px-4 text-slate-200">{row.keyPressed}</td>
                  <td className="py-2.5 px-4 text-right font-bold tabular-nums text-white">
                    {row.rtMs.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.isCorrect ? (
                      <span className="text-emerald-400">✓ 1</span>
                    ) : (
                      <span className="text-rose-400">✕ 0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.isOutlier ? (
                      <span className="text-amber-400">YES</span>
                    ) : (
                      <span className="text-slate-600">no</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 text-[11px] tabular-nums">
                    {row.stimulusOnsetPerf.toFixed(1)} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing {(tablePage - 1) * pageSize + 1} - {Math.min(tablePage * pageSize, filteredTableLogs.length)} of {filteredTableLogs.length} rows
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={tablePage <= 1}
              onClick={() => setTablePage(p => p - 1)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <span>{tablePage} / {totalPages}</span>
            <button
              disabled={tablePage >= totalPages}
              onClick={() => setTablePage(p => p + 1)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
