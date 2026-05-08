export interface ExtractedFood { name: string; quantity_grams?: number; quantity_description?: string; meal_type?: string; calories_estimated: number; protein_g: number; carbs_g: number; fat_g: number; confidence?: string }
export interface ExtractedExercise { name: string; exercise_type?: string; duration_minutes?: number; intensity?: string; calories_burned_estimated?: number; calories_burned?: number; notes?: string }
export interface ExtractedData { extracted_foods?: ExtractedFood[]; extracted_exercises?: ExtractedExercise[]; daily_analysis?: Record<string, unknown> }
export interface User { id: number; first_name: string; email: string; profile?: UserProfile }
export interface UserProfile { age: number; gender: string; weight_kg: number; height_cm: number; goal: string; activity_level: string; daily_calorie_target: number; protein_target_g: number; carbs_target_g: number; fat_target_g: number; }
export interface MealLog { id?: number; name: string; meal_type?: string; calories: number; protein_g?: number; carbs_g?: number; fat_g?: number; quantity_description?: string; quantity_grams?: number; created_at?: string }
export interface ExerciseLog { id?: number; name: string; duration_minutes?: number; calories_burned: number; exercise_type?: string; intensity?: string; notes?: string; created_at?: string }
export interface ChatMessage { id?: number; role: 'user' | 'assistant'; content: string; message_type?: string; created_at?: string; extracted_data?: ExtractedData }
export interface DailyProgress { caloriesConsumed: number; caloriesBurned: number; netCalories: number; calorieTarget: number; progressPct: number; proteinG: number; carbsG: number; fatG: number; mealsLogged: MealLog[]; exercisesLogged: ExerciseLog[] }
