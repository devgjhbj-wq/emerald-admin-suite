import { RefreshCw } from 'lucide-react';

interface LastUpdatedProps {
  timestamp: Date | null;
  onRefresh?: () => void;
  loading?: boolean;
  compact?: boolean;
}

const LastUpdated = ({ timestamp, onRefresh, loading, compact }: LastUpdatedProps) => {
  if (!timestamp) return null;

  return (
    <div className={`flex items-center gap-1.5 ${compact ? 'text-[10px]' : 'text-[10px]'} text-muted-foreground`}>
      <span>Updated: {timestamp.toLocaleTimeString()}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="hover:text-foreground transition-colors p-0.5 hover:bg-secondary"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default LastUpdated;
