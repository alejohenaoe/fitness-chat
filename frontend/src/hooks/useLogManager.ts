import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import type { MealLog, ExerciseLog } from '../types';

interface MealsResponse { logs: MealLog[] }
interface ExercisesResponse { logs: ExerciseLog[] }

export const useLogManager = () => {
  const queryClient = useQueryClient();
  const { setTodayMeals, setTodayExercises, removeMeal, removeExercise, updateDailyProgress } = useAppStore();

  const mealsQuery = useQuery<MealsResponse>({
    queryKey: ['meals-today'],
    queryFn: async () => (await api.get('/nutrition/today/')).data,
    refetchOnMount: 'always',
  });

  const exercisesQuery = useQuery<ExercisesResponse>({
    queryKey: ['exercises-today'],
    queryFn: async () => (await api.get('/exercise/today/')).data,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (mealsQuery.data?.logs) setTodayMeals(mealsQuery.data.logs);
  }, [mealsQuery.data, setTodayMeals]);

  useEffect(() => {
    if (exercisesQuery.data?.logs) setTodayExercises(exercisesQuery.data.logs);
  }, [exercisesQuery.data, setTodayExercises]);

  const deleteMeal = async (mealId: number) => {
    const { data } = await api.delete(`/nutrition/meal/${mealId}/`);
    removeMeal(mealId);
    updateDailyProgress({
      caloriesConsumed: data.daily_update.calories_consumed,
      caloriesBurned: data.daily_update.calories_burned,
      netCalories: data.daily_update.net_calories,
      calorieTarget: data.daily_update.calorie_target,
      progressPct: data.daily_update.progress_pct,
      proteinG: data.daily_update.protein_g,
      carbsG: data.daily_update.carbs_g,
      fatG: data.daily_update.fat_g,
    });
    queryClient.invalidateQueries({ queryKey: ['meals-today'] });
    queryClient.invalidateQueries({ queryKey: ['exercises-today'] });
  };

  const deleteExercise = async (exerciseId: number) => {
    const { data } = await api.delete(`/exercise/log/${exerciseId}/`);
    removeExercise(exerciseId);
    updateDailyProgress({
      caloriesConsumed: data.daily_update.calories_consumed,
      caloriesBurned: data.daily_update.calories_burned,
      netCalories: data.daily_update.net_calories,
      calorieTarget: data.daily_update.calorie_target,
      progressPct: data.daily_update.progress_pct,
      proteinG: data.daily_update.protein_g,
      carbsG: data.daily_update.carbs_g,
      fatG: data.daily_update.fat_g,
    });
    queryClient.invalidateQueries({ queryKey: ['meals-today'] });
    queryClient.invalidateQueries({ queryKey: ['exercises-today'] });
  };

  return { deleteMeal, deleteExercise, meals: mealsQuery.data?.logs ?? [], exercises: exercisesQuery.data?.logs ?? [] };
};
