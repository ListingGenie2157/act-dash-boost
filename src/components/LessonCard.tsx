// Zero business logic component - just renders props
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock } from 'lucide-react';
import type { Lesson } from '@/types/curriculum';

interface LessonCardProps {
  lesson: Lesson;
  onStart: (lessonId: string) => void;
  isCompleted?: boolean;
  isLocked?: boolean;
}

export const LessonCard = ({ lesson, onStart, isCompleted, isLocked }: LessonCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isLocked ? 'opacity-60' : 'hover:border-primary'
      }`}
      onClick={() => !isLocked && onStart(lesson.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {lesson.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {lesson.skill_code} • {lesson.subject}
            </CardDescription>
          </div>
          <Badge variant={isCompleted ? 'default' : isLocked ? 'secondary' : 'outline'}>
            {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Available'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>~8 minutes</span>
          </div>

          <Button
            size="sm"
            className="w-full"
            disabled={isLocked}
            variant={isCompleted ? 'outline' : 'default'}
          >
            {isCompleted ? 'Review' : isLocked ? 'Locked' : 'Start Lesson'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};