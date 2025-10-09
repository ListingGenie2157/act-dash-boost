import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        .filter(skill => skillsWithContent.includes(skill.name))
        .map(skill => ({
          skill_code: skill.name,
          skill_name: skill.name,
          subject: skill.subject,
          section: skill.cluster,
          questionCount: questionCounts[skill.name] || 0
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

  const subjectColors = {
    English: 'from-purple-500 to-pink-500',
    Math: 'from-blue-500 to-cyan-500',
    Reading: 'from-green-500 to-emerald-500',
    Science: 'from-orange-500 to-amber-500'
  };

  const subjectIcons = {
    English: '📝',
    Math: '🔢',
    Reading: '📚',
    Science: '🔬'
  };

  // Group lessons by subject
  const lessonsBySubject = recommendedLessons.reduce((acc, lesson) => {
    const subject = lesson.subject as 'English' | 'Math' | 'Reading' | 'Science';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(lesson);
    return acc;
  }, {} as Record<string, typeof recommendedLessons>);

  const startedCount = masteryMap 
    ? Array.from(masteryMap.values()).filter(m => m.total > 0).length 
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lessons Library</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {totalLessons} lessons • {startedCount} started
          </p>
        </div>
      </div>

      {Object.keys(lessonsBySubject).length > 0 ? (
        <>
          <div className="grid gap-4">
            {Object.entries(lessonsBySubject).slice(0, 4).map(([subject, lessons]) => {
              const subjectKey = subject as keyof typeof subjectColors;
              return (
                <Link 
                  key={subject}
                  to={`/lessons?subject=${subject}`}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2">
                    <CardContent className="p-0">
                      <div className={`bg-gradient-to-r ${subjectColors[subjectKey]} p-5 text-white`}>
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">
                            {subjectIcons[subjectKey]}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold">{subject}</h3>
                            <p className="text-sm text-white/90">
                              {lessons.length} lessons available
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="p-4 bg-card">
                        <p className="text-sm text-muted-foreground truncate">
                          {lessons[0]?.skill_name}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          
          <Link to="/lessons">
            <Button variant="outline" className="w-full gap-2">
              <GraduationCap className="h-4 w-4" />
              Browse All Lessons
            </Button>
          </Link>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No lessons available yet
            </p>
            <Link to="/lessons">
              <Button>Explore Lessons</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
