import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Target, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getEnhancedLesson, type EnhancedLesson } from '@/lib/lessons';
import { useSkillMastery } from '@/hooks/useMastery';
import { MasteryBadge } from '@/components/MasteryBadge';
import { MasteryProgressBar } from '@/components/MasteryProgressBar';
import { sanitizeHTML } from '@/lib/sanitize';
import { supabase } from '@/integrations/supabase/client';
import { updateMastery } from '@/lib/mastery';
import { toast } from 'sonner';

export default function EnhancedLessonViewer() {
  const { topic } = useParams<{ topic?: string }>();
  const [lesson, setLesson] = useState<EnhancedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('overview');
  
  // Practice tracking
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [showingPracticeResults, setShowingPracticeResults] = useState(false);
  const [practiceStartTime, setPracticeStartTime] = useState<number>(Date.now());

  // Mastery data
  const { data: mastery, refetch: refetchMastery } = useSkillMastery(topic);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      try {
        const code = topic ?? '';
        const { data, error: fetchError } = await getEnhancedLesson(code);
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setLesson(data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };
    void fetchLesson();
  }, [topic]);

  const handlePracticeAnswer = (questionId: string, answer: string) => {
    setPracticeAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitPractice = async () => {
    if (!lesson) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to track your progress');
      return;
    }

    // Calculate results
    let correct = 0;
    const totalTime = Date.now() - practiceStartTime;
    
    lesson.practiceQuestions.forEach(q => {
      const userAnswer = practiceAnswers[q.staging_id.toString()];
      if (userAnswer === q.answer) {
        correct++;
      }
    });

    const accuracy = lesson.practiceQuestions.length > 0
      ? (correct / lesson.practiceQuestions.length) * 100
      : 0;

    // Update mastery
    const avgTimePerQuestion = Math.round(totalTime / lesson.practiceQuestions.length);
    await updateMastery(
      user.id,
      lesson.skill_code,
      accuracy >= 70, // Consider correct if 70%+ accuracy
      avgTimePerQuestion
    );

    setShowingPracticeResults(true);
    void refetchMastery();

    toast.success(
      `Practice complete! ${correct}/${lesson.practiceQuestions.length} correct (${accuracy.toFixed(0)}%)`
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Lesson</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/lessons">← Back to Lessons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Not Found</CardTitle>
            <CardDescription>
              This lesson doesn't have content yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/lessons">← Browse Other Lessons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const practiceComplete = lesson.practiceQuestions.length > 0 &&
    lesson.practiceQuestions.every(q => practiceAnswers[q.staging_id.toString()]);

  const practiceScore = lesson.practiceQuestions.length > 0
    ? lesson.practiceQuestions.filter(q => 
        practiceAnswers[q.staging_id.toString()] === q.answer
      ).length
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/lessons">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{lesson.subject}</Badge>
              <Badge variant="outline">{lesson.section}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{lesson.skill_name}</h1>
            {lesson.topic && lesson.topic !== lesson.skill_name && (
              <p className="text-lg text-muted-foreground">{lesson.topic}</p>
            )}
          </div>

          {mastery && mastery.total > 0 && (
            <div className="flex-shrink-0">
              <MasteryBadge 
                level={mastery.level}
                accuracy={mastery.accuracy}
                total={mastery.total}
                size="lg"
              />
            </div>
          )}
        </div>

        {/* Lesson Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            {lesson.totalQuestions} questions
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            ~{lesson.estimatedMinutes} minutes
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            {lesson.difficulty}
          </div>
        </div>

        {/* Mastery Progress */}
        {mastery && mastery.total > 0 && (
          <div className="mt-4">
            <MasteryProgressBar 
              accuracy={mastery.accuracy}
              level={mastery.level}
              total={mastery.total}
            />
          </div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Tabbed Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BookOpen className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="examples">
            Examples ({lesson.examples.length})
          </TabsTrigger>
          <TabsTrigger value="practice">
            Practice ({lesson.practiceQuestions.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(lesson.overview) }}
              />
            </CardContent>
          </Card>

          {lesson.examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Concepts</CardTitle>
                <CardDescription>
                  Review these examples before practicing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lesson.examples.map((example, idx) => (
                  <div key={example.staging_id} className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Example {idx + 1}</h4>
                    {example.passage_text && (
                      <div className="mb-3 p-3 bg-background rounded border">
                        <p className="text-sm whitespace-pre-wrap">{example.passage_text}</p>
                      </div>
                    )}
                    <p className="mb-3">{example.question}</p>
                    <div className="space-y-1 text-sm mb-3">
                      <div>A) {example.choice_a}</div>
                      <div>B) {example.choice_b}</div>
                      <div>C) {example.choice_c}</div>
                      <div>D) {example.choice_d}</div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                      <div className="font-semibold text-green-700 dark:text-green-400">
                        Answer: {example.answer}
                      </div>
                    </div>
                    {example.explanation && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Explanation:</strong> {example.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setCurrentTab('practice')} size="lg">
              Start Practice Questions →
            </Button>
          </div>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-4 mt-6">
          {lesson.examples.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No example questions available for this lesson.</p>
              </CardContent>
            </Card>
          ) : (
            lesson.examples.map((example, idx) => (
              <Card key={example.staging_id}>
                <CardHeader>
                  <CardTitle className="text-lg">Example {idx + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {example.passage_text && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Passage:</h4>
                      <p className="text-sm whitespace-pre-wrap">{example.passage_text}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-3">{example.question}</h4>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg border">A) {example.choice_a}</div>
                      <div className="p-3 rounded-lg border">B) {example.choice_b}</div>
                      <div className="p-3 rounded-lg border">C) {example.choice_c}</div>
                      <div className="p-3 rounded-lg border">D) {example.choice_d}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        Correct Answer: {example.answer}
                      </span>
                    </div>
                    {example.explanation && (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                        {example.explanation}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Practice Tab */}
        <TabsContent value="practice" className="space-y-6 mt-6">
          {lesson.practiceQuestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No practice questions available for this lesson.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle>Practice Questions</CardTitle>
                  <CardDescription>
                    Answer all questions to update your mastery level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showingPracticeResults && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span className="text-muted-foreground">
                          {Object.keys(practiceAnswers).length} / {lesson.practiceQuestions.length}
                        </span>
                      </div>
                      <Progress 
                        value={(Object.keys(practiceAnswers).length / lesson.practiceQuestions.length) * 100} 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Practice Questions */}
              <div className="space-y-4">
                {lesson.practiceQuestions.map((question, idx) => {
                  const questionId = question.staging_id.toString();
                  const userAnswer = practiceAnswers[questionId];
                  const isCorrect = userAnswer === question.answer;
                  const hasAnswered = !!userAnswer;

                  return (
                    <Card 
                      key={question.staging_id}
                      className={cn(
                        showingPracticeResults && hasAnswered && (
                          isCorrect 
                            ? 'border-green-300 bg-green-50 dark:bg-green-900/10' 
                            : 'border-red-300 bg-red-50 dark:bg-red-900/10'
                        )
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Question {idx + 1}
                          </CardTitle>
                          {showingPracticeResults && hasAnswered && (
                            <Badge variant={isCorrect ? 'default' : 'destructive'}>
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {question.passage_text && (
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{question.passage_text}</p>
                          </div>
                        )}

                        <p className="font-medium">{question.question}</p>

                        <div className="space-y-2">
                          {['A', 'B', 'C', 'D'].map((letter) => {
                            const choiceKey = `choice_${letter.toLowerCase()}` as keyof typeof question;
                            const choiceText = question[choiceKey] as string;
                            const isSelected = userAnswer === letter;
                            const isCorrectAnswer = question.answer === letter;
                            
                            return (
                              <button
                                key={letter}
                                onClick={() => !showingPracticeResults && handlePracticeAnswer(questionId, letter)}
                                disabled={showingPracticeResults}
                                className={cn(
                                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                                  !showingPracticeResults && 'hover:border-primary hover:bg-primary/5',
                                  isSelected && !showingPracticeResults && 'border-primary bg-primary/10',
                                  showingPracticeResults && isCorrectAnswer && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                                  showingPracticeResults && isSelected && !isCorrectAnswer && 'border-red-500 bg-red-50 dark:bg-red-900/20',
                                  showingPracticeResults && !isSelected && !isCorrectAnswer && 'opacity-50'
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="font-bold text-sm mt-0.5">{letter})</span>
                                  <span className="flex-1">{choiceText}</span>
                                  {showingPracticeResults && isCorrectAnswer && (
                                    <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {showingPracticeResults && question.explanation && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-sm mb-1 text-blue-900 dark:text-blue-100">
                              Explanation:
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!showingPracticeResults && (
                <Card className="border-primary">
                  <CardContent className="pt-6">
                    <Button 
                      onClick={handleSubmitPractice}
                      disabled={!practiceComplete}
                      size="lg"
                      className="w-full"
                    >
                      {practiceComplete 
                        ? `Submit Practice (${lesson.practiceQuestions.length} questions)` 
                        : `Answer all questions to submit (${Object.keys(practiceAnswers).length}/${lesson.practiceQuestions.length})`
                      }
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Results Summary */}
              {showingPracticeResults && (
                <Card className="border-green-300 bg-green-50 dark:bg-green-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      Practice Complete!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-4xl font-bold text-green-700 dark:text-green-400 mb-2">
                        {practiceScore} / {lesson.practiceQuestions.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {((practiceScore / lesson.practiceQuestions.length) * 100).toFixed(0)}% accuracy
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setPracticeAnswers({});
                          setShowingPracticeResults(false);
                          setPracticeStartTime(Date.now());
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Try Again
                      </Button>
                      <Button asChild className="flex-1">
                        <Link to="/lessons">
                          Browse More Lessons
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
