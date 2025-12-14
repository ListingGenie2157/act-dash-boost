import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, TrendingUp, Target, Clock, XCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { MissReasonTagger, type MissReason } from '@/components/MissReasonTagger';

interface SkillResult {
  skill_id: string;
  skill_name: string;
  correct: number;
  total: number;
  accuracy: number;
}

interface MissedQuestion {
  question_id: string;
  staging_id: number;
  question_text: string;
  selected: string;
  correct_answer: string;
  explanation: string | null;
  skill_code: string;
  time_ms: number;
  miss_reason: string | null;
}

interface SimulationSummary {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  avgTimeMs: number;
  perSkill: SkillResult[];
  missedQuestions?: MissedQuestion[];
}

export default function SimulationResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [taggedCount, setTaggedCount] = useState(0);

  const loadResults = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Try to get results from navigation state first
      const stateData = location.state as SimulationSummary | undefined;
      
      if (stateData && stateData.sessionId) {
        // Fetch skill names in one batch query (avoid N+1)
        const uniqueSkillIds = Array.from(new Set(stateData.perSkill.map(s => s.skill_id)));
        const { data: skillRows } = await supabase
          .from('skills')
          .select('id, name')
          .in('id', uniqueSkillIds);
        
        const skillNameById = new Map<string, string>(
          (skillRows || []).map((s) => [s.id, s.name])
        );

        const enrichedSkills = stateData.perSkill.map((skill) => ({
          ...skill,
          skill_name: skillNameById.get(skill.skill_id) || skill.skill_id,
        }));

        setSummary({
          ...stateData,
          perSkill: enrichedSkills
        });

        // Count already tagged questions
        const alreadyTagged = stateData.missedQuestions?.filter(q => q.miss_reason).length || 0;
        setTaggedCount(alreadyTagged);
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
          .select('*')
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
          perSkill,
          missedQuestions: []
        });
      }
    } catch (error) {
      console.error('Error loading simulation results:', error);
      toast.error('Failed to load results');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, location.state]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleReasonTagged = (questionId: string, reason: MissReason) => {
    // Update local state to show the tag
    setSummary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        missedQuestions: prev.missedQuestions?.map(q => 
          q.question_id === questionId ? { ...q, miss_reason: reason } : q
        )
      };
    });
    setTaggedCount(prev => prev + 1);
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
  const missedQuestions = summary.missedQuestions || [];
  const allTagged = missedQuestions.length > 0 && taggedCount >= missedQuestions.length;

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

        {/* Missed Questions Review */}
        {missedQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Review Missed Questions ({missedQuestions.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tag why you missed each question to unlock targeted practice
              </p>
              
              {/* Progress indicator */}
              <div className="flex items-center gap-3 mt-3">
                <Progress 
                  value={(taggedCount / missedQuestions.length) * 100} 
                  className="h-2 flex-1" 
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {taggedCount}/{missedQuestions.length} tagged
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* All tagged celebration */}
              {allTagged && (
                <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20 mb-4">
                  <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="font-medium text-success">All questions tagged!</p>
                  <p className="text-sm text-muted-foreground">
                    Practice by miss reason coming soon in Weak Areas
                  </p>
                </div>
              )}

              {missedQuestions.map((q, i) => (
                <div key={q.question_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline">Q{i + 1}</Badge>
                    <Badge variant="secondary" className="text-xs">{q.skill_code}</Badge>
                  </div>
                  
                  <p className="font-medium mb-3 text-sm">{q.question_text}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className="text-destructive font-medium">{q.selected}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Correct: </span>
                      <span className="text-success font-medium">{q.correct_answer}</span>
                    </div>
                  </div>
                  
                  {q.explanation && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <ChevronDown className="w-4 h-4" />
                        Show Explanation
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 p-3 bg-muted/50 rounded text-sm">
                        {q.explanation}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  
                  <MissReasonTagger 
                    questionId={q.question_id}
                    sessionId={summary.sessionId}
                    currentReason={q.miss_reason as MissReason | null}
                    onTagged={(reason) => handleReasonTagged(q.question_id, reason)}
                  />
                </div>
              ))}
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
