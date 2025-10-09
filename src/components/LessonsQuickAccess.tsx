import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useUserMastery } from '@/hooks/useMastery';

interface Lesson {
  skill_code: string;
  skill_name: string;
  subject: string;
  section: string;
  questionCount: number;
}

export function LessonsQuickAccess() {
  const [recommendedLessons, setRecommendedLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLessons, setTotalLessons] = useState(0);
  
  const { data: masteryMap } = useUserMastery();

  useEffect(() => {
    loadRecommendedLessons();
  }, [masteryMap]);

  const loadRecommendedLessons = async () => {
    try {
      setLoading(true);

      // Get all available lessons
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, subject, cluster')
        .order('order_index', { ascending: true });

      if (skillsError) throw skillsError;

      // Get question counts from staging_items
      const { data: itemsData, error: itemsError } = await supabase
        .from('staging_items')
        .select('skill_code');

      if (itemsError) throw itemsError;

      // Count questions per skill
      const questionCounts = (itemsData || []).reduce((acc, item) => {
        acc[item.skill_code] = (acc[item.skill_code] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get unique skills from staging_items
      const skillsWithContent = Array.from(new Set(itemsData?.map(i => i.skill_code) || []));

      // Filter to only skills with content
      const lessonsWithContent = (skillsData || [])
        .filter(skill => skillsWithContent.includes(skill.id))
        .map(skill => ({
          skill_code: skill.id,
          skill_name: skill.name,
          subject: skill.subject,
          section: skill.cluster,
          questionCount: questionCounts[skill.id] || 0
        }));

      setTotalLessons(lessonsWithContent.length);

      // Recommend lessons based on low mastery or not started
      let recommended: Lesson[] = [];
      
      if (masteryMap && masteryMap.size > 0) {
        // Find lessons with low mastery or not started
        recommended = lessonsWithContent
          .map(lesson => {
            const mastery = masteryMap.get(lesson.skill_code);
            return {
              ...lesson,
              masteryScore: mastery ? mastery.accuracy : -1 // -1 for not started
            };
          })
          .sort((a, b) => a.masteryScore - b.masteryScore) // Lowest mastery first
          .slice(0, 3)
          .map(({ masteryScore, ...lesson }) => lesson);
      } else {
        // No mastery data yet, show first 3 lessons
        recommended = lessonsWithContent.slice(0, 3);
      }

      setRecommendedLessons(recommended);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedLessons = masteryMap 
    ? Array.from(masteryMap.values()).filter(m => m.total > 0).length 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lessons Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Lessons Library
        </CardTitle>
        <CardDescription>
          Comprehensive content library for all ACT subjects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{totalLessons}</p>
            <p className="text-xs text-muted-foreground">Total Lessons</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-2xl font-bold">{completedLessons}</p>
            <p className="text-xs text-muted-foreground">Started</p>
          </div>
        </div>

        {/* Recommended Lessons */}
        {recommendedLessons.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Recommended for You</h4>
            </div>
            {recommendedLessons.map(lesson => {
              const mastery = masteryMap?.get(lesson.skill_code);
              
              return (
                <Link 
                  key={lesson.skill_code} 
                  to={`/lesson/${lesson.skill_code}`}
                  className="block"
                >
                  <div className="p-3 rounded-lg border hover:border-primary hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {lesson.skill_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {lesson.subject}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {lesson.questionCount} questions
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                    {mastery && mastery.total > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{mastery.accuracy.toFixed(0)}%</span>
                        </div>
                        <Progress value={mastery.accuracy} className="h-1" />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Not started</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Browse All Button */}
        <Link to="/lessons" className="block">
          <Button variant="outline" className="w-full gap-2">
            <BookOpen className="h-4 w-4" />
            Browse All Lessons
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
