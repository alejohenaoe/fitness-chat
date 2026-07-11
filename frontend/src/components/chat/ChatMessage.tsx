import { MessageCard } from './MessageCard';
import type { ChatMessage as Msg, ExtractedFood, ExtractedExercise } from '../../types';

export const ChatMessage = ({ message, isConsecutive }: { message: Msg; isConsecutive?: boolean }) => {
  const user = message.role === 'user';
  const ext = message.extracted_data;
  const foods = (ext?.extracted_foods || []) as ExtractedFood[];
  const exercises = (ext?.extracted_exercises || []) as ExtractedExercise[];
  const hasData = foods.length > 0 || exercises.length > 0;

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${user ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'pt-0.5' : 'pt-3'}`}>
      <div className={`${hasData && !user ? 'w-[90%] md:w-[85%] lg:w-[75%]' : 'max-w-[85%] md:max-w-[78%] lg:max-w-[70%]'}`}>
        {user ? (
          <div className="animate-[fadeSlideIn_200ms_ease-out] max-w-[300px]">
            {ext?.image_data && (
              <img src={ext.image_data} alt="Etiqueta escaneada"
                   className="w-full max-h-48 object-contain rounded-2xl rounded-br-md bg-brand-500" />
            )}
            {message.content && (
              <div className="rounded-2xl rounded-br-md bg-brand-500 px-4 py-2.5 shadow-sm">
                <p className="text-sm leading-relaxed text-white">{message.content}</p>
              </div>
            )}
            {time && <p className="mt-0.5 text-right text-[10px] text-surface-700">{time}</p>}
          </div>
        ) : (
          <div className="animate-[fadeSlideIn_200ms_ease-out]">
            <div className="overflow-hidden rounded-2xl rounded-bl-md border border-surface-800 bg-white shadow-card">
              <div className="px-4 py-2.5">
                <p className="text-sm leading-relaxed text-surface-50">{message.content}</p>
              </div>
              {hasData && <MessageCard foods={foods} exercises={exercises} />}
            </div>
            {time && <p className="mt-0.5 text-left text-[10px] text-surface-700">{time}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
