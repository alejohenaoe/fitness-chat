import { create } from 'zustand';
import type { User, ChatMessage, DailyProgress, MealLog, ExerciseLog } from '../types';
import api, { setTokens, clearTokens } from '../services/api';

interface AppStore {
  initialized: boolean;
  user: User | null;
  token: string | null;
  refresh: string | null;
  setAuth: (user: User, token: string, refresh: string) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
  loadTodayData: () => Promise<void>;
  dailyProgress: DailyProgress;
  updateDailyProgress: (data: Partial<DailyProgress>) => void;
  currentSessionMessages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  isAiTyping: boolean;
  setAiTyping: (typing: boolean) => void;
  isDashboardOpen: boolean;
  toggleDashboard: () => void;
  todayMeals: MealLog[];
  todayExercises: ExerciseLog[];
  setTodayMeals: (meals: MealLog[]) => void;
  setTodayExercises: (exercises: ExerciseLog[]) => void;
  removeMeal: (mealId: number) => void;
  removeExercise: (exerciseId: number) => void;
  showEntries: boolean;
  toggleEntries: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  initialized: false,
  user: null, token: null, refresh: null,

  initAuth: async () => {
    const access = localStorage.getItem('fc_access');
    const refresh = localStorage.getItem('fc_refresh');
    if (!access || !refresh) {
      set({ initialized: true });
      return;
    }
    try {
      const { data } = await api.get('/auth/me/');
      setTokens(access, refresh);
      set({ user: data, token: access, refresh, initialized: true });
      get().loadTodayData();
    } catch {
      clearTokens();
      set({ initialized: true });
    }
  },

  setAuth: (user, token, refresh) => {
    setTokens(token, refresh);
    set({ user, token, refresh });
    get().loadTodayData();
  },

  logout: () => {
    clearTokens();
    set({ user: null, token: null, refresh: null, currentSessionMessages: [], todayMeals: [], todayExercises: [] });
  },

  loadTodayData: async () => {
    try {
      const [msgs, meals, exercises, dashboard] = await Promise.allSettled([
        api.get('/chat/sessions/today/'),
        api.get('/nutrition/today/'),
        api.get('/exercise/today/'),
        api.get('/dashboard/today/'),
      ]);

      if (msgs.status === 'fulfilled') {
        const messages = msgs.value.data.messages || [];
        set({ currentSessionMessages: messages });
      }
      if (meals.status === 'fulfilled') {
        set({ todayMeals: meals.value.data.logs || [] });
      }
      if (exercises.status === 'fulfilled') {
        set({ todayExercises: exercises.value.data.logs || [] });
      }
      if (dashboard.status === 'fulfilled') {
        const d = dashboard.value.data;
        set((s) => ({
          dailyProgress: {
            ...s.dailyProgress,
            caloriesConsumed: d.calories_consumed ?? 0,
            caloriesBurned: d.calories_burned ?? 0,
            netCalories: d.net_calories ?? 0,
            calorieTarget: d.calorie_target ?? 2100,
            progressPct: d.progress_pct ?? 0,
            proteinG: d.protein_g ?? 0,
            carbsG: d.carbs_g ?? 0,
            fatG: d.fat_g ?? 0,
          },
        }));
      }
    } catch {
      // silent fail
    }
  },

  dailyProgress: { caloriesConsumed: 0, caloriesBurned: 0, netCalories: 0, calorieTarget: 2100, progressPct: 0, proteinG: 0, carbsG: 0, fatG: 0, mealsLogged: [], exercisesLogged: [] },
  updateDailyProgress: (data) => set((s) => ({
    dailyProgress: {
      ...s.dailyProgress,
      ...data,
      mealsLogged: data.mealsLogged || s.dailyProgress.mealsLogged,
      exercisesLogged: data.exercisesLogged || s.dailyProgress.exercisesLogged,
    }
  })),
  currentSessionMessages: [],
  addMessage: (message) => set((s) => ({ currentSessionMessages: [...s.currentSessionMessages, message] })),
  setMessages: (messages) => set({ currentSessionMessages: messages }),
  isAiTyping: false,
  setAiTyping: (typing) => set({ isAiTyping: typing }),
  isDashboardOpen: false,
  toggleDashboard: () => set((s) => ({ isDashboardOpen: !s.isDashboardOpen })),
  todayMeals: [],
  todayExercises: [],
  setTodayMeals: (meals) => set({ todayMeals: meals }),
  setTodayExercises: (exercises) => set({ todayExercises: exercises }),
  removeMeal: (mealId) => set((s) => ({ todayMeals: s.todayMeals.filter((m) => m.id !== mealId) })),
  removeExercise: (exerciseId) => set((s) => ({ todayExercises: s.todayExercises.filter((e) => e.id !== exerciseId) })),
  showEntries: false,
  toggleEntries: () => set((s) => ({ showEntries: !s.showEntries })),
}));
