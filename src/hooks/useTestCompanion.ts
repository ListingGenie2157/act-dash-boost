import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getCompanionTip } from '@/data/companionTips';

interface CompanionState {
  enabled: boolean;
  tipCount: number;
  lastTipTime: number;
  firedTips: Set<string>;
}

interface UseTestCompanionParams {
  enabled: boolean;
  section: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  totalTimeLeftSec: number;
  totalTimeSec: number;
  hasAnswer: boolean;
  answeredCount: number;
}

const TIP_COOLDOWN_MS = 45000; // 45 seconds minimum between tips
const MAX_TIPS_PER_SESSION = 12; // Don't overwhelm the student

export function useTestCompanion({
  enabled,
  section,
  currentQuestionIndex,
  totalQuestions,
  totalTimeLeftSec,
  totalTimeSec,
  hasAnswer,
  answeredCount,
}: UseTestCompanionParams) {
  const [state, setState] = useState<CompanionState>({
    enabled,
    tipCount: 0,
    lastTipTime: Date.now(),
    firedTips: new Set(),
  });
  const [internalTimeOnQuestion, setInternalTimeOnQuestion] = useState(0);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Track time on current question internally with setInterval
  useEffect(() => {
    if (!enabled) return;
    
    setInternalTimeOnQuestion(0);
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      setInternalTimeOnQuestion(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, currentQuestionIndex]);

  const canShowTip = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTip = now - stateRef.current.lastTipTime;
    
    return (
      stateRef.current.enabled &&
      stateRef.current.tipCount < MAX_TIPS_PER_SESSION &&
      timeSinceLastTip >= TIP_COOLDOWN_MS
    );
  }, []);

  const fireTip = useCallback((tipKey: string, context?: Record<string, any>) => {
    if (!canShowTip()) return;
    if (stateRef.current.firedTips.has(tipKey)) return;

    const tip = getCompanionTip(tipKey, section, context);
    if (!tip) return;

    toast.info(tip.message, {
      duration: 6000,
      icon: '💡',
      className: 'bg-blue-50 border-blue-200',
    });

    setState(prev => ({
      ...prev,
      tipCount: prev.tipCount + 1,
      lastTipTime: Date.now(),
      firedTips: new Set([...prev.firedTips, tipKey]),
    }));
  }, [canShowTip, section]);

  // Time-based triggers
  useEffect(() => {
    if (!enabled) return;

    // Spending too long on one question
    if (internalTimeOnQuestion > 60000 && !hasAnswer) {
      fireTip('TIME_WARNING_60S');
    } else if (internalTimeOnQuestion > 90000 && !hasAnswer) {
      fireTip('TIME_WARNING_90S');
    }
  }, [enabled, internalTimeOnQuestion, hasAnswer, fireTip]);

  // Progress-based triggers
  useEffect(() => {
    if (!enabled) return;

    const percentTimeUsed = ((totalTimeSec - totalTimeLeftSec) / totalTimeSec) * 100;
    const percentComplete = (answeredCount / totalQuestions) * 100;

    // Pacing warnings
    if (percentTimeUsed > 50 && percentComplete < 40) {
      fireTip('PACE_WARNING');
    }

    // Encourage guessing on blanks near end
    const unansweredCount = totalQuestions - answeredCount;
    if (totalTimeLeftSec < 300 && unansweredCount > 5) {
      fireTip('GUESS_BLANKS');
    }

    // Final push
    if (totalTimeLeftSec < 120 && unansweredCount > 0) {
      fireTip('FINAL_PUSH');
    }
  }, [enabled, totalTimeLeftSec, totalTimeSec, answeredCount, totalQuestions, fireTip]);

  // Section-specific triggers
  useEffect(() => {
    if (!enabled) return;

    // First question of section - give a strategic tip
    if (currentQuestionIndex === 0 && !stateRef.current.firedTips.has('SECTION_START')) {
      setTimeout(() => {
        fireTip('SECTION_START');
      }, 3000); // Wait 3 seconds before first tip
    }

    // Mid-section encouragement
    if (currentQuestionIndex === Math.floor(totalQuestions / 2)) {
      fireTip('MIDPOINT_ENCOURAGEMENT');
    }
  }, [enabled, currentQuestionIndex, totalQuestions, fireTip]);

  return {
    fireTip,
    tipCount: state.tipCount,
    reset: () => setState({
      enabled,
      tipCount: 0,
      lastTipTime: Date.now(),
      firedTips: new Set(),
    }),
  };
}
