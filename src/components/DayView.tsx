import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calculator, BookOpen, Timer, CheckCircle } from 'lucide-react';
import { Day, DrillSession, WrongAnswer } from '@/types';
import { LessonComponent } from './LessonComponent';
import { DrillComponent } from './DrillComponent';
import { mathDrills, englishDrills } from '@/data/curriculum';

interface DayViewProps {
  day: Day;
  onBack: () => void;
  onDayComplete: (dayNumber: number) => void;
  onUpdateScore: (lessonId: string, practiceScore: number, quizScore: number, wrongAnswers: WrongAnswer[]) => void;
}

export const DayView = ({ day, onBack, onDayComplete, onUpdateScore }: DayViewProps) => {
  const [activeLesson, setActiveLesson] = useState<'math' | 'english' | 'drill' | null>(null);
  const [activeDrillType, setActiveDrillType] = useState<'math' | 'english'>('math');
  const [mathCompleted, setMathCompleted] = useState(false);
  const [englishCompleted, setEnglishCompleted] = useState(false);
  const [drillsCompleted, setDrillsCompleted] = useState({ math: false, english: false });

  const handleLessonComplete = (lessonId: string, practiceScore: number, quizScore: number, wrongAnswers: WrongAnswer[]) => {
    onUpdateScore(lessonId, practiceScore, quizScore, wrongAnswers);
    
    if (lessonId === day.mathLesson.id) {
      setMathCompleted(true);
    } else if (lessonId === day.englishLesson.id) {
      setEnglishCompleted(true);
    }
    
    setActiveLesson(null);
  };

  const handleDrillComplete = (drillType: 'math' | 'english') => {
    setDrillsCompleted(prev => ({ ...prev, [drillType]: true }));
    setActiveLesson(null);
  };

  const handleCompleteDayClicked = () => {
    onDayComplete(day.day);
    onBack();
  };

  const allCompleted = mathCompleted && englishCompleted;
  const bothDrillsCompleted = drillsCompleted.math && drillsCompleted.english;

  /**
   * Helper to select a random subset of questions from a larger pool.
   * This ensures that each drill attempt presents a fresh mix of questions.
   *
   * @param questions - The full list of questions for the drill.
   * @param count - How many questions to include in the drill.
   * @returns A new array containing `count` randomly selected questions.
   */
  function getRandomSubset<T>(questions: T[], count: number): T[] {
    const shuffled = [...questions];
    // Fisher–Yates shuffle for unbiased randomization
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  // Define how many questions each drill should include.  These values
  // control both the random selection and the UI labels below.  Adjust
  // these counts to change the length of each drill without touching
  // the underlying question pools defined in the curriculum.
  const MATH_QUESTIONS_COUNT = 5;
  const ENGLISH_QUESTIONS_COUNT = 5;

  if (activeLesson === 'math') {
    return (
      <LessonComponent
        lesson={day.mathLesson}
        onComplete={handleLessonComplete}
        onBack={() => setActiveLesson(null)}
      />
    );
  }

  if (activeLesson === 'english') {
    return (
      <LessonComponent
        lesson={day.englishLesson}
        onComplete={handleLessonComplete}
        onBack={() => setActiveLesson(null)}
      />
    );
  }

  if (activeLesson === 'drill') {
    // Clone the appropriate drill and inject a random subset of questions.
    const baseDrill = activeDrillType === 'math' ? mathDrills[0] : englishDrills[0];
    const questionCount = activeDrillType === 'math' ? MATH_QUESTIONS_COUNT : ENGLISH_QUESTIONS_COUNT;
    const selectedQuestions = getRandomSubset(baseDrill.questions, questionCount);
    const drill: DrillSession = {
      ...baseDrill,
      questions: selectedQuestions
    };
    return (
      <DrillComponent
        drill={drill}
        onComplete={() => handleDrillComplete(activeDrillType)}
        onBack={() => setActiveLesson(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Day {day.day}</h1>
          <p className="text-muted-foreground">
            Complete both lessons to finish today's study session
          </p>
        </div>
        {allCompleted && (
          <div className="px-4 py-2 bg-success/10 text-success text-sm font-medium rounded-full flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Day Complete
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <Card className="p-6 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-secondary" />
              <span className="font-medium">Math Lesson</span>
            </div>
            {mathCompleted ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <div className="w-3 h-3 bg-muted rounded-full" />
            )}
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="font-medium">English Lesson</span>
            </div>
            {englishCompleted ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <div className="w-3 h-3 bg-muted rounded-full" />
            )}
          </div>
        </div>
      </Card>

      {/* Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Math Lesson */}
        <Card className="p-6 shadow-medium">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Calculator className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{day.mathLesson.title}</h3>
                <p className="text-sm text-muted-foreground">Math Lesson</p>
              </div>
              {mathCompleted && (
                <CheckCircle className="w-5 h-5 text-success ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {day.mathLesson.concept}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Practice Questions</span>
                <span className="text-muted-foreground">{day.mathLesson.practiceQuestions.length} questions</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Quiz</span>
                <span className="text-muted-foreground">{day.mathLesson.quiz.length} questions</span>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => setActiveLesson('math')}
              variant={mathCompleted ? "outline" : "default"}
            >
              {mathCompleted ? 'Review Math Lesson' : 'Start Math Lesson'}
            </Button>
          </div>
        </Card>

        {/* English Lesson */}
        <Card className="p-6 shadow-medium">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{day.englishLesson.title}</h3>
                <p className="text-sm text-muted-foreground">English Lesson</p>
              </div>
              {englishCompleted && (
                <CheckCircle className="w-5 h-5 text-success ml-auto" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {day.englishLesson.concept}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Practice Questions</span>
                <span className="text-muted-foreground">{day.englishLesson.practiceQuestions.length} questions</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Quiz</span>
                <span className="text-muted-foreground">{day.englishLesson.quiz.length} questions</span>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => setActiveLesson('english')}
              variant={englishCompleted ? "outline" : "default"}
            >
              {englishCompleted ? 'Review English Lesson' : 'Start English Lesson'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Drill Section */}
      <Card className="p-6 shadow-medium border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Timer className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Timed Drills</h3>
              <p className="text-sm text-muted-foreground">
                Quick practice to reinforce fundamentals
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Math Basics</p>
                  {/* Dynamically reflect the time limit and number of questions for math drills */}
                  <p className="text-sm text-muted-foreground">
                    {mathDrills[0].timeLimit} seconds • {MATH_QUESTIONS_COUNT} questions
                  </p>
                </div>
                {drillsCompleted.math && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setActiveDrillType('math');
                  setActiveLesson('drill');
                }}
              >
                {drillsCompleted.math ? 'Retry Math Drill' : 'Start Math Drill'}
              </Button>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Grammar Rules</p>
                  {/* Dynamically reflect the time limit and number of questions for grammar drills */}
                  <p className="text-sm text-muted-foreground">
                    {englishDrills[0].timeLimit} seconds • {ENGLISH_QUESTIONS_COUNT} questions
                  </p>
                </div>
                {drillsCompleted.english && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setActiveDrillType('english');
                  setActiveLesson('drill');
                }}
              >
                {drillsCompleted.english ? 'Retry Grammar Drill' : 'Start Grammar Drill'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Complete Day Button */}
      {allCompleted && (
        <Card className="p-6 shadow-strong border-success/50">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-gradient-success rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Excellent Work!</h3>
              <p className="text-muted-foreground">
                You've completed all lessons for Day {day.day}
                {bothDrillsCompleted && ' and both drill sessions'}
              </p>
            </div>
            <Button 
              variant="success" 
              size="lg" 
              onClick={handleCompleteDayClicked}
              className="px-8"
            >
              Complete Day {day.day}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};