// src/components/DiagnosticEvaluation.tsx
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Timer, Brain, AlertCircle } from 'lucide-react';
import { evaluationQuestions } from '@/data/evaluationQuestions';

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
  previousScores
}: DiagnosticEvaluationProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = React.useState(0);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string>('');

  // Generate once per previousScores, not every render
  const questions = React.useMemo(
    () => getAdaptiveQuestions(previousScores),
    [previousScores]
  );

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  // Reset timer on question change
  React.useEffect(() => {
    if (currentQuestion && !isReviewing) {
      setTimeRemaining(currentQuestion.timeLimit ?? 60);
      setSelectedAnswer('');
    }
  }, [currentQuestionIndex, currentQuestion?.id, isReviewing]); // stable on id/index

  // Countdown
  React.useEffect(() => {
    if (timeRemaining > 0 && !isReviewing) {
      const t = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(t);
    }
    if (timeRemaining === 0 && currentQuestion && !isReviewing) {
      handleNextQuestion();
    }
  }, [timeRemaining, isReviewing, currentQuestion]);

  function getAdaptiveQuestions(scores?: DiagnosticEvaluationProps['previousScores']): Question[] {
    const bias = scores ? calculateDifficultyBias(scores) : 'medium';

    const perSubjectCounts: Record<Question['subject'], number> = {
      english: scores && scores.english < 20 ? 4 : 3,
      math: scores && scores.math < 20 ? 4 : 3,
      reading: scores && scores.reading < 20 ? 4 : 3,
      science: scores && scores.science < 20 ? 4 : 3
    };

    const selected: Question[] = [];
    (['english', 'math', 'reading', 'science'] as Question['subject'][]).forEach(
      subject => {
        const pool = evaluationQuestions.filter(q => q.subject === subject);
        selected.push(...selectQuestionsByDifficulty(pool, perSubjectCounts[subject], bias));
      }
    );

    return shuffleWithBias(selected);
  }

  function calculateDifficultyBias(scores: NonNullable<DiagnosticEvaluationProps['previousScores']>) {
    const avg =
      (scores.english + scores.math + scores.reading + scores.science) / 4;
    if (avg >= 28) return 'hard';
    if (avg >= 20) return 'medium';
    return 'easy';
  }

  function randomPick<T>(arr: T[], n: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    for (let i = 0; i < n && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return out;
  }

  // Ensures we select exactly `count` items per subject, honoring a bias
  function selectQuestionsByDifficulty(questions: Question[], count: number, bias: string): Question[] {
    const pools = {
      easy: questions.filter(q => q.difficulty === 'easy'),
      medium: questions.filter(q => q.difficulty === 'medium'),
      hard: questions.filter(q => q.difficulty === 'hard')
    };

    const weights =
      bias === 'easy'
        ? { easy: 0.5, medium: 0.35, hard: 0.15 }
        : bias === 'medium'
        ? { easy: 0.3, medium: 0.5, hard: 0.2 }
        : { easy: 0.2, medium: 0.3, hard: 0.5 };

    const take = {
      easy: Math.floor(count * weights.easy),
      medium: Math.floor(count * weights.medium),
      hard: Math.floor(count * weights.hard)
    };

    // Fill remainder to reach exactly `count`, preferring pools with more remaining
    let total = take.easy + take.medium + take.hard;
    const order: Array<keyof typeof take> = ['medium', 'easy', 'hard'];
    while (total < count) {
      for (const k of order) {
        if (total >= count) break;
        if (pools[k].length > take[k]) {
          take[k]++;
          total++;
        }
      }
      // If all pools exhausted, break to avoid infinite loop
      if (order.every(k => pools[k].length <= take[k])) break;
    }

    const selected = [
      ...randomPick(pools.easy, take.easy),
      ...randomPick(pools.medium, take.medium),
      ...randomPick(pools.hard, take.hard)
    ];

    // If still short, top up from any remaining
    if (selected.length < count) {
      const remaining = questions.filter(q => !selected.includes(q));
      selected.push(...randomPick(remaining, count - selected.length));
    }

    return selected.slice(0, count);
  }

  function shuffleWithBias(qs: Question[]): Question[] {
    // group by subject then interleave to avoid long runs
    const grouped = qs.reduce<Record<string, Question[]>>((acc, q) => {
      (acc[q.subject] ||= []).push(q);
      return acc;
    }, {});
    const subjects = Object.keys(grouped);
    const maxLen = Math.max(...subjects.map(s => grouped[s].length));
    const out: Question[] = [];
    for (let i = 0; i < maxLen; i++) {
      for (const s of subjects) {
        if (grouped[s][i]) out.push(grouped[s][i]);
      }
    }
    return out;
  }

  function handleAnswerSelect(value: string) {
    setSelectedAnswer(value);
  }

  function handleSubmitAnswer() {
    if (!selectedAnswer) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: parseInt(selectedAnswer, 10)
    }));
    handleNextQuestion();
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(i => i + 1);
    } else {
      calculateResults();
    }
  }

  function calculateResults() {
    const results = {
      english: { score: 0, weakAreas: [] as string[] },
      math: { score: 0, weakAreas: [] as string[] },
      reading: { score: 0, weakAreas: [] as string[] },
      science: { score: 0, weakAreas: [] as string[] }
    };

    const subjectGroups = questions.reduce<Record<Question['subject'], Question[]>>((acc, q) => {
      (acc[q.subject] ||= []).push(q);
      return acc;
    }, {} as any);

    (Object.keys(subjectGroups) as Question['subject'][]).forEach(subject => {
      const subjectQuestions = subjectGroups[subject];
      const subjectAnswers = subjectQuestions.map(q => ({
        q,
        correct: answers[q.id] === q.correctAnswer
      }));

      const correctCount = subjectAnswers.filter(a => a.correct).length;
      const score = Math.round((correctCount / subjectQuestions.length) * 100);

      const weakTopics = [...new Set(
        subjectQuestions
          .filter(q => answers[q.id] !== q.correctAnswer)
          .map(q => q.topic)
      )];

      results[subject] = { score, weakAreas: weakTopics };
    });

    setIsReviewing(true);
    setTimeout(() => onComplete(results), 1000);
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
    }

  function getSubjectColor(subject: Question['subject']) {
    switch (subject) {
      case 'english':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'math':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'reading':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'science':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  if (isReviewing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold">Analyzing Your Responses...</h2>
            <p className="text-muted-foreground">
              We're identifying your strengths and areas for improvement
            </p>
            <Progress value={66} className="w-full max-w-xs mx-auto" />
          </div>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(
                  currentQuestion.subject
                )}`}
              >
                {currentQuestion.subject.toUpperCase()}
              </div>
              <span className="text-sm text-muted-foreground">
                {currentQuestion.topic}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span
                  className={`font-mono font-bold ${
                    timeRemaining < 10 ? 'text-destructive' : ''
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
          </div>
          <Progress
            value={((currentQuestionIndex + 1) / totalQuestions) * 100}
            className="mt-4"
          />
        </Card>

        {/* Question */}
        <Card className="p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant={
                    currentQuestion.difficulty === 'easy'
                      ? 'success'
                      : currentQuestion.difficulty === 'medium'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>
            </div>

            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Label
                    key={index}
                    htmlFor={`option-${currentQuestion.id}-${index}`}
                    className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${currentQuestion.id}-${index}`}
                    />
                    <span className="flex-1">{option}</span>
                  </Label>
                ))}
              </div>
            </RadioGroup>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex(i => Math.max(0, i - 1))
                }
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer}>
                {currentQuestionIndex === totalQuestions - 1
                  ? 'Finish'
                  : 'Next Question'}
              </Button>
            </div>
          </div>
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
    </div>
  );
};import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticQuestion {
  id: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  skill_tags?: string[];
}

interface DiagnosticAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

const MOCK_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'diag-eng-1',
    stem: 'Which sentence uses correct comma placement?',
    choice_a: 'The cat, ran quickly across the yard.',
    choice_b: 'The cat ran quickly, across the yard.',
    choice_c: 'The cat ran quickly across the yard.',
    choice_d: 'The cat ran, quickly across the yard.',
    answer: 'C',
    skill_tags: ['grammar']
  },
  {
    id: 'diag-eng-2',
    stem: 'What is the best way to combine these sentences: "The storm was severe. Many trees fell down."',
    choice_a: 'The storm was severe, many trees fell down.',
    choice_b: 'The storm was severe; many trees fell down.',
    choice_c: 'The storm was severe and many trees fell down.',
    choice_d: 'Because the storm was severe, many trees fell down.',
    answer: 'D',
    skill_tags: ['rhetoric']
  },
  // Add more mock questions to reach 50-60 total
  ...Array.from({ length: 48 }, (_, i) => ({
    id: `diag-eng-${i + 3}`,
    stem: `Mock question ${i + 3} for diagnostic testing purposes.`,
    choice_a: 'Option A',
    choice_b: 'Option B',
    choice_c: 'Option C',
    choice_d: 'Option D',
    answer: ['A', 'B', 'C', 'D'][i % 4] as string,
    skill_tags: ['grammar', 'rhetoric'][i % 2] ? ['grammar'] : ['rhetoric']
  }))
];

const Diagnostic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<DiagnosticAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(1);
  
  const totalQuestions = MOCK_QUESTIONS.length;
  const block1Questions = MOCK_QUESTIONS.slice(0, 25);
  const block2Questions = MOCK_QUESTIONS.slice(25, 50);
  const currentQuestions = currentBlock === 1 ? block1Questions : block2Questions;
  const questionInBlock = currentQuestion % 25;

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save every 5 questions
  useEffect(() => {
    if (currentQuestion > 0 && currentQuestion % 5 === 0) {
      localStorage.setItem('diagnostic-progress', JSON.stringify({
        currentQuestion,
        answers,
        currentBlock,
        timeRemaining
      }));
    }
  }, [currentQuestion, answers, currentBlock, timeRemaining]);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('diagnostic-progress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        setCurrentQuestion(progress.currentQuestion || 0);
        setAnswers(progress.answers || []);
        setCurrentBlock(progress.currentBlock || 1);
        setTimeRemaining(progress.timeRemaining || 45 * 60);
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      toast({
        title: "Please select an answer",
        description: "You must select an answer before continuing.",
        variant: "destructive"
      });
      return;
    }

    const question = currentQuestions[questionInBlock];
    const isCorrect = selectedAnswer === question.answer;
    
    const newAnswer: DiagnosticAnswer = {
      questionId: question.id,
      selectedAnswer,
      isCorrect
    };

    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = newAnswer;
    setAnswers(updatedAnswers);
    setSelectedAnswer('');

    if (questionInBlock === 24) { // End of block
      if (currentBlock === 1) {
        setCurrentBlock(2);
        setCurrentQuestion(25);
      } else {
        handleSubmit(updatedAnswers);
      }
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmit(answers);
  };

  const handleSubmit = async (finalAnswers: DiagnosticAnswer[]) => {
    setIsSubmitting(true);

    try {
      const block1Answers = finalAnswers.slice(0, 25);
      const block2Answers = finalAnswers.slice(25, 50);

      const { data, error } = await supabase.functions.invoke('finish-diagnostic', {
        body: {
          section: 'English',
          blocks: [
            {
              questions: block1Questions,
              answers: block1Answers
            },
            {
              questions: block2Questions,
              answers: block2Answers
            }
          ]
        }
      });

      if (error) {
        console.error('Error submitting diagnostic:', error);
        toast({
          title: "Error submitting diagnostic",
          description: "Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Clear saved progress
      localStorage.removeItem('diagnostic-progress');

      // Store results for display on dashboard
      localStorage.setItem('diagnostic-results', JSON.stringify(data));

      toast({
        title: "Diagnostic completed!",
        description: `Predicted score: ${data.predicted_section_score}%`,
      });

      navigate('/');

    } catch (error) {
      console.error('Error submitting diagnostic:', error);
      toast({
        title: "Error submitting diagnostic",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestionData = currentQuestions[questionInBlock];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const blockProgress = ((questionInBlock + 1) / 25) * 100;

  if (!currentQuestionData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-lg">Loading diagnostic...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                English Diagnostic Assessment
                <Badge variant="outline">Block {currentBlock}</Badge>
              </CardTitle>
              <CardDescription>
                Question {questionInBlock + 1} of 25 in this block
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} />
                <span className={timeRemaining < 300 ? 'text-destructive font-semibold' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Block Progress</span>
              <span>{questionInBlock + 1}/25</span>
            </div>
            <Progress value={blockProgress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Overall Progress</span>
              <span>{currentQuestion + 1}/{totalQuestions}</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </CardHeader>
      </Card>

      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestionData.stem}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((letter) => {
              const choiceKey = `choice_${letter.toLowerCase()}` as keyof DiagnosticQuestion;
              const choiceText = currentQuestionData[choiceKey] as string;
              return (
                <Button
                  key={letter}
                  variant={selectedAnswer === letter ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => handleAnswerSelect(letter)}
                >
                  <span className="font-semibold mr-3">{letter}.</span>
                  <span>{choiceText}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {answers.filter(a => a).length} questions answered
        </div>
        
        <Button 
          onClick={handleNext}
          disabled={!selectedAnswer || isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : questionInBlock === 24 ? (
            currentBlock === 1 ? (
              <>Start Block 2 <ArrowRight size={16} /></>
            ) : (
              <>Complete Diagnostic <CheckCircle2 size={16} /></>
            )
          ) : (
            <>Next Question <ArrowRight size={16} /></>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Diagnostic;
