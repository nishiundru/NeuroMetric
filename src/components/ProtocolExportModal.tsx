import React, { useState } from 'react';
import { Experiment } from '../types/experiment';
import { X, Copy, Check, Download, Upload } from 'lucide-react';

interface ProtocolExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: Experiment;
  onImportProtocol: (exp: Experiment) => void;
}

export const ProtocolExportModal: React.FC<ProtocolExportModalProps> = ({
  isOpen,
  onClose,
  experiment,
  onImportProtocol,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  if (!isOpen) return null;

  const jsonString = JSON.stringify(experiment, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${experiment.id}_protocol.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDoImport = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importText);
      if (!parsed.id || !parsed.blocks || !parsed.timingSettings) {
        throw new Error('Missing required experiment fields (id, blocks, timingSettings)');
      }
      onImportProtocol(parsed);
      onClose();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Open Science Protocol Schema (OSF)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export / Import Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded text-xs font-mono">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1 rounded ${activeTab === 'export' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Export JSON Schema
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1 rounded ${activeTab === 'import' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Import External Protocol
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-4">
            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-cyan-300 max-h-72 overflow-y-auto leading-relaxed">
                {jsonString}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-500">
                JSON compliant with Open Science Framework specifications
              </span>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded hover:bg-slate-700 font-mono"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Schema'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-400 text-slate-950 rounded hover:bg-cyan-300 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Paste Raw Protocol JSON</label>
              <textarea
                rows={10}
                placeholder="Paste valid JSON protocol representation..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-cyan-200 text-xs font-mono"
              />
            </div>

            {importError && (
              <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded border border-rose-900">
                Error: {importError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDoImport}
                disabled={!importText.trim()}
                className="px-5 py-2 font-semibold text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 disabled:opacity-50"
              >
                Load Protocol
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
