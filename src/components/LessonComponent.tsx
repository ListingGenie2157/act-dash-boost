import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Brain, Target, ArrowLeft } from 'lucide-react';
import { Lesson } from '@/types';
import { QuizComponent } from './QuizComponent';

interface LessonComponentProps {
  lesson: Lesson;
  onComplete: (lessonId: string, practiceScore: number, quizScore: number, wrongAnswers: any[]) => void;
  onBack: () => void;
}

export const LessonComponent = ({ lesson, onComplete, onBack }: LessonComponentProps) => {
  const [activeTab, setActiveTab] = useState('concept');
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [practiceWrongAnswers, setPracticeWrongAnswers] = useState<any[]>([]);
  const [quizWrongAnswers, setQuizWrongAnswers] = useState<any[]>([]);

  const handlePracticeComplete = (score: number, wrongAnswers: any[]) => {
    setPracticeScore(score);
    setPracticeWrongAnswers(wrongAnswers);
    setActiveTab('quiz');
  };

  const handleQuizComplete = (score: number, wrongAnswers: any[]) => {
    setQuizScore(score);
    setQuizWrongAnswers(wrongAnswers);
    onComplete(lesson.id, practiceScore || 0, score, [...practiceWrongAnswers, ...wrongAnswers]);
  };

  const isCompleted = practiceScore !== null && quizScore !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <p className="text-muted-foreground capitalize">
            {lesson.subject} • Day lesson
          </p>
        </div>
        {isCompleted && (
          <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
            Completed
          </div>
        )}
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          activeTab === 'concept' || practiceScore !== null 
            ? 'bg-primary/10 text-primary' 
            : 'bg-muted text-muted-foreground'
        }`}>
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Concept</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          practiceScore !== null 
            ? 'bg-secondary/10 text-secondary' 
            : 'bg-muted text-muted-foreground'
        }`}>
          <Brain className="w-4 h-4" />
          <span className="text-sm font-medium">Practice</span>
          {practiceScore !== null && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
              {practiceScore}%
            </span>
          )}
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          quizScore !== null 
            ? 'bg-accent/10 text-accent' 
            : 'bg-muted text-muted-foreground'
        }`}>
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">Quiz</span>
          {quizScore !== null && (
            <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
              {quizScore}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="concept">Concept</TabsTrigger>
          <TabsTrigger value="practice">
            Practice
          </TabsTrigger>
          <TabsTrigger value="quiz" disabled={practiceScore === null}>
            Quiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="concept" className="space-y-6">
          <Card className="p-6 shadow-medium">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Concept Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {lesson.concept}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Key Examples
                </h3>
                <div className="space-y-3">
                  {lesson.examples.map((example, index) => (
                    <div key={index} className="p-4 bg-[hsl(var(--example-bg))] border border-[hsl(var(--example-border))] rounded-lg">
                      <code className="text-sm font-mono font-medium text-[hsl(var(--example-text))] leading-relaxed whitespace-pre-wrap">{example}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => setActiveTab('practice')}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  Start Practice Questions
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="practice">
          <QuizComponent
            questions={lesson.practiceQuestions}
            title="Practice Questions"
            onComplete={handlePracticeComplete}
            onBack={() => setActiveTab('concept')}
          />
        </TabsContent>

        <TabsContent value="quiz">
          <QuizComponent
            questions={lesson.quiz}
            title="Lesson Quiz"
            onComplete={handleQuizComplete}
            onBack={() => setActiveTab('practice')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};