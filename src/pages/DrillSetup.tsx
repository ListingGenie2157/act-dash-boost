import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Clock, TrendingDown, Zap, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useWeakAreasDb } from '@/hooks/useWeakAreasDb';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

type DrillMode = 'weak' | 'skill' | 'mixed';

interface SkillOption {
  id: string;
  name: string;
  accuracy?: number;
  seen?: number;
}

export default function DrillSetup() {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<DrillMode>('weak');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number>(450); // 7.5 minutes default
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: weakAreas } = useWeakAreasDb(5);

  useEffect(() => {
    async function fetchSkills() {
      if (!subject) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch all skills for this subject
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('id, name')
          .eq('subject', subject)
          .order('order_index');

        if (skillsError) throw skillsError;

        // Get user's mastery data for these skills
        const { data: masteryData } = await supabase
          .from('mastery')
          .select('skill_id, correct, total')
          .eq('user_id', user.id);

        const masteryMap = new Map(masteryData?.map(m => [
          m.skill_id,
          { accuracy: m.total > 0 ? m.correct / m.total : 0, seen: m.total }
        ]));

        const enrichedSkills = skillsData?.map(skill => ({
          id: skill.id,
          name: skill.name,
          accuracy: masteryMap.get(skill.id)?.accuracy,
          seen: masteryMap.get(skill.id)?.seen,
        })) || [];

        setSkills(enrichedSkills);
        if (enrichedSkills.length > 0) {
          setSelectedSkill(enrichedSkills[0].id);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
        toast.error('Failed to load skills');
      } finally {
        setLoading(false);
      }
    }

    void fetchSkills();
  }, [subject, navigate]);

  const handleStartDrill = () => {
    if (mode === 'skill' && !selectedSkill) {
      toast.error('Please select a skill');
      return;
    }

    const params = new URLSearchParams({
      mode,
      questions: questionCount.toString(),
      time: timeLimit.toString(),
      ...(mode === 'skill' && { skill: selectedSkill }),
    });

    navigate(`/drill/${subject}/play?${params.toString()}`);
  };

  const subjectWeakAreas = weakAreas?.filter(w => w.subject === subject) || [];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="outline"
        onClick={() => navigate('/drill-runner')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{subject} Drill Setup</h1>
          <p className="text-muted-foreground">Customize your practice session</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Drill Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Drill Type</CardTitle>
            <CardDescription>Select what you want to practice</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as DrillMode)}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="weak" id="weak" className="mt-1" />
                  <Label htmlFor="weak" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="font-semibold">Weak Areas Focus</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Practice questions from your lowest performing skills
                    </p>
                    {subjectWeakAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {subjectWeakAreas.slice(0, 3).map(area => (
                          <Badge key={area.skill_id} variant="outline" className="text-xs">
                            {area.skill_name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="skill" id="skill" className="mt-1" />
                  <Label htmlFor="skill" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Specific Skill</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Target a specific skill for focused practice
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="mixed" id="mixed" className="mt-1" />
                  <Label htmlFor="mixed" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Mixed Review</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Random questions from all {subject} skills
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Skill Selector (only for skill mode) */}
        {mode === 'skill' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Skill</CardTitle>
              <CardDescription>Choose which skill to practice</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a skill..." />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{skill.name}</span>
                        {skill.accuracy !== undefined && (
                          <Badge variant={skill.accuracy >= 0.7 ? 'default' : 'destructive'} className="ml-2">
                            {(skill.accuracy * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Drill Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Drill Settings</CardTitle>
            <CardDescription>Customize your practice session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="questions">Number of Questions</Label>
              <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(Number(v))}>
                <SelectTrigger id="questions">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 questions (~3 min)</SelectItem>
                  <SelectItem value="10">10 questions (~7 min)</SelectItem>
                  <SelectItem value="15">15 questions (~11 min)</SelectItem>
                  <SelectItem value="20">20 questions (~15 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time">Time Limit</Label>
              <Select value={timeLimit.toString()} onValueChange={(v) => setTimeLimit(Number(v))}>
                <SelectTrigger id="time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Time Limit</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="450">7.5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                  <SelectItem value="900">15 minutes</SelectItem>
                  <SelectItem value="1200">20 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ACT averages 45 seconds per question
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button onClick={handleStartDrill} size="lg" className="w-full">
          Start {questionCount} Question Drill
        </Button>
      </div>
    </div>
  );
}
