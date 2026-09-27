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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#e2e2e2] rounded max-w-2xl w-full p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#007fd7]" />
            <h3 className="text-base font-bold text-[#3f3f3f] tracking-tight">Open Science Protocol Schema (OSF)</h3>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#3f3f3f] p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export / Import Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#f8f9fa] border border-[#e2e2e2] rounded text-xs font-mono">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'export' ? 'bg-[#3f3f3f] text-white font-medium' : 'text-[#6b7280] hover:text-[#3f3f3f]'}`}
          >
            Export JSON Schema
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'import' ? 'bg-[#3f3f3f] text-white font-medium' : 'text-[#6b7280] hover:text-[#3f3f3f]'}`}
          >
            Import External Protocol
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-4">
            <div className="relative">
              <pre className="p-3.5 sm:p-4 bg-[#f8f9fa] rounded border border-[#e2e2e2] text-[11px] font-mono text-[#3f3f3f] max-h-64 sm:max-h-72 overflow-y-auto leading-relaxed">
                {jsonString}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] sm:text-xs font-mono text-[#6b7280]">
                JSON compliant with Open Science Framework specifications
              </span>

              <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] border border-[#e2e2e2] text-[#3f3f3f] rounded hover:bg-[#e9ecef] font-mono"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#007fd7]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Schema'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#007fd7] text-white rounded hover:bg-[#006cb8] font-medium transition-colors"
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
              <label className="text-[#3f3f3f] block mb-1">Paste Raw Protocol JSON</label>
              <textarea
                rows={9}
                placeholder="Paste valid JSON protocol representation..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#e2e2e2] rounded p-3 text-[#3f3f3f] text-xs font-mono focus:outline-none focus:border-[#007fd7]"
              />
            </div>

            {importError && (
              <div className="text-xs text-[#de0606] bg-[#de0606]/10 p-2.5 rounded border border-[#de0606]/20">
                Error: {importError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e2e2e2]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[#6b7280] hover:text-[#3f3f3f] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDoImport}
                disabled={!importText.trim()}
                className="px-5 py-2 font-medium text-white bg-[#007fd7] rounded hover:bg-[#006cb8] disabled:opacity-50 transition-colors"
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
