import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DayView } from '@/components/DayView';
import { FiveDayCalendar } from '@/components/FiveDayCalendar';
import { curriculum } from '@/data/curriculum';
import { useProgress } from '@/hooks/useProgress';
import { WrongAnswer } from '@/types';

const Plan = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showDayView, setShowDayView] = useState(false);
  const { progress, updateProgress, addWrongAnswer, updateWeakAreas, completeDay } = useProgress();

  const handleStartDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setShowDayView(true);
  };

  const handleBackToCalendar = () => {
    setShowDayView(false);
  };

  const handleDayComplete = (dayNumber: number) => {
    completeDay(dayNumber);
    setShowDayView(false);
  };

  const handleUpdateScore = (lessonId: string, practiceScore: number, quizScore: number, wrongAnswers: WrongAnswer[]) => {
    // Update scores
    updateProgress({
      ...progress,
      scores: {
        ...progress.scores,
        [lessonId]: {
          practiceScore,
          quizScore
        }
      }
    });

    // Add wrong answers and update weak areas
    wrongAnswers.forEach((wa) => {
      addWrongAnswer(wa.questionId, wa.question, wa.userAnswer);

      // Determine topic from lesson
      const lesson = curriculum.find(d =>
        d.mathLesson.id === lessonId || d.englishLesson.id === lessonId
      );
      if (lesson) {
        const ismath = lesson.mathLesson.id === lessonId;
        const subject = ismath ? 'Math' : 'English';
        const topic = ismath ? lesson.mathLesson.title : lesson.englishLesson.title;
        updateWeakAreas(subject, topic);
      }
    });
  };

  const selectedDayData = curriculum.find(d => d.day === selectedDay);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">
            {showDayView ? `Day ${selectedDay} Plan` : 'Study Plan Calendar'}
          </h1>
        </div>

        {!showDayView ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Your 30-Day Study Plan</h2>
              <p className="text-muted-foreground">
                Select a day to view your personalized lessons and practice sessions
              </p>
            </div>

            <FiveDayCalendar
              progress={progress}
              onStartDay={handleStartDay}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">
                  {progress.completedDays?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Days Completed</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">
                  {30 - (progress.completedDays?.length || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Days Remaining</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(((progress.completedDays?.length || 0) / 30) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </div>
        ) : (
          selectedDayData && (
            <DayView
              day={selectedDayData}
              onBack={handleBackToCalendar}
              onDayComplete={handleDayComplete}
              onUpdateScore={handleUpdateScore}
            />
          )
        )}
      </div>
    </div>
  );
};

export default Plan;