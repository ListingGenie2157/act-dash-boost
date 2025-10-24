import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

type SubjectStats = {
  subject: string;
  questionCount: number;
};

export default function TimedDrills() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const { data, error } = await supabase
          .from('v_form_section')
          .select('section, form_id');

        if (error) {
          console.error('Error fetching questions:', error);
          setLoading(false);
          return;
        }

        // Count questions per section
        const counts: Record<string, number> = {};
        data.forEach(item => {
          if (item.section) {
            counts[item.section] = (counts[item.section] || 0) + 1;
          }
        });

        const stats: SubjectStats[] = Object.entries(counts).map(([subject, count]) => ({
          subject,
          questionCount: count,
        })).sort((a, b) => a.subject.localeCompare(b.subject));

        setSubjects(stats);
      } catch (err) {
        console.error('Error loading drill subjects:', err);
      } finally {
        setLoading(false);
      }
    }

    void fetchSubjects();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with Back Button */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Timed Drills</h1>
        </div>
        <p className="text-muted-foreground">
          Practice with timed questions from each section
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No drills available</p>
            <p className="text-sm mt-1">Check back soon for practice questions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(stat => (
            <Link key={stat.subject} to={`/drill/${encodeURIComponent(stat.subject)}`}>
              <Card className="h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {stat.subject}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {stat.questionCount} questions
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Take a timed drill to practice your skills in this section
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
