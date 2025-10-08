import { useState } from 'react';
import { useParams } from 'react-router-dom';

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
