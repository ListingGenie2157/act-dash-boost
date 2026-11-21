import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Timer, Clock, Brain, TrendingUp, Zap, Target, BookOpen, History, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { reportError } from '@/lib/errorReporter';

type SubjectStats = { subject: string; questionCount: number };

const sectionSimCards = [
  { section: 'English', questions: 50, time: '35 min', description: 'Pace through 5 passages with chunk timers and two-pass coaching.' },
  { section: 'Math', questions: 45, time: '50 min', description: 'Build speed on 45 questions with real-time pace alerts.' },
  { section: 'Reading', questions: 36, time: '40 min', description: 'Train two-pass strategy across 4 passages under timed pressure.' },
  { section: 'Science', questions: 40, time: '40 min', description: 'Practice data-heavy passages with chunk-based pacing.' },
];

const PacingLab = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const drillForms = ['DR_RD', 'DR_MA', 'DR_EN', 'DR_SC'];
        const { data, error } = await supabase.from('v_staging_items_public').select('section, form_id').in('form_id', drillForms);
        if (error) { reportError(error instanceof Error ? error : new Error(String(error)), { page: 'PacingLab' }); setLoading(false); return; }
        const counts: Record<string, number> = {};
        data.forEach(item => { if (item.section) counts[item.section] = (counts[item.section] || 0) + 1; });
        setSubjects(Object.entries(counts).map(([subject, count]) => ({ subject, questionCount: count })).sort((a, b) => a.subject.localeCompare(b.subject)));
      } catch (err) { reportError(err instanceof Error ? err : new Error(String(err)), { page: 'PacingLab' }); }
      finally { setLoading(false); }
    }
    void fetchSubjects();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-white/[0.06] mb-4">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Pacing Lab</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Master Your Pace</h1>
        <p className="text-muted-foreground max-w-2xl">
          Time management is worth 3-5 points on the ACT. Build speed with timed drills or practice full sections with coached pacing.
        </p>
      </div>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Timed Drills</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/drill-history')}>
            <History className="h-4 w-4 mr-2" />Drill History
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Pick a subject and choose your run style — Sprint, Marathon, Pomodoro, or Random Mix.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No drills available yet</p>
              <p className="text-sm mt-1">Check back soon for practice questions</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjects.map(stat => {
              const hasContent = stat.questionCount > 0;
              return hasContent ? (
                <Link key={stat.subject} to={`/drill/${encodeURIComponent(stat.subject)}/setup`}>
                  <Card className="h-full card-hover hover:border-primary/30 cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                        <Clock className="h-5 w-5" />{stat.subject}
                      </CardTitle>
                      <CardDescription><Badge variant="secondary">{stat.questionCount} questions</Badge></CardDescription>
                    </CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">Configure and start a targeted drill</p></CardContent>
                  </Card>
                </Link>
              ) : (
                <Card key={stat.subject} className="h-full opacity-60 cursor-not-allowed">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" />{stat.subject}</CardTitle>
                    <CardDescription><Badge variant="outline">Coming Soon</Badge></CardDescription>
                  </CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">Content is being prepared</p></CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <PlayCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Section Simulation — Coached Mode</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Full-length section practice with live pacing cues, chunk timers, and two-pass coaching.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectionSimCards.map(card => (
            <Link key={card.section} to="/simulation">
              <Card className="h-full card-hover hover:border-primary/30 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                    <Timer className="h-5 w-5" />{card.section}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{card.questions} Qs</Badge>
                    <Badge variant="outline">{card.time}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{card.description}</p></CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="p-4 rounded-2xl bg-secondary">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-2xl font-bold">Why Pacing Training Works</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-secondary border border-white/[0.06]">
                  <TrendingUp className="w-5 h-5 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Build Instincts</h4>
                  <p className="text-sm text-muted-foreground">Train your internal clock so you naturally know when to move on.</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary border border-white/[0.06]">
                  <Zap className="w-5 h-5 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Reduce Anxiety</h4>
                  <p className="text-sm text-muted-foreground">Confident pacers don't panic. Practice builds calm under pressure.</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary border border-white/[0.06]">
                  <Target className="w-5 h-5 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Maximize Points</h4>
                  <p className="text-sm text-muted-foreground">Never leave easy points on the table by running out of time.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PacingLab;
