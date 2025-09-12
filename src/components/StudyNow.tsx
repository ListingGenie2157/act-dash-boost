import React, { useState, useEffect, useCallback, memo } from 'react';
import { Play, Clock, CheckCircle, XCircle, Brain, Target, BookOpen, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StudyTask {
  id: string;
  type: 'LEARN' | 'DRILL' | 'MIXED' | 'REVIEW' | 'SIM';
  skill_id: string | null;
  size: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  accuracy: number | null;
  median_time_ms: number | null;
  reward_cents: number;
}

interface Question {
  id: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: number;
  time_limit_secs: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  subject: string;
  cluster: string;
}

interface StudyPlan {
  the_date: string;
  tasks: StudyTask[];
  mode: string;
  days_left: number | null;
}

export function StudyNow() {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadStudyPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      setStudyPlan(data);
      setCurrentTaskIndex(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error loading study plan:', msg);
      setError(msg || 'Failed to load study plan');
      toast({
        title: 'Error',
        description: 'Failed to load your study plan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleTaskComplete = useCallback(async (taskId: string, accuracy: number, timeMs: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('complete-task', {
        body: {
          task_id: taskId,
          accuracy,
          time_ms: timeMs
        }
      });

      if (error) {
        throw error;
      }

      // Update the study plan with the completed task
      if (studyPlan) {
        const updatedTasks = studyPlan.tasks.map(task =>
          task.id === taskId ? { ...task, ...data } : task
        );
        setStudyPlan({ ...studyPlan, tasks: updatedTasks });
      }

      // Move to next task
      setCurrentTaskIndex(prev => prev + 1);

      toast({
        title: 'Task Completed!',
        description: `Great job! Accuracy: ${Math.round(accuracy * 100)}%`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error completing task:', msg);
      toast({
        title: 'Error',
        description: 'Failed to save task completion. Please try again.',
        variant: 'destructive'
      });
    }
  }, [studyPlan, toast]);

  if (!studyPlan) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Ready to Study?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <p className="text-muted-foreground">
            Generate your personalized study plan for today and start learning!
          </p>
          <Button 
            onClick={loadStudyPlan} 
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {loading ? 'Loading...' : 'Study Now'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentTask = studyPlan.tasks[currentTaskIndex];
  const completedTasks = studyPlan.tasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = studyPlan.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (currentTaskIndex >= studyPlan.tasks.length) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Study Session Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium">Great work today!</p>
            <p className="text-muted-foreground">
              You completed {totalTasks} task{totalTasks !== 1 ? 's' : ''} in {studyPlan.mode} mode.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-primary">
                  {studyPlan.tasks.reduce((sum, t) => sum + (t.reward_cents || 0), 0)}¢
                </div>
                <div className="text-muted-foreground">Earned</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary">
                  {Math.round(studyPlan.tasks.reduce((sum, t) => sum + (t.accuracy || 0), 0) / totalTasks * 100)}%
                </div>
                <div className="text-muted-foreground">Avg Accuracy</div>
              </div>
            </div>
          </div>
          <Button onClick={loadStudyPlan} variant="outline">
            Study More
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {completedTasks} of {totalTasks} tasks
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Mode: {studyPlan.mode}</span>
              <span>
                {studyPlan.days_left !== null ? `T-${studyPlan.days_left}` : 'No test date set'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Task */}
      {currentTask && (
        <TaskRunner
          task={currentTask}
          onComplete={handleTaskComplete}
        />
      )}
    </div>
  );
}

interface TaskRunnerProps {
  task: StudyTask;
  onComplete: (taskId: string, accuracy: number, timeMs: number) => void;
}

const TaskRunner = memo(function TaskRunner({ task, onComplete }: TaskRunnerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: string]: 'A' | 'B' | 'C' | 'D' }>({});
  const [timeStarted, setTimeStarted] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(45);
  const { toast } = useToast();

  // Timer effect
  useEffect(() => {
    if (task.type === 'LEARN') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleQuestionAnswer('A'); // Default answer
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex]);

  // Load questions and skill data
  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setLoading(true);

        if (task.skill_id) {
          // Load skill info
          const { data: skillData, error: skillError } = await supabase
            .from('skills')
            .select('*')
            .eq('id', task.skill_id)
            .single();

          if (skillError) throw skillError;
          setSkill(skillData);
        }

        if (task.type !== 'LEARN') {
          // Load questions for this skill
          const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('skill_id', task.skill_id)
            .limit(task.size);

          if (questionsError) throw questionsError;
          setQuestions((questionsData || []).map(q => ({
            ...q,
            answer: q.answer as 'A' | 'B' | 'C' | 'D'
          })));
        }

        setTimeStarted(Date.now());
        setQuestionStartTime(Date.now());
      } catch (error) {
        console.error('Error loading task data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load task data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadTaskData();
  }, [task, toast]);

  const handleQuestionAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D') => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionTime = Date.now() - questionStartTime;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
      setTimeRemaining(45);
    } else {
      // Complete the task
      const totalTime = Date.now() - timeStarted;
      const correctAnswers = Object.entries(answers).reduce((count, [qId, ans]) => {
        const q = questions.find(q => q.id === qId);
        return count + (q && q.answer === ans ? 1 : 0);
      }, 0) + (currentQuestion.answer === answer ? 1 : 0);
      
      const accuracy = correctAnswers / questions.length;
      onComplete(task.id, accuracy, totalTime);
    }
  }, [questions, currentQuestionIndex, answers, timeStarted, questionStartTime, onComplete, task.id]);

  const getTaskIcon = () => {
    switch (task.type) {
      case 'LEARN': return <BookOpen className="h-5 w-5" />;
      case 'DRILL': return <Target className="h-5 w-5" />;
      case 'REVIEW': return <Brain className="h-5 w-5" />;
      case 'SIM': return <Zap className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4">Loading task...</p>
        </CardContent>
      </Card>
    );
  }

  if (task.type === 'LEARN') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTaskIcon()}
            Learn: {skill?.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p><strong>Subject:</strong> {skill?.subject}</p>
            <p><strong>Cluster:</strong> {skill?.cluster}</p>
            <p>{skill?.description}</p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Example Problems:</h4>
            <p className="text-sm text-muted-foreground">
              Practice problems would be displayed here based on the skill content.
            </p>
          </div>

          <Button 
            onClick={() => onComplete(task.id, 1, Date.now() - timeStarted)}
            className="w-full"
          >
            Complete Lesson
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (task.type === 'SIM') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTaskIcon()}
            Section Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Full section simulator coming soon!
          </p>
          <Button 
            onClick={() => onComplete(task.id, 0.85, 1800000)} // Mock 30min session
            variant="outline"
          >
            Skip for Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No questions available for this task.</p>
          <Button 
            onClick={() => onComplete(task.id, 0, 0)}
            variant="outline"
            className="mt-4"
          >
            Skip Task
          </Button>
        </CardContent>
      </Card>
    );
  }

  const choices = [
    { key: 'A', text: currentQuestion.choice_a },
    { key: 'B', text: currentQuestion.choice_b },
    { key: 'C', text: currentQuestion.choice_c },
    { key: 'D', text: currentQuestion.choice_d }
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getTaskIcon()}
            {task.type}: {skill?.name}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {currentQuestionIndex + 1} of {questions.length}
            </Badge>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4" />
              <span className={cn(
                "font-mono",
                timeRemaining <= 10 && "text-destructive font-bold"
              )}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        <Progress value={(timeRemaining / 45) * 100} className="h-1" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="prose prose-sm max-w-none">
          <p className="text-base leading-relaxed">{currentQuestion.stem}</p>
        </div>

        <div className="grid gap-3">
          {choices.map(({ key, text }) => (
            <Button
              key={key}
              variant="outline"
              className="justify-start text-left h-auto p-4 whitespace-normal"
              onClick={() => handleQuestionAnswer(key)}
            >
              <span className="font-mono font-bold mr-3 text-primary">{key}.</span>
              <span>{text}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});