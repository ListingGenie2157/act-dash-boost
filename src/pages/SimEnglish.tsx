import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
}

interface Answer {
  questionId: string;
  selectedAnswer: string;
  timeSpent: number;
}

const SimEnglish = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes (2700s) for English
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setSimResultId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [score, setScore] = useState(0);

  // Load questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('v_form_section')
          .select('*')
          .eq('form_id', 'A')
          .eq('section', 'EN')
          .order('ord', { ascending: true });

        if (error) throw error;
        
        const formattedQuestions = (data || []).map(d => ({
          id: d.question_id ?? '',
          stem: d.question ?? '',
          choice_a: d.choice_a ?? '',
          choice_b: d.choice_b ?? '',
          choice_c: d.choice_c ?? '',
          choice_d: d.choice_d ?? '',
          answer: d.answer ?? 'A'
        }));
        
        setQuestions(formattedQuestions);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load questions",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [toast]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitting) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, selectedAnswer: string) => {
    const timeSpent = Date.now() - questionStartTime;
    
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, selectedAnswer, timeSpent: a.timeSpent + timeSpent }
            : a
        );
      } else {
        return [...prev, { questionId, selectedAnswer, timeSpent }];
      }
    });
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestion(index);
    setQuestionStartTime(Date.now());
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Calculate score
      let correctAnswers = 0;
      const incorrectAnswers: string[] = [];
      
      answers.forEach(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        if (question && question.answer.toLowerCase() === answer.selectedAnswer.toLowerCase()) {
          correctAnswers++;
        } else if (question) {
          incorrectAnswers.push(question.id);
        }
      });

      const finalScore = correctAnswers;
      setScore(finalScore);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create sim result
      const { data: simResult, error: simError } = await supabase
        .from('sim_results')
        .insert({
          user_id: user.id,
          section: 'english',
          raw_score: finalScore,
          ended_at: new Date().toISOString(),
          time_stats_json: {
            total_time_ms: totalTime,
            answers: answers.map(a => ({
              question_id: a.questionId,
              time_spent_ms: a.timeSpent,
              selected_answer: a.selectedAnswer
            }))
          }
        })
        .select()
        .single();

      if (simError) throw simError;
      setSimResultId(simResult.id);

      // Add incorrect answers to error bank and review queue
      for (const questionId of incorrectAnswers) {
        // Add to error bank
        await supabase
          .from('error_bank')
          .upsert({
            user_id: user.id,
            question_id: questionId,
            last_missed_at: new Date().toISOString(),
            miss_count: 1
          }, {
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false
          });

        // Add to review queue
        await supabase
          .from('review_queue')
          .upsert({
            user_id: user.id,
            question_id: questionId,
            due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow
            interval_days: 1
          }, {
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false
          });
      }

      setShowSummary(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit simulation",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, answers, questions, startTime, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="print-content bg-white text-black p-8 rounded-lg shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">ACT English Simulation Results</h1>
              <p className="text-lg text-gray-600">Test completed on {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Score Summary</h2>
                <div className="space-y-2">
                  <p><strong>Raw Score:</strong> {score}/75</p>
                  <p><strong>Percentage:</strong> {Math.round((score / 75) * 100)}%</p>
                  <p><strong>Questions Answered:</strong> {answers.length}/75</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Time Statistics</h2>
                <div className="space-y-2">
                  <p><strong>Total Time:</strong> {formatTime(Math.floor((Date.now() - startTime) / 1000))}</p>
                  <p><strong>Average per Question:</strong> {formatTime(Math.floor((Date.now() - startTime) / (1000 * answers.length)))}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Answer Grid</h2>
              <div className="grid grid-cols-15 gap-2">
                {questions.map((question, index) => {
                  const answer = answers.find(a => a.questionId === question.id);
                  const isCorrect = answer && question.answer.toLowerCase() === answer.selectedAnswer.toLowerCase();
                  return (
                    <div
                      key={question.id}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded ${
                        !answer 
                          ? 'bg-gray-200 text-gray-500' 
                          : isCorrect 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {index + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center space-x-4 no-print">
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                Print Results
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              .print-content { box-shadow: none !important; }
            }
          `
        }} />
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ACT English Simulation</h1>
            <p className="text-muted-foreground">Question {currentQuestion + 1} of 75</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-primary">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground">Time Remaining</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Bubble Grid */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const hasAnswer = answers.some(a => a.questionId === question.id);
                  return (
                    <Button
                      key={question.id}
                      variant={currentQuestion === index ? "default" : hasAnswer ? "secondary" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => navigateToQuestion(index)}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {answers.length} of 75 answered
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Question */}
        <div className="lg:col-span-3">
          {currentQ && (
            <Card>
              <CardHeader>
                <CardTitle>Question {currentQuestion + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <p className="text-lg leading-relaxed">{currentQ.stem}</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { key: 'A', text: currentQ.choice_a },
                    { key: 'B', text: currentQ.choice_b },
                    { key: 'C', text: currentQ.choice_c },
                    { key: 'D', text: currentQ.choice_d }
                  ].map((choice) => {
                    const currentAnswer = answers.find(a => a.questionId === currentQ.id);
                    return (
                      <Button
                        key={choice.key}
                        variant={currentAnswer?.selectedAnswer === choice.key ? "default" : "outline"}
                        className="w-full text-left justify-start p-4 h-auto"
                        onClick={() => handleAnswerSelect(currentQ.id, choice.key)}
                      >
                        <span className="font-semibold mr-3">{choice.key}.</span>
                        <span>{choice.text}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigateToQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  
                  {currentQuestion === questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Test"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigateToQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                      disabled={currentQuestion === questions.length - 1}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimEnglish;