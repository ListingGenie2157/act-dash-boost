import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, TrendingUp, Target, Clock } from 'lucide-react';

interface SkillResult {
  skill_id: string;
  skill_name: string;
  correct: number;
  total: number;
  accuracy: number;
}

interface SimulationSummary {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  avgTimeMs: number;
  perSkill: SkillResult[];
}

export default function SimulationResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Try to get results from navigation state first
      const stateData = location.state as SimulationSummary | undefined;
      
      if (stateData && stateData.sessionId) {
        // Fetch skill names for each skill_id
        const enrichedSkills = await Promise.all(
          stateData.perSkill.map(async (skill) => {
            const { data: skillData } = await supabase
              .from('skills')
              .select('name')
              .eq('id', skill.skill_id)
              .maybeSingle();
            
            return {
              ...skill,
              skill_name: skillData?.name || skill.skill_id
            };
          })
        );

        setSummary({
          ...stateData,
          perSkill: enrichedSkills
        });
      } else {
        // Fallback: Try to fetch the most recent simulation session
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('mode', 'simulation')
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionError || !sessions || sessions.length === 0) {
          toast.error('No simulation results found');
          navigate('/', { replace: true });
          return;
        }

        const session = sessions[0];
        
        // Fetch responses for this session
        const { data: responses, error: responsesError } = await supabase
          .from('responses')
          .select('*, question_id')
          .eq('session_id', session.id);

        if (responsesError || !responses) {
          throw responsesError;
        }

        // Calculate summary
        const totalQuestions = responses.length;
        const correctAnswers = responses.filter(r => r.correct).length;
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const avgTimeMs = responses.length > 0 
          ? responses.reduce((sum, r) => sum + r.time_ms, 0) / responses.length 
          : 0;

        // Group by skill
        const skillMap = new Map<string, { correct: number; total: number }>();
        
        for (const response of responses) {
          const { data: question } = await supabase
            .from('questions')
            .select('skill_id')
            .eq('id', response.question_id)
            .maybeSingle();

          if (question?.skill_id) {
            const existing = skillMap.get(question.skill_id) || { correct: 0, total: 0 };
            existing.total++;
            if (response.correct) existing.correct++;
            skillMap.set(question.skill_id, existing);
          }
        }

        // Convert to array and enrich with skill names
        const perSkill = await Promise.all(
          Array.from(skillMap.entries()).map(async ([skill_id, stats]) => {
            const { data: skillData } = await supabase
              .from('skills')
              .select('name')
              .eq('id', skill_id)
              .maybeSingle();

            return {
              skill_id,
              skill_name: skillData?.name || skill_id,
              correct: stats.correct,
              total: stats.total,
              accuracy: (stats.correct / stats.total) * 100
            };
          })
        );

        setSummary({
          sessionId: session.id,
          totalQuestions,
          correctAnswers,
          accuracy,
          avgTimeMs,
          perSkill
        });
      }
    } catch (error) {
      console.error('Error loading simulation results:', error);
      toast.error('Failed to load results');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const generateStudyPlan = async () => {
    try {
      toast.info('✨ Generating your personalized study plan...');
      
      const { error } = await supabase.functions.invoke('generate-study-plan');

      if (error) throw error;

      toast.success('🎯 Your study plan is ready!');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error generating study plan:', error);
      toast.error('Failed to generate study plan');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getRecommendation = (accuracy: number) => {
    if (accuracy >= 80) {
      return {
        title: 'Outstanding Performance! 🎉',
        message: 'You\'re performing at a high level. Keep up the momentum with more practice.',
        action: 'Continue Training',
        link: '/simulation'
      };
    } else if (accuracy >= 50) {
      return {
        title: 'Good Progress! 📈',
        message: 'You\'re on the right track. Focus on weak skills to improve further.',
        action: 'Practice Weak Areas',
        link: '/weak-areas'
      };
    } else {
      return {
        title: 'Build Your Foundation 🎯',
        message: 'Let\'s strengthen your fundamentals with targeted lessons.',
        action: 'Start Learning',
        link: '/lessons'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-lg">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No results to display</p>
            <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recommendation = getRecommendation(summary.accuracy);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-4xl mb-2">Simulation Complete!</CardTitle>
            <p className="text-muted-foreground">
              Here's your performance breakdown
            </p>
          </CardHeader>
        </Card>

        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(summary.accuracy)}`}>
                  {Math.round(summary.accuracy)}%
                </div>
                <p className="text-muted-foreground mt-2">Accuracy</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">
                  {summary.correctAnswers}/{summary.totalQuestions}
                </div>
                <p className="text-muted-foreground mt-2">Correct Answers</p>
              </div>
              <div className="text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Clock className="w-6 h-6" />
                  {Math.round(summary.avgTimeMs / 1000)}s
                </div>
                <p className="text-muted-foreground mt-2">Avg. Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Breakdown */}
        {summary.perSkill.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Skill-by-Skill Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.perSkill
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .map((skill) => (
                    <div key={skill.skill_id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium">{skill.skill_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {skill.correct}/{skill.total} correct
                          </p>
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColor(skill.accuracy)}`}>
                          {Math.round(skill.accuracy)}%
                        </div>
                      </div>
                      <Progress value={skill.accuracy} className="h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendation */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>{recommendation.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{recommendation.message}</p>
            <div className="flex gap-4">
              <Button onClick={() => navigate(recommendation.link)} className="flex-1" size="lg">
                {recommendation.action}
              </Button>
              <Button onClick={generateStudyPlan} variant="outline" className="flex-1" size="lg">
                Generate Study Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
            Return to Dashboard
          </Button>
          <Button onClick={() => navigate('/simulation')} className="flex-1">
            Try Another Simulation
          </Button>
        </div>
      </div>
    </div>
  );
}
