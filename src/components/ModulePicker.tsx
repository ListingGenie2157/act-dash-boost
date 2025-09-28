import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock, Clock, BookOpen, Target } from 'lucide-react';
import { Module, UserModuleProgress, PHASE_CONFIGS } from '@/types/curriculum';
import { MODULES } from '@/data/modules';

interface ModulePickerProps {
  userProgress: UserModuleProgress[];
  onModuleSelect: (moduleId: string) => void;
  selectedPhase?: number;
  onPhaseChange?: (phase: number) => void;
}

export const ModulePicker: React.FC<ModulePickerProps> = ({
  userProgress,
  onModuleSelect,
  selectedPhase,
  onPhaseChange,
}) => {
  const [currentPhase, setCurrentPhase] = useState(selectedPhase || 1);

  const getUserProgress = (moduleId: string) => {
    return userProgress.find(p => p.module_id === moduleId);
  };

  const getModulesByPhase = (phase: number) => {
    return MODULES.filter(m => m.phase === phase && m.is_active);
  };

  const getProgressIcon = (status: string | undefined, masteryAchieved: boolean) => {
    if (!status || status === 'locked') return <Lock className="h-4 w-4 text-muted-foreground" />;
    if (status === 'completed' && masteryAchieved) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-blue-600" />;
    if (status === 'available') return <Circle className="h-4 w-4 text-orange-600" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getProgressColor = (status: string | undefined, masteryAchieved: boolean) => {
    if (!status || status === 'locked') return 'secondary';
    if (status === 'completed' && masteryAchieved) return 'default';
    if (status === 'in_progress') return 'outline';
    return 'secondary';
  };

  const getModuleProgress = (progress: UserModuleProgress | undefined) => {
    if (!progress) return 0;
    let completed = 0;
    let total = 5; // lesson, examples, practice, timed_set, mastery_quiz

    if (progress.lesson_completed) completed++;
    if (progress.examples_completed) completed++;
    if (progress.practice_completed) completed++;
    if (progress.timed_set_completed) completed++;
    if (progress.mastery_achieved) completed++;

    return (completed / total) * 100;
  };

  const phaseConfig = PHASE_CONFIGS.find(p => p.phase === currentPhase);
  const phaseModules = getModulesByPhase(currentPhase);

  const handlePhaseChange = (phase: number) => {
    setCurrentPhase(phase);
    onPhaseChange?.(phase);
  };

  return (
    <div className="space-y-6">
      {/* Phase Navigation */}
      <div className="flex flex-wrap gap-2">
        {PHASE_CONFIGS.slice(0, 5).map((phase) => ( // Skip Phase 6 for now
          <Button
            key={phase.phase}
            variant={currentPhase === phase.phase ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePhaseChange(phase.phase)}
            className="flex items-center gap-2"
          >
            <span className="text-xs font-mono">Phase {phase.phase}</span>
            <span>{phase.name}</span>
          </Button>
        ))}
      </div>

      {/* Phase Overview */}
      {phaseConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Phase {phaseConfig.phase}: {phaseConfig.name}
            </CardTitle>
            <CardDescription>{phaseConfig.description}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phaseModules.map((module) => {
          const progress = getUserProgress(module.id);
          const progressPercent = getModuleProgress(progress);
          const canStart = !progress || progress.status === 'available' || progress.status === 'in_progress';

          return (
            <Card
              key={module.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                canStart ? 'hover:border-primary' : 'opacity-60'
              }`}
              onClick={() => canStart && onModuleSelect(module.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {module.id}
                      </span>
                      {module.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      {module.description}
                    </CardDescription>
                  </div>
                  {getProgressIcon(progress?.status, progress?.mastery_achieved || false)}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  {/* Module Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span>{module.lesson_duration_minutes}min lesson</span>
                    </div>
                    <Badge variant={getProgressColor(progress?.status, progress?.mastery_achieved || false)}>
                      {!progress ? 'Locked' :
                       progress.status === 'completed' && progress.mastery_achieved ? 'Mastered' :
                       progress.status === 'completed' ? 'Completed' :
                       progress.status === 'in_progress' ? 'In Progress' :
                       progress.status === 'available' ? 'Available' : 'Locked'}
                    </Badge>
                  </div>

                  {/* Mastery Score */}
                  {progress?.mastery_quiz_score !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Last quiz: {Math.round(progress.mastery_quiz_score * 100)}%
                      {progress.mastery_achieved && (
                        <span className="text-green-600 ml-1">✓ Mastered</span>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!canStart}
                    variant={progress?.status === 'in_progress' ? 'default' : 'outline'}
                  >
                    {!progress ? 'Locked' :
                     progress.status === 'completed' && progress.mastery_achieved ? 'Review' :
                     progress.status === 'completed' ? 'Retry for Mastery' :
                     progress.status === 'in_progress' ? 'Continue' :
                     progress.status === 'available' ? 'Start' : 'Locked'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Phase Progress Summary */}
      {phaseModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phase Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Modules</div>
                  <div className="font-semibold">{phaseModules.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Completed</div>
                  <div className="font-semibold text-green-600">
                    {phaseModules.filter(m => {
                      const p = getUserProgress(m.id);
                      return p?.status === 'completed';
                    }).length}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mastered</div>
                  <div className="font-semibold text-green-600">
                    {phaseModules.filter(m => {
                      const p = getUserProgress(m.id);
                      return p?.mastery_achieved;
                    }).length}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Estimated Time</div>
                  <div className="font-semibold">
                    {phaseModules.reduce((sum, m) => sum + m.lesson_duration_minutes, 0)}min
                  </div>
                </div>
              </div>

              {phaseConfig && (
                <div className="text-xs text-muted-foreground mt-2">
                  <strong>Advancement Rule:</strong> No more than {phaseConfig.max_unresolved_weak_skills} unresolved weak skills to move to next phase.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};