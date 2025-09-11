import { useState, useEffect } from 'react';
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