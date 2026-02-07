import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Question } from '@/types';
import { shuffleQuestionChoices } from '@/lib/shuffle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Timer } from 'lucide-react';
import { drillRunnerSchema, safeValidateInput } from '@/lib/validation/edgeFunctionSchemas';
import { LiveStreakCounter } from '@/components/LiveStreakCounter';
import { BreakModal } from '@/components/BreakModal';
import { getRunStyle, type RunStyle } from '@/lib/runStyles';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function DrillRunner() {
  const navigate = useNavigate();
  const { subject } = useParams<{ subject?: string }>();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);
  const [lastAnswerTime, setLastAnswerTime] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  
  // Streak tracking for ADHD dopamine feedback
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakEvent, setStreakEvent] = useState<'scored' | 'broke' | null>(null);
  
  // Run Style state
  const [runStyle, setRunStyle] = useState<RunStyle | null>(null);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Initialize run style from URL params
  useEffect(() => {
    const styleId = searchParams.get('runStyle');
    const style = getRunStyle(styleId || 'sprint');
    if (style) {
      setRunStyle(style);
    }
    
    // Initialize timer from URL params
    const timeParam = searchParams.get('time');
    if (timeParam) {
      const time = parseInt(timeParam, 10);
      if (!isNaN(time) && time > 0) {
        setTimeLeft(time);
      }
    }
  }, [searchParams]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || completed || isOnBreak) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          toast.warning("Time's up! Drill completed.");
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, completed, isOnBreak]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }
        setUserId(user.id);

        // Validate parameters
        const nParam = searchParams.get('n');
        const validation = safeValidateInput(drillRunnerSchema, {
          subject: subject,
          n: nParam ? parseInt(nParam, 10) : undefined
        });

        if (!validation.success) {
          setError(validation.error);
          setLoading(false);
          return;
        }

        const { subject: validSubject, n } = validation.data;

        // Map subject to drill form ID (accepts full subject names)
        const formIdMap: Record<string, string> = {
          'Reading': 'DR_RD',
          'RD': 'DR_RD',
          'Math': 'DR_MA',
          'MA': 'DR_MA',
          'English': 'DR_EN',
          'EN': 'DR_EN',
          'Science': 'DR_SC',
          'SC': 'DR_SC',
        };
        const drillFormId = formIdMap[validSubject];

        if (!drillFormId) {
          setError('Invalid drill subject');
          setLoading(false);
          return;
        }

        // Fetch questions from v_staging_items_public (answer/explanation excluded for security)
        const { data, error: qError } = await supabase
          .from('v_staging_items_public')
          .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, skill_code, form_id')
          .eq('form_id', drillFormId)
          .limit(n ?? 10); // Use default of 10 if undefined

        if (qError) {
          setError(qError.message);
        } else if (!data || data.length === 0) {
          setError('No questions found for this section');
        } else {
          // Map v_staging_items_public to Question type
          // Note: answer is validated server-side, not available client-side
          const mappedQuestions: Question[] = data.map((q) => ({
            id: String(q.staging_id || ''),
            stem: q.question || '',
            choice_a: q.choice_a || '',
            choice_b: q.choice_b || '',
            choice_c: q.choice_c || '',
            choice_d: q.choice_d || '',
            answer: 'A' as const, // Placeholder - actual validation is server-side
            skill_code: q.skill_code ?? undefined,
            form_id: q.form_id ?? undefined,
          }));
          
          // Filter out questions with invalid answers
          const validQuestions = mappedQuestions.filter(q => {
            const isValid = q.answer && ['A', 'B', 'C', 'D'].includes(q.answer);
            if (!isValid) {
              logger.debug(`Skipping question ${q.id} with invalid answer: "${q.answer}"`);
            }
            return isValid;
          });
          
          if (validQuestions.length === 0) {
            setError('No valid questions found for this section');
          } else {
            setQuestions(validQuestions);
            if (validQuestions.length < mappedQuestions.length) {
              logger.debug(`Filtered out ${mappedQuestions.length - validQuestions.length} questions with invalid answers`);
            }
            
            // Create study_task for tracking
            const { data: taskData, error: taskError } = await supabase
              .from('study_tasks')
              .insert({
                user_id: user.id,
                type: 'DRILL',
                the_date: new Date().toISOString().split('T')[0],
                size: validQuestions.length,
                status: 'IN_PROGRESS',
              })
              .select('id')
              .single();
            
            if (!taskError && taskData) {
              setTaskId(taskData.id);
            }
            
            setLastAnswerTime(Date.now());
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [subject, searchParams]);

  const handleAnswer = async (selectedIdx: number, choiceOrder: number[] = [0, 1, 2, 3]) => {
    if (!userId || isSubmitting) return;
    const q = questions[current];
    if (!q) return;
    
    setIsSubmitting(true);
    const correctIdx = ['A', 'B', 'C', 'D'].indexOf(q.answer);
    const isCorrect = selectedIdx === correctIdx;
    const now = Date.now();
    const timeSpent = now - lastAnswerTime;
    
    // Track timing
    setAnswerTimes(prev => [...prev, timeSpent]);
    setLastAnswerTime(now);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      // Update streak
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      setStreakEvent('scored');
    } else {
      // Break streak
      if (currentStreak > 0) {
        setStreakEvent('broke');
      }
      setCurrentStreak(0);
    }
    // Clear streak event after animation
    setTimeout(() => setStreakEvent(null), 600);
    
    try {
      // Track attempt in database with task_id and actual shuffled choice_order
      await supabase.from('attempts').insert({
        user_id: userId,
        question_id: q.id,
        form_id: q.form_id ?? 'drill',
        question_ord: current + 1,
        choice_order: choiceOrder,
        correct_idx: correctIdx,
        selected_idx: selectedIdx,
        task_id: taskId,
      });
      
      // Add to review queue if incorrect (spaced repetition)
      if (!isCorrect) {
        const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        await supabase.from('review_queue').insert({
          user_id: userId,
          question_id: q.id,
          due_at: dueDate.toISOString(),
          interval_days: 2,
        });
        
        // Record in error_bank using atomic RPC (replaces N+1 SELECT/INSERT/UPDATE)
        await supabase.rpc('increment_error_bank', {
          p_user_id: userId,
          p_question_id: q.id,
        });
      }
    } catch (err) {
      console.error('Error tracking drill answer:', err);
    } finally {
      setIsSubmitting(false);
    }
    
    // Move to next question or complete
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      
      // Check for Pomodoro break
      if (runStyle?.id === 'pomodoro' && runStyle.breakAfter) {
        const questionsAnswered = current + 1;
        if (questionsAnswered === runStyle.breakAfter) {
          setShowBreakModal(true);
        }
      }
    } else {
      // Drill complete - update study_task
      const newAnswerTimes = [...answerTimes, timeSpent];
      const finalCorrectCount = correctCount + (isCorrect ? 1 : 0);
      const accuracy = finalCorrectCount / questions.length;
      const sortedTimes = [...newAnswerTimes].sort((a, b) => a - b);
      const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)] || 0;
      
      if (taskId) {
        await supabase
          .from('study_tasks')
          .update({
            status: 'DONE',
            accuracy,
            median_time_ms: medianTime,
          })
          .eq('id', taskId);
      }
      
      setCompleted(true);
    }
  };

  // Break modal handlers
  const handleTakeBreak = () => {
    setIsOnBreak(true);
    setShowBreakModal(false);
    toast.info('Break started! Timer paused for 2 minutes. ☕');
    
    // Auto-resume after 2 minutes
    setTimeout(() => {
      setIsOnBreak(false);
      toast.success('Break over! Let\'s finish strong! 💪');
    }, 120000); // 2 minutes
  };

  const handleContinueWithoutBreak = () => {
    setShowBreakModal(false);
  };

  // Shuffle current question's choices
  const shuffled = useMemo(() => {
    if (!questions[current]) return null;
    const seed = userId ? `${userId}-${questions[current].id}` : undefined;
    return shuffleQuestionChoices(questions[current], seed);
  }, [current, questions, userId]);

  if (loading) return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate('/drill-runner')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <div className="mt-4">Loading questions...</div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate('/drill-runner')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <div className="mt-8 max-w-md mx-auto">
        <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
          <div className="text-5xl">📚</div>
          <h3 className="text-xl font-semibold">Content Coming Soon</h3>
          <p className="text-muted-foreground">
            {error === 'No questions found for this section' || error === 'No valid questions found for this section'
              ? 'We\'re working on adding questions for this section. Check back soon!'
              : error}
          </p>
          <Button onClick={() => navigate('/drill-runner')} className="mt-4">
            Browse Other Drills
          </Button>
        </div>
      </div>
    </div>
  );

  if (completed) return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate('/drill-runner')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <div className="mt-8 max-w-md mx-auto text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h3 className="text-2xl font-bold">Drill Complete!</h3>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-3xl font-bold text-primary">{correctCount}/{questions.length}</div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-3xl font-bold text-primary">🔥 {bestStreak}</div>
            <div className="text-sm text-muted-foreground">Best Streak</div>
          </div>
        </div>
        <Button onClick={() => navigate('/drill-runner')} className="mt-6">
          Back to Drills
        </Button>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate('/drill-runner')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <div className="mt-4">No questions found.</div>
    </div>
  );

  if (!shuffled) return <div className="p-4">Loading question...</div>;

  const handleShuffledAnswer = async (shuffledIndex: number) => {
    if (!shuffled) return;
    
    // Map shuffled index back to original index and pass actual choice order for DB persistence
    const originalIndex = shuffled.choiceOrder[shuffledIndex];
    await handleAnswer(originalIndex, shuffled.choiceOrder);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Break Modal for Pomodoro Style */}
      <BreakModal
        open={showBreakModal}
        questionsCompleted={current + 1}
        onTakeBreak={handleTakeBreak}
        onContinue={handleContinueWithoutBreak}
      />

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => navigate('/drill-runner')}
          aria-label="Back to Drills"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Drills
        </Button>
        <div className="flex items-center gap-3">
          {/* Timer Display */}
          {timeLeft !== null && timeLeft > 0 && (
            <Badge variant={timeLeft < 60 ? 'destructive' : 'secondary'} className="font-mono flex items-center gap-1" aria-live="polite" aria-atomic="true">
              <Timer className="h-3 w-3" aria-hidden="true" />
              {formatTime(timeLeft)}
              {isOnBreak && <span className="ml-1 text-xs">(Break)</span>}
            </Badge>
          )}
          <LiveStreakCounter
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            streakEvent={streakEvent}
          />
        </div>
      </div>
      <h2 className="font-bold mb-4">Drill Question {current + 1} of {questions.length}</h2>
      <p className="mb-4">{shuffled.original.stem}</p>
      <div className="space-y-2">
        {shuffled.choices.map((choice, i) => (
          <button
            key={i}
            className="w-full border rounded-md p-2 text-left hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleShuffledAnswer(i)}
            disabled={isSubmitting || isOnBreak}
          >
            <span className="font-semibold mr-2">{['A', 'B', 'C', 'D'][i]})</span>
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
