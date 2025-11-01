import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Progress, Badge, RadioGroup, RadioGroupItem, Label,
  CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui';
import { Brain, AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
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
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<string>('');
  const { toast } = useToast();

  // Fetch questions from database on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questions: Question[] = [];
        
        // Fetch diagnostic questions from staging_items (D2* forms)
        const sections = ['EN', 'MATH', 'RD', 'SCI'];
        const formMap: Record<string, string> = {
          'EN': 'D2EN',
          'MATH': 'D2MA',
          'RD': 'D2RD',
          'SCI': 'D2SC'
        };
        const subjectMap: Record<string, 'english' | 'math' | 'reading' | 'science'> = {
          'EN': 'english',
          'MATH': 'math',
          'RD': 'reading',
          'SCI': 'science'
        };
        
        for (const section of sections) {
          const { data, error } = await supabase
            .from('staging_items')
            .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, answer, explanation')
            .eq('form_id', formMap[section])
            .eq('section', section)
            .order('ord')
            .limit(25);
          
          if (error) {
            console.error(`Error fetching ${section} questions:`, error);
            continue;
          }
          
          if (data) {
            data.forEach((item) => {
              if (item.question && item.choice_a && item.choice_b && item.choice_c && item.choice_d && item.answer) {
                questions.push({
                  id: String(item.staging_id || ''),
                  subject: subjectMap[section],
                  topic: section,
                  difficulty: 'medium',
                  question: item.question,
                  options: [item.choice_a, item.choice_b, item.choice_c, item.choice_d],
                  correctAnswer: item.answer.charCodeAt(0) - 65, // A=0, B=1, C=2, D=3
                  explanation: item.explanation || '',
                  timeLimit: 60
                });
              }
            });
          }
        }
        
        setAllQuestions(questions);
        if (questions.length > 0) {
          setCurrentSection(questions[0].subject);
        }
      } catch (error) {
        console.error('Error fetching diagnostic questions:', error);
        toast({
          title: "Error",
          description: "Failed to load diagnostic questions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuestions();
  }, [toast]);

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

    if (isEndOfSection) {
      // Complete current section and show transition
      completeSection(currentQuestion.subject);
      setCurrentSection(nextQuestion.subject);
      
      toast({
        title: `${currentQuestion.subject.charAt(0).toUpperCase() + currentQuestion.subject.slice(1)} Complete!`,
        description: `Starting ${nextQuestion.subject.charAt(0).toUpperCase() + nextQuestion.subject.slice(1)} section...`,
      });
    }

    if (isLastQuestion) {
      // Complete final section
      completeSection(currentQuestion.subject);
      return;
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

  if (isLoading || !currentQuestion) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">
            {isLoading ? 'Loading Diagnostic Questions...' : 'No questions available'}
          </h2>
          {!isLoading && !currentQuestion && (
            <p className="text-sm text-muted-foreground">
              Please contact support if this issue persists.
            </p>
          )}
        </div>
      </Card>
    );
  }
  
  // Calculate questions in current section
  const sectionQuestions = allQuestions.filter(q => q.subject === currentSection);
  const sectionProgress = sectionAnswers[currentSection].length;
  const sectionTotal = sectionQuestions.length;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Overall: {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}: {sectionProgress + 1} of {sectionTotal}
          </span>
        </div>
        <Progress value={(currentQuestionIndex / totalQuestions) * 100} className="h-2 mb-2" />
        <Progress value={((sectionProgress + 1) / sectionTotal) * 100} className="h-1" />
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
  
  // Track which diagnostic sections have been completed
  const [completedSections, setCompletedSections] = useState<string[]>(() => {
    const stored = localStorage.getItem('diagnostic_completed_sections');
    return stored ? JSON.parse(stored) : [];
  });

  const sections = [
    { id: 'D2EN', label: 'English', description: '20 minutes - Grammar, punctuation, and style' },
    { id: 'D2MA', label: 'Math', description: '25 minutes - Algebra, geometry, and trigonometry' },
    { id: 'D2RD', label: 'Reading', description: '18 minutes - Comprehension and analysis' },
    { id: 'D2SCI', label: 'Science', description: '18 minutes - Data interpretation and reasoning' }
  ];

  const currentSectionIndex = completedSections.length;
  const allComplete = completedSections.length >= 4;

  const handleStartNext = () => {
    if (currentSectionIndex < sections.length) {
      navigate(`/diagnostic-test/${sections[currentSectionIndex].id}`);
    }
  };

  const handleContinue = async () => {
    if (allComplete) {
      // Mark diagnostic as complete in profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ diagnostic_completed: true })
          .eq('id', user.id);
      }
      
      // Clear localStorage
      localStorage.removeItem('diagnostic_completed_sections');
      setCompletedSections([]);
      
      // Navigate to aggregate results
      navigate('/diagnostic-results-complete');
    }
  };

  // Listen for section completion (set by DiagnosticTest page)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('diagnostic_completed_sections');
      if (stored) {
        setCompletedSections(JSON.parse(stored));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
              Complete all 4 sections to get your personalized study plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Total Duration</p>
                    <p className="text-sm text-muted-foreground">~80 minutes (4 sections)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {completedSections.length} of 4 sections complete
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Checklist */}
              <div className="space-y-3">
                <h3 className="font-semibold">Test Sections:</h3>
                {sections.map((section, index) => {
                  const isCompleted = completedSections.includes(section.id);
                  const isCurrent = index === currentSectionIndex;
                  
                  return (
                    <div
                      key={section.id}
                      className={`p-4 border rounded-lg ${
                        isCompleted ? 'bg-green-50 border-green-200' : 
                        isCurrent ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                          <div>
                            <p className="font-medium">{section.label}</p>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <Badge variant="secondary">Complete</Badge>
                        )}
                        {isCurrent && !isCompleted && (
                          <Badge>Next</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {!allComplete && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Before You Begin:
                  </h3>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Find a quiet place to take the test</li>
                    <li>• Each section is timed separately</li>
                    <li>• You can pause between sections</li>
                    <li>• Your answers are saved automatically</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                {!allComplete ? (
                  <>
                    <Button onClick={handleStartNext} className="flex-1">
                      {completedSections.length === 0 ? 'Start Diagnostic' : 'Continue to Next Section'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Save & Exit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleContinue} className="flex-1">
                      View Complete Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Return to Dashboard
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}