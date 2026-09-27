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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#e2e2e2] rounded max-w-lg w-full p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#007fd7]" />
            <h3 className="text-base font-bold text-[#3f3f3f] tracking-tight">Create Behavioral Experiment</h3>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#3f3f3f] p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="text-[#3f3f3f] block mb-1 font-mono font-medium">Experiment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#e2e2e2] rounded px-3 py-2 text-[#3f3f3f] text-xs focus:outline-none focus:border-[#007fd7] font-sans"
            />
          </div>

          <div>
            <label className="text-[#3f3f3f] block mb-1 font-mono font-medium">Cognitive Paradigm Template</label>
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
                    ? 'border-[#007fd7] bg-[#007fd7]/5 text-[#007fd7]'
                    : 'border-[#e2e2e2] bg-[#f8f9fa] text-[#3f3f3f] hover:border-[#d1d5db]'
                }`}
              >
                <div className="font-semibold text-[#3f3f3f]">Stroop Interference</div>
                <div className="text-[10px] text-[#6b7280] mt-0.5 font-sans">Selective attention & inhibition</div>
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
                    ? 'border-[#007fd7] bg-[#007fd7]/5 text-[#007fd7]'
                    : 'border-[#e2e2e2] bg-[#f8f9fa] text-[#3f3f3f] hover:border-[#d1d5db]'
                }`}
              >
                <div className="font-semibold text-[#3f3f3f]">Eriksen Flanker</div>
                <div className="text-[10px] text-[#6b7280] mt-0.5 font-sans">Visuospatial attention conflict</div>
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
                    ? 'border-[#007fd7] bg-[#007fd7]/5 text-[#007fd7]'
                    : 'border-[#e2e2e2] bg-[#f8f9fa] text-[#3f3f3f] hover:border-[#d1d5db]'
                }`}
              >
                <div className="font-semibold text-[#3f3f3f]">N-Back Memory</div>
                <div className="text-[10px] text-[#6b7280] mt-0.5 font-sans">Working memory updating</div>
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
                    ? 'border-[#007fd7] bg-[#007fd7]/5 text-[#007fd7]'
                    : 'border-[#e2e2e2] bg-[#f8f9fa] text-[#3f3f3f] hover:border-[#d1d5db]'
                }`}
              >
                <div className="font-semibold text-[#3f3f3f]">Go / No-Go</div>
                <div className="text-[10px] text-[#6b7280] mt-0.5 font-sans">Motor response suppression</div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[#3f3f3f] block mb-1 font-mono font-medium">IRB Protocol Identification</label>
            <input
              type="text"
              value={irbNumber}
              onChange={(e) => setIrbNumber(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#e2e2e2] rounded px-3 py-2 text-[#3f3f3f] font-mono text-xs focus:outline-none focus:border-[#007fd7]"
            />
          </div>

          <div>
            <label className="text-[#3f3f3f] block mb-1 font-mono font-medium">Study Abstract / Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#e2e2e2] rounded p-2.5 text-[#3f3f3f] text-xs leading-relaxed focus:outline-none focus:border-[#007fd7]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e2e2e2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#6b7280] hover:text-[#3f3f3f] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-medium text-xs text-white bg-[#007fd7] rounded hover:bg-[#006cb8] transition-colors"
            >
              Create Protocol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
