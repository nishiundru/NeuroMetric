/**
 * NeuroMetric: Precision Behavioral Experiment Platform
 * High-precision browser-based cognitive science & psychophysics SaaS platform.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Experiment, ParticipantSession, TrialLog } from './types/experiment';
import { DEFAULT_EXPERIMENTS } from './data/defaultParadigms';
import { generateRealisticCohortData } from './data/mockCohortData';
import { Header } from './components/Header';
import { ExperimentList } from './components/ExperimentList';
import { ExperimentBuilder } from './components/ExperimentBuilder';
import { LabRunner } from './components/LabRunner';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TimingCalibration } from './components/TimingCalibration';
import { NewExperimentModal } from './components/NewExperimentModal';
import { ProtocolExportModal } from './components/ProtocolExportModal';
import { Layers, Sliders, Play, BarChart2, Activity } from 'lucide-react';

export default function App() {
  // Experiments state
  const [experiments, setExperiments] = useState<Experiment[]>(() => {
    const saved = localStorage.getItem('neurometric_experiments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_EXPERIMENTS;
  });

  const [selectedExperimentId, setSelectedExperimentId] = useState<string>(() => {
    return experiments[0]?.id || 'exp_stroop_001';
  });

  const [activeTab, setActiveTab] = useState<'experiments' | 'builder' | 'runner' | 'analytics' | 'calibration'>('experiments');

  // Participant and trial data storage
  const [allSessions, setAllSessions] = useState<ParticipantSession[]>([]);
  const [allTrialLogs, setAllTrialLogs] = useState<TrialLog[]>([]);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Initialize mock cohort on first mount if empty
  useEffect(() => {
    const initialData = generateRealisticCohortData(selectedExperimentId, 36);
    setAllSessions(initialData.sessions);
    setAllTrialLogs(initialData.logs);

    // Check URL parameters for direct participant link e.g. ?study=...&mode=participant
    const params = new URLSearchParams(window.location.search);
    const studyParam = params.get('study');
    const modeParam = params.get('mode');

    if (studyParam) {
      const match = experiments.find(e => e.id === studyParam);
      if (match) {
        setSelectedExperimentId(match.id);
        if (modeParam === 'participant') {
          setActiveTab('runner');
        }
      }
    }
  }, []);

  // Sync experiments to localStorage
  useEffect(() => {
    localStorage.setItem('neurometric_experiments', JSON.stringify(experiments));
  }, [experiments]);

  const activeExperiment = useMemo(() => {
    return experiments.find(e => e.id === selectedExperimentId) || experiments[0];
  }, [experiments, selectedExperimentId]);

  const handleUpdateExperiment = (updated: Experiment) => {
    setExperiments(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleCreateExperiment = (newExp: Experiment) => {
    setExperiments(prev => [newExp, ...prev]);
    setSelectedExperimentId(newExp.id);
    setActiveTab('builder');

    // Generate initial sample cohort for testing
    const sample = generateRealisticCohortData(newExp.id, 16);
    setAllSessions(prev => [...sample.sessions, ...prev]);
    setAllTrialLogs(prev => [...sample.logs, ...prev]);
  };

  const handleFinishRunnerSession = (session: ParticipantSession, logs: TrialLog[]) => {
    setAllSessions(prev => [session, ...prev]);
    setAllTrialLogs(prev => [...logs, ...prev]);
    setActiveTab('analytics');
  };

  const handleGenerateSimulatedCohort = (count: number) => {
    if (!activeExperiment) return;
    const generated = generateRealisticCohortData(activeExperiment.id, count);
    setAllSessions(prev => [...generated.sessions, ...prev]);
    setAllTrialLogs(prev => [...generated.logs, ...prev]);
  };

  const handleClearData = () => {
    if (!activeExperiment) return;
    setAllSessions(prev => prev.filter(s => s.experimentId !== activeExperiment.id));
    setAllTrialLogs(prev => prev.filter(l => l.experimentId !== activeExperiment.id));
  };

  // Direct participant fullscreen runner view
  if (activeTab === 'runner' && activeExperiment) {
    return (
      <LabRunner
        experiment={activeExperiment}
        onFinishSession={handleFinishRunnerSession}
        onExit={() => setActiveTab('experiments')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#3f3f3f] flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewExperiment={() => setIsNewModalOpen(true)}
        onQuickRun={() => setActiveTab('runner')}
        activeExperimentTitle={activeExperiment?.title}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 pb-20 md:pb-16">
        {activeTab === 'experiments' && (
          <ExperimentList
            experiments={experiments}
            selectedExperimentId={selectedExperimentId}
            onSelectExperiment={(exp) => setSelectedExperimentId(exp.id)}
            onOpenBuilder={(exp) => {
              setSelectedExperimentId(exp.id);
              setActiveTab('builder');
            }}
            onRunExperiment={(exp) => {
              setSelectedExperimentId(exp.id);
              setActiveTab('runner');
            }}
            onOpenAnalytics={(exp) => {
              setSelectedExperimentId(exp.id);
              setActiveTab('analytics');
            }}
            onNewExperiment={() => setIsNewModalOpen(true)}
          />
        )}

        {activeTab === 'builder' && activeExperiment && (
          <ExperimentBuilder
            experiment={activeExperiment}
            onUpdateExperiment={handleUpdateExperiment}
            onRunPreview={() => setActiveTab('runner')}
            onExportJson={() => setIsExportModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && activeExperiment && (
          <AnalyticsDashboard
            experiment={activeExperiment}
            sessions={allSessions}
            trialLogs={allTrialLogs}
            onGenerateSimulatedCohort={handleGenerateSimulatedCohort}
            onClearData={handleClearData}
          />
        )}

        {activeTab === 'calibration' && (
          <TimingCalibration />
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#e2e2e2] px-2 py-1.5 flex items-center justify-around text-[10px] font-medium text-[#6b7280]">
        <button
          onClick={() => setActiveTab('experiments')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${activeTab === 'experiments' ? 'text-[#007fd7] font-semibold' : 'hover:text-[#3f3f3f]'}`}
        >
          <Layers className="w-4 h-4" />
          <span>Studies</span>
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${activeTab === 'builder' ? 'text-[#007fd7] font-semibold' : 'hover:text-[#3f3f3f]'}`}
        >
          <Sliders className="w-4 h-4" />
          <span>Builder</span>
        </button>
        <button
          onClick={() => setActiveTab('runner')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${activeTab === 'runner' ? 'text-[#007fd7] font-semibold' : 'hover:text-[#3f3f3f]'}`}
        >
          <Play className="w-4 h-4" />
          <span>Run</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${activeTab === 'analytics' ? 'text-[#007fd7] font-semibold' : 'hover:text-[#3f3f3f]'}`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Data</span>
        </button>
        <button
          onClick={() => setActiveTab('calibration')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${activeTab === 'calibration' ? 'text-[#007fd7] font-semibold' : 'hover:text-[#3f3f3f]'}`}
        >
          <Activity className="w-4 h-4" />
          <span>Timing</span>
        </button>
      </nav>

      {/* Institutional Open Science Footer */}
      <footer className="border-t border-[#e2e2e2] bg-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-xs text-[#6b7280]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 font-mono text-center sm:text-left">
          <div>
            <span className="text-[#3f3f3f] font-semibold">NeuroMetric Behavioral Platform</span>
            <span className="mx-2 hidden sm:inline">·</span>
            <span className="block sm:inline mt-1 sm:mt-0">Open Science Framework (OSF) Compatible</span>
            <span className="mx-2 hidden sm:inline">·</span>
            <span className="block sm:inline mt-1 sm:mt-0">Sub-Millisecond VSYNC Instrumentation</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e2e2e2] w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('calibration')}
              className="hover:text-[#007fd7] transition-colors"
            >
              Hardware Latency Diagnostic
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hover:text-[#007fd7] transition-colors"
            >
              Protocol Schema Specification
            </button>
          </div>
        </div>
      </footer>

      {/* Creation Modal */}
      <NewExperimentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateExperiment}
      />

      {/* Protocol Schema Export/Import Modal */}
      {activeExperiment && (
        <ProtocolExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          experiment={activeExperiment}
          onImportProtocol={(imported) => {
            setExperiments(prev => [imported, ...prev]);
            setSelectedExperimentId(imported.id);
            setActiveTab('builder');
          }}
        />
      )}
    </div>
  );
}
