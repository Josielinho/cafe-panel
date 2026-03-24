import { useQuery } from '@tanstack/react-query';
import { fetchSurvey } from '@/services/surveyService';

export function useSurvey(encuestaId: string) {
  return useQuery({
    queryKey: ['survey', encuestaId],
    queryFn: () => fetchSurvey(encuestaId),
    enabled: !!encuestaId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
