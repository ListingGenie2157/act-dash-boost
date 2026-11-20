import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { getBankAnswer } from '@/lib/bank';
import { completeTask } from '@/lib/supabase-client';
import { BackButton } from '@/components/BackButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { reportError } from '@/lib/errorReporter';
import { toast } from 'sonner';
import { calculateNextReview, ReviewGrade, type ReviewCard } from '@/lib/spacedRepetition';

interface StagingQuestion {
  staging_id: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  // answer and explanation fetched separately after user attempts
}

interface ReviewCardWithQuestion extends ReviewCard {
  staging_question: StagingQuestion | null;
  answer?: string;
  explanation?: string | null;
}

const PLAN_REVIEW_BLOCK = 10;

export default function ReviewSpaced() {
  const navigate = useNavigate();
  const [dueCards, setDueCards] = useState<ReviewCardWithQuestion[]>([]);
  const [currentCard, setCurrentCard] = useState<ReviewCardWithQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(0);
  // Opened from the study plan: the review task checks off after its block (max 10 cards) or when nothing is left
  const [searchParams] = useSearchParams();
  const planTaskId = searchParams.get('taskId');
  const planGoal = useRef(0);
  const planGood = useRef(0);
  const planDone = useRef(false);

  const loadDueCards = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const today = new Date().toISOString();

      // Fetch review queue items
      const { data: reviewItems, error: reviewError } = await supabase
        .from('review_queue')
        .select('*')
        .eq('user_id', user.id)
        .lte('due_at', today)
        .order('due_at', { ascending: true })
        .limit(50);

      if (reviewError) throw reviewError;

      if (!reviewItems || reviewItems.length === 0) {
        setDueCards([]);
        setLoading(false);
        return;
      }

      // review_queue.question_id is the numeric staging_id
      const stagingIds = reviewItems.map(item => Number(item.question_id));

      // Fetch staging items using safe view (excludes answer/explanation for security)
      const { data: stagingItems, error: stagingError } = await supabase
        .from('v_staging_items_public')
        .select('staging_id, question, choice_a, choice_b, choice_c, choice_d')
        .in('staging_id', stagingIds);

      if (stagingError) throw stagingError;

      // Create a map for quick lookup (filter out null staging_ids)
      const stagingMap = new Map<number, StagingQuestion>(
        (stagingItems || [])
          .filter(item => item.staging_id !== null)
          .map(item => [item.staging_id!, item as StagingQuestion])
      );

      // Merge review items with staging questions
      const allCards = reviewItems.map(item => ({
        question_id: String(item.question_id),
        user_id: item.user_id,
        due_at: item.due_at,
        interval_days: item.interval_days,
        ease: item.ease ?? 250,
        lapses: item.lapses ?? 0,
        staging_question: stagingMap.get(Number(item.question_id)) || null,
      }));

      const cards = allCards.filter(card => card.staging_question !== null) as ReviewCardWithQuestion[];

      setDueCards(cards);
      planGoal.current = Math.min(PLAN_REVIEW_BLOCK, cards.length);
      if (cards.length > 0) {
        setCurrentCard(cards[0]);
      }
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'ReviewSpaced', source: 'loadDueCards' });
      toast.error('Failed to load review cards');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  const handleAnswerSelect = async (answer: string) => {
    if (!currentCard?.staging_question) return;
    
    setSelectedAnswer(answer);
    
    // Fetch answer and explanation after user attempts (security: only available post-attempt)
    try {
      const fullQuestion = await getBankAnswer(currentCard.staging_question.staging_id);
      
      if (fullQuestion) {
        // Update current card with answer/explanation
        setCurrentCard(prev => prev ? {
          ...prev,
          answer: fullQuestion.answer,
          explanation: fullQuestion.explanation
        } : null);
      }
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'ReviewSpaced', source: 'fetchAnswer' });
    }
    
    setShowAnswer(true);
  };

  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentCard) return;

    try {
      const { question_id: _questionId, ...updates } = calculateNextReview(currentCard, grade);

      await supabase
        .from('review_queue')
        .update(updates)
        .eq('question_id', Number(currentCard.question_id))
        .eq('user_id', currentCard.user_id);

      // Move to next card
      const nextCards = dueCards.filter(c => c.question_id !== currentCard.question_id);
      setDueCards(nextCards);
      setCurrentCard(nextCards[0] || null);
      setShowAnswer(false);
      setSelectedAnswer(null);
      setReviewed(prev => prev + 1);
      if (grade === ReviewGrade.GOOD || grade === ReviewGrade.EASY) planGood.current++;
      const gradedCount = reviewed + 1;
      if (planTaskId && !planDone.current && (gradedCount >= planGoal.current || nextCards.length === 0)) {
        planDone.current = true;
        completeTask(supabase, { taskId: planTaskId, correctCount: planGood.current, totalCount: gradedCount, medianTimeMs: 0 })
          .catch(err => reportError(err instanceof Error ? err : new Error(String(err)), { page: 'ReviewSpaced', source: 'completeTask' }));
      }

      // Show feedback
      if (grade === ReviewGrade.EASY) {
        toast.success('Great! Next review in ' + updates.interval_days + ' days');
      } else if (grade === ReviewGrade.GOOD) {
        toast.success('Good job! Next review in ' + updates.interval_days + ' days');
      } else if (grade === ReviewGrade.HARD) {
        toast.info('Needs more practice. Review again in ' + updates.interval_days + ' days');
      } else {
        toast.error('Review again tomorrow');
      }
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'ReviewSpaced', source: 'updateReview' });
      toast.error('Failed to save review');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalCards = dueCards.length + reviewed;
  const progress = totalCards > 0 ? (reviewed / totalCards) * 100 : 0;

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <BackButton className="mb-6" />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <RotateCcw className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Spaced Repetition Review</h1>
            <p className="text-muted-foreground">
              {dueCards.length} cards due for review today
            </p>
          </div>
        </div>

        {totalCards > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{reviewed} / {totalCards} reviewed</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      {currentCard && currentCard.staging_question ? (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Due Today
              </Badge>
              <Badge variant="secondary">
                Interval: {currentCard.interval_days} days
              </Badge>
            </div>
            <CardTitle className="text-xl">Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-lg">{currentCard.staging_question.question}</p>
            </div>

            {!showAnswer ? (
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const choiceKey = `choice_${letter.toLowerCase()}` as keyof StagingQuestion;
                  return (
                    <Button
                      key={letter}
                      variant="outline"
                      className="w-full justify-start text-left h-auto p-4"
                      onClick={() => handleAnswerSelect(letter)}
                    >
                      <span className="font-semibold mr-3">{letter}.</span>
                      <span>{currentCard.staging_question![choiceKey] as string}</span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className={`p-4 rounded-lg border-2 ${
                  currentCard.answer && selectedAnswer === currentCard.answer
                    ? 'bg-success/10 border-success'
                    : 'bg-destructive/10 border-destructive'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {currentCard.answer && selectedAnswer === currentCard.answer ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-semibold">
                      {currentCard.answer && selectedAnswer === currentCard.answer ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm mb-2">
                    Correct Answer: <span className="font-semibold">{currentCard.answer || 'Loading...'}</span>
                  </p>
                  {currentCard.explanation && (
                    <p className="text-sm text-muted-foreground">
                      {currentCard.explanation}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-center mb-2">
                    How well did you know this?
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      variant="destructive"
                      onClick={() => handleGrade(ReviewGrade.AGAIN)}
                      className="h-auto py-3 flex-col"
                    >
                      <span className="text-lg mb-1">😟</span>
                      <span className="text-xs">Again</span>
                      <span className="text-xs opacity-70">{'<60%'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGrade(ReviewGrade.HARD)}
                      className="h-auto py-3 flex-col border-warning text-warning hover:bg-warning/10"
                    >
                      <span className="text-lg mb-1">😕</span>
                      <span className="text-xs">Hard</span>
                      <span className="text-xs opacity-70">60-80%</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGrade(ReviewGrade.GOOD)}
                      className="h-auto py-3 flex-col border-primary text-primary hover:bg-primary/10"
                    >
                      <span className="text-lg mb-1">🙂</span>
                      <span className="text-xs">Good</span>
                      <span className="text-xs opacity-70">80-90%</span>
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleGrade(ReviewGrade.EASY)}
                      className="h-auto py-3 flex-col bg-success hover:bg-success/90"
                    >
                      <span className="text-lg mb-1">😄</span>
                      <span className="text-xs">Easy</span>
                      <span className="text-xs opacity-70">{'>90%'}</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-4" />
            <h2 className="text-2xl font-bold mb-2">All Done!</h2>
            <p className="text-muted-foreground mb-6">
              {reviewed > 0 
                ? `Great job! You reviewed ${reviewed} card${reviewed > 1 ? 's' : ''} today.`
                : 'No cards due for review today.'}
            </p>
            <Button onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
