import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, TrendingUp, Target } from 'lucide-react';

interface SectionResult {
  section: string;
  score: number;
  completed_at: string;
}

interface WeakSkill {
  skill_id: string;
  skill_name: string;
  accuracy: number;
  total_questions: number;
  section: string;
}

export default function DiagnosticResultsComplete() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [weakSkills, setWeakSkills] = useState<WeakSkill[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    fetchAllResults();
  }, []);

  const fetchAllResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Fetch all diagnostic results for this user
      const { data: diagnostics, error } = await supabase
        .from('diagnostics')
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (!diagnostics || diagnostics.length === 0) {
        toast.error('No diagnostic results found');
        navigate('/diagnostic', { replace: true });
        return;
      }

      // Get the most recent result for each section
      const latestBySectionMap = new Map<string, any>();
      
      for (const diag of diagnostics) {
        const section = diag.section;
        if (!latestBySectionMap.has(section)) {
          latestBySectionMap.set(section, diag);
        }
      }

      const latestResults: SectionResult[] = Array.from(latestBySectionMap.values()).map(d => ({
        section: d.section,
        score: d.score || 0,
        completed_at: d.completed_at
      }));

      setSectionResults(latestResults);

      // Calculate overall composite score
      const avgScore = latestResults.reduce((sum, r) => sum + r.score, 0) / latestResults.length;
      setOverallScore(Math.round(avgScore));

      // Aggregate weak skills across all sections
      const allWeakSkills: WeakSkill[] = [];
      
      for (const diag of diagnostics) {
        const responses = (diag.responses || []) as any[];
        
        for (const block of responses) {
          if (block.questions && block.answers) {
            for (let i = 0; i < block.questions.length; i++) {
              const question = block.questions[i];
              const answer = block.answers[i];
              
              if (answer && question.skill_tags && question.skill_tags.length > 0) {
                const skillId = question.skill_tags[0];
                
                // Fetch skill name from skills table
                const { data: skillData } = await supabase
                  .from('skills')
                  .select('name')
                  .eq('id', skillId)
                  .maybeSingle();
                
                const existing = allWeakSkills.find(s => s.skill_id === skillId);
                if (existing) {
                  existing.total_questions++;
                  if (answer.isCorrect) {
                    existing.accuracy = ((existing.accuracy * (existing.total_questions - 1)) + 100) / existing.total_questions;
                  } else {
                    existing.accuracy = (existing.accuracy * (existing.total_questions - 1)) / existing.total_questions;
                  }
                } else {
                  allWeakSkills.push({
                    skill_id: skillId,
                    skill_name: skillData?.name || skillId,
                    accuracy: answer.isCorrect ? 100 : 0,
                    total_questions: 1,
                    section: diag.section
                  });
                }
              }
            }
          }
        }
      }

      // Sort by accuracy (lowest first) and take top 10
      const sortedWeakSkills = allWeakSkills
        .filter(s => s.total_questions >= 2)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 10);

      setWeakSkills(sortedWeakSkills);

    } catch (error) {
      console.error('Error fetching diagnostic results:', error);
      toast.error('Failed to load results');
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

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      'EN': 'English',
      'MA': 'Math',
      'RD': 'Reading',
      'SCI': 'Science'
    };
    return labels[section] || section;
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-4xl mb-2">Diagnostic Complete!</CardTitle>
            <p className="text-muted-foreground">
              Here's your comprehensive performance analysis
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
            <div className="text-center mb-6">
              <div className={`text-7xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              <p className="text-muted-foreground mt-2">Average Across All Sections</p>
            </div>

            {/* Section Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionResults.map((result) => (
                <div key={result.section} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{getSectionLabel(result.section)}</span>
                    <span className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                      {Math.round(result.score)}%
                    </span>
                  </div>
                  <Progress value={result.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weak Areas */}
        {weakSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Priority Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weakSkills.map((skill, index) => (
                  <div key={skill.skill_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-10 h-10 rounded-full flex items-center justify-center text-lg">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{skill.skill_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {getSectionLabel(skill.section)}
                          </Badge>
                          <span>{skill.total_questions} questions</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(skill.accuracy)}`}>
                        {Math.round(skill.accuracy)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Ready to start improving? We'll create a personalized study plan based on your results.
              </p>
              <div className="flex gap-4">
                <Button onClick={generateStudyPlan} className="flex-1" size="lg">
                  Generate My Study Plan
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="flex-1" size="lg">
                  View Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
