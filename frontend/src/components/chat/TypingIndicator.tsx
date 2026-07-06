export const TypingIndicator = () => (
  <div className="flex px-4 py-1">
    <div className="rounded-2xl rounded-bl-sm bg-surface-800 px-4 py-3">
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
);
