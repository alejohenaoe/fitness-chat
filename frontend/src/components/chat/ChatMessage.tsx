import type { ChatMessage as Msg, ExtractedFood, ExtractedExercise } from '../../types';
import { MessageCard } from './MessageCard';

function getSummaryLabel(foods: ExtractedFood[], exercises: ExtractedExercise[]) {
  const foodKcal = foods.reduce((s, f) => s + (f.calories_estimated || 0), 0);
  const exKcal = exercises.reduce((s, e) => s + (e.calories_burned_estimated || e.calories_burned || 0), 0);
  const totalKcal = foodKcal + exKcal;
  if (foods.length > 0 && exercises.length > 0) {
    return `Registrados: ${foods.length} alimento(s) + ${exercises.length} ejercicio(s) (${Math.round(totalKcal)} kcal)`;
  }
  if (foods.length > 0) {
    return `Registrados: ${foods.length} alimento(s) (${Math.round(foodKcal)} kcal)`;
  }
  return `Registrados: ${exercises.length} ejercicio(s) (${Math.round(exKcal)} kcal)`;
}

export const ChatMessage = ({ message }: { message: Msg }) => {
  const user = message.role === 'user';
  const ext = message.extracted_data;
  const foods = (ext?.extracted_foods || []) as ExtractedFood[];
  const exercises = (ext?.extracted_exercises || []) as ExtractedExercise[];
  const hasData = foods.length > 0 || exercises.length > 0;

  return (
    <div className={`flex ${user ? 'justify-end' : 'justify-start'} py-1`}>
      <div className={`${hasData && !user ? 'w-[90%] md:w-[85%] lg:w-[75%]' : 'max-w-[90%] md:max-w-[85%] lg:max-w-[75%]'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            user
              ? 'rounded-br-sm bg-brand-500 text-white'
              : 'rounded-bl-sm bg-surface-800 text-surface-50'
          }`}
        >
          <p className="text-sm leading-relaxed">
            {!user && hasData ? getSummaryLabel(foods, exercises) : message.content}
          </p>
        </div>
        {!user && hasData && (
          <MessageCard foods={foods} exercises={exercises} />
        )}
      </div>
    </div>
  );
};
