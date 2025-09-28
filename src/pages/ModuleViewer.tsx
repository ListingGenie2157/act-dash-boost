import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Target,
  Clock,
  CheckCircle,
  PlayCircle,
  RotateCcw
} from 'lucide-react';
import { MASTERY_GATES } from '@/types/curriculum';
import { useModule } from '@/hooks/useCurriculum';
import { useCurriculum } from '@/hooks/useCurriculum';

const ModuleViewer = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();
  const [activeTab, setActiveTab] = useState('lesson');
  const { updateProgress } = useCurriculum();

  const {
    module,
    lesson,
    examples,
    practiceQuestions,
    userProgress,
    isLoading,
    error
  } = useModule(moduleId!);

  // If no module found, redirect to curriculum
  useEffect(() => {
    if (!isLoading && !module && moduleId) {
      navigate('/curriculum');
    }
  }, [isLoading, module, moduleId, navigate]);

  const getStepStatus = (step: string) => {
    if (!userProgress) return 'locked';

    switch (step) {
      case 'lesson':
        return userProgress.lesson_completed ? 'completed' :
               userProgress.status === 'available' || userProgress.status === 'in_progress' ? 'available' : 'locked';
      case 'examples':
        return userProgress.examples_completed ? 'completed' :
               userProgress.lesson_completed ? 'available' : 'locked';
      case 'practice':
        return userProgress.practice_completed ? 'completed' :
               userProgress.examples_completed ? 'available' : 'locked';
      case 'timed':
        return userProgress.timed_set_completed ? 'completed' :
               userProgress.practice_completed ? 'available' : 'locked';
      case 'mastery':
        return userProgress.mastery_achieved ? 'completed' :
               userProgress.timed_set_completed ? 'available' : 'locked';
      default:
        return 'locked';
    }
  };

  const getOverallProgress = () => {
    if (!userProgress) return 0;
    let completed = 0;
    if (userProgress.lesson_completed) completed++;
    if (userProgress.examples_completed) completed++;
    if (userProgress.practice_completed) completed++;
    if (userProgress.timed_set_completed) completed++;
    if (userProgress.mastery_achieved) completed++;
    return (completed / 5) * 100;
  };

  const getMasteryRequirements = () => {
    if (!module) return null;

    switch (module.subject.toLowerCase()) {
      case 'english':
        return MASTERY_GATES.english;
      case 'math':
        return MASTERY_GATES.math;
      case 'reading':
        return MASTERY_GATES.reading;
      case 'science':
        return MASTERY_GATES.science;
      default:
        return null;
    }
  };

  const handleStartStep = async (step: string) => {
    const status = getStepStatus(step);
    if (status === 'locked') return;

    // Update progress to in_progress if not already
    if (userProgress && userProgress.status !== 'in_progress') {
      setUserProgress({ ...userProgress, status: 'in_progress' });
    }

    switch (step) {
      case 'lesson':
        setActiveTab('lesson');
        break;
      case 'examples':
        setActiveTab('examples');
        break;
      case 'practice':
        navigate(`/curriculum/module/${moduleId}/practice`);
        break;
      case 'timed':
        navigate(`/curriculum/module/${moduleId}/timed`);
        break;
      case 'mastery':
        navigate(`/curriculum/module/${moduleId}/mastery`);
        break;
    }
  };

  const handleCompleteLesson = () => {
    if (userProgress && moduleId) {
      updateProgress({
        module_id: moduleId,
        lesson_completed: true,
        status: 'in_progress',
        started_at: userProgress.started_at || new Date().toISOString()
      });
      setActiveTab('examples');
    }
  };

  const handleCompleteExamples = () => {
    if (userProgress && moduleId) {
      updateProgress({
        module_id: moduleId,
        examples_completed: true
      });
      setActiveTab('overview');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Module Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested module could not be found.</p>
          <Button onClick={() => navigate('/curriculum')}>Back to Curriculum</Button>
        </div>
      </div>
    );
  }

  const masteryReqs = getMasteryRequirements();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/curriculum')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Curriculum
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm bg-muted px-3 py-1 rounded">
                {module.id}
              </span>
              <h1 className="text-3xl font-bold">{module.title}</h1>
              <Badge variant="outline">Phase {module.phase}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{module.description}</p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Module Progress</CardTitle>
                <CardDescription>Complete all steps to achieve mastery</CardDescription>
              </div>
              <Badge variant={userProgress?.mastery_achieved ? 'default' : 'secondary'}>
                {userProgress?.mastery_achieved ? 'Mastered' : 'In Progress'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(getOverallProgress())}%</span>
                </div>
                <Progress value={getOverallProgress()} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { key: 'lesson', label: 'Lesson', duration: module.lesson_duration_minutes, icon: BookOpen },
                  { key: 'examples', label: 'Examples', duration: 10, icon: Users },
                  { key: 'practice', label: 'Practice', duration: 15, icon: Target },
                  { key: 'timed', label: 'Timed Set', duration: module.subject === 'English' ? 8 : 12, icon: Clock },
                  { key: 'mastery', label: 'Mastery Quiz', duration: 20, icon: CheckCircle },
                ].map(({ key, label, duration, icon: Icon }) => {
                  const status = getStepStatus(key);
                  return (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all ${
                        status === 'available' ? 'hover:shadow-md border-primary/50' :
                        status === 'completed' ? 'bg-green-50 border-green-200' :
                        'opacity-60'
                      }`}
                      onClick={() => handleStartStep(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`h-4 w-4 ${
                            status === 'completed' ? 'text-green-600' :
                            status === 'available' ? 'text-primary' :
                            'text-muted-foreground'
                          }`} />
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {duration}min
                        </div>
                        <div className="mt-2">
                          {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {status === 'available' && <PlayCircle className="h-4 w-4 text-primary" />}
                          {status === 'locked' && <div className="h-4 w-4 rounded-full bg-muted" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lesson" disabled={getStepStatus('lesson') === 'locked'}>
              Lesson
            </TabsTrigger>
            <TabsTrigger value="examples" disabled={getStepStatus('examples') === 'locked'}>
              Examples
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Module Structure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <strong>Per module ({module.subject}):</strong>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                    <li>• {module.lesson_duration_minutes}-minute lesson</li>
                    <li>• {module.subject === 'English' ? '6' : '5'} examples</li>
                    <li>• {module.subject === 'English' ? '8' : '12'} practice questions</li>
                    <li>• 1 timed mini-set ({module.subject === 'English' ? '10 Q/8 min' : '12 Q/12 min'})</li>
                    <li>• Mastery quiz ({module.subject === 'English' ? '12' : '15'} questions)</li>
                  </ul>
                </CardContent>
              </Card>

              {masteryReqs && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Mastery Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      {module.subject === 'English' && (
                        <>
                          <div>• 2 consecutive module quizzes ≥80%</div>
                          <div>• Average ≤45 sec/question</div>
                          <div>• Zero repeat rule errors</div>
                        </>
                      )}
                      {module.subject === 'Math' && (
                        <>
                          <div>• Module quiz ≥80%</div>
                          <div>• Mini-set ≥75% at 1 min/question</div>
                          <div>• Show work on missed questions</div>
                        </>
                      )}
                      {module.subject === 'Reading' && (
                        <>
                          <div>• Per passage ≥8/10 at ≤9 min</div>
                          <div>• No more than 1 "function" miss per set</div>
                        </>
                      )}
                      {module.subject === 'Science' && (
                        <>
                          <div>• Mini-set ≥80% at ≤40 sec/question</div>
                          <div>• All graph-axis reads correct</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => handleStartStep('practice')}
                disabled={getStepStatus('practice') === 'locked'}
                size="lg"
                className="h-16"
              >
                <div className="text-center">
                  <div className="font-medium">Practice</div>
                  <div className="text-xs opacity-75">{practiceQuestions.length} questions</div>
                </div>
              </Button>

              <Button
                onClick={() => handleStartStep('timed')}
                disabled={getStepStatus('timed') === 'locked'}
                variant="outline"
                size="lg"
                className="h-16"
              >
                <div className="text-center">
                  <div className="font-medium">Timed Set</div>
                  <div className="text-xs opacity-75">{module.subject === 'English' ? '8min' : '12min'}</div>
                </div>
              </Button>

              <Button
                onClick={() => handleStartStep('mastery')}
                disabled={getStepStatus('mastery') === 'locked'}
                variant="outline"
                size="lg"
                className="h-16"
              >
                <div className="text-center">
                  <div className="font-medium">Mastery Quiz</div>
                  <div className="text-xs opacity-75">Final test</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/curriculum')}
                variant="ghost"
                size="lg"
                className="h-16"
              >
                <div className="text-center">
                  <div className="font-medium">All Modules</div>
                  <div className="text-xs opacity-75">Choose different</div>
                </div>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="lesson" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lesson Content</span>
                  <Badge variant="outline">{module.lesson_duration_minutes} minutes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lesson ? (
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap">{lesson.lesson_text}</div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <h2>{module.title}</h2>
                    <p><strong>Overview:</strong> {module.description}</p>
                    <p>This {module.lesson_duration_minutes}-minute lesson will cover the key concepts you need to master for {module.title}.</p>

                    <h3>Key Concepts</h3>
                    <ol>
                      <li><strong>Concept 1:</strong> Detailed explanation here</li>
                      <li><strong>Concept 2:</strong> More information</li>
                      <li><strong>Concept 3:</strong> Additional content</li>
                    </ol>

                    <h3>Practice Strategy</h3>
                    <p>After completing this lesson, you'll work through examples and practice questions to reinforce your understanding.</p>
                  </div>
                )}

                {!userProgress?.lesson_completed && (
                  <>
                    <Separator className="my-6" />
                    <div className="flex justify-center">
                      <Button onClick={handleCompleteLesson} size="lg">
                        Mark Lesson Complete
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Worked Examples</span>
                  <Badge variant="outline">{examples.length} examples</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {examples.map((example, index) => (
                    <div key={example.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Example {index + 1}</span>
                      </div>
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <p className="font-medium mb-2">{example.question_text}</p>
                          <p className="text-sm text-muted-foreground">{example.explanation}</p>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>

                {!userProgress?.examples_completed && (
                  <>
                    <Separator className="my-6" />
                    <div className="flex justify-center">
                      <Button onClick={handleCompleteExamples} size="lg">
                        Complete Examples
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModuleViewer;