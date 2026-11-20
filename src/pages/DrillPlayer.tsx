import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DrillComponent, type DrillResult } from '@/components/DrillComponent';
import { getBankAnswer, BANK_FORM_IDS } from '@/lib/bank';
import { toast } from 'sonner';
import type { DrillSession, LegacyQuestion } from '@/types';
import { logger } from '@/lib/logger';
import { localDateString } from '@/lib/localDate';

/** Drill bank form for each subject (accepts full names and codes) */
const DRILL_FORM_BY_SUBJECT: Record<string, string> = {
  Reading: 'DR_RD', RD: 'DR_RD',
  Math: 'DR_MA', MA: 'DR_MA',
  English: 'DR_EN', EN: 'DR_EN',
  Science: 'DR_SC', SC: 'DR_SC',
};

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

        const drillFormId = DRILL_FORM_BY_SUBJECT[subject];

        if (!drillFormId) {
          toast.error('Invalid drill subject');
          navigate('/pacing-lab');
          return;
        }

        // Use v_staging_items_public view (excludes answer/explanation for security)
        let query = supabase
          .from('v_staging_items_public')
          .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_id, passage_text, passage_title, underlined_text, reference_number')
          .eq('form_id', drillFormId);

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
          // question_id in error_bank stores staging_id as text
          const { data: missedEntries } = await supabase
            .from('error_bank')
            .select('question_id, miss_count')
            .eq('user_id', user.id)
            .order('miss_count', { ascending: false })
            .limit(100);

          if (missedEntries && missedEntries.length > 0) {
            // Parse staging_ids from question_id field
            const stagingIds = missedEntries
              .map(m => parseInt(m.question_id, 10))
              .filter(id => !isNaN(id));
            
            if (stagingIds.length === 0) {
              toast.error('No missed questions available');
              navigate(`/drill/${subject}/setup`);
              return;
            }

            // Map subject to section for filtering
            const sectionMap: Record<string, string> = {
              'Reading': 'Reading',
              'RD': 'Reading',
              'Math': 'Math',
              'MA': 'Math',
              'English': 'English',
              'EN': 'English',
              'Science': 'Science',
              'SC': 'Science',
            };
            const targetSection = sectionMap[subject];

            // Fetch staging items for missed questions, filtered by subject (using safe view)
            const { data: stagingData } = await supabase
              .from('v_staging_items_public')
              .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_id, passage_text, passage_title, underlined_text, reference_number')
              .in('staging_id', stagingIds)
              .in('form_id', BANK_FORM_IDS) // locked exam/diagnostic questions are not re-practiced
              .eq('section', targetSection);

            if (!stagingData || stagingData.length === 0) {
              toast.error('No missed questions available for this subject');
              navigate(`/drill/${subject}/setup`);
              return;
            }

            // Convert to drill format (answer validated server-side)
            const questions: LegacyQuestion[] = stagingData
              .filter(q => q.staging_id !== null)
              .slice(0, questionCount)
              .map(q => ({
                id: q.staging_id!.toString(),
                question: q.question || '',
                options: [q.choice_a || '', q.choice_b || '', q.choice_c || '', q.choice_d || ''],
                correctAnswer: 0, // Unused: graded per answer via gradeAnswer (get_bank_answers)
                explanation: 'Review after submission', // Explanation fetched after attempt
                difficulty: (q.difficulty === 'easy' ? 'easy' : q.difficulty === 'hard' ? 'hard' : 'medium') as 'easy' | 'medium' | 'hard',
                passageText: q.passage_text || undefined,
                passageTitle: q.passage_title || undefined,
                passageId: q.passage_id || undefined,
                underlinedText: q.underlined_text || undefined,
                referenceNumber: q.reference_number || undefined,
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

        // Convert to LegacyQuestion format for DrillComponent (answer validated server-side)
        const questions: LegacyQuestion[] = selected
          .filter(q => q.staging_id !== null)
          .map(q => ({
            id: q.staging_id!.toString(),
            question: q.question || '',
            options: [q.choice_a || '', q.choice_b || '', q.choice_c || '', q.choice_d || ''],
            correctAnswer: 0, // Unused: graded per answer via gradeAnswer (get_bank_answers)
            explanation: 'Review after submission', // Explanation fetched after attempt
            difficulty: (q.difficulty === 'easy' ? 'easy' : q.difficulty === 'hard' ? 'hard' : 'medium') as 'easy' | 'medium' | 'hard',
            passageText: q.passage_text || undefined,
            passageTitle: q.passage_title || undefined,
            passageId: q.passage_id || undefined,
            underlinedText: q.underlined_text || undefined,
            referenceNumber: q.reference_number || undefined,
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

  const gradeAnswer = async (questionId: string, _selectedIdx: number) => {
    const result = await getBankAnswer(questionId);
    if (!result) throw new Error(`No answer key for question ${questionId}`);
    return { correctIdx: result.correctIdx, explanation: result.explanation };
  };

  const handleComplete = async ({ score, answers, correctIdxs, elapsedSeconds, timesMs }: DrillResult) => {
    if (!drill) return;

    // Calculate stats from drill
    const total = drill.questions.length;
    const correct = answers.filter((a, i) => a !== -1 && a === correctIdxs[i]).length;
    const answeredCount = answers.filter(a => a !== -1).length;

    logger.debug('Drill completed:', { score, correct, total });

    // Save drill session to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // One attempt per graded answer, with time on the question (feeds skill buckets in the study plan)
      const attemptRows = drill.questions
        .map((q, i) => ({ q, i }))
        .filter(({ i }) => answers[i] !== -1 && correctIdxs[i] !== -1)
        .map(({ q, i }) => ({
          user_id: user.id,
          question_id: Number(q.id),
          form_id: DRILL_FORM_BY_SUBJECT[subject ?? ''] ?? 'DR_EN',
          question_ord: i + 1,
          choice_order: [0, 1, 2, 3],
          correct_idx: correctIdxs[i],
          selected_idx: answers[i],
          time_ms: timesMs[i] ?? null,
        }));
      if (attemptRows.length > 0) {
        const { error: attemptsError } = await supabase.from('attempts').insert(attemptRows);
        if (attemptsError) logger.error('Failed to save drill attempts:', attemptsError);
      }

      // Record missed questions to error_bank (only answers that were actually graded)
      for (let i = 0; i < drill.questions.length; i++) {
        const userAnswer = answers[i];
        const correctAnswer = correctIdxs[i];

        if (userAnswer !== -1 && correctAnswer !== -1 && userAnswer !== correctAnswer) {
          // Question was answered incorrectly
          const questionIdStr = drill.questions[i].id;
          
          // Check if error_bank entry exists
          const { data: existingError } = await supabase
            .from('error_bank')
            .select('miss_count')
            .eq('user_id', user.id)
            .eq('question_id', questionIdStr)
            .maybeSingle();
          
          if (existingError) {
            // Update existing record
            await supabase
              .from('error_bank')
              .update({
                miss_count: (existingError.miss_count || 0) + 1,
                last_missed_at: new Date().toISOString(),
              })
              .eq('user_id', user.id)
              .eq('question_id', questionIdStr);
          } else {
            // Insert new record
            await supabase.from('error_bank').insert({
              user_id: user.id,
              question_id: questionIdStr,
              last_missed_at: new Date().toISOString(),
              miss_count: 1,
            });
          }
        }
      }

      const taskRow = {
        user_id: user.id,
        type: 'DRILL',
        skill_id: mode === 'skill' ? skillId : null,
        the_date: localDateString(),
        status: 'DONE',
        size: total,
        accuracy: correct / total,
        // Average time actually spent per answered question (previously time limit ÷ questions)
        median_time_ms: answeredCount > 0 ? Math.round((elapsedSeconds * 1000) / answeredCount) : null,
      };
      const { error: taskError } = await supabase.from('study_tasks').insert(taskRow);
      // One task per user/day/type/skill (unique index shared with the study plan). A repeat drill
      // of the same skill today keeps the first saved result; students can't rewrite scores (RLS).
      if (taskError && taskError.code !== '23505') throw taskError;

      toast.success(`Drill complete! ${correct}/${total} correct (${score}%)`);
    } catch (error) {
      console.error('Error saving drill results:', error);
    }

    // Stay on the results screen (answers + explanations); DrillComponent provides the exit buttons
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
      gradeAnswer={gradeAnswer}
      onBack={handleBack}
    />
  );
}
