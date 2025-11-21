import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Award, 
  TrendingUp, 
  Calculator,
  PlayCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { calculatorLessons, calculatorModels, type CalculatorModel } from '@/data/calculatorLessons';
import { YouTubeEmbed } from '@/components/lesson/YouTubeEmbed';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VirtualCalculator } from '@/components/calculator/VirtualCalculator';

export default function CalculatorLab() {
  const [selectedModel, setSelectedModel] = useState<CalculatorModel | 'all'>('all');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [calcDisplay, setCalcDisplay] = useState<string>('');
  const [showDemo, setShowDemo] = useState(false);

  const filteredLessons = selectedModel === 'all' 
    ? calculatorLessons 
    : calculatorLessons.filter(lesson => lesson.model.includes(selectedModel));

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
          The ACT is time-pressured—these techniques are the difference between guessing and finishing.
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="flex items-center gap-4 pt-6">
            <Clock className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">2-3 min</p>
              <p className="text-sm text-muted-foreground">Time saved per problem</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="flex items-center gap-4 pt-6">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">15+ min</p>
              <p className="text-sm text-muted-foreground">Total time saved on Math</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="flex items-center gap-4 pt-6">
            <Award className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{calculatorLessons.length} Skills</p>
              <p className="text-sm text-muted-foreground">Test-specific shortcuts</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            variant={selectedModel === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedModel('all')}
            className="h-auto py-4 flex-col gap-2"
          >
            <span className="text-2xl">🎯</span>
            <span className="font-semibold">All Models</span>
            <span className="text-xs opacity-70">{calculatorLessons.length} lessons</span>
          </Button>
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
        {filteredLessons.map((lesson, index) => (
          <Card 
            key={lesson.id}
            className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in border-l-4"
            style={{ 
              animationDelay: `${index * 50}ms`,
              borderLeftColor: lesson.difficulty === 'beginner' ? 'rgb(34, 197, 94)' : 
                               lesson.difficulty === 'intermediate' ? 'rgb(234, 179, 8)' : 
                               'rgb(239, 68, 68)'
            }}
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
                    <Button variant="ghost" size="sm" className="shrink-0">
                      {expandedLesson === lesson.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
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
                  {lesson.model.map(model => (
                    <Badge key={model} variant="secondary">
                      {calculatorModels[model].image} {model}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="space-y-6 border-t pt-6">
                  {/* Video */}
                  {lesson.videoId && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        Watch the Tutorial
                      </h3>
                      <YouTubeEmbed videoId={lesson.videoId} title={lesson.title} />
                    </div>
                  )}

                  {/* When to Use */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      When to Use This
                    </h3>
                    <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {lesson.whenToUse}
                    </p>
                  </div>

                  {/* Steps */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Step-by-Step Instructions
                    </h3>
                    <ol className="space-y-2">
                      {lesson.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 items-start">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Practice Problems */}
                  {lesson.practiceProblems && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Practice Problem
                      </h3>
                      {lesson.practiceProblems.map((practice, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-lg p-4 space-y-2">
                          <p className="font-mono text-lg">{practice.problem}</p>
                          <details className="text-sm text-muted-foreground">
                            <summary className="cursor-pointer hover:text-foreground font-medium">
                              Show hint
                            </summary>
                            <p className="mt-2 pl-4 border-l-2 border-primary/30">{practice.hint}</p>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Footer CTA */}
      <Card className="mt-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="pt-6 text-center">
          <h3 className="text-xl font-bold mb-2">🎯 Pro Tip for Test Day</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Practice these shortcuts until they're <span className="text-primary font-semibold">muscle memory</span>. 
            On test day, you won't have time to think—you need to execute automatically. 
            Spend 15 minutes/day for one week, and you'll save 15+ minutes on the actual test.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
