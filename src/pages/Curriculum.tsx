// Curriculum page with proper architecture - hooks for data, components for UI
import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Target, TrendingUp } from 'lucide-react';
import { LessonCard } from '@/components/LessonCard';
import { ProgressCard } from '@/components/ProgressCard';
import { useLessons, useProgress } from '@/hooks/useCurriculum';
import { useIsAuthenticated } from '@/hooks/useAuthUser';

const CurriculumContent = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useIsAuthenticated();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const { data: lessons = [], isLoading: lessonsLoading } = useLessons();
  const { data: progress = [], isLoading: progressLoading } = useProgress();

  const handleLessonStart = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };

  const groupedLessons = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.subject]) {
      acc[lesson.subject] = [];
    }
    acc[lesson.subject].push(lesson);
    return acc;
  }, {} as Record<string, typeof lessons>);

  if (lessonsLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">ACT Curriculum</h1>
            <p className="text-muted-foreground">
              Study lessons by subject and track your progress
            </p>
          </div>
        </div>

        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            {Object.entries(groupedLessons).map(([subject, subjectLessons]) => (
              <Card key={subject}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {subject}
                  </CardTitle>
                  <CardDescription>
                    {subjectLessons.length} lessons available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectLessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onStart={handleLessonStart}
                        isCompleted={false} // TODO: Track completion
                        isLocked={false} // TODO: Track unlock status
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {lessons.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No lessons available yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            {progress.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {progress.map((progressItem) => (
                  <ProgressCard
                    key={`${progressItem.user_id}-${progressItem.domain}`}
                    progress={progressItem}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Complete some practice questions to see your progress
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Curriculum = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CurriculumContent />
    </Suspense>
  );
};

export default Curriculum;