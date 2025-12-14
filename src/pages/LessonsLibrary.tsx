import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, BookOpen, ArrowLeft, Filter, Clock, RefreshCw, Sparkles, PenTool, Calculator, Microscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { getAllLessons } from '@/lib/lessons';
import { useUserMastery } from '@/hooks/useMastery';
import { MasteryBadge } from '@/components/MasteryBadge';
import { Skeleton } from '@/components/ui/skeleton';

// Subject-specific design system
const subjectConfig = {
  'English': {
    gradient: 'from-indigo-600/90 to-violet-600/90',
    Icon: PenTool,
    accentBorder: 'border-l-indigo-500',
    bgGradient: 'bg-gradient-to-br from-indigo-500/5 to-violet-500/5'
  },
  'Math': {
    gradient: 'from-blue-600/90 to-cyan-600/90',
    Icon: Calculator,
    accentBorder: 'border-l-blue-500',
    bgGradient: 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5'
  },
  'Reading': {
    gradient: 'from-emerald-600/90 to-teal-600/90',
    Icon: BookOpen,
    accentBorder: 'border-l-emerald-500',
    bgGradient: 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5'
  },
  'Science': {
    gradient: 'from-amber-600/90 to-orange-600/90',
    Icon: Microscope,
    accentBorder: 'border-l-amber-500',
    bgGradient: 'bg-gradient-to-br from-amber-500/5 to-orange-500/5'
  }
} as const;

export default function LessonsLibrary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedCardRef = useRef<HTMLDivElement>(null);
  const [lessons, setLessons] = useState<Array<{
    skill_code: string;
    skill_name: string;
    subject: string;
    section: string;
    cluster: string;
    questionCount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: masteryMap } = useUserMastery();
  const highlightSkill = searchParams.get('highlight');

  const fetchLessons = async () => {
    try {
      const { data, error } = await getAllLessons();
      if (error) {
        console.error('Error fetching lessons:', error);
      } else {
        setLessons(data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchLessons();
  }, []);

  useEffect(() => {
    if (highlightSkill && highlightedCardRef.current) {
      setTimeout(() => {
        highlightedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [highlightSkill, lessons]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLessons();
  };

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.skill_name.toLowerCase().includes(search.toLowerCase()) ||
      lesson.section.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || lesson.subject.toLowerCase() === subjectFilter.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  // Group by subject -> cluster
  const bySubjectAndCluster = filteredLessons.reduce((acc, lesson) => {
    if (!acc[lesson.subject]) acc[lesson.subject] = {};
    if (!acc[lesson.subject][lesson.cluster]) acc[lesson.subject][lesson.cluster] = [];
    acc[lesson.subject][lesson.cluster].push(lesson);
    return acc;
  }, {} as Record<string, Record<string, typeof filteredLessons>>);

  // Get unique subjects
  const subjects = Array.from(new Set(lessons.map(l => l.subject))).sort();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-soft">
            <BookOpen className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Lessons Library
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse {lessons.length} lessons and track your mastery progress
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={subjectFilter} onValueChange={setSubjectFilter}>
          <TabsList>
            <TabsTrigger value="all">
              All ({lessons.length})
            </TabsTrigger>
            {subjects.map(subject => (
              <TabsTrigger key={subject} value={subject.toLowerCase()}>
                {subject} ({lessons.filter(l => l.subject === subject).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-soft">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 animate-pulse" />
                <Skeleton className="h-4 w-1/2 mt-2 animate-pulse" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="text-center py-16 text-muted-foreground">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mx-auto mb-4">
              <Filter className="h-10 w-10 opacity-50" />
            </div>
            <p className="font-semibold text-lg mb-1">No lessons found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(bySubjectAndCluster).map(([subject, clusters]) => {
            const config = subjectConfig[subject as keyof typeof subjectConfig];
            
            return (
              <div key={subject} className="space-y-4">
                {/* Subject Header with Gradient */}
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${config.gradient} p-6 shadow-sm text-white`}>
                  <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <config.Icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-semibold tracking-tight">{subject}</h2>
                      <p className="text-white/90 mt-1">
                        {Object.values(clusters).reduce((sum, c) => sum + c.length, 0)} lessons across {Object.keys(clusters).length} topics
                      </p>
                    </div>
                    <Sparkles className="h-7 w-7 opacity-70" />
                  </div>
                </div>

                {/* Clusters */}
                <div className="space-y-4">
                  {Object.entries(clusters).map(([cluster, clusterLessons]) => {
                    // Calculate cluster mastery
                    const clusterMastery = clusterLessons.reduce((acc, lesson) => {
                      const m = masteryMap?.get(lesson.skill_code);
                      if (m && m.total > 0) {
                        acc.total += m.total;
                        acc.correct += m.correct;
                      }
                      return acc;
                    }, { total: 0, correct: 0 });
                    const clusterAccuracy = clusterMastery.total > 0 
                      ? Math.round((clusterMastery.correct / clusterMastery.total) * 100)
                      : 0;

                    return (
                      <Collapsible key={cluster} defaultOpen>
                        <div className={`border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${config.bgGradient}`}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-5 group hover:bg-background/50 rounded-t-xl transition-all">
                            <div className="flex items-center gap-3 text-left">
                              <ChevronDown className="h-5 w-5 transition-transform group-data-[state=closed]:-rotate-90 flex-shrink-0" />
                              <div>
                                <h3 className="text-lg font-semibold tracking-tight">{cluster}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {clusterLessons.length} lessons
                                  </Badge>
                                  {clusterMastery.total > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {clusterAccuracy}% mastery
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {clusterMastery.total > 0 && (
                              <div className="w-24">
                                <Progress value={clusterAccuracy} className="h-2" />
                              </div>
                            )}
                          </CollapsibleTrigger>

                          <CollapsibleContent className="p-5 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {clusterLessons.map((lesson, index) => {
                                const mastery = masteryMap?.get(lesson.skill_code);
                                const isHighlighted = highlightSkill === lesson.skill_code;

                                return (
                                  <Link 
                                    key={lesson.skill_code} 
                                    to={`/lesson/${lesson.skill_code}`}
                                    className="animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    <Card 
                                      ref={isHighlighted ? highlightedCardRef : null}
                                      className={`h-full shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer group border-l-4 ${config.accentBorder} ${
                                        isHighlighted ? 'ring-2 ring-primary shadow-md bg-primary/5' : ''
                                      }`}
                                    >
                                      <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          <Badge variant="outline" className="text-xs font-medium">
                                            {lesson.section}
                                          </Badge>
                                          {mastery && (
                                            <MasteryBadge 
                                              level={mastery.level}
                                              accuracy={mastery.accuracy}
                                              total={mastery.total}
                                              size="sm"
                                            />
                                          )}
                                        </div>
                                        <CardTitle className="text-base leading-snug tracking-tight group-hover:text-primary transition-colors">
                                          {lesson.skill_name}
                                          {isHighlighted && (
                                            <Badge variant="default" className="ml-2 text-xs animate-pulse">
                                              NEW
                                            </Badge>
                                          )}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 text-xs">
                                          <Clock className="h-3 w-3" />
                                          ~{lesson.questionCount} min lesson
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent className="pt-0">
                                        {mastery && mastery.total > 0 ? (
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-muted-foreground font-medium">Progress</span>
                                              <span className="font-semibold">{Math.round(mastery.accuracy)}%</span>
                                            </div>
                                            <Progress value={mastery.accuracy} className="h-2 animate-fade-in" />
                                            <p className="text-xs text-muted-foreground">
                                              {mastery.correct} of {mastery.total} correct
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Sparkles className="h-4 w-4" />
                                            <span>Start learning this topic</span>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </Link>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
