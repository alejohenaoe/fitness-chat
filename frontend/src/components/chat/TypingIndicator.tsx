export const TypingIndicator = () => (
  <div className="flex gap-1.5 py-1" role="status" aria-label="FitnessChat está escribiendo">
    {[0, 200, 400].map((delay) => (
      <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${delay}ms` }} />
    ))}
  </div>
);
