import React, { useState } from 'react';
import { Experiment, ParadigmType } from '../types/experiment';
import { Play, Sliders, BarChart2, Share2, Copy, Check, Clock, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

interface ExperimentListProps {
  experiments: Experiment[];
  selectedExperimentId: string;
  onSelectExperiment: (exp: Experiment) => void;
  onOpenBuilder: (exp: Experiment) => void;
  onRunExperiment: (exp: Experiment) => void;
  onOpenAnalytics: (exp: Experiment) => void;
  onNewExperiment: () => void;
}

export const ExperimentList: React.FC<ExperimentListProps> = ({
  experiments,
  selectedExperimentId,
  onSelectExperiment,
  onOpenBuilder,
  onRunExperiment,
  onOpenAnalytics,
  onNewExperiment,
}) => {
  const [filterParadigm, setFilterParadigm] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredExperiments = experiments.filter((exp) => {
    const matchesParadigm = filterParadigm === 'all' || exp.paradigmType === filterParadigm;
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.recruitment.irbProtocolNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesParadigm && matchesSearch;
  });

  const handleCopyLink = (expId: string) => {
    const participantUrl = `${window.location.origin}/?study=${expId}&mode=participant`;
    navigator.clipboard.writeText(participantUrl);
    setCopiedId(expId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getParadigmLabel = (type: ParadigmType) => {
    switch (type) {
      case 'stroop': return 'Stroop Interference';
      case 'flanker': return 'Eriksen Flanker';
      case 'n_back': return 'N-Back Working Memory';
      case 'go_nogo': return 'Go / No-Go Motor Inhibition';
      case 'mental_rotation': return 'Mental Rotation';
      default: return 'Custom Cognitive Paradigm';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Protocol Status Banner */}
      <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>LABORATORY TIMING SUBSYSTEM: CALIBRATED</span>
              <span aria-hidden="true">·</span>
              <span>HARDWARE RAF CLOCK ACTIVE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Behavioral Experiment Protocols
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Design, test, and deploy cognitive psychology paradigms with frame-locked visual stimulus onset, sub-millisecond keyboard response timestamping, and crowd recruitment pipelines.
            </p>
          </div>

          <div className="flex items-center gap-6 divide-x divide-slate-800">
            <div className="space-y-0.5">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">Active Protocols</div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">{experiments.length}</div>
            </div>
            <div className="pl-6 space-y-0.5">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">Raster Timing Precision</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">±0.4 ms</div>
            </div>
            <div className="pl-6 space-y-0.5">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">IRB Verified</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">100%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Interactive Segmented Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
          <button
            onClick={() => setFilterParadigm('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterParadigm === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Paradigms ({experiments.length})
          </button>
          <button
            onClick={() => setFilterParadigm('stroop')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterParadigm === 'stroop'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stroop
          </button>
          <button
            onClick={() => setFilterParadigm('flanker')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterParadigm === 'flanker'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Flanker
          </button>
          <button
            onClick={() => setFilterParadigm('n_back')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterParadigm === 'n_back'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            N-Back
          </button>
          <button
            onClick={() => setFilterParadigm('go_nogo')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterParadigm === 'go_nogo'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Go / No-Go
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search protocols by name, IRB, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 px-3.5 py-1.5 text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-md focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>
      </div>

      {/* Experiment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredExperiments.map((exp) => {
          const totalTrials = exp.blocks.reduce((sum, b) => sum + (b.trials.length * b.repetitions), 0);
          const isSelected = exp.id === selectedExperimentId;

          return (
            <div
              key={exp.id}
              className={`border rounded-lg bg-slate-900/40 p-6 flex flex-col justify-between transition-colors ${
                isSelected ? 'border-cyan-500/80 bg-slate-900/70' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Clean unboxed metadata with separators */}
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-cyan-400 font-medium">{getParadigmLabel(exp.paradigmType)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{exp.recruitment.irbProtocolNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>v{exp.version}</span>
                  <span aria-hidden="true">·</span>
                  <span>{exp.timingSettings.targetFrameRate}Hz sync</span>
                </div>

                <h3 className="text-lg font-semibold text-white tracking-tight leading-snug">
                  {exp.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {exp.description}
                </p>

                {/* Structure metrics */}
                <div className="pt-2 grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Blocks</span>
                    <span className="text-slate-200 font-semibold tabular-nums">{exp.blocks.length} sections</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total Trials</span>
                    <span className="text-slate-200 font-semibold tabular-nums">{totalTrials} trials</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Target Sample</span>
                    <span className="text-slate-200 font-semibold tabular-nums">N = {exp.recruitment.targetSampleN}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 flex items-center justify-between gap-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onSelectExperiment(exp);
                      onOpenBuilder(exp);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 rounded hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Timeline</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectExperiment(exp);
                      onOpenAnalytics(exp);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 rounded hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Data</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(exp.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded hover:border-slate-700 transition-colors"
                    title="Copy Participant Recruitment Link"
                  >
                    {copiedId === exp.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Link</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    onSelectExperiment(exp);
                    onRunExperiment(exp);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors whitespace-nowrap"
                >
                  <Play className="w-3 h-3 fill-slate-950" />
                  <span>Run Session</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredExperiments.length === 0 && (
        <div className="border border-dashed border-slate-800 rounded-lg p-12 text-center space-y-4">
          <p className="text-sm text-slate-400">No experimental protocols match your filter criteria.</p>
          <button
            onClick={onNewExperiment}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300"
          >
            Create New Protocol
          </button>
        </div>
      )}
    </div>
  );
};
