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


interface DiagnosticAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface DiagnosticEvaluationProps {
  onComplete: (section: string, blocks: Array<{
    questions: Array<{ id: string; skill_tags?: string[] }>;
    answers: DiagnosticAnswer[];
  }>) => void;
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
  const [sectionAnswers, setSectionAnswers] = useState<Record<string, DiagnosticAnswer[]>>({
    english: [],
    math: [],
    reading: [],
    science: []
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

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
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    // Store answer for current section
    const answer: DiagnosticAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: String.fromCharCode(65 + answerIndex), // Convert 0->A, 1->B, etc.
      isCorrect
    };
    
    setSectionAnswers(prev => ({
      ...prev,
      [currentQuestion.subject]: [...prev[currentQuestion.subject], answer]
    }));

    // Check if this is the last question of current section
    const nextQuestion = allQuestions[currentQuestionIndex + 1];
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const isEndOfSection = nextQuestion && nextQuestion.subject !== currentQuestion.subject;

    if (isEndOfSection || isLastQuestion) {
      // Complete current section
      completeSection(currentQuestion.subject);
      
      if (isLastQuestion) {
        return;
      }
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
    }
  };

  const completeSection = (section: 'english' | 'math' | 'reading' | 'science') => {
    // Get all questions for this section
    const sectionQuestions = allQuestions
      .filter(q => q.subject === section)
      .map(q => ({ id: q.id, skill_tags: [q.topic] }));

    // Get answers for this section (include current answer if it's the last one)
    const answers = [...sectionAnswers[section]];
    
    const blocks = [{
      questions: sectionQuestions,
      answers
    }];

    onComplete(section.charAt(0).toUpperCase() + section.slice(1) as 'English' | 'Math' | 'Reading' | 'Science', blocks);
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
            Time Remaining
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
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const handleEvaluationComplete = async (
    section: string, 
    blocks: Array<{
      questions: Array<{ id: string; skill_tags?: string[] }>;
      answers: DiagnosticAnswer[];
    }>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to save your results",
          variant: "destructive",
        });
        return;
      }

      // Call the finish-diagnostic edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/finish-diagnostic`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ section, blocks }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save diagnostic');
      }

      const result = await response.json();
      console.log('Diagnostic saved:', result);

      // Track completed sections
      setCompletedSections(prev => new Set(prev).add(section));

      // Check if all 4 sections are complete
      const newCompletedSections = new Set(completedSections).add(section);
      if (newCompletedSections.size === 4) {
        toast({
          title: "Diagnostic Complete!",
          description: "Your results have been saved and your study plan is being generated.",
        });

        navigate('/diagnostic-results');
      }
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