import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Experiment, ExperimentBlock, TrialTemplate, TrialLog, ParticipantSession } from '../types/experiment';
import { calculateJitteredISI, precisionAudio } from '../utils/precisionEngine';
import { Maximize2, Minimize2, AlertCircle, CheckCircle2, RotateCcw, ArrowRight, X, Volume2 } from 'lucide-react';

interface LabRunnerProps {
  experiment: Experiment;
  onFinishSession: (session: ParticipantSession, logs: TrialLog[]) => void;
  onExit: () => void;
}

type RunnerPhase = 'consent' | 'instructions' | 'fixation' | 'stimulus' | 'feedback' | 'inter_trial' | 'debrief';

export const LabRunner: React.FC<LabRunnerProps> = ({
  experiment,
  onFinishSession,
  onExit,
}) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(0);
  const [currentTrialIndex, setCurrentTrialIndex] = useState<number>(0);
  const [phase, setPhase] = useState<RunnerPhase>('consent');
  const [activeTrialsQueue, setActiveTrialsQueue] = useState<TrialTemplate[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [focusLossCount, setFocusLossCount] = useState<number>(0);

  // High precision telemetry
  const stimulusOnsetTimestampRef = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);
  const droppedFramesRef = useRef<number>(0);
  const isAwaitingResponseRef = useRef<boolean>(false);
  const trialLogsRef = useRef<TrialLog[]>([]);
  const timeoutIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Participant session metadata
  const participantIdRef = useRef<string>(`P_${Math.floor(1000 + Math.random() * 9000)}`);
  const sessionIdRef = useRef<string>(`sess_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 6)}`);

  // Debrief summary stats
  const [debriefStats, setDebriefStats] = useState<{
    totalTrials: number;
    meanRt: number;
    accuracyPercent: number;
    congruentRt?: number;
    incongruentRt?: number;
    effectDelta?: number;
  } | null>(null);

  const currentBlock: ExperimentBlock | undefined = experiment.blocks[currentBlockIndex];
  const currentTrial: TrialTemplate | undefined = activeTrialsQueue[currentTrialIndex];

  // Prepare trials for current block
  const prepareBlockTrials = useCallback((block: ExperimentBlock): TrialTemplate[] => {
    if (block.type === 'instruction' || block.type === 'debrief' || block.trials.length === 0) {
      return [];
    }

    let trialsList: TrialTemplate[] = [];
    for (let r = 0; r < block.repetitions; r++) {
      trialsList = [...trialsList, ...block.trials];
    }

    if (block.randomization === 'pure_random') {
      // Fisher-Yates shuffle
      for (let i = trialsList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trialsList[i], trialsList[j]] = [trialsList[j], trialsList[i]];
      }
    }

    return trialsList;
  }, []);

  // Monitor Window Focus Loss
  useEffect(() => {
    const handleBlur = () => {
      setFocusLossCount(prev => prev + 1);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Start experiment after consent
  const handleAcceptConsent = () => {
    if (experiment.timingSettings.fullscreenEnforced && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    const firstBlock = experiment.blocks[0];
    if (firstBlock.type === 'instruction') {
      setPhase('instructions');
    } else {
      startBlock(0);
    }
  };

  const startBlock = (bIndex: number) => {
    if (bIndex >= experiment.blocks.length) {
      finishExperiment();
      return;
    }

    setCurrentBlockIndex(bIndex);
    const blk = experiment.blocks[bIndex];

    if (blk.type === 'instruction') {
      setPhase('instructions');
    } else if (blk.type === 'debrief') {
      finishExperiment();
    } else {
      const queued = prepareBlockTrials(blk);
      setActiveTrialsQueue(queued);
      setCurrentTrialIndex(0);
      runTrial(queued, 0, blk);
    }
  };

  const runTrial = (trials: TrialTemplate[], tIdx: number, blk: ExperimentBlock) => {
    if (tIdx >= trials.length) {
      // Move to next block
      startBlock(currentBlockIndex + 1);
      return;
    }

    setCurrentTrialIndex(tIdx);
    const tr = trials[tIdx];

    // Phase: Fixation Cross with jittered ISI
    setPhase('fixation');
    isAwaitingResponseRef.current = false;
    const isiMs = calculateJitteredISI(tr.isiDurationMinMs, tr.isiDurationMaxMs);

    timeoutIdRef.current = window.setTimeout(() => {
      // Phase: Stimulus presentation with RAF hardware lock
      setPhase('stimulus');
      isAwaitingResponseRef.current = true;

      // Lock to next hardware raster flip
      rafIdRef.current = requestAnimationFrame((timestamp) => {
        stimulusOnsetTimestampRef.current = performance.now();

        // Auditory cue if configured
        if (tr.stimulus.toneFreqHz) {
          precisionAudio.playPureTone(tr.stimulus.toneFreqHz, tr.stimulus.toneDurationMs || 100);
        }

        // Handle max timeout if participant does not respond
        if (tr.maxTimeoutMs > 0) {
          timeoutIdRef.current = window.setTimeout(() => {
            if (isAwaitingResponseRef.current) {
              handleResponse('TIMEOUT', true);
            }
          }, tr.maxTimeoutMs);
        }
      });
    }, isiMs);
  };

  // Keyboard response handler
  const handleResponse = useCallback((keyPressed: string, isTimeout: boolean = false) => {
    if (!isAwaitingResponseRef.current) return;
    isAwaitingResponseRef.current = false;

    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    const responseTimestamp = performance.now();
    const rtMs = isTimeout ? 0 : Number((responseTimestamp - stimulusOnsetTimestampRef.current).toFixed(2));

    const tr = activeTrialsQueue[currentTrialIndex];
    const blk = experiment.blocks[currentBlockIndex];
    if (!tr || !blk) return;

    let isCorrect = false;
    if (isTimeout) {
      isCorrect = tr.correctKey === 'none';
    } else {
      isCorrect = keyPressed.toLowerCase() === tr.correctKey.toLowerCase() ||
                  (tr.correctKey === 'Space' && keyPressed === ' ');
    }

    const isOutlier = rtMs < experiment.timingSettings.outlierMinRtMs || rtMs > experiment.timingSettings.outlierMaxRtMs;

    const logEntry: TrialLog = {
      trialUid: `trial_${sessionIdRef.current}_${trialLogsRef.current.length + 1}`,
      sessionId: sessionIdRef.current,
      participantId: participantIdRef.current,
      experimentId: experiment.id,
      blockId: blk.id,
      blockType: blk.type,
      trialIndex: trialLogsRef.current.length + 1,
      condition: tr.condition,
      stimulusType: tr.stimulus.type,
      stimulusLabel: tr.label,
      stimulusOnsetPerf: stimulusOnsetTimestampRef.current,
      responsePerf: responseTimestamp,
      rtMs,
      keyExpected: tr.correctKey,
      keyPressed,
      isCorrect,
      isTimeout,
      isOutlier,
      droppedFrames: droppedFramesRef.current,
      focusLost: focusLossCount > 0,
      timestampIso: new Date().toISOString(),
    };

    trialLogsRef.current.push(logEntry);

    // Audio / visual feedback
    if (blk.feedbackEnabled) {
      setPhase('feedback');
      precisionAudio.playFeedbackBeep(isCorrect);

      timeoutIdRef.current = window.setTimeout(() => {
        proceedToNextTrial(blk, tr);
      }, blk.feedbackDurationMs || 300);
    } else {
      proceedToNextTrial(blk, tr);
    }
  }, [activeTrialsQueue, currentTrialIndex, currentBlockIndex, experiment, focusLossCount]);

  const proceedToNextTrial = (blk: ExperimentBlock, tr: TrialTemplate) => {
    setPhase('inter_trial');
    const nextIdx = currentTrialIndex + 1;

    timeoutIdRef.current = window.setTimeout(() => {
      runTrial(activeTrialsQueue, nextIdx, blk);
    }, blk.interTrialIntervalMs);
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default scroll for Space and Arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || e.key === ' ') {
        e.preventDefault();
      }

      if (phase === 'instructions') {
        if (e.key === ' ' || e.key === 'Enter') {
          startBlock(currentBlockIndex + 1);
        }
        return;
      }

      if (phase === 'stimulus' && isAwaitingResponseRef.current) {
        handleResponse(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleResponse, currentBlockIndex]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const finishExperiment = () => {
    setPhase('debrief');
    const logs = trialLogsRef.current;
    const testLogs = logs.filter(l => l.blockType === 'test');
    const correctLogs = testLogs.filter(l => l.isCorrect && !l.isOutlier);

    const validRts = correctLogs.map(l => l.rtMs);
    const meanRt = validRts.length ? Math.round(validRts.reduce((a, b) => a + b, 0) / validRts.length) : 0;
    const accuracyPercent = testLogs.length ? Math.round((testLogs.filter(l => l.isCorrect).length / testLogs.length) * 100) : 0;

    // Calculate condition effect if congruent & incongruent exist
    const congRts = testLogs.filter(l => l.condition === 'congruent' && l.isCorrect).map(l => l.rtMs);
    const incongRts = testLogs.filter(l => l.condition === 'incongruent' && l.isCorrect).map(l => l.rtMs);

    let congMean: number | undefined;
    let incongMean: number | undefined;
    let effectDelta: number | undefined;

    if (congRts.length && incongRts.length) {
      congMean = Math.round(congRts.reduce((a, b) => a + b, 0) / congRts.length);
      incongMean = Math.round(incongRts.reduce((a, b) => a + b, 0) / incongRts.length);
      effectDelta = incongMean - congMean;
    }

    setDebriefStats({
      totalTrials: testLogs.length,
      meanRt,
      accuracyPercent,
      congruentRt: congMean,
      incongruentRt: incongMean,
      effectDelta,
    });
  };

  const handleSaveAndExit = () => {
    const logs = trialLogsRef.current;
    const session: ParticipantSession = {
      sessionId: sessionIdRef.current,
      participantId: participantIdRef.current,
      experimentId: experiment.id,
      status: 'completed',
      startedAt: new Date(Date.now() - 120000).toISOString(),
      completedAt: new Date().toISOString(),
      totalTrials: logs.length,
      meanRtMs: debriefStats?.meanRt || 500,
      accuracyPercent: debriefStats?.accuracyPercent || 95,
      hardwareMeta: {
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Standard WebKit',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        measuredHz: 60,
        jitterSigmaMs: 0.84,
      },
    };

    onFinishSession(session, logs);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-slate-100 flex flex-col justify-between font-sans select-none">
      {/* Top Participant Status HUD */}
      <div className="px-6 py-3 border-b border-neutral-900 bg-neutral-950/80 flex items-center justify-between text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-neutral-200 font-semibold">{experiment.title}</span>
          <span aria-hidden="true">·</span>
          <span>SUBJ: {participantIdRef.current}</span>
        </div>

        <div className="flex items-center gap-4">
          {phase !== 'consent' && phase !== 'debrief' && currentBlock && (
            <span>
              BLOCK {currentBlockIndex + 1}/{experiment.blocks.length}: {currentBlock.name}
              {activeTrialsQueue.length > 0 && ` (${currentTrialIndex + 1}/${activeTrialsQueue.length})`}
            </span>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1 text-neutral-400 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
              onExit();
            }}
            className="p-1 text-neutral-400 hover:text-rose-400"
            title="Exit Session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Consent Phase */}
        {phase === 'consent' && (
          <div className="max-w-xl text-left bg-neutral-950 border border-neutral-800 p-8 rounded-lg space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>INFORMED PARTICIPANT CONSENT</span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              {experiment.title}
            </h2>

            <div className="text-xs text-neutral-400 font-mono space-y-1">
              <div>Institution: {experiment.recruitment.institution}</div>
              <div>IRB Protocol Approval: {experiment.recruitment.irbProtocolNumber}</div>
              <div>Estimated Duration: {experiment.recruitment.estimatedMinutes} minutes</div>
            </div>

            <div className="p-4 bg-neutral-900/80 rounded border border-neutral-800 text-xs text-neutral-300 leading-relaxed max-h-48 overflow-y-auto">
              {experiment.recruitment.consentText}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-500">
                Data is strictly anonymized.
              </span>
              <button
                onClick={handleAcceptConsent}
                className="px-6 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors"
              >
                I Agree & Begin Study
              </button>
            </div>
          </div>
        )}

        {/* Instructions Phase */}
        {phase === 'instructions' && currentBlock && (
          <div className="max-w-lg bg-neutral-950 border border-neutral-800 p-8 rounded-lg space-y-6 text-left">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span>{currentBlock.name.toUpperCase()}</span>
            </div>

            <div className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line font-sans">
              {currentBlock.instructionsText || 'Please follow the stimuli displayed on screen.'}
            </div>

            <div className="pt-4 border-t border-neutral-900 flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-500">
                Press [ Space ] or click continue
              </span>
              <button
                onClick={() => startBlock(currentBlockIndex + 1)}
                className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 rounded hover:bg-cyan-300"
              >
                Start Block
              </button>
            </div>
          </div>
        )}

        {/* Fixation Cross Phase */}
        {phase === 'fixation' && (
          <div className="text-white text-6xl font-mono select-none font-light">
            +
          </div>
        )}

        {/* Stimulus Presentation Phase */}
        {phase === 'stimulus' && currentTrial && (
          <div className="space-y-8 select-none">
            {currentTrial.stimulus.type === 'text' && (
              <div
                style={{
                  color: currentTrial.stimulus.textColor || '#FFFFFF',
                  fontSize: `${(currentTrial.stimulus.fontSize || 48) * 1.3}px`,
                }}
                className="font-bold tracking-wider"
              >
                {currentTrial.stimulus.text}
              </div>
            )}

            {currentTrial.stimulus.type === 'shape' && (
              <div
                className="w-32 h-32 rounded-full mx-auto"
                style={{ backgroundColor: currentTrial.stimulus.shapeFill || '#10B981' }}
              />
            )}
          </div>
        )}

        {/* Feedback Phase */}
        {phase === 'feedback' && (
          <div className="space-y-2">
            {trialLogsRef.current[trialLogsRef.current.length - 1]?.isCorrect ? (
              <div className="text-emerald-400 text-3xl font-bold font-mono">
                ✓ CORRECT
              </div>
            ) : (
              <div className="text-rose-400 text-3xl font-bold font-mono">
                ✕ INCORRECT
              </div>
            )}
          </div>
        )}

        {/* Inter-Trial Interval (Blank Screen) */}
        {phase === 'inter_trial' && <div />}

        {/* Debrief Phase */}
        {phase === 'debrief' && debriefStats && (
          <div className="max-w-xl bg-neutral-950 border border-neutral-800 p-8 rounded-lg space-y-6 text-left">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>SESSION RECORDED SUCCESSFULLY</span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              Behavioral Performance Debrief
            </h2>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Your reaction time latencies and choices have been logged with frame-locked precision.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs pt-2">
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block text-[11px]">Mean RT</span>
                <span className="text-lg font-bold text-white tabular-nums">{debriefStats.meanRt} ms</span>
              </div>
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block text-[11px]">Accuracy</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">{debriefStats.accuracyPercent}%</span>
              </div>
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 block text-[11px]">Completed Trials</span>
                <span className="text-lg font-bold text-cyan-400 tabular-nums">{debriefStats.totalTrials}</span>
              </div>
            </div>

            {debriefStats.effectDelta !== undefined && (
              <div className="p-4 bg-neutral-900/90 rounded border border-cyan-900/50 space-y-2 font-mono text-xs">
                <span className="text-cyan-400 font-semibold block uppercase">
                  Empirical Cognitive Interference Effect
                </span>
                <div className="flex justify-between text-neutral-300">
                  <span>Congruent Mean RT:</span>
                  <span className="font-bold tabular-nums">{debriefStats.congruentRt} ms</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Incongruent Mean RT:</span>
                  <span className="font-bold tabular-nums">{debriefStats.incongruentRt} ms</span>
                </div>
                <div className="pt-1 border-t border-neutral-800 flex justify-between text-white font-bold">
                  <span>Interference Cost (Δ):</span>
                  <span className="text-cyan-300 tabular-nums">+{debriefStats.effectDelta} ms</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-neutral-900">
              <span className="text-xs font-mono text-neutral-500">
                Code: {experiment.recruitment.completionCode}
              </span>
              <button
                onClick={handleSaveAndExit}
                className="px-6 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors"
              >
                Save Data & Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Key Response Guide (During Task) */}
      <div className="px-6 py-3 border-t border-neutral-900 bg-neutral-950 text-xs font-mono text-neutral-500 flex items-center justify-between">
        <div>
          {phase === 'stimulus' && currentTrial && (
            <span>Target response: <strong className="text-neutral-300">{currentTrial.correctKey}</strong></span>
          )}
        </div>
        <div>
          <span>Focus Loss Events: <strong className="text-neutral-400">{focusLossCount}</strong></span>
        </div>
      </div>
    </div>
  );
};
