// Lesson viewer with proper architecture
import { Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { useLessons } from '@/hooks/useCurriculum';
import { useIsAuthenticated } from '@/hooks/useAuthUser';

const LessonContent = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useIsAuthenticated();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const { data: lessons = [], isLoading } = useLessons();
  const lesson = lessons.find(l => l.id === lessonId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Lesson Not Found</h2>
          <p className="text-muted-foreground">The requested lesson could not be found.</p>
          <Button onClick={() => navigate('/curriculum')}>
            Back to Curriculum
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6">
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
              <BookOpen className="h-6 w-6" />
              <h1 className="text-3xl font-bold">{lesson.title}</h1>
              <Badge variant="outline">{lesson.subject}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Skill Code: {lesson.skill_code}
            </p>
          </div>
        </div>

        {/* Lesson Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lesson Content</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~8 minutes</span>
              </div>
            </CardTitle>
            <CardDescription>
              Version {lesson.version} • Last updated {new Date(lesson.updated_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: lesson.body }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={() => navigate('/curriculum')}>
            Back to Curriculum
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/practice/${lesson.skill_code}`)}
            >
              Practice Questions
            </Button>
            <Button onClick={() => navigate(`/quiz/${lesson.skill_code}`)}>
              Take Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LessonViewer = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LessonContent />
    </Suspense>
  );
};

export default LessonViewer;