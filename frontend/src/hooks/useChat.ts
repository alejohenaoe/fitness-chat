import { useAppStore } from '../stores/useAppStore';
import api from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

export const useChat = () => {
  const { currentSessionMessages, addMessage, setAiTyping, isAiTyping, updateDailyProgress } = useAppStore();
  const queryClient = useQueryClient();

  const sendMessage = async (content: string) => {
    addMessage({ role: 'user', content, message_type: 'text', created_at: new Date().toISOString() });
    setAiTyping(true);
    try {
      const { data } = await api.post('/chat/message/', { message: content });
      addMessage(data.assistant_message);
      const d = data.daily_update;
      updateDailyProgress({
        caloriesConsumed: d.calories_consumed,
        caloriesBurned: d.calories_burned,
        netCalories: d.net_calories,
        calorieTarget: d.calorie_target,
        progressPct: d.progress_pct,
        proteinG: d.protein_g,
        carbsG: d.carbs_g,
        fatG: d.fat_g,
        mealsLogged: (data.foods_logged || []).map((f: any) => ({
          ...f,
          calories: f.calories_estimated || f.calories || 0,
        })),
        exercisesLogged: data.exercises_logged || [],
      });
      queryClient.invalidateQueries({ queryKey: ['meals-today'] });
      queryClient.invalidateQueries({ queryKey: ['exercises-today'] });
    } finally {
      setAiTyping(false);
    }
  };

  return { sendMessage, messages: currentSessionMessages, isTyping: isAiTyping };
};
