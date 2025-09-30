import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getLessonBySkill } from '@/lib/content';

export default function LessonViewer() {
  const { topic } = useParams<{ topic?: string }>();
  const [lesson, setLesson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      try {
        const code = topic ?? '';
        const { data, error } = await getLessonBySkill(code);
        if (error) {
          setError(error.message);
        } else {
          setLesson(data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
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
      {/* naive rendering; if body contains markdown HTML; ideally use a markdown renderer */}
      <div className="prose max-w-none">
        {lesson.body || lesson.content || 'No content'}
      </div>
    </div>
  );
}
