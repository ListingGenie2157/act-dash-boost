import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, BookOpen, ArrowLeft, Filter, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getAllLessons } from '@/lib/lessons';
import { useUserMastery } from '@/hooks/useMastery';
import { MasteryBadge } from '@/components/MasteryBadge';
import { Skeleton } from '@/components/ui/skeleton';

export default function LessonsLibrary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedCardRef = useRef<HTMLDivElement>(null);
  const [lessons, setLessons] = useState<Array<{
    skill_code: string;
    skill_name: string;
    subject: string;
    section: string;
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

  // Group by subject
  const bySubject = filteredLessons.reduce((acc, lesson) => {
    if (!acc[lesson.subject]) acc[lesson.subject] = [];
    acc[lesson.subject].push(lesson);
    return acc;
  }, {} as Record<string, typeof filteredLessons>);

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

        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Lessons Library</h1>
        </div>
        <p className="text-muted-foreground">
          Browse all available lessons and track your mastery progress
        </p>
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
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No lessons found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(bySubject).map(([subject, subjectLessons]) => (
            <div key={subject}>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                {subject}
                <Badge variant="secondary">{subjectLessons.length} lessons</Badge>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectLessons.map(lesson => {
                  const mastery = masteryMap?.get(lesson.skill_code);
                  const isHighlighted = highlightSkill === lesson.skill_code;

                  return (
                    <Link key={lesson.skill_code} to={`/lesson/${lesson.skill_code}`}>
                      <Card 
                        ref={isHighlighted ? highlightedCardRef : null}
                        className={`h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer group ${
                          isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''
                        }`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
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
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {lesson.skill_name}
                            {isHighlighted && (
                              <Badge variant="default" className="ml-2 text-xs">NEW</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3" />
                            ~{lesson.questionCount} min lesson
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {mastery && mastery.total > 0 ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Your Progress</span>
                                <span className="font-semibold">{mastery.accuracy.toFixed(0)}%</span>
                              </div>
                              <Progress value={mastery.accuracy} className="h-2" />
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              Not started yet
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
