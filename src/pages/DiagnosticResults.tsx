import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DiagnosticResultsState {
  results: {
    predicted_section_score: number;
    top_5_weak_skills: Array<{
      skill: string;
      accuracy: number;
      total: number;
    }>;
    diagnostic_id: string;
  };
  formId: string;
}

export default function DiagnosticResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as DiagnosticResultsState;
  const formId = state?.formId;

  // Fallback: fetch latest diagnostic if state is missing
  useEffect(() => {
    if (!state?.results) {
      const fetchLatestDiagnostic = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('No user found for diagnostic results fallback');
            navigate('/', { replace: true });
            return;
          }

          // Fetch the most recent completed diagnostic across all sections
          const { data: diagnostics, error } = await supabase
            .from('diagnostics')
            .select('*')
            .eq('user_id', user.id)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1);

          if (error || !diagnostics || diagnostics.length === 0) {
            console.error('No diagnostic found:', error);
            toast.error('No diagnostic results found. Please take the diagnostic test.');
            navigate('/diagnostic', { replace: true });
            return;
          }

          const diagnostic = diagnostics[0];
          
          // Reconstruct results from the most recent diagnostic
          const responses = (diagnostic.responses || []) as any;
          const reconstructedResults = {
            predicted_section_score: diagnostic.score || 0,
            top_5_weak_skills: Array.isArray(responses) && responses.length > 0 
              ? responses[0]?.top_5_weak_skills || []
              : [],
            diagnostic_id: diagnostic.id
          };

          navigate('/diagnostic-results', {
            state: {
              results: reconstructedResults,
              formId: `D2${diagnostic.section.slice(0, 2).toUpperCase()}`
            },
            replace: true
          });
        } catch (error) {
          console.error('Error fetching diagnostic:', error);
          toast.error('Failed to load diagnostic results');
          navigate('/', { replace: true });
        }
      };
      fetchLatestDiagnostic();
    }
  }, [state, navigate]);

  if (!state?.results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Loading results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { results } = state;
  const { predicted_section_score, top_5_weak_skills } = results;

  // Auto-generate study plan after diagnostic completion
  useEffect(() => {
    const generatePlan = async () => {
      try {
        toast.info('✨ Generating your personalized study plan...');
        
        const { error } = await supabase.functions.invoke('generate-study-plan', {
          method: 'POST'
        });

        if (error) throw error;

        toast.success('🎯 Your study plan is ready!');
        
        // Auto-redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error) {
        console.error('Error generating study plan:', error);
        // Don't block the user - they can still navigate manually
      }
    };

    if (results) {
      generatePlan();
    }
  }, [results, navigate]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendation = (score: number) => {
    if (score < 50) {
      return {
        title: "Focus on Fundamentals",
        description: "Start with targeted skill lessons for your weakest areas",
        action: "Begin Lessons"
      };
    } else if (score < 80) {
      return {
        title: "Mixed Practice",
        description: "Practice with mixed drills to strengthen weak skills",
        action: "Start Mixed Drills"
      };
    } else {
      return {
        title: "Ready for Section Sims",
        description: "You're ready for full section simulations",
        action: "Take Section Sim"
      };
    }
  };

  const recommendation = getRecommendation(predicted_section_score);

  const handleNext = () => {
    // Route based on score
    if (predicted_section_score < 50) {
      // Navigate to lessons for weakest skills
      navigate('/lessons', { 
        state: { 
          weakSkills: top_5_weak_skills.slice(0, 3),
          subject: formId.replace('D2', '')
        }
      });
    } else if (predicted_section_score < 80) {
      // Navigate to mixed drills
      navigate('/mixed-drills', { 
        state: { 
          subject: formId.replace('D2', ''),
          weakSkills: top_5_weak_skills
        }
      });
    } else {
      // Navigate to section simulation
      navigate(`/sim-${formId.replace('D2', '').toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">
              {formId.replace('D2', '')} Diagnostic Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(predicted_section_score)}`}>
                {predicted_section_score}%
              </div>
              <p className="text-muted-foreground mt-2">Predicted Section Score</p>
            </div>

            {/* Recommendation */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-xl">{recommendation.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {recommendation.description}
                </p>
                <Button onClick={handleNext} className="w-full">
                  {recommendation.action}
                </Button>
              </CardContent>
            </Card>

            {/* Weak Skills */}
            {top_5_weak_skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {top_5_weak_skills.map((skill, index) => (
                      <div key={skill.skill} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{skill.skill}</p>
                            <p className="text-sm text-muted-foreground">
                              {skill.total} questions answered
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(skill.accuracy)}`}>
                            {Math.round(skill.accuracy)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                Return to Dashboard
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}