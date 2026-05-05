import type { ChatMessage as Msg, ExtractedFood, ExtractedExercise } from '../../types';
import { MessageCard } from './MessageCard';
import { User, Sparkles } from 'lucide-react';

export const ChatMessage = ({ message }: { message: Msg }) => {
  const user = message.role === 'user';
  const ext = message.extracted_data;
  const foods = (ext?.extracted_foods || []) as ExtractedFood[];
  const exercises = (ext?.extracted_exercises || []) as ExtractedExercise[];
  const hasData = foods.length > 0 || exercises.length > 0;

  return (
    <div className={`my-2 flex ${user ? 'justify-end' : 'justify-start'}`}>
      {!user && (
        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/20 to-brand-600/10">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl ${
          user
            ? 'bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/10'
            : 'glass noise glow-card'
        }`}
      >
        <div className="p-3.5">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        {hasData && (
          <div className="border-t border-white/10">
            <MessageCard foods={foods} exercises={exercises} />
          </div>
        )}
      </div>
      {user && (
        <div className="ml-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5">
          <User className="h-3.5 w-3.5 text-surface-100" />
        </div>
      )}
    </div>
  );
};
