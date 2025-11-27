import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Target, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

interface MissedQuestion {
  question_id: string;
  miss_count: number;
  last_missed_at: string;
  question: {
    id: string;
    stem: string;
    skill_id: string;
    difficulty: number;
    skill: {
      name: string;
      subject: string;
    };
  };
}

export default function ReviewMissed() {
  const navigate = useNavigate();
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'most'>('recent');

  useEffect(() => {
    loadMissedQuestions();
  }, [subjectFilter, sortBy]);

  const loadMissedQuestions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      let query = supabase
        .from('error_bank')
        .select(`
          question_id,
          miss_count,
          last_missed_at,
          questions!inner (
            id,
            stem,
            skill_id,
            difficulty,
            skills!inner (
              name,
              subject
            )
          )
        `)
        .eq('user_id', user.id);

      // Apply subject filter
      if (subjectFilter !== 'all') {
        query = query.eq('questions.skills.subject', subjectFilter);
      }

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('last_missed_at', { ascending: false });
      } else {
        query = query.order('miss_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match interface
      interface RawQuestionData {
        question_id: string;
        miss_count: number | null;
        last_missed_at: string;
        questions: {
          id: string;
          stem: string;
          skill_id: string;
          difficulty: number;
          skills: {
            name: string;
            subject: string;
          };
        };
      }
      
      const transformed = data?.map((item: RawQuestionData) => ({
        question_id: item.question_id,
        miss_count: item.miss_count || 0,
        last_missed_at: item.last_missed_at,
        question: {
          id: item.questions.id,
          stem: item.questions.stem,
          skill_id: item.questions.skill_id,
          difficulty: item.questions.difficulty,
          skill: {
            name: item.questions.skills.name,
            subject: item.questions.skills.subject
          }
        }
      })) || [];

      setMissedQuestions(transformed);
    } catch (error) {
      console.error('Error loading missed questions:', error);
      toast.error('Failed to load missed questions');
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeAll = () => {
    // Navigate to drill with missed mode
    if (missedQuestions.length > 0) {
      const subject = missedQuestions[0].question.skill.subject;
      navigate(`/drill/${subject}/setup?mode=missed`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <BackButton className="mb-6" />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-lg bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Missed Questions</h1>
            <p className="text-muted-foreground">
              Review and practice questions you've gotten wrong
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Math">Math</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'recent' | 'most')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="most">Most Missed</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handlePracticeAll} disabled={missedQuestions.length === 0} className="ml-auto">
              <Target className="h-4 w-4 mr-2" />
              Practice All ({missedQuestions.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question List */}
      {missedQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Missed Questions</h3>
            <p className="text-muted-foreground">
              {subjectFilter === 'all' 
                ? "You haven't missed any questions yet. Keep up the great work!"
                : `No missed questions in ${subjectFilter}. Try another subject.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {missedQuestions.map((item) => (
            <Card key={item.question_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive">
                        Missed {item.miss_count}x
                      </Badge>
                      <Badge variant="outline">
                        {item.question.skill.subject}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Difficulty: {item.question.difficulty}/3
                      </Badge>
                    </div>
                    <CardTitle className="text-base mb-1">
                      {item.question.skill.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.question.stem}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // TODO: Navigate to practice this specific question
                      toast.info('Practice mode coming soon!');
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Practice
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
