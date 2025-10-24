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
  type EnhancedLesson,
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

export default function EnhancedLessonViewer() {
  const { topic } = useParams<{ topic?: string }>();
  const [lesson, setLesson] = useState<EnhancedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('learn');

  const { data: mastery } = useSkillMastery(topic);

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
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setLesson(data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };
    void fetchLesson();
  }, [topic]);

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
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Not Found</CardTitle>
            <CardDescription>This lesson doesn't have content yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/lessons">← Browse Other Lessons</Link>
            </Button>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="learn">
            <BookOpen className="h-4 w-4 mr-2" />
            Learn
          </TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="test">Test Yourself</TabsTrigger>
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
          {lesson.checkpoint_quiz_questions && lesson.checkpoint_quiz_questions.length > 0 && (
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
                  onComplete={async () => {}} 
                />
              </CardContent>
            </Card>
          )}

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
      </Tabs>
    </div>
  );
}
