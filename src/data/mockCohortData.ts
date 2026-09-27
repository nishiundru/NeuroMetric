import { ParticipantSession, TrialLog } from '../types/experiment';

export function generateRealisticCohortData(experimentId: string, count: number = 32): { sessions: ParticipantSession[]; logs: TrialLog[] } {
  const sessions: ParticipantSession[] = [];
  const logs: TrialLog[] = [];

  const browsers = ['Chrome 128.0 (Macintosh)', 'Firefox 130.0 (Windows)', 'Chrome 128.0 (Windows)', 'Edge 128.0 (Windows)', 'Safari 18.0 (Macintosh)'];
  const resolutions = ['1920x1080', '2560x1440', '1440x900', '1536x864'];
  const hzOptions = [60, 120, 144];

  for (let s = 1; s <= count; s++) {
    const participantId = `P_${(1000 + s).toString()}`;
    const sessionId = `sess_${Math.random().toString(36).substring(2, 9)}`;
    const measuredHz = hzOptions[Math.floor(Math.random() * (hzOptions.length))];
    const jitterSigma = Number((0.6 + Math.random() * 1.4).toFixed(3));
    const browser = browsers[s % browsers.length];
    const resolution = resolutions[s % resolutions.length];

    // Subject baseline RT (individual differences in processing speed)
    const subjectBaselineRt = 450 + Math.random() * 140; // e.g. 520ms
    const subjectAccuracyBias = 0.88 + Math.random() * 0.10; // 88% - 98% accuracy

    const sessionTrials: TrialLog[] = [];

    // Let's generate ~24 trials per participant
    const conditions = ['congruent', 'congruent', 'incongruent', 'incongruent'];
    const totalTrials = 24;

    for (let t = 0; t < totalTrials; t++) {
      const condition = conditions[t % conditions.length];
      const isCongruent = condition === 'congruent';

      // Cognitive effect: Incongruent is slower by ~95ms + noise
      const effectShift = isCongruent ? 0 : 85 + Math.random() * 45;
      // Ex-Gaussian tail noise
      const gaussianNoise = (Math.random() + Math.random() + Math.random() - 1.5) * 60;
      const exponentialTail = Math.random() > 0.85 ? Math.random() * 250 : 0;

      let rtMs = subjectBaselineRt + effectShift + gaussianNoise + exponentialTail;
      rtMs = Math.max(180, Math.round(rtMs * 10) / 10);

      // Accuracy: Incongruent has slightly lower accuracy
      const errorProb = isCongruent ? (1 - subjectAccuracyBias) * 0.4 : (1 - subjectAccuracyBias) * 1.3;
      const isCorrect = Math.random() > errorProb;

      const keys = ['d', 'f', 'j', 'k'];
      const correctKey = keys[t % keys.length];
      const keyPressed = isCorrect ? correctKey : keys[(t + 1) % keys.length];

      const trialUid = `log_${sessionId}_t${t + 1}`;
      const logItem: TrialLog = {
        trialUid,
        sessionId,
        participantId,
        experimentId,
        blockId: 'block_stroop_test',
        blockType: 'test',
        trialIndex: t + 1,
        condition,
        stimulusType: 'text',
        stimulusLabel: isCongruent ? 'Congruent Color-Word' : 'Incongruent Color-Word',
        stimulusOnsetPerf: 1000 + t * 2400 + Math.random() * 30,
        responsePerf: 1000 + t * 2400 + rtMs,
        rtMs,
        keyExpected: correctKey,
        keyPressed,
        isCorrect,
        isTimeout: false,
        isOutlier: rtMs < 160 || rtMs > 1300,
        droppedFrames: Math.random() > 0.95 ? 1 : 0,
        focusLost: false,
        timestampIso: new Date(Date.now() - (count - s) * 3600000 - (totalTrials - t) * 3000).toISOString(),
      };

      sessionTrials.push(logItem);
      logs.push(logItem);
    }

    const validRts = sessionTrials.filter(tr => tr.isCorrect && !tr.isOutlier).map(tr => tr.rtMs);
    const meanRtMs = validRts.length ? Math.round(validRts.reduce((a, b) => a + b, 0) / validRts.length) : 500;
    const correctCount = sessionTrials.filter(tr => tr.isCorrect).length;
    const accuracyPercent = Math.round((correctCount / totalTrials) * 100);

    sessions.push({
      sessionId,
      participantId,
      experimentId,
      status: 'completed',
      startedAt: new Date(Date.now() - (count - s) * 3600000 - 300000).toISOString(),
      completedAt: new Date(Date.now() - (count - s) * 3600000).toISOString(),
      totalTrials,
      meanRtMs,
      accuracyPercent,
      hardwareMeta: {
        browser,
        screenResolution: resolution,
        measuredHz,
        jitterSigmaMs: jitterSigma,
      },
    });
  }

  return { sessions, logs };
}
