import { Calendar, Target, TrendingUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProgress } from '@/hooks/useProgress';

interface DashboardProps {
  onStartDay: (day: number) => void;
  onViewReview: () => void;
}

export const Dashboard = ({ onStartDay, onViewReview }: DashboardProps) => {
  const { progress } = useProgress();
  
  const daysUntilTest = Math.max(0, 11 - progress.currentDay);
  const completionPercentage = (progress.completedDays.length / 11) * 100;
  
  const topWeakAreas = progress.weakAreas
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          ACT Prep Dashboard
        </h1>
        <p className="text-muted-foreground">
          Test Date: September 6 • {daysUntilTest} days of prep remaining
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Day</p>
              <p className="text-2xl font-bold">{progress.currentDay}/11</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-2xl font-bold">{Math.round(completionPercentage)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wrong Answers</p>
              <p className="text-2xl font-bold">{progress.wrongAnswers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="p-6 shadow-soft">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Overall Progress</h3>
            <span className="text-sm text-muted-foreground">
              {progress.completedDays.length} of 11 days completed
            </span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
        </div>
      </Card>

      {/* Current Day Action */}
      {progress.currentDay <= 11 && (
        <Card className="p-6 shadow-medium border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Day {progress.currentDay} Ready</h3>
              <p className="text-muted-foreground">
                Continue your ACT prep journey
              </p>
            </div>
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => onStartDay(progress.currentDay)}
              className="px-8"
            >
              Start Day {progress.currentDay}
            </Button>
          </div>
        </Card>
      )}

      {/* Weak Areas */}
      {topWeakAreas.length > 0 && (
        <Card className="p-6 shadow-soft">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Areas to Focus On
              </h3>
              <Button variant="outline" size="sm" onClick={onViewReview}>
                Review Wrong Answers
              </Button>
            </div>
            <div className="space-y-3">
              {topWeakAreas.map((area, index) => (
                <div key={`${area.subject}-${area.topic}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      area.subject === 'math' ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'
                    }`}>
                      {area.subject === 'math' ? 'M' : 'E'}
                    </div>
                    <span className="font-medium capitalize">{area.topic}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {area.errorCount} error{area.errorCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 shadow-soft">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold">Quick Drills</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Practice with timed rapid-fire questions
            </p>
            <Button 
              variant="drill" 
              className="w-full"
              onClick={() => {
                console.log("Math drill button clicked from Dashboard");
                // For now, we'll direct them to Day 1 where drills are available
                onStartDay(1);
              }}
            >
              🔢 Start Math Drill (60s)
            </Button>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Grammar Drill</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Quick grammar rules practice
            </p>
            <Button 
              variant="success" 
              className="w-full"
              onClick={() => {
                console.log("Grammar drill button clicked from Dashboard");
                // For now, we'll direct them to Day 1 where drills are available
                onStartDay(1);
              }}
            >
              ✏️ Start Grammar Drill (90s)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};