import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLessonBySkill } from '@/lib/content';
import { sanitizeHTML } from '@/lib/sanitize';

interface Lesson {
  id: string;
  title: string;
  body: string;
  skill_code: string;
  subject: string;
}

export default function LessonViewer() {
  const { topic } = useParams<{ topic?: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      try {
        const code = topic ?? '';
        const { data, error: fetchError } = await getLessonBySkill(code);
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
    return <div className="p-4">Loading lesson...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive">{error}</div>;
  }

  if (!lesson) {
    return <div className="p-4">No lesson found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{lesson.title || 'Lesson'}</h1>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(lesson.body || 'No content') }}
      />

export default function LessonViewer() {
  const { topic } = useParams<{ topic?: string }>();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lesson: {topic}</h1>
      <div className="prose max-w-none">
        <p className="text-muted-foreground">
          Lesson content for {topic} will be available soon.
        </p>
      </div>
    </div>
  );
}
