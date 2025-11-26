import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNormalizedPlanDay,
  fetchNormalizedPlanRange,
  regeneratePlan,
  type NormalizedStudyPlanDay,
  type NormalizedStudyPlanTask,
} from './api';
import { logger } from '@/utils/logger';

interface StudyPlanDayParams {
  userId?: string;
  date: string;
  enabled?: boolean;
}

interface StudyPlanRangeParams {
  userId?: string;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export const useStudyPlanDay = ({ userId, date, enabled = true }: StudyPlanDayParams) =>
  useQuery({
    queryKey: ['study-plan', 'day', userId, date],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required to load study plan data.');
      }
      return fetchNormalizedPlanDay(userId, date);
    },
    enabled: Boolean(userId && date && enabled),
    staleTime: 1000 * 60,
  });

export const useStudyPlanRange = ({
  userId,
  startDate,
  endDate,
  enabled = true,
}: StudyPlanRangeParams) =>
  useQuery({
    queryKey: ['study-plan', 'range', userId, startDate, endDate],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required to load study plan data.');
      }
      return fetchNormalizedPlanRange(userId, startDate, endDate);
    },
    enabled: Boolean(userId && startDate && endDate && enabled),
    staleTime: 1000 * 60,
  });

export const useRegenerateStudyPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: { force?: boolean }) => regeneratePlan(options?.force ?? true),
    onSuccess: () => {
      logger.info('Study plan data invalidated after regeneration');
      queryClient.invalidateQueries({ queryKey: ['study-plan'] });
    },
  });
};

export type { NormalizedStudyPlanDay, NormalizedStudyPlanTask } from './api';
