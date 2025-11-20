import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  getEnhancedLesson, 
  getPracticeQuestions,
  type EnhancedLesson,
  type CheckpointQuestion,
  parseConceptRules,
  parseGuidedPractice,
  parseCommonTraps,
  parseIndependentPractice
} from '@/lib/lessons';
import { useSkillMastery } from '@/hooks/useMastery';
import { MasteryBadge } from '@/components/MasteryBadge';
import { MasteryProgressBar } from '@/components/MasteryProgressBar';
import { sanitizeHTML } from '@/lib/sanitize';
import { RuleCard } from '@/components/lesson/RuleCard';
import { GuidedExampleCard } from '@/components/lesson/GuidedExampleCard';
import { CommonTrapsAlert } from '@/components/lesson/CommonTrapsAlert';
import { IndependentPracticeCard } from '@/components/lesson/IndependentPracticeCard';
import { QuizComponent } from '@/components/QuizComponent';
import { AlertCircle, Target, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PeriodicTable } from '@/components/lesson/PeriodicTable';
import { YouTubeEmbed, extractYouTubeId } from '@/components/lesson/YouTubeEmbed';
import { TutorTrigger } from '@/components/tutor/TutorTrigger';
import { mapToTutorSubject } from '@/lib/tutorSubjectMapper';

export default function EnhancedLessonViewer() {
  const { topic } = useParams<{ topic?: string }>();
  const [lesson, setLesson] = useState<EnhancedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('learn');
  const [showPracticeQuiz, setShowPracticeQuiz] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<CheckpointQuestion[]>([]);
  const [needsMorePractice, setNeedsMorePractice] = useState(false);
  const [lastScore, setLastScore] = useState<number>(0);

  const { data: mastery } = useSkillMastery(topic);
  const { toast } = useToast();

  const parsedRules = useMemo(() => {
    try {
      return lesson?.concept_explanation ? parseConceptRules(lesson.concept_explanation) : [];
    } catch (err) {
      console.error('Error parsing concept rules:', err);
      return [];
    }
  }, [lesson?.concept_explanation]);

  const parsedExamples = useMemo(() => {
    try {
      return lesson?.guided_practice ? parseGuidedPractice(lesson.guided_practice) : [];
    } catch (err) {
      console.error('Error parsing guided practice:', err);
      return [];
    }
  }, [lesson?.guided_practice]);

  const parsedTraps = useMemo(() => {
    try {
      return lesson?.common_traps ? parseCommonTraps(lesson.common_traps) : [];
    } catch (err) {
      console.error('Error parsing common traps:', err);
      return [];
    }
  }, [lesson?.common_traps]);

  const parsedIndependentPractice = useMemo(() => {
    try {
      return lesson?.independent_practice 
        ? parseIndependentPractice(lesson.independent_practice, lesson.independent_practice_answers || null)
        : [];
    } catch (err) {
      console.error('Error parsing independent practice:', err);
      return [];
    }
  }, [lesson?.independent_practice, lesson?.independent_practice_answers]);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      try {
        const code = topic ?? '';
        const { data, error: fetchError } = await getEnhancedLesson(code);
        if (fetchError || !data) {
          // If no enhanced lesson content, still show a basic view
          setError(null);
          setLesson(null);
        } else {
          setLesson(data);
        }
      } catch (err: unknown) {
        setError(null);
        setLesson(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchLesson();
  }, [topic]);

  const handleNeedsPractice = async (_skillCode: string, score: number, wrongCount: number) => {
    setLastScore(score);
    setNeedsMorePractice(true);
    
    toast({
      title: 'Keep Practicing!',
      description: `Score: ${score}%. Let's practice ${wrongCount} more questions to master this skill.`,
    });
  };
  
  const handlePracticeMore = async () => {
    try {
      const questions = await getPracticeQuestions(topic || '', 10);
      setPracticeQuestions(questions);
      setShowPracticeQuiz(true);
      setNeedsMorePractice(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load practice questions',
        variant: 'destructive',
      });
    }
  };
  
  const handlePracticeComplete = (score: number) => {
    setShowPracticeQuiz(false);
    
    if (score >= 80) {
      toast({
        title: 'Mastery Achieved! 🎉',
        description: `Great job! You scored ${score}% and mastered this skill.`,
      });
      setNeedsMorePractice(false);
    } else {
      setNeedsMorePractice(true);
      toast({
        title: 'Keep Going!',
        description: `Score: ${score}%. Try a few more questions.`,
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Lesson</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/lessons">← Back to Lessons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Button variant="outline" size="default" asChild className="mb-6">
          <Link to="/lessons">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Lessons
          </Link>
        </Button>
        
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-warning/20">
                <BookOpen className="h-6 w-6 text-warning" />
              </div>
              <div>
                <CardTitle>Lesson Content Coming Soon</CardTitle>
                <CardDescription className="mt-1">
                  Detailed lesson content for this skill is being prepared.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              While we're working on comprehensive lesson content, you can still practice this skill through:
            </p>
            <div className="grid gap-3">
              <Link to="/drills">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Clock className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">Practice with Timed Drills</p>
                      <p className="text-xs text-muted-foreground">Build speed and accuracy</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link to="/lessons">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Browse Other Lessons</p>
                      <p className="text-xs text-muted-foreground">Explore available content</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button variant="outline" size="default" asChild className="mb-6">
          <Link to="/lessons">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Lessons
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{lesson.subject}</Badge>
              <Badge variant="outline">{lesson.section}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{lesson.skill_name}</h1>
          </div>

          {mastery && mastery.total > 0 && (
            <div className="flex-shrink-0">
              <MasteryBadge 
                level={mastery.level}
                accuracy={mastery.accuracy}
                total={mastery.total}
                size="lg"
              />
            </div>
          )}
          
          <TutorTrigger
            subject={mapToTutorSubject(lesson.subject)}
            topic={lesson.skill_code}
            mode="practice"
          />
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            ~{lesson.estimatedMinutes} minutes
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            {lesson.difficulty}
          </div>
        </div>

        {mastery && mastery.total > 0 && (
          <div className="mt-4">
            <MasteryProgressBar 
              accuracy={mastery.accuracy}
              level={mastery.level}
              total={mastery.total}
            />
          </div>
        )}
      </div>

      <Separator className="my-6" />

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="learn">
            <BookOpen className="h-4 w-4 mr-2" />
            Learn
          </TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="test">Test Yourself</TabsTrigger>
          <TabsTrigger value="resources">
            <FlaskConical className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learn" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHTML(lesson.overview) }} />
            </CardContent>
          </Card>

          {parsedRules.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold">Key Rules</h2>
              {parsedRules.map((rule) => (
                <RuleCard key={rule.number} number={rule.number} title={rule.title} content={rule.content} />
              ))}
            </>
          ) : lesson.concept_explanation && (
            <Card>
              <CardHeader>
                <CardTitle>Concept Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert" 
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(lesson.concept_explanation) }} 
                />
              </CardContent>
            </Card>
          )}

          {parsedExamples.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mt-8">Guided Examples</h2>
              {parsedExamples.map((example) => (
                <GuidedExampleCard key={example.number} number={example.number} content={example.content} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="practice" className="space-y-6 mt-6">
          {lesson.common_traps && <CommonTrapsAlert traps={parsedTraps} />}

          {parsedIndependentPractice.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Practice Questions</CardTitle>
                  <CardDescription>Try these on your own. Click to reveal answers.</CardDescription>
                </CardHeader>
              </Card>
              {parsedIndependentPractice.map((q) => (
                <IndependentPracticeCard key={q.number} number={q.number} question={q.question} answer={q.answer} />
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Practice questions coming soon!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-6 mt-6">
          {showPracticeQuiz ? (
            <Card>
              <CardHeader>
                <CardTitle>Practice: {lesson?.skill_name}</CardTitle>
                <CardDescription>Additional practice questions to master this skill</CardDescription>
              </CardHeader>
              <CardContent>
                <QuizComponent
                  questions={practiceQuestions}
                  title={`Practice: ${lesson?.skill_name}`}
                  skillCode={topic || ''}
                  onComplete={handlePracticeComplete}
                  onBack={() => setShowPracticeQuiz(false)}
                />
              </CardContent>
            </Card>
          ) : lesson.checkpoint_quiz_questions && lesson.checkpoint_quiz_questions.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Checkpoint Quiz</CardTitle>
                  <CardDescription>Test your mastery</CardDescription>
                </CardHeader>
                <CardContent>
                  <QuizComponent 
                    questions={lesson.checkpoint_quiz_questions.map(q => {
                      const answer = q.correctAnswer as unknown;
                      return {
                        ...q,
                        correctAnswer: typeof answer === 'string' 
                          ? (answer as string).toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
                          : q.correctAnswer
                      };
                    })} 
                    title="Checkpoint Quiz"
                    skillCode={topic || ''}
                    onComplete={(score) => setLastScore(score)}
                    onNeedsPractice={handleNeedsPractice}
                  />
                </CardContent>
              </Card>
              
              {needsMorePractice && (
                <Card className="border-warning">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertCircle className="h-6 w-6 text-warning" />
                      <div>
                        <h4 className="font-semibold">Practice More to Master This Skill</h4>
                        <p className="text-sm text-muted-foreground">
                          You scored {lastScore}%. Complete additional practice to reach mastery (80%+).
                        </p>
                      </div>
                    </div>
                    <Button onClick={handlePracticeMore} className="w-full" variant="outline">
                      <Target className="h-4 w-4 mr-2" />
                      Practice More Questions
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}

          {lesson.recap && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle>Lesson Recap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHTML(lesson.recap) }} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6 mt-6">
          <PeriodicTable />
          
          {/* Example of how to embed YouTube videos in lesson content */}
          {lesson.overview.includes('youtube.com') || lesson.overview.includes('youtu.be') ? (
            <Card>
              <CardHeader>
                <CardTitle>Video Resources</CardTitle>
                <CardDescription>Supplementary video content for this lesson</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const urlPattern = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+)/g;
                  const matches = lesson.overview.match(urlPattern) || [];
                  return matches.map((url, idx) => {
                    const videoId = extractYouTubeId(url);
                    return videoId ? (
                      <YouTubeEmbed key={idx} videoId={videoId} title={`Video ${idx + 1}`} />
                    ) : null;
                  });
                })()}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Practice Problems</p>
                  <p className="text-muted-foreground text-xs">Work through the practice tab for hands-on experience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Checkpoint Quiz</p>
                  <p className="text-muted-foreground text-xs">Test your understanding in the Test Yourself tab</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
