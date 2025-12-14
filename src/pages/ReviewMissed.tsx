import { useState, useEffect, useCallback } from 'react';
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
  staging_id: number;
  question: string;
  section: string;
  skill_code: string;
  difficulty: string;
}

export default function ReviewMissed() {
  const navigate = useNavigate();
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'most'>('recent');

  const loadMissedQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // First, get error_bank entries for this user (limited to 100 for performance)
      let errorQuery = supabase
        .from('error_bank')
        .select('question_id, miss_count, last_missed_at')
        .eq('user_id', user.id);

      if (sortBy === 'recent') {
        errorQuery = errorQuery.order('last_missed_at', { ascending: false });
      } else {
        errorQuery = errorQuery.order('miss_count', { ascending: false });
      }

      const { data: errorData, error: errorError } = await errorQuery.limit(100);

      if (errorError) throw errorError;
      if (!errorData || errorData.length === 0) {
        setMissedQuestions([]);
        return;
      }

      // Extract staging_ids from question_id (stored as text)
      const stagingIds = errorData.map(e => parseInt(e.question_id, 10)).filter(id => !isNaN(id));

      if (stagingIds.length === 0) {
        setMissedQuestions([]);
        return;
      }

      // Fetch corresponding questions from staging_items
      let stagingQuery = supabase
        .from('staging_items')
        .select('staging_id, question, section, skill_code, difficulty')
        .in('staging_id', stagingIds);

      // Apply subject filter
      if (subjectFilter !== 'all') {
        stagingQuery = stagingQuery.eq('section', subjectFilter);
      }

      const { data: stagingData, error: stagingError } = await stagingQuery;

      if (stagingError) throw stagingError;

      // Create a map for quick lookup
      const stagingMap = new Map(
        (stagingData || []).map(s => [s.staging_id.toString(), s])
      );

      // Merge error_bank with staging_items data
      const merged: MissedQuestion[] = [];
      for (const err of errorData) {
        const staging = stagingMap.get(err.question_id);
        if (staging) {
          merged.push({
            question_id: err.question_id,
            miss_count: err.miss_count || 1,
            last_missed_at: err.last_missed_at,
            staging_id: staging.staging_id,
            question: staging.question,
            section: staging.section,
            skill_code: staging.skill_code,
            difficulty: staging.difficulty
          });
        }
      }

      setMissedQuestions(merged);
    } catch (error) {
      console.error('Error loading missed questions:', error);
      toast.error('Failed to load missed questions');
    } finally {
      setLoading(false);
    }
  }, [subjectFilter, sortBy, navigate]);

  useEffect(() => {
    loadMissedQuestions();
  }, [loadMissedQuestions]);

  const handlePracticeAll = () => {
    if (missedQuestions.length > 0) {
      const section = missedQuestions[0].section;
      navigate(`/drill/${section}/setup?mode=missed`);
    }
  };

  const getDifficultyNumber = (diff: string): number => {
    switch (diff.toLowerCase()) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 2;
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
                        {item.section}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Difficulty: {getDifficultyNumber(item.difficulty)}/3
                      </Badge>
                    </div>
                    <CardTitle className="text-base mb-1">
                      {item.skill_code}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.question}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigate('/drill-runner', { 
                        state: { 
                          mode: 'targeted',
                          stagingIds: [item.staging_id],
                          source: 'missed-review'
                        } 
                      });
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
