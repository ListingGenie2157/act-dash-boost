import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format } from 'date-fns';

interface AttemptWithQuestion {
  id: string;
  question_id: string;
  selected_idx: number | null;
  correct_idx: number;
  question_ord: number;
  question?: string;
  choice_a?: string;
  choice_b?: string;
  choice_c?: string;
  choice_d?: string;
  explanation?: string | null;
  skill_code?: string;
}

interface DrillTask {
  id: string;
  the_date: string;
  size: number;
  accuracy: number | null;
  median_time_ms: number | null;
  skill_id: string | null;
  skills: { name: string; subject: string } | null;
}

export default function DrillDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<DrillTask | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDrillDetail() {
      if (!taskId) {
        setError('No drill ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch task details
        const { data: taskData, error: taskError } = await supabase
          .from('study_tasks')
          .select('id, the_date, size, accuracy, median_time_ms, skill_id, skills(name, subject)')
          .eq('id', taskId)
          .eq('user_id', user.id)
          .single();

        if (taskError || !taskData) {
          setError('Drill not found');
          setLoading(false);
          return;
        }

        setTask(taskData as DrillTask);

        // Fetch attempts for this task
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('attempts')
          .select('id, question_id, selected_idx, correct_idx, question_ord')
          .eq('task_id', taskId)
          .eq('user_id', user.id)
          .order('question_ord');

        if (attemptsError) {
          console.error('Error fetching attempts:', attemptsError);
          setAttempts([]);
        } else if (attemptsData && attemptsData.length > 0) {
          // Fetch question details from staging_items
          const questionIds = attemptsData.map(a => a.question_id);
          const { data: questionsData } = await supabase
            .from('staging_items')
            .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, explanation, skill_code')
            .in('staging_id', questionIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id)));

          // Merge attempts with question data
          const merged = attemptsData.map(attempt => {
            const question = questionsData?.find(q => String(q.staging_id) === attempt.question_id);
            return {
              ...attempt,
              question: question?.question,
              choice_a: question?.choice_a,
              choice_b: question?.choice_b,
              choice_c: question?.choice_c,
              choice_d: question?.choice_d,
              explanation: question?.explanation,
              skill_code: question?.skill_code,
            };
          });

          setAttempts(merged);
        }
      } catch (err) {
        console.error('Error loading drill detail:', err);
        setError('Failed to load drill details');
      } finally {
        setLoading(false);
      }
    }

    void fetchDrillDetail();
  }, [taskId, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !task) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button variant="outline" onClick={() => navigate('/drill-history')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">{error || 'Drill not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const correctCount = attempts.filter(a => a.selected_idx === a.correct_idx).length;
  const incorrectCount = attempts.filter(a => a.selected_idx !== null && a.selected_idx !== a.correct_idx).length;
  const choices = ['A', 'B', 'C', 'D'];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button variant="outline" onClick={() => navigate('/drill-history')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to History
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Drill Review
              </CardTitle>
              <CardDescription>
                {format(new Date(task.the_date), 'MMMM d, yyyy')}
                {task.skills && ` • ${task.skills.name}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {task.accuracy !== null && (
                <Badge variant={task.accuracy >= 0.7 ? 'default' : 'destructive'}>
                  {(task.accuracy * 100).toFixed(0)}% accuracy
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-success">{correctCount}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-destructive">{incorrectCount}</p>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{task.size}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
          <CardDescription>Click on a question to see the explanation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {attempts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No question data available for this drill.</p>
              <p className="text-sm mt-1">Older drills may not have detailed tracking.</p>
            </div>
          ) : (
            attempts.map((attempt, index) => {
              const isCorrect = attempt.selected_idx === attempt.correct_idx;
              const selectedLetter = attempt.selected_idx !== null ? choices[attempt.selected_idx] : '—';
              const correctLetter = choices[attempt.correct_idx];

              return (
                <Collapsible key={attempt.id}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium">Question {index + 1}</span>
                        {attempt.skill_code && (
                          <Badge variant="outline" className="text-xs">
                            {attempt.skill_code}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className={isCorrect ? 'text-success font-medium' : 'text-destructive font-medium'}>
                            {selectedLetter}
                          </span>
                          {!isCorrect && (
                            <>
                              <span className="text-muted-foreground"> • Correct: </span>
                              <span className="text-success font-medium">{correctLetter}</span>
                            </>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border border-t-0 rounded-b-lg bg-muted/30 space-y-3">
                      {attempt.question && (
                        <div>
                          <p className="font-medium mb-2">Question:</p>
                          <p className="text-sm">{attempt.question}</p>
                        </div>
                      )}
                      
                      {(attempt.choice_a || attempt.choice_b || attempt.choice_c || attempt.choice_d) && (
                        <div className="grid gap-2">
                          {[attempt.choice_a, attempt.choice_b, attempt.choice_c, attempt.choice_d].map((choice, i) => (
                            choice && (
                              <div
                                key={i}
                                className={`p-2 rounded text-sm ${
                                  i === attempt.correct_idx
                                    ? 'bg-success/10 border border-success/30'
                                    : i === attempt.selected_idx
                                    ? 'bg-destructive/10 border border-destructive/30'
                                    : 'bg-background border'
                                }`}
                              >
                                <span className="font-medium">{choices[i]})</span> {choice}
                              </div>
                            )
                          ))}
                        </div>
                      )}
                      
                      {attempt.explanation && (
                        <div className="pt-2 border-t">
                          <p className="font-medium mb-1">Explanation:</p>
                          <p className="text-sm text-muted-foreground">{attempt.explanation}</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Practice Again Button */}
      {incorrectCount > 0 && (
        <div className="mt-6 text-center">
          <Button onClick={() => navigate('/review/missed')}>
            Practice Missed Questions
          </Button>
        </div>
      )}
    </div>
  );
}
