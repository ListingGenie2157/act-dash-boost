import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { calculateNextReview, ReviewGrade, type ReviewCard } from '@/lib/spacedRepetition';

interface Question {
  id: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation: string | null;
}

interface ReviewCardWithQuestion extends ReviewCard {
  questions: Question;
}

export default function ReviewSpaced() {
  const navigate = useNavigate();
  const [dueCards, setDueCards] = useState<ReviewCardWithQuestion[]>([]);
  const [currentCard, setCurrentCard] = useState<ReviewCardWithQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const today = new Date().toISOString();

      const { data, error } = await supabase
        .from('review_queue')
        .select(`
          *,
          questions!inner (
            id,
            stem,
            choice_a,
            choice_b,
            choice_c,
            choice_d,
            answer,
            explanation
          )
        `)
        .eq('user_id', user.id)
        .lte('due_at', today)
        .order('due_at', { ascending: true });

      if (error) throw error;

      const cards = (data || []) as unknown as ReviewCardWithQuestion[];
      setDueCards(cards);
      if (cards.length > 0) {
        setCurrentCard(cards[0]);
      }
    } catch (error) {
      console.error('Error loading due cards:', error);
      toast.error('Failed to load review cards');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setShowAnswer(true);
  };

  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentCard) return;

    try {
      const updates = calculateNextReview(currentCard, grade);

      await supabase
        .from('review_queue')
        .update(updates)
        .eq('question_id', currentCard.question_id)
        .eq('user_id', currentCard.user_id);

      // Move to next card
      const nextCards = dueCards.filter(c => c.question_id !== currentCard.question_id);
      setDueCards(nextCards);
      setCurrentCard(nextCards[0] || null);
      setShowAnswer(false);
      setSelectedAnswer(null);
      setReviewed(prev => prev + 1);

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
      console.error('Error updating review card:', error);
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

      {currentCard ? (
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
              <p className="text-lg">{currentCard.questions.stem}</p>
            </div>

            {!showAnswer ? (
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const choiceKey = `choice_${letter.toLowerCase()}` as keyof Question;
                  return (
                    <Button
                      key={letter}
                      variant="outline"
                      className="w-full justify-start text-left h-auto p-4"
                      onClick={() => handleAnswerSelect(letter)}
                    >
                      <span className="font-semibold mr-3">{letter}.</span>
                      <span>{currentCard.questions[choiceKey]}</span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className={`p-4 rounded-lg border-2 ${
                  selectedAnswer === currentCard.questions.answer
                    ? 'bg-success/10 border-success'
                    : 'bg-destructive/10 border-destructive'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedAnswer === currentCard.questions.answer ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-semibold">
                      {selectedAnswer === currentCard.questions.answer ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm mb-2">
                    Correct Answer: <span className="font-semibold">{currentCard.questions.answer}</span>
                  </p>
                  {currentCard.questions.explanation && (
                    <p className="text-sm text-muted-foreground">
                      {currentCard.questions.explanation}
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
