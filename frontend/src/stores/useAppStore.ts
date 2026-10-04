import { create } from 'zustand';
import type { User, UserProfile, ChatMessage, DailyProgress, MealLog, ExerciseLog } from '../types';
import api, { setTokens, clearTokens } from '../services/api';

const AUTH_TIMEOUT = 30000;

interface AppStore {
  initialized: boolean;
  user: User | null;
  token: string | null;
  refresh: string | null;
  setAuth: (user: User, token: string, refresh: string) => void;
  setProfile: (profile: UserProfile) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
  loadTodayData: () => Promise<void>;

  // Chat de hoy (los días anteriores se ven en Diario)
  currentSessionMessages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateMessage: (index: number, updates: Partial<ChatMessage>) => void;
  isAiTyping: boolean;
  setAiTyping: (typing: boolean) => void;

  // Daily progress
  dailyProgress: DailyProgress;
  updateDailyProgress: (data: Partial<DailyProgress>) => void;

  // Today's logs
  todayMeals: MealLog[];
  todayExercises: ExerciseLog[];
  setTodayMeals: (meals: MealLog[]) => void;
  setTodayExercises: (exercises: ExerciseLog[]) => void;
  removeMeal: (mealId: number) => void;
  removeExercise: (exerciseId: number) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  initialized: false,
  user: null, token: null, refresh: null,

  initAuth: async () => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    if (!access || !refresh) {
      set({ initialized: true });
      return;
    }

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      clearTokens();
      set({ initialized: true });
    }, AUTH_TIMEOUT);

    try {
      // /auth/me/ trae el usuario con su perfil (metas incluidas); /profile/ trae solo el perfil.
      const { data } = await api.get('/auth/me/');
      if (timedOut) return;
      clearTimeout(timer);
      const currentAccess = localStorage.getItem('access_token');
      const currentRefresh = localStorage.getItem('refresh_token');
      set({ user: data, token: currentAccess, refresh: currentRefresh, initialized: true });
      get().loadTodayData();
    } catch {
      if (timedOut) return;
      clearTimeout(timer);
      clearTokens();
      set({ initialized: true });
    }
  },

  setAuth: (user, token, refresh) => {
    setTokens(token, refresh);
    set({ user, token, refresh });
    get().loadTodayData();
  },

  setProfile: (profile) => set((s) => (s.user ? { user: { ...s.user, profile } } : {})),

  logout: () => {
    clearTokens();
    set({
      user: null, token: null, refresh: null,
      currentSessionMessages: [],
      todayMeals: [], todayExercises: [],
    });
  },

  loadTodayData: async () => {
    try {
      const [sessionRes, meals, exercises, dashboard] = await Promise.allSettled([
        api.get('/chat/sessions/today/'),
        api.get('/nutrition/today/'),
        api.get('/exercise/today/'),
        api.get('/dashboard/today/'),
      ]);

      if (sessionRes.status === 'fulfilled') {
        const sessionId = sessionRes.value.data.id ?? sessionRes.value.data[0]?.id;
        if (sessionId) {
          const { data: messages } = await api.get(`/chat/sessions/${sessionId}/messages/`);
          set({ currentSessionMessages: messages });
        } else {
          set({ currentSessionMessages: [] });
        }
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
            mealsLogged: d.meals ?? [],
            exercisesLogged: d.exercises ?? [],
          },
        }));
      }
    } catch {
      // silent fail
    }
  },

  // Chat
  currentSessionMessages: [],
  addMessage: (message) => set((s) => ({ currentSessionMessages: [...s.currentSessionMessages, message] })),
  updateMessage: (index, updates) =>
    set((s) => ({
      currentSessionMessages: s.currentSessionMessages.map((m, i) =>
        i === index ? { ...m, ...updates } : m
      ),
    })),
  isAiTyping: false,
  setAiTyping: (typing) => set({ isAiTyping: typing }),

  // Daily progress
  dailyProgress: { caloriesConsumed: 0, caloriesBurned: 0, netCalories: 0, calorieTarget: 2100, progressPct: 0, proteinG: 0, carbsG: 0, fatG: 0, mealsLogged: [], exercisesLogged: [] },
  updateDailyProgress: (data) => set((s) => ({
    dailyProgress: {
      ...s.dailyProgress,
      ...data,
      mealsLogged: data.mealsLogged || s.dailyProgress.mealsLogged,
      exercisesLogged: data.exercisesLogged || s.dailyProgress.exercisesLogged,
    }
  })),

  // Today's logs
  todayMeals: [],
  todayExercises: [],
  setTodayMeals: (meals) => set({ todayMeals: meals }),
  setTodayExercises: (exercises) => set({ todayExercises: exercises }),
  removeMeal: (mealId) => set((s) => ({ todayMeals: s.todayMeals.filter((m) => m.id !== mealId) })),
  removeExercise: (exerciseId) => set((s) => ({ todayExercises: s.todayExercises.filter((e) => e.id !== exerciseId) })),
}));
