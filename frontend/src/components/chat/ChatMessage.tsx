import { Receipt } from './Receipt';
import { formatClockTime } from '../../utils/format';
import type { ChatMessage as Msg, ExtractedFood, ExtractedExercise } from '../../types';

/** Tus mensajes van en burbuja; las respuestas de la IA, como texto limpio con el recibo debajo. */
export const ChatMessage = ({ message, remaining }: { message: Msg; remaining?: number }) => {
  const ext = message.extracted_data;

  if (message.role === 'user') {
    return (
      <div className="flex max-w-[82%] animate-[fadeSlideIn_200ms_ease-out] flex-col items-end self-end md:max-w-[70%]">
        {ext?.image_data && (
          <img src={ext.image_data} alt="Etiqueta escaneada" className="mb-1 max-h-48 w-full max-w-[300px] rounded-[18px] border border-line object-contain" />
        )}
        {message.content && (
          <div className="rounded-[18px_18px_4px_18px] border border-line bg-card px-[13px] py-[9px]">
            <span className="whitespace-pre-line">{message.content}</span>
            {message.created_at && <span className="mt-[3px] block text-right text-[11px] text-muted">{formatClockTime(message.created_at)}</span>}
          </div>
        )}
      </div>
    );
  }

  const foods = (ext?.extracted_foods ?? []) as ExtractedFood[];
  const exercises = (ext?.extracted_exercises ?? []) as ExtractedExercise[];
  const hasData = foods.length > 0 || exercises.length > 0;

  return (
    <div className="flex max-w-full animate-[fadeSlideIn_200ms_ease-out] flex-col gap-2.5 md:max-w-[78%]">
      {message.content && <p className="m-0 whitespace-pre-line">{message.content}</p>}
      {hasData && <Receipt foods={foods} exercises={exercises} remaining={remaining} />}
    </div>
  );
};
