import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useDailyProgress = () => {
  return useQuery({
    queryKey: ['dashboard-today'],
    queryFn: async () => (await api.get('/dashboard/today/')).data,
    refetchInterval: 30000,
  });
};
