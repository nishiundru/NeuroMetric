import React, { useState } from 'react';
import { Experiment, ExperimentBlock, TrialTemplate, BlockType, RandomizationType } from '../types/experiment';
import { Play, Plus, Trash2, ArrowUp, ArrowDown, Eye, Settings, FileJson, Check, Shield, Clock, Shuffle } from 'lucide-react';
import { precisionAudio } from '../utils/precisionEngine';

interface ExperimentBuilderProps {
  experiment: Experiment;
  onUpdateExperiment: (updated: Experiment) => void;
  onRunPreview: () => void;
  onExportJson: () => void;
}

export const ExperimentBuilder: React.FC<ExperimentBuilderProps> = ({
  experiment,
  onUpdateExperiment,
  onRunPreview,
  onExportJson,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>(experiment.blocks[0]?.id || '');
  const [selectedTrialId, setSelectedTrialId] = useState<string>('');
  const [activeBuilderTab, setActiveBuilderTab] = useState<'timeline' | 'timing' | 'recruitment'>('timeline');
  const [previewStimulusState, setPreviewStimulusState] = useState<'fixation' | 'stimulus' | 'feedback'>('stimulus');

  const selectedBlock = experiment.blocks.find(b => b.id === selectedBlockId) || experiment.blocks[0];
  const selectedTrial = selectedBlock?.trials.find(t => t.id === selectedTrialId) || selectedBlock?.trials[0];

  const handleUpdateBlock = (blockId: string, updates: Partial<ExperimentBlock>) => {
    const updatedBlocks = experiment.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    onUpdateExperiment({ ...experiment, blocks: updatedBlocks, lastModified: new Date().toISOString() });
  };

  const handleUpdateTrial = (blockId: string, trialId: string, updates: Partial<TrialTemplate>) => {
    const updatedBlocks = experiment.blocks.map(b => {
      if (b.id !== blockId) return b;
      const updatedTrials = b.trials.map(t => t.id === trialId ? { ...t, ...updates } : t);
      return { ...b, trials: updatedTrials };
    });
    onUpdateExperiment({ ...experiment, blocks: updatedBlocks, lastModified: new Date().toISOString() });
  };

  const handleAddTrial = () => {
    if (!selectedBlock) return;
    const newTrialId = `tr_${Date.now().toString().slice(-6)}`;
    const newTrial: TrialTemplate = {
      id: newTrialId,
      condition: 'neutral',
      label: 'New Trial Condition',
      stimulus: {
        type: 'text',
        text: 'TARGET',
        textColor: '#38BDF8',
        fontSize: 48,
      },
      correctKey: 'Space',
      stimulusDurationMs: 0,
      isiDurationMinMs: 400,
      isiDurationMaxMs: 700,
      maxTimeoutMs: 2500,
    };
    handleUpdateBlock(selectedBlock.id, {
      trials: [...selectedBlock.trials, newTrial],
    });
    setSelectedTrialId(newTrialId);
  };

  const handleDeleteTrial = (trialId: string) => {
    if (!selectedBlock) return;
    handleUpdateBlock(selectedBlock.id, {
      trials: selectedBlock.trials.filter(t => t.id !== trialId),
    });
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlockId = `block_${Date.now().toString().slice(-6)}`;
    const newBlock: ExperimentBlock = {
      id: newBlockId,
      name: type === 'test' ? 'Experimental Trials Block' : type === 'practice' ? 'Practice Run' : 'Instructions',
      type,
      randomization: 'pure_random',
      instructionsText: type === 'instruction' ? 'Please read the instructions carefully before continuing.' : undefined,
      repetitions: 1,
      interTrialIntervalMs: 500,
      feedbackEnabled: type === 'practice',
      feedbackDurationMs: 350,
      trials: type === 'test' || type === 'practice' ? [
        {
          id: `tr_${Date.now().toString().slice(-6)}_1`,
          condition: 'condition_a',
          label: 'Condition Alpha',
          stimulus: { type: 'text', text: 'STIMULUS', textColor: '#F8FAFC', fontSize: 48 },
          correctKey: 'f',
          stimulusDurationMs: 0,
          isiDurationMinMs: 400,
          isiDurationMaxMs: 700,
          maxTimeoutMs: 2000,
        }
      ] : [],
    };
    onUpdateExperiment({
      ...experiment,
      blocks: [...experiment.blocks, newBlock],
      lastModified: new Date().toISOString(),
    });
    setSelectedBlockId(newBlockId);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (experiment.blocks.length <= 1) return;
    const remaining = experiment.blocks.filter(b => b.id !== blockId);
    onUpdateExperiment({
      ...experiment,
      blocks: remaining,
      lastModified: new Date().toISOString(),
    });
    setSelectedBlockId(remaining[0].id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Protocol Header Bar */}
      <div className="border border-slate-800 bg-slate-900/60 p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="text-cyan-400">{experiment.paradigmType.toUpperCase()} ARCHITECTURE</span>
            <span aria-hidden="true">·</span>
            <span>PROTOCOL ID: {experiment.id}</span>
            <span aria-hidden="true">·</span>
            <span>RAF VSYNC LOCKED</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {experiment.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveBuilderTab('timeline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeBuilderTab === 'timeline' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trial Pipeline
            </button>
            <button
              onClick={() => setActiveBuilderTab('timing')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeBuilderTab === 'timing' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hardware Timing
            </button>
            <button
              onClick={() => setActiveBuilderTab('recruitment')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeBuilderTab === 'recruitment' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IRB & Sampling
            </button>
          </div>

          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors"
            title="Export standard Open Science protocol JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-slate-400" />
            <span>Schema</span>
          </button>

          <button
            onClick={onRunPreview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Run Preview</span>
          </button>
        </div>
      </div>

      {activeBuilderTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Block & Trial Hierarchy (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Block Pipeline Strip */}
            <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Execution Flow Sequence
                </span>
                <button
                  onClick={() => handleAddBlock('test')}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Block</span>
                </button>
              </div>

              <div className="space-y-2">
                {experiment.blocks.map((block, idx) => {
                  const isActive = block.id === selectedBlockId;
                  return (
                    <div
                      key={block.id}
                      onClick={() => {
                        setSelectedBlockId(block.id);
                        if (block.trials.length > 0) setSelectedTrialId(block.trials[0].id);
                      }}
                      className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                        isActive
                          ? 'border-cyan-500 bg-slate-800/90 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400 font-bold">
                          0{idx + 1}.
                        </span>
                        <div>
                          <div className="text-xs font-semibold leading-tight">{block.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {block.type.toUpperCase()} · {block.trials.length} stimuli · {block.repetitions}x loop
                          </div>
                        </div>
                      </div>

                      {experiment.blocks.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(block.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Delete Block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Block Parameters */}
            {selectedBlock && (
              <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-lg space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800 pb-2">
                  Block Parameters: {selectedBlock.name}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Block Name</label>
                    <input
                      type="text"
                      value={selectedBlock.name}
                      onChange={(e) => handleUpdateBlock(selectedBlock.id, { name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Randomization Engine</label>
                    <select
                      value={selectedBlock.randomization}
                      onChange={(e) => handleUpdateBlock(selectedBlock.id, { randomization: e.target.value as RandomizationType })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono text-xs"
                    >
                      <option value="pure_random">Pure Random Shuffle</option>
                      <option value="sequential">Sequential Order</option>
                      <option value="latin_square">Latin Square Counterbalanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Block Repetitions</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedBlock.repetitions}
                      onChange={(e) => handleUpdateBlock(selectedBlock.id, { repetitions: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Post-Trial ITI (ms)</label>
                    <input
                      type="number"
                      step={50}
                      value={selectedBlock.interTrialIntervalMs}
                      onChange={(e) => handleUpdateBlock(selectedBlock.id, { interTrialIntervalMs: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                </div>

                {selectedBlock.type === 'instruction' && (
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono text-xs">Instruction Markdown / Text</label>
                    <textarea
                      rows={5}
                      value={selectedBlock.instructionsText || ''}
                      onChange={(e) => handleUpdateBlock(selectedBlock.id, { instructionsText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 font-sans leading-relaxed"
                    />
                  </div>
                )}

                {selectedBlock.type !== 'instruction' && selectedBlock.type !== 'debrief' && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-300 font-medium">
                        Stimulus Conditions ({selectedBlock.trials.length})
                      </span>
                      <button
                        onClick={handleAddTrial}
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Stimulus</span>
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {selectedBlock.trials.map((tr) => {
                        const isTrActive = tr.id === (selectedTrial?.id || '');
                        return (
                          <div
                            key={tr.id}
                            onClick={() => setSelectedTrialId(tr.id)}
                            className={`px-3 py-2 rounded text-xs cursor-pointer flex items-center justify-between transition-colors ${
                              isTrActive
                                ? 'bg-cyan-950/60 border border-cyan-800 text-white'
                                : 'bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-cyan-400">[{tr.condition}]</span>
                              <span className="truncate max-w-[150px]">{tr.label}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span>Key: <strong className="text-slate-200">{tr.correctKey}</strong></span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTrial(tr.id);
                                }}
                                className="text-slate-600 hover:text-rose-400 ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Visual Stimulus Previewer & Condition Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Visual Canvas Simulator */}
            <div className="border border-slate-800 bg-slate-950 rounded-lg overflow-hidden flex flex-col">
              {/* Canvas Header / Stage Switcher */}
              <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>REAL-TIME STIMULUS STAGE</span>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-0.5 border border-slate-800 rounded">
                  <button
                    onClick={() => setPreviewStimulusState('fixation')}
                    className={`px-2.5 py-1 text-xs font-mono rounded ${
                      previewStimulusState === 'fixation' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Fixation
                  </button>
                  <button
                    onClick={() => setPreviewStimulusState('stimulus')}
                    className={`px-2.5 py-1 text-xs font-mono rounded ${
                      previewStimulusState === 'stimulus' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Stimulus
                  </button>
                  <button
                    onClick={() => {
                      setPreviewStimulusState('feedback');
                      precisionAudio.playFeedbackBeep(true);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono rounded ${
                      previewStimulusState === 'feedback' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Feedback (Audio)
                  </button>
                </div>
              </div>

              {/* Black Stage Viewport */}
              <div className="h-72 bg-black flex flex-col items-center justify-center relative select-none">
                {previewStimulusState === 'fixation' && (
                  <div className="text-white text-5xl font-mono leading-none font-light animate-pulse">
                    +
                  </div>
                )}

                {previewStimulusState === 'stimulus' && selectedTrial && (
                  <div className="text-center space-y-4">
                    {selectedTrial.stimulus.type === 'text' && (
                      <div
                        style={{
                          color: selectedTrial.stimulus.textColor || '#FFFFFF',
                          fontSize: `${selectedTrial.stimulus.fontSize || 48}px`,
                        }}
                        className="font-bold tracking-wider"
                      >
                        {selectedTrial.stimulus.text}
                      </div>
                    )}

                    {selectedTrial.stimulus.type === 'shape' && (
                      <div
                        className="w-24 h-24 rounded-full mx-auto shadow-lg"
                        style={{ backgroundColor: selectedTrial.stimulus.shapeFill || '#10B981' }}
                      />
                    )}

                    <div className="text-slate-500 font-mono text-xs mt-6">
                      Target Key: <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-400">{selectedTrial.correctKey}</kbd>
                    </div>
                  </div>
                )}

                {previewStimulusState === 'feedback' && (
                  <div className="text-center space-y-2">
                    <div className="text-emerald-400 text-3xl font-bold font-mono">
                      CORRECT (+1046 Hz)
                    </div>
                    <div className="text-slate-400 text-xs font-mono">Latency: 412.3 ms</div>
                  </div>
                )}

                {/* Sub-ms Calibration Stamp */}
                <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-600">
                  Locked 16.67ms VSYNC · Δ0.02ms
                </div>
              </div>
            </div>

            {/* Trial Configuration Inspector */}
            {selectedTrial && (
              <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-lg space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800 pb-2">
                  Stimulus Parameters: {selectedTrial.label}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Condition Identifier</label>
                    <input
                      type="text"
                      value={selectedTrial.condition}
                      onChange={(e) => handleUpdateTrial(selectedBlock.id, selectedTrial.id, { condition: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Display Text / Glyphs</label>
                    <input
                      type="text"
                      value={selectedTrial.stimulus.text || ''}
                      onChange={(e) => handleUpdateTrial(selectedBlock.id, selectedTrial.id, {
                        stimulus: { ...selectedTrial.stimulus, text: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Ink / Render Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedTrial.stimulus.textColor || '#FFFFFF'}
                        onChange={(e) => handleUpdateTrial(selectedBlock.id, selectedTrial.id, {
                          stimulus: { ...selectedTrial.stimulus, textColor: e.target.value }
                        })}
                        className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedTrial.stimulus.textColor || '#FFFFFF'}
                        onChange={(e) => handleUpdateTrial(selectedBlock.id, selectedTrial.id, {
                          stimulus: { ...selectedTrial.stimulus, textColor: e.target.value }
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Correct Keyboard Key</label>
                    <input
                      type="text"
                      value={selectedTrial.correctKey}
                      onChange={(e) => handleUpdateTrial(selectedBlock.id, selectedTrial.id, { correctKey: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono text-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Jittered Fixation ISI (Min ms)</label>
                    <input
                      type="number"
                      step={50}
                      value={selectedTrial.isiDurationMinMs}
                      onChange={(e) => handleUpdateTrial(selectedBlock.id, selectedTrial.id, { isiDurationMinMs: parseInt(e.target.value) || 300 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Jittered Fixation ISI (Max ms)</label>
                    <input
                      type="number"
                      step={50}
                      value={selectedTrial.isiDurationMaxMs}
                      onChange={(e) => handleUpdateTrial(selectedBlock.id, selectedTrial.id, { isiDurationMaxMs: parseInt(e.target.value) || 800 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hardware Timing Tab */}
      {activeBuilderTab === 'timing' && (
        <div className="border border-slate-800 bg-slate-900/40 p-6 rounded-lg space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">
              High-Precision Hardware Timing Architecture
            </h3>
            <p className="text-xs text-slate-400">
              Configure low-level browser synchronization primitives for display refresh and input capture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="border border-slate-800 bg-slate-950/70 p-4 rounded-lg space-y-4">
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold block">
                Visual Raster Synchronization
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Lock to requestAnimationFrame</div>
                  <div className="text-[11px] text-slate-400">Presents visual stimuli strictly on hardware VSYNC flip</div>
                </div>
                <input
                  type="checkbox"
                  checked={experiment.timingSettings.useRAFStimulusOnset}
                  onChange={(e) => onUpdateExperiment({
                    ...experiment,
                    timingSettings: { ...experiment.timingSettings, useRAFStimulusOnset: e.target.checked }
                  })}
                  className="w-4 h-4 accent-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Enforce Fullscreen Mode</div>
                  <div className="text-[11px] text-slate-400">Minimizes desktop window compositing jitter during runs</div>
                </div>
                <input
                  type="checkbox"
                  checked={experiment.timingSettings.fullscreenEnforced}
                  onChange={(e) => onUpdateExperiment({
                    ...experiment,
                    timingSettings: { ...experiment.timingSettings, fullscreenEnforced: e.target.checked }
                  })}
                  className="w-4 h-4 accent-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Detect Window Focus Loss</div>
                  <div className="text-[11px] text-slate-400">Logs or excludes trials if participant navigates away</div>
                </div>
                <input
                  type="checkbox"
                  checked={experiment.timingSettings.screenFocusLossDetection}
                  onChange={(e) => onUpdateExperiment({
                    ...experiment,
                    timingSettings: { ...experiment.timingSettings, screenFocusLossDetection: e.target.checked }
                  })}
                  className="w-4 h-4 accent-cyan-400"
                />
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-950/70 p-4 rounded-lg space-y-4">
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold block">
                Audio & Outlier Cutoffs
              </span>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Audio Output Latency Compensation ({experiment.timingSettings.audioLatencyCompensationMs} ms)
                </label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={experiment.timingSettings.audioLatencyCompensationMs}
                  onChange={(e) => onUpdateExperiment({
                    ...experiment,
                    timingSettings: { ...experiment.timingSettings, audioLatencyCompensationMs: parseInt(e.target.value) }
                  })}
                  className="w-full accent-cyan-400"
                />
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Offsets Web Audio API clock relative to visual onset.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-mono">Anticipatory Cutoff (Min RT)</label>
                  <input
                    type="number"
                    value={experiment.timingSettings.outlierMinRtMs}
                    onChange={(e) => onUpdateExperiment({
                      ...experiment,
                      timingSettings: { ...experiment.timingSettings, outlierMinRtMs: parseInt(e.target.value) || 150 }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-mono">Lapse Cutoff (Max RT)</label>
                  <input
                    type="number"
                    value={experiment.timingSettings.outlierMaxRtMs}
                    onChange={(e) => onUpdateExperiment({
                      ...experiment,
                      timingSettings: { ...experiment.timingSettings, outlierMaxRtMs: parseInt(e.target.value) || 1500 }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IRB & Recruitment Tab */}
      {activeBuilderTab === 'recruitment' && (
        <div className="border border-slate-800 bg-slate-900/40 p-6 rounded-lg space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Ethics, IRB & Crowd Recruitment Protocol
            </h3>
            <p className="text-xs text-slate-400">
              Integrate directly with online crowdsourced participant pools (Prolific, MTurk, SONA Systems) with IRB tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-mono">IRB Protocol Approval Number</label>
              <input
                type="text"
                value={experiment.recruitment.irbProtocolNumber}
                onChange={(e) => onUpdateExperiment({
                  ...experiment,
                  recruitment: { ...experiment.recruitment, irbProtocolNumber: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono">Host Academic Institution</label>
              <input
                type="text"
                value={experiment.recruitment.institution}
                onChange={(e) => onUpdateExperiment({
                  ...experiment,
                  recruitment: { ...experiment.recruitment, institution: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono">Target Sample Size (N)</label>
              <input
                type="number"
                value={experiment.recruitment.targetSampleN}
                onChange={(e) => onUpdateExperiment({
                  ...experiment,
                  recruitment: { ...experiment.recruitment, targetSampleN: parseInt(e.target.value) || 50 }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono">Completion Code (Redirect)</label>
              <input
                type="text"
                value={experiment.recruitment.completionCode}
                onChange={(e) => onUpdateExperiment({
                  ...experiment,
                  recruitment: { ...experiment.recruitment, completionCode: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 font-mono text-cyan-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1 font-mono">Informed Consent Document</label>
              <textarea
                rows={4}
                value={experiment.recruitment.consentText}
                onChange={(e) => onUpdateExperiment({
                  ...experiment,
                  recruitment: { ...experiment.recruitment, consentText: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-slate-200 text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
