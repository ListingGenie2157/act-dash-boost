import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Progress, Badge, RadioGroup, RadioGroupItem, Label,
  CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui';
import { Timer, Brain, AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { evaluationQuestions } from '@/data/evaluationQuestions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


interface DiagnosticEvaluationProps {
  onComplete: (results: {
    english: { score: number; weakAreas: string[] };
    math: { score: number; weakAreas: string[] };
    reading: { score: number; weakAreas: string[] };
    science: { score: number; weakAreas: string[] };
  }) => void;
  previousScores?: {
    english: number;
    math: number;
    reading: number;
    science: number;
  };
}

interface Question {
  id: string;
  subject: 'english' | 'math' | 'reading' | 'science';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  timeLimit: number; // seconds
}

export const DiagnosticEvaluation = ({
  onComplete,
}: DiagnosticEvaluationProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Use the evaluation questions from the data file
  const [allQuestions] = useState<Question[]>(() => {
    const questions: Question[] = [];
    
    // Add questions from each subject
    Object.entries(evaluationQuestions).forEach(([subject, subjectQuestions]) => {
      (subjectQuestions as Array<{
        id: string;
        skill?: string;
        question: string;
        passage?: string;
        underlined?: string;
        options: string[];
        correctAnswer: number | string;
        explanation?: string;
      }>).forEach((q) => {
        questions.push({
          id: q.id,
          subject: subject as 'english' | 'math' | 'reading' | 'science',
          topic: q.skill || 'general',
          difficulty: 'medium',
          question: q.question,
          options: q.options,
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : parseInt(String(q.correctAnswer), 10) || 0,
          explanation: q.explanation || '',
          timeLimit: 60
        });
      });
    });
    
    return questions;
  });

  const currentQuestion = allQuestions[currentQuestionIndex];
  const totalQuestions = allQuestions.length;

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;

    const answerIndex = selectedAnswer ? parseInt(selectedAnswer) : -1;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerIndex
    }));

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeEvaluation();
    }
  };

  const completeEvaluation = () => {
    // Calculate results by subject
    const results = {
      english: { score: 0, weakAreas: [] as string[] },
      math: { score: 0, weakAreas: [] as string[] },
      reading: { score: 0, weakAreas: [] as string[] },
      science: { score: 0, weakAreas: [] as string[] }
    };

    allQuestions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        results[question.subject].score += 1;
      } else {
        results[question.subject].weakAreas.push(question.topic);
      }
    });

    // Convert to percentage scores
    const subjectCounts = { english: 0, math: 0, reading: 0, science: 0 };
    allQuestions.forEach(q => subjectCounts[q.subject]++);

    Object.keys(results).forEach(subject => {
      const key = subject as keyof typeof results;
      const total = subjectCounts[key];
      if (total > 0) {
        results[key].score = Math.round((results[key].score / total) * 100);
      }
    });

    onComplete(results);
  };

  if (!currentQuestion) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Loading Evaluation...</h2>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <Badge variant="outline" className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </Badge>
        </div>
        <Progress value={(currentQuestionIndex / totalQuestions) * 100} className="h-2" />
      </Card>

      {/* Question Card */}
      <Card className="p-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{currentQuestion.subject.charAt(0).toUpperCase() + currentQuestion.subject.slice(1)}</Badge>
            <Badge variant="outline">{currentQuestion.topic}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
          
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
            >
              {currentQuestionIndex === totalQuestions - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">Quick Tip:</p>
            <p>
              This evaluation helps us understand your current level. Don&apos;t
              stress about perfection; just be consistent.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default function Diagnostic() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEvaluation, setShowEvaluation] = useState(false);

  const handleEvaluationComplete = async (results: Record<string, { score: number }>) => {
    try {
      // Save diagnostic results to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to save your results",
          variant: "destructive",
        });
        return;
      }

      // Results ready to save

      // Save results to diagnostics table for each section
      const sections = Object.keys(results);
      for (const sectionKey of sections) {
        const sectionName = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1); // Capitalize
        const { error } = await supabase.from('diagnostics').insert({
          user_id: user.id,
          section: sectionName,
          block: 1,
          score: results[sectionKey].score || 0,
          responses: { [sectionKey]: results[sectionKey] },
          completed_at: new Date().toISOString()
        });

        if (error) {
          console.error(`Error saving ${sectionName} diagnostic:`, error);
          throw error;
        }
      }

      toast({
        title: "Diagnostic Complete!",
        description: "Your results have been saved and your study plan is being generated.",
      });

      navigate('/diagnostic-results');
    } catch (error) {
      console.error('Error saving diagnostic results:', error);
      toast({
        title: "Error",
        description: "Failed to save diagnostic results",
        variant: "destructive",
      });
    }
  };

  if (showEvaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <DiagnosticEvaluation onComplete={handleEvaluationComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              ACT Diagnostic Test
            </CardTitle>
            <CardDescription>
              Take this diagnostic test to identify your strengths and areas for improvement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">Approximately 20 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Questions</p>
                    <p className="text-sm text-muted-foreground">Multiple choice format</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Before You Begin:
                </h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Find a quiet place to take the test</li>
                  <li>• Answer questions to the best of your ability</li>
                  <li>• Don't worry about perfect scores - this helps us help you</li>
                  <li>• You can pause and resume if needed</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setShowEvaluation(true)} className="flex-1">
                  Start Diagnostic Test
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Skip for Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}