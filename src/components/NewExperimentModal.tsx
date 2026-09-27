import React, { useState } from 'react';
import { Experiment, ParadigmType } from '../types/experiment';
import { X, Layers, Sparkles, Check } from 'lucide-react';
import { DEFAULT_EXPERIMENTS } from '../data/defaultParadigms';

interface NewExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newExp: Experiment) => void;
}

export const NewExperimentModal: React.FC<NewExperimentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState<string>('New Cognitive Experiment');
  const [paradigmType, setParadigmType] = useState<ParadigmType>('stroop');
  const [description, setDescription] = useState<string>('Behavioral assessment measuring cognitive processing speed and accuracy under controlled conditions.');
  const [irbNumber, setIrbNumber] = useState<string>(`IRB-${new Date().getFullYear()}-BEHAV-${Math.floor(100 + Math.random() * 900)}`);
  const [templateSource, setTemplateSource] = useState<string>('stroop');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use selected default paradigm as baseline if available
    const baseTemplate = DEFAULT_EXPERIMENTS.find(e => e.paradigmType === templateSource) || DEFAULT_EXPERIMENTS[0];

    const newExperiment: Experiment = {
      ...baseTemplate,
      id: `exp_${paradigmType}_${Date.now().toString().slice(-6)}`,
      title,
      paradigmType,
      description,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'calibrated',
      recruitment: {
        ...baseTemplate.recruitment,
        irbProtocolNumber: irbNumber,
        completionCode: `COMPL_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      },
    };

    onCreate(newExperiment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Create Behavioral Experiment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="text-slate-300 block mb-1 font-mono">Experiment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-mono">Cognitive Paradigm Template</label>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <button
                type="button"
                onClick={() => {
                  setParadigmType('stroop');
                  setTemplateSource('stroop');
                  setTitle('Stroop Color-Word Interference');
                }}
                className={`p-2.5 rounded border text-left transition-colors ${
                  templateSource === 'stroop'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-slate-200">Stroop Interference</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Selective attention & inhibition</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setParadigmType('flanker');
                  setTemplateSource('flanker');
                  setTitle('Eriksen Flanker Task');
                }}
                className={`p-2.5 rounded border text-left transition-colors ${
                  templateSource === 'flanker'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-slate-200">Eriksen Flanker</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Visuospatial attention conflict</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setParadigmType('n_back');
                  setTemplateSource('n_back');
                  setTitle('2-Back Working Memory Protocol');
                }}
                className={`p-2.5 rounded border text-left transition-colors ${
                  templateSource === 'n_back'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-slate-200">N-Back Memory</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Working memory updating</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setParadigmType('go_nogo');
                  setTemplateSource('go_nogo');
                  setTitle('Go / No-Go Motor Inhibition');
                }}
                className={`p-2.5 rounded border text-left transition-colors ${
                  templateSource === 'go_nogo'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-slate-200">Go / No-Go</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Motor response suppression</div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-mono">IRB Protocol Identification</label>
            <input
              type="text"
              value={irbNumber}
              onChange={(e) => setIrbNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-mono">Study Abstract / Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white text-xs leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors"
            >
              Create Protocol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
