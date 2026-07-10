import { useAppStore } from '../stores/useAppStore';
import api from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

export const useChat = () => {
  const { addMessage, updateMessage, setAiTyping, isAiTyping, updateDailyProgress, currentSessionMessages } = useAppStore();
  const queryClient = useQueryClient();

  const sendMessage = async (content: string, mode: string = 'food') => {
    addMessage({ role: 'user', content, message_type: 'text', created_at: new Date().toISOString() });
    setAiTyping(true);
    try {
      const { data } = await api.post('/chat/message/', { message: content, mode });
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
    } catch (error) { console.error('sendMessage failed', error); }
    finally { setAiTyping(false); }
  };

  const sendScan = async (file: File) => {
    const idx = useAppStore.getState().currentSessionMessages.length;
    addMessage({ role: 'user', content: 'Escaneando etiqueta...', message_type: 'text', created_at: new Date().toISOString() });
    setAiTyping(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/chat/scan/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      if (data.user_message) updateMessage(idx, data.user_message);
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
    } catch (error) { console.error('sendScan failed', error); }
    finally { setAiTyping(false); }
  };

  return { sendMessage, sendScan, messages: currentSessionMessages, isTyping: isAiTyping };
};
