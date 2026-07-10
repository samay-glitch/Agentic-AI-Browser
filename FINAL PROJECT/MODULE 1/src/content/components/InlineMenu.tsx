interface InlineMenuProps {
  position: { top: number; left: number } | null;
  onGenerate: () => void;
  isVisible: boolean;
  isGenerating?: boolean;
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

const BotIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8V4H8"/>
    <rect width="16" height="12" x="4" y="8" rx="2"/>
    <path d="M2 14h2"/>
    <path d="M20 14h2"/>
    <path d="M15 13v2"/>
    <path d="M9 13v2"/>
  </svg>
);

export function InlineMenu({ position, onGenerate, isVisible, isGenerating }: InlineMenuProps) {
  if (!isVisible || !position) return null;

  return (
    <div 
      className="absolute z-[2147483647] flex items-center gap-1 bg-bg-card border border-zinc-700 shadow-lg rounded-md p-1 animate-in fade-in zoom-in duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateY(-120%)' // Hover slightly above the input
      }}
    >
      <button 
        className="p-1.5 hover:bg-zinc-800 rounded text-primary transition-colors flex items-center justify-center group disabled:opacity-50"
        onClick={(e) => {
          e.preventDefault();
          if (!isGenerating) onGenerate();
        }}
        title="Generate AI Answer"
        disabled={isGenerating}
      >
        <SparklesIcon className={`w-4 h-4 transition-transform ${isGenerating ? 'animate-pulse text-primary-hover' : 'group-hover:scale-110'}`} />
      </button>
      <div className="w-[1px] h-4 bg-zinc-700 mx-1"></div>
      <button 
        className="p-1.5 hover:bg-zinc-800 rounded text-text-muted transition-colors flex items-center justify-center group"
        title="Settings"
      >
        <BotIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
