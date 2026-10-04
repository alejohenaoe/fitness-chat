import { useAppStore } from '../stores/useAppStore';
import api from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

// Vercel limita el cuerpo de la petición a ~4.5 MB: reducir la foto antes de subirla
const compressImage = async (file: File, maxSide = 1600): Promise<Blob> => {
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
};

export const useChat = () => {
  const { addMessage, updateMessage, setAiTyping, isAiTyping, updateDailyProgress, currentSessionMessages } = useAppStore();
  const queryClient = useQueryClient();

  const sendMessage = async (content: string, mode: string = 'register') => {
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
      });
      queryClient.invalidateQueries({ queryKey: ['dailyProgress'] });
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
      formData.append('image', await compressImage(file), 'scan.jpg');
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
      });
      queryClient.invalidateQueries({ queryKey: ['dailyProgress'] });
      queryClient.invalidateQueries({ queryKey: ['meals-today'] });
      queryClient.invalidateQueries({ queryKey: ['exercises-today'] });
    } catch (error) {
      console.error('sendScan failed', error);
      updateMessage(idx, { role: 'user', content: 'No se pudo escanear la etiqueta. Intenta tomar una foto más clara.', message_type: 'text', created_at: new Date().toISOString() });
    } finally { setAiTyping(false); }
  };

  return { sendMessage, sendScan, messages: currentSessionMessages, isTyping: isAiTyping };
};
