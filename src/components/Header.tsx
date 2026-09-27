import React from 'react';
import { Activity, Plus, Play, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'experiments' | 'builder' | 'runner' | 'analytics' | 'calibration';
  setActiveTab: (tab: 'experiments' | 'builder' | 'runner' | 'analytics' | 'calibration') => void;
  onNewExperiment: () => void;
  onQuickRun: () => void;
  activeExperimentTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewExperiment,
  onQuickRun,
  activeExperimentTitle,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element brand wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('experiments')}
            className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
            <span>NeuroMetric</span>
          </button>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab('experiments')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'experiments'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Studies
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'builder'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Protocol Builder
          </button>
          <button
            onClick={() => setActiveTab('runner')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'runner'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Lab Runner
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('calibration')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'calibration'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Timing Calibration
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onQuickRun}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 rounded-md hover:bg-cyan-900/60 transition-colors whitespace-nowrap"
            title="Launch test session in high-precision mode"
          >
            <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
            <span>Launch Participant View</span>
          </button>

          <button
            onClick={onNewExperiment}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors whitespace-nowrap shadow-sm shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Study</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
            <img
              src="/src/assets/images/avatar_dr_elena_1790398728807.jpg"
              alt="Dr. Elena Vance"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-slate-700"
              onError={(e) => {
                // Fallback avatar container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="text-left hidden lg:block">
              <div className="text-xs font-medium text-slate-200 leading-none">Dr. E. Vance</div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5 font-mono">Cognitive Lab PI</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
