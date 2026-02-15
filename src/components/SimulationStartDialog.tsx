import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Play, Sparkles, Brain, Target } from 'lucide-react';

interface SimulationStartDialogProps {
  formId: string;
  section: string;
  questionCount?: number;
  onStart: (coached: boolean) => void;
  onBack: () => void;
}

const SECTION_CONFIG: Record<string, { name: string; timeMinutes: number; icon: string }> = {
  'EN': { name: 'English', timeMinutes: 35, icon: '📝' },
  'MATH': { name: 'Math', timeMinutes: 50, icon: '🔢' },
  'RD': { name: 'Reading', timeMinutes: 40, icon: '📖' },
  'SCI': { name: 'Science', timeMinutes: 40, icon: '🔬' },
};

export function SimulationStartDialog({ 
  formId, 
  section, 
  onStart, 
  onBack 
}: SimulationStartDialogProps) {
  const [coachMode, setCoachMode] = useState(false);
  
  const config = SECTION_CONFIG[section] || { name: section, timeMinutes: 45, icon: '📋' };
  const formLabel = formId.replace('F', 'Form ').replace('_', ' - ');

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Forms
      </Button>

      <Card className="w-full">
        <CardHeader className="text-center pb-4">
          <div className="text-4xl mb-2">{config.icon}</div>
          <CardTitle className="text-2xl">ACT {config.name}</CardTitle>
          <CardDescription className="text-base">
            {formLabel}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Test Details */}
          <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Time Limit</p>
              <p className="font-semibold">{config.timeMinutes} minutes</p>
            </div>
          </div>

          {/* Coach Mode Toggle */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <Label htmlFor="coach-mode" className="font-semibold cursor-pointer">
                  Coach Mode
                </Label>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <Switch 
                id="coach-mode"
                checked={coachMode}
                onCheckedChange={setCoachMode}
              />
            </div>
            
            {coachMode && (
              <div className="space-y-2 text-sm text-muted-foreground pl-7">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Two-Pass Strategy guidance</span>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Real-time pacing feedback</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Personalized tips as you go</span>
                </div>
              </div>
            )}
          </div>

          {/* Start Button */}
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => onStart(coachMode)}
          >
            <Play className="h-5 w-5 mr-2" />
            {coachMode ? 'Start Coached Test' : 'Start Timed Test'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your progress will be saved automatically. You can resume if you leave.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
