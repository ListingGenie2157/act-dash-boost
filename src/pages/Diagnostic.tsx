import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Badge,
  CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui';
import { Brain, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';



export default function Diagnostic() {
  const navigate = useNavigate();
  
  // Track which diagnostic sections have been completed
  const [completedSections, setCompletedSections] = useState<string[]>(() => {
    const stored = localStorage.getItem('diagnostic_completed_sections');
    return stored ? JSON.parse(stored) : [];
  });

  const sections = [
    { id: 'D2EN', label: 'English', description: '20 minutes - Grammar, punctuation, and style' },
    { id: 'D2MA', label: 'Math', description: '25 minutes - Algebra, geometry, and trigonometry' },
    { id: 'D2RD', label: 'Reading', description: '18 minutes - Comprehension and analysis' },
    { id: 'D2SCI', label: 'Science', description: '18 minutes - Data interpretation and reasoning' }
  ];

  const currentSectionIndex = completedSections.length;
  const allComplete = completedSections.length >= 4;

  const handleStartNext = () => {
    if (currentSectionIndex < sections.length) {
      navigate(`/diagnostic-test/${sections[currentSectionIndex].id}`);
    }
  };

  const handleContinue = async () => {
    if (allComplete) {
      // Mark diagnostic as complete in profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ diagnostic_completed: true })
          .eq('id', user.id);
      }
      
      // Clear localStorage
      localStorage.removeItem('diagnostic_completed_sections');
      setCompletedSections([]);
      
      // Navigate to aggregate results
      navigate('/diagnostic-results-complete');
    }
  };

  // Listen for section completion (set by DiagnosticTest page)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('diagnostic_completed_sections');
      if (stored) {
        setCompletedSections(JSON.parse(stored));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              ACT Diagnostic Test
            </CardTitle>
            <CardDescription>
              Complete all 4 sections to get your personalized study plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Total Duration</p>
                    <p className="text-sm text-muted-foreground">~80 minutes (4 sections)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {completedSections.length} of 4 sections complete
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Checklist */}
              <div className="space-y-3">
                <h3 className="font-semibold">Test Sections:</h3>
                {sections.map((section, index) => {
                  const isCompleted = completedSections.includes(section.id);
                  const isCurrent = index === currentSectionIndex;
                  
                  return (
                    <div
                      key={section.id}
                      className={`p-4 border rounded-lg ${
                        isCompleted ? 'bg-success/10 border-success/30' : 
                        isCurrent ? 'bg-primary/10 border-primary/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <div>
                            <p className="font-medium">{section.label}</p>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <Badge variant="secondary">Complete</Badge>
                        )}
                        {isCurrent && !isCompleted && (
                          <Badge>Next</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {!allComplete && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <h3 className="font-medium text-warning-foreground mb-2">
                    Before You Begin:
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Find a quiet place to take the test</li>
                    <li>• Each section is timed separately</li>
                    <li>• You can pause between sections</li>
                    <li>• Your answers are saved automatically</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                {!allComplete ? (
                  <>
                    <Button onClick={handleStartNext} className="flex-1">
                      {completedSections.length === 0 ? 'Start Diagnostic' : 'Continue to Next Section'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Save & Exit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleContinue} className="flex-1">
                      View Complete Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Return to Dashboard
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}