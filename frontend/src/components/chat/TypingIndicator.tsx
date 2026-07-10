export const TypingIndicator = () => (
  <div className="flex justify-start pt-1">
    <div className="animate-[fadeSlideIn_200ms_ease-out] max-w-[85%] md:max-w-[78%] lg:max-w-[70%]">
      <div className="overflow-hidden rounded-2xl rounded-bl-md border border-surface-800 bg-white px-4 py-3 shadow-card">
        <div className="flex gap-1.5">
          {[0, 200, 400].map((delay) => (
            <span
              key={delay}
              className="h-2 w-2 animate-bounce rounded-full bg-surface-700"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);
