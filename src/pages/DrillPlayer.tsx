import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DrillComponent } from '@/components/DrillComponent';
import { toast } from 'sonner';
import type { DrillSession, LegacyQuestion } from '@/types';

export default function DrillPlayer() {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [drill, setDrill] = useState<DrillSession | null>(null);
  const [loading, setLoading] = useState(true);

  const mode = searchParams.get('mode') || 'mixed';
  const questionCount = Number(searchParams.get('questions')) || 10;
  const timeLimit = Number(searchParams.get('time')) || 450;
  const skillId = searchParams.get('skill');

  useEffect(() => {
    async function fetchQuestions() {
      if (!subject) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        let query = supabase
          .from('staging_items')
          .select('*')
          .eq('section', subject)
          .not('form_id', 'like', 'F%')
          .not('form_id', 'like', 'D2%')
          .in('answer', ['A', 'B', 'C', 'D']); // Only valid answers

        // Apply mode-specific filters
        if (mode === 'weak') {
          // Get user's weak skills
          const { data: weakSkills } = await supabase
            .from('vw_user_skill_stats')
            .select('skill_id')
            .eq('user_id', user.id)
            .eq('subject', subject)
            .lt('combined_accuracy', 0.85)
            .order('combined_accuracy', { ascending: true })
            .limit(5);

          if (weakSkills && weakSkills.length > 0) {
            const skillIds = weakSkills.map(s => s.skill_id).filter((id): id is string => id !== null);
            if (skillIds.length > 0) {
              query = query.in('skill_code', skillIds);
            }
          }
        } else if (mode === 'learned') {
          // Get recently completed lessons (last 48 hours)
          const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
          const { data: recentLessons } = await supabase
            .from('study_tasks')
            .select('skill_id')
            .eq('user_id', user.id)
            .eq('type', 'LEARN')
            .eq('status', 'DONE')
            .gte('created_at', twoDaysAgo);

          if (recentLessons && recentLessons.length > 0) {
            const skillIds = recentLessons
              .map(l => l.skill_id)
              .filter((id): id is string => id !== null);
            if (skillIds.length > 0) {
              query = query.in('skill_code', skillIds);
            } else {
              toast.error('No recently completed lessons found');
              navigate(`/drill/${subject}/setup`);
              return;
            }
          } else {
            toast.error('No recently completed lessons found');
            navigate(`/drill/${subject}/setup`);
            return;
          }
        } else if (mode === 'missed') {
          // Get questions from error_bank for this subject
          const { data: missedQuestions } = await supabase
            .from('error_bank')
            .select(`
              question_id,
              questions!inner(skill_id, skills!inner(subject))
            `)
            .eq('user_id', user.id)
            .eq('questions.skills.subject', subject)
            .order('miss_count', { ascending: false })
            .limit(50);

          if (missedQuestions && missedQuestions.length > 0) {
            const questionIds = missedQuestions
              .map(m => m.question_id)
              .filter((id): id is string => id !== null);
            
            // For missed questions, we need to query questions table directly
            const { data: questionsData } = await supabase
              .from('questions')
              .select('*')
              .in('id', questionIds);

            if (!questionsData || questionsData.length === 0) {
              toast.error('No missed questions available');
              navigate(`/drill/${subject}/setup`);
              return;
            }

            // Convert to drill format and skip staging_items query
            const questions: LegacyQuestion[] = questionsData.slice(0, questionCount).map(q => ({
              id: q.id,
              question: q.stem,
              options: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
              correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.answer),
              explanation: q.explanation || 'No explanation available',
              difficulty: 'medium',
            }));

            const drillSession: DrillSession = {
              id: `drill-${Date.now()}`,
              subject: subject as 'Math' | 'English',
              title: 'Missed Questions Review',
              timeLimit: timeLimit,
              questions,
            };

            setDrill(drillSession);
            setLoading(false);
            return;
          } else {
            toast.error('No missed questions found for this subject');
            navigate(`/drill/${subject}/setup`);
            return;
          }
        } else if (mode === 'skill' && skillId) {
          query = query.eq('skill_code', skillId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          toast.error('No questions available for this drill');
          navigate(`/drill/${subject}/setup`);
          return;
        }

        // Shuffle and take requested number of questions
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

        // Convert to LegacyQuestion format for DrillComponent
        const questions: LegacyQuestion[] = selected.map(q => ({
          id: q.staging_id.toString(),
          question: q.question,
          options: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
          correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.answer),
          explanation: q.explanation || 'No explanation available',
          difficulty: q.difficulty === 'easy' ? 'easy' : q.difficulty === 'hard' ? 'hard' : 'medium',
        }));

        const drillSession: DrillSession = {
          id: `drill-${Date.now()}`,
          subject: subject as 'Math' | 'English',
          title: mode === 'weak' ? 'Weak Areas Focus' : mode === 'skill' ? 'Skill Practice' : 'Mixed Review',
          timeLimit: timeLimit,
          questions,
        };

        setDrill(drillSession);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load drill questions');
        navigate(`/drill/${subject}/setup`);
      } finally {
        setLoading(false);
      }
    }

    void fetchQuestions();
  }, [subject, mode, questionCount, timeLimit, skillId, navigate]);

  const handleComplete = async (score: number) => {
    // Calculate stats from drill
    const total = drill?.questions.length || 0;
    const correct = Math.round((score / 100) * total);
    
    console.log('Drill completed:', { score, correct, total });
    
    // Save drill session to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('study_tasks').insert({
        user_id: user.id,
        type: 'DRILL',
        skill_id: mode === 'skill' ? skillId : null,
        the_date: new Date().toISOString().split('T')[0],
        status: 'DONE',
        size: total,
        accuracy: correct / total,
        median_time_ms: timeLimit > 0 ? Math.round((timeLimit * 1000) / total) : null,
      });

      toast.success(`Drill complete! ${correct}/${total} correct (${score}%)`);
    } catch (error) {
      console.error('Error saving drill results:', error);
    }

    // Navigate back after a delay
    setTimeout(() => {
      navigate('/drill-runner');
    }, 3000);
  };

  const handleBack = () => {
    navigate(`/drill/${subject}/setup`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!drill) {
    return null;
  }

  return (
    <DrillComponent
      drill={drill}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
