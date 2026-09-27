export type ParadigmType = 'stroop' | 'flanker' | 'n_back' | 'go_nogo' | 'mental_rotation' | 'custom';

export type BlockType = 'instruction' | 'practice' | 'test' | 'debrief';

export type RandomizationType = 'sequential' | 'pure_random' | 'latin_square' | 'blocked';

export type ResponseModality = 'keyboard' | 'mouse' | 'touch';

export interface StimulusDefinition {
  type: 'text' | 'shape' | 'fixation' | 'tone' | 'compound' | 'rotation';
  text?: string;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  shape?: 'circle' | 'square' | 'arrow_left' | 'arrow_right' | 'arrow_up' | 'arrow_down';
  shapeFill?: string;
  flankers?: string; // For flanker task e.g. '<<<<<'
  nBackLetter?: string;
  isNBackTarget?: boolean;
  rotationAngle?: number;
  rotationMatch?: boolean;
  toneFreqHz?: number;
  toneDurationMs?: number;
}

export interface TrialTemplate {
  id: string;
  condition: string; // e.g. 'congruent', 'incongruent', 'target', 'go', 'nogo'
  label: string;
  stimulus: StimulusDefinition;
  correctKey: string; // e.g. 'f', 'j', 'ArrowLeft', 'ArrowRight', 'Space', 'none'
  stimulusDurationMs: number; // 0 = until response
  isiDurationMinMs: number; // Jitter min
  isiDurationMaxMs: number; // Jitter max
  maxTimeoutMs: number;
}

export interface ExperimentBlock {
  id: string;
  name: string;
  type: BlockType;
  randomization: RandomizationType;
  instructionsText?: string;
  trials: TrialTemplate[];
  repetitions: number; // How many times trials are repeated
  interTrialIntervalMs: number;
  feedbackEnabled: boolean;
  feedbackDurationMs: number;
  breakDurationSeconds?: number;
}

export interface TimingSettings {
  targetFrameRate: 60 | 120 | 144;
  useRAFStimulusOnset: boolean;
  audioLatencyCompensationMs: number;
  subMillisecondTimestamping: boolean;
  screenFocusLossDetection: boolean;
  fullscreenEnforced: boolean;
  outlierMinRtMs: number;
  outlierMaxRtMs: number;
}

export interface RecruitmentConfig {
  platform: 'prolific' | 'mturk' | 'sona' | 'direct_link';
  completionCode: string;
  targetSampleN: number;
  estimatedMinutes: number;
  irbProtocolNumber: string;
  institution: string;
  consentText: string;
  compensationAmount: string;
}

export interface Experiment {
  id: string;
  title: string;
  paradigmType: ParadigmType;
  description: string;
  version: string;
  author: string;
  createdAt: string;
  lastModified: string;
  status: 'draft' | 'calibrated' | 'active_collection' | 'archived';
  timingSettings: TimingSettings;
  recruitment: RecruitmentConfig;
  blocks: ExperimentBlock[];
}

export interface TrialLog {
  trialUid: string;
  sessionId: string;
  participantId: string;
  experimentId: string;
  blockId: string;
  blockType: BlockType;
  trialIndex: number;
  condition: string;
  stimulusType: string;
  stimulusLabel: string;
  stimulusOnsetPerf: number;
  responsePerf: number;
  rtMs: number;
  keyExpected: string;
  keyPressed: string;
  isCorrect: boolean;
  isTimeout: boolean;
  isOutlier: boolean;
  droppedFrames: number;
  focusLost: boolean;
  timestampIso: string;
}

export interface ParticipantSession {
  sessionId: string;
  participantId: string;
  experimentId: string;
  status: 'completed' | 'abandoned' | 'screened_out';
  startedAt: string;
  completedAt?: string;
  totalTrials: number;
  meanRtMs: number;
  accuracyPercent: number;
  hardwareMeta: {
    browser: string;
    screenResolution: string;
    measuredHz: number;
    jitterSigmaMs: number;
  };
}

export interface HardwareBenchmarkResult {
  measuredFps: number;
  frameJitterSigmaMs: number;
  estimatedDisplayLatencyMs: number;
  hardwareConfidence: 'optimal' | 'acceptable' | 'unreliable';
  testedFramesCount: number;
  droppedFrameCount: number;
}
