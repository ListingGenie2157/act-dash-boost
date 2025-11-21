import { useState } from 'react';
import { calculatorLessons, calculatorModels, CalculatorModel } from '@/data/calculatorLessons';
import { VirtualCalculator } from '@/components/calculator/VirtualCalculator';
import { GuidedPractice } from '@/components/calculator/GuidedPractice';
import { TimedChallenge } from '@/components/calculator/TimedChallenge';
import { useCalculatorProgress } from '@/hooks/useCalculatorProgress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calculator, ChevronDown, PlayCircle, Clock, TrendingUp, Zap, Target, Timer, CheckCircle2 } from 'lucide-react';

export default function CalculatorLab() {
  const [selectedModel, setSelectedModel] = useState<CalculatorModel>('TI-84');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [showDemo, setShowDemo] = useState(false);
  const [practiceMode, setPracticeMode] = useState<{
    type: 'guided' | 'challenge' | null;
    lessonId: string | null;
  }>({ type: null, lessonId: null });

  const { getLessonProgress, totalTimeSaved, lessonsCompleted } = useCalculatorProgress();

  const filteredLessons = calculatorLessons.filter(lesson => 
    lesson.model.includes(selectedModel)
  );

  const startGuidedPractice = (lessonId: string) => {
    setPracticeMode({ type: 'guided', lessonId });
  };

  const startTimedChallenge = (lessonId: string) => {
    setPracticeMode({ type: 'challenge', lessonId });
  };

  const closePracticeMode = () => {
    setPracticeMode({ type: null, lessonId: null });
  };

  const currentLesson = practiceMode.lessonId 
    ? calculatorLessons.find(l => l.id === practiceMode.lessonId)
    : null;

  const difficultyColors = {
    beginner: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full mb-4">
          <Calculator className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Calculator Lab</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Master calculator shortcuts to save <span className="text-primary font-bold">10-15 minutes</span> on test day. 
          Practice interactively and track your progress!
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
                <p className="text-3xl font-bold">{lessonsCompleted}/{calculatorLessons.length}</p>
              </div>
              <Calculator className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Time Saved</p>
                <p className="text-3xl font-bold">{(totalTimeSaved / 60000).toFixed(1)}m</p>
              </div>
              <Clock className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Lessons</p>
                <p className="text-3xl font-bold">{filteredLessons.length}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Demo Section */}
      <Card className="mb-8 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">🎮 Try the Virtual Calculator</CardTitle>
              <CardDescription>
                Click buttons to see how it works before diving into lessons
              </CardDescription>
            </div>
            <Button
              variant={showDemo ? 'secondary' : 'default'}
              onClick={() => setShowDemo(!showDemo)}
            >
              {showDemo ? 'Hide Demo' : 'Show Demo'}
            </Button>
          </div>
        </CardHeader>
        {showDemo && (
          <CardContent>
            <VirtualCalculator
              mode="free"
              display={calcDisplay}
              onButtonPress={(buttonId) => {
                setCalcDisplay(prev => {
                  if (buttonId === 'clear') return '';
                  if (buttonId === 'del') return prev.slice(0, -1);
                  if (buttonId === 'enter') return prev + '\n';
                  return prev + (buttonId.length === 1 ? buttonId : ` [${buttonId}] `);
                });
              }}
            />
          </CardContent>
        )}
      </Card>

      {/* Calculator Model Selector */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Choose Your Calculator
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(calculatorModels) as CalculatorModel[]).map((model) => (
            <Button
              key={model}
              variant={selectedModel === model ? 'default' : 'outline'}
              onClick={() => setSelectedModel(model)}
              className="h-auto py-4 flex-col gap-2"
            >
              <span className="text-2xl">{calculatorModels[model].image}</span>
              <span className="font-semibold">{calculatorModels[model].name}</span>
              <span className="text-xs opacity-70">{calculatorModels[model].price}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <PlayCircle className="w-5 h-5" />
          Speed Skills ({filteredLessons.length} techniques)
        </h2>
        {filteredLessons.map((lesson) => (
          <Card 
            key={lesson.id}
            className="overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            <Collapsible
              open={expandedLesson === lesson.id}
              onOpenChange={(open) => setExpandedLesson(open ? lesson.id : null)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center gap-2">
                      {lesson.title}
                      {lesson.videoId && (
                        <Badge variant="secondary" className="gap-1">
                          <PlayCircle className="w-3 h-3" />
                          Video
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {lesson.description}
                    </CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={difficultyColors[lesson.difficulty]}>
                    {lesson.difficulty}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {lesson.timeSaved}
                  </Badge>
                </div>
              </CardHeader>

              <CollapsibleContent className="pt-4 space-y-6">
                <CardContent>
                  {/* Practice Modes Section */}
                  <div className="border-t pt-6 mb-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Practice Modes
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {/* Watch Video */}
                      {lesson.videoId && (
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                          <PlayCircle className="w-5 h-5" />
                          <span className="font-semibold">Watch Tutorial</span>
                          <span className="text-xs text-muted-foreground">Passive learning</span>
                        </Button>
                      )}
                      
                      {/* Guided Practice */}
                      <Button 
                        variant="default"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => startGuidedPractice(lesson.id)}
                        disabled={!lesson.interactiveSteps}
                      >
                        <Target className="w-5 h-5" />
                        <span className="font-semibold">Guided Practice</span>
                        <span className="text-xs">Step-by-step interactive</span>
                      </Button>
                      
                      {/* Timed Challenge */}
                      <Button 
                        variant="secondary"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => startTimedChallenge(lesson.id)}
                        disabled={!lesson.challengeMode}
                      >
                        <Timer className="w-5 h-5" />
                        <span className="font-semibold">Timed Challenge</span>
                        <span className="text-xs">Measure your speed</span>
                      </Button>
                    </div>

                    {/* Show progress if completed */}
                    {(getLessonProgress(lesson.id, 'guided') || getLessonProgress(lesson.id, 'challenge')) && (
                      <div className="space-y-2">
                        {getLessonProgress(lesson.id, 'guided') && (
                          <div className="p-3 bg-green-500/10 rounded-lg flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>Guided Practice completed</span>
                          </div>
                        )}
                        {getLessonProgress(lesson.id, 'challenge') && (
                          <div className="p-3 bg-green-500/10 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span>Challenge completed</span>
                              {getLessonProgress(lesson.id, 'challenge')?.time_saved_ms && (
                                <Badge variant="secondary" className="ml-auto">
                                  Saved {(getLessonProgress(lesson.id, 'challenge')!.time_saved_ms! / 1000).toFixed(1)}s
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Video */}
                  {lesson.videoId && (
                    <div className="mb-6">
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${lesson.videoId}`}
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Step-by-Step Instructions
                    </h4>
                    <ol className="space-y-2">
                      {lesson.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3">
                          <Badge variant="outline" className="mt-0.5">{idx + 1}</Badge>
                          <span className="text-sm text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Practice Problems */}
                  {lesson.practiceProblems && (
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Practice Problem</h4>
                      <p className="text-sm mb-2">{lesson.practiceProblems[0].problem}</p>
                      <details className="text-sm text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground">Show hint</summary>
                        <p className="mt-2">{lesson.practiceProblems[0].hint}</p>
                      </details>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Footer CTA */}
      <Card className="mt-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Master These, Gain Minutes</h2>
          <p className="text-muted-foreground mb-6">
            The ACT is a race against time. These shortcuts can be the difference between finishing and guessing.
          </p>
          <Button size="lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Zap className="w-4 h-4 mr-2" />
            Start Practicing Now
          </Button>
        </CardContent>
      </Card>

      {/* Practice Mode Dialog */}
      <Dialog open={practiceMode.type !== null} onOpenChange={closePracticeMode}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {practiceMode.type === 'guided' && 'Guided Practice'}
              {practiceMode.type === 'challenge' && 'Timed Challenge'}
              {currentLesson && `: ${currentLesson.title}`}
            </DialogTitle>
          </DialogHeader>
          
          {practiceMode.type === 'guided' && currentLesson && (
            <GuidedPractice 
              lesson={currentLesson} 
              onComplete={closePracticeMode}
            />
          )}
          
          {practiceMode.type === 'challenge' && currentLesson && (
            <TimedChallenge 
              lesson={currentLesson}
              onComplete={closePracticeMode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
